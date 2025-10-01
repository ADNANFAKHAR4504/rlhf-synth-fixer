"""
monitoring.py

Monitoring module for CloudWatch, alarms, and X-Ray configuration.
Addresses model failures: SNS notifications missing.
"""

import json

import pulumi
import pulumi_aws as aws

from .config import config


def create_lambda_alarms(name: str, function_name: str, sns_topic_arn: str = None):
    """
    Create comprehensive CloudWatch alarms for Lambda function.
    Addresses model failure: SNS notifications missing.
    """
    
    # Error rate alarm
    error_alarm = aws.cloudwatch.MetricAlarm(
        f"{name}-error-alarm",
        name=f"{name}-error-alarm",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="Errors",
        namespace="AWS/Lambda",
        period=60,
        statistic="Sum",
        threshold=2,
        alarm_description=f"Lambda function {function_name} error rate exceeded threshold",
        alarm_actions=[sns_topic_arn] if sns_topic_arn else [],
        ok_actions=[sns_topic_arn] if sns_topic_arn else [],
        dimensions={
            "FunctionName": function_name
        },
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Throttle alarm
    throttle_alarm = aws.cloudwatch.MetricAlarm(
        f"{name}-throttle-alarm",
        name=f"{name}-throttle-alarm",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="Throttles",
        namespace="AWS/Lambda",
        period=60,
        statistic="Sum",
        threshold=1,
        alarm_description=f"Lambda function {function_name} is being throttled",
        alarm_actions=[sns_topic_arn] if sns_topic_arn else [],
        ok_actions=[sns_topic_arn] if sns_topic_arn else [],
        dimensions={
            "FunctionName": function_name
        },
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Duration alarm (for potential timeouts)
    duration_alarm = aws.cloudwatch.MetricAlarm(
        f"{name}-duration-alarm",
        name=f"{name}-duration-alarm",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="Duration",
        namespace="AWS/Lambda",
        period=60,
        statistic="Maximum",
        threshold=160000,  # 160 seconds (close to 3 min timeout)
        alarm_description=f"Lambda function {function_name} execution is approaching timeout",
        alarm_actions=[sns_topic_arn] if sns_topic_arn else [],
        ok_actions=[sns_topic_arn] if sns_topic_arn else [],
        dimensions={
            "FunctionName": function_name
        },
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Concurrent executions alarm
    concurrent_alarm = aws.cloudwatch.MetricAlarm(
        f"{name}-concurrent-alarm",
        name=f"{name}-concurrent-alarm",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="ConcurrentExecutions",
        namespace="AWS/Lambda",
        period=60,
        statistic="Maximum",
        threshold=950,  # Close to 1000 concurrent execution limit
        alarm_description=f"Lambda function {function_name} approaching concurrent execution limit",
        alarm_actions=[sns_topic_arn] if sns_topic_arn else [],
        ok_actions=[sns_topic_arn] if sns_topic_arn else [],
        dimensions={
            "FunctionName": function_name
        },
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    return {
        "error_alarm": error_alarm,
        "throttle_alarm": throttle_alarm,
        "duration_alarm": duration_alarm,
        "concurrent_alarm": concurrent_alarm
    }


def create_sns_topic(name: str):
    """
    Create SNS topic for notifications.
    Addresses model failure: SNS notifications missing.
    """
    
    sns_topic = aws.sns.Topic(
        f"{name}-notifications",
        name=f"{name}-notifications",
        display_name=f"{name} Notifications",
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Create SNS topic policy for CloudWatch alarms
    sns_topic_policy = aws.sns.TopicPolicy(
        f"{name}-sns-policy",
        arn=sns_topic.arn,
        policy=pulumi.Output.all(sns_topic.arn).apply(
            lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "cloudwatch.amazonaws.com"
                    },
                    "Action": "sns:Publish",
                    "Resource": args[0]
                }]
            })
        ),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    return sns_topic




def create_dashboard(name: str, function_name: str):
    """
    Create CloudWatch dashboard for monitoring.
    """
    
    dashboard = aws.cloudwatch.Dashboard(
        f"{name}-dashboard",
        dashboard_name=f"{name}-dashboard",
        dashboard_body=pulumi.Output.all(function_name).apply(
            lambda args: json.dumps({
                "widgets": [
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/Lambda", "Invocations", "FunctionName", args[0]],
                                [".", "Errors", ".", "."],
                                [".", "Duration", ".", "."],
                                [".", "Throttles", ".", "."]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": config.aws_region,
                            "title": "Lambda Function Metrics - " + args[0]
                        }
                    }
                ]
            })
        ),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    return dashboard
