"""
monitoring_stack.py

Monitoring resources including CloudWatch dashboards, alarms, and SNS topics.
"""

import json
import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws


class MonitoringStack(pulumi.ComponentResource):
    """
    Monitoring infrastructure component.
    """
    def __init__(
        self,
        name: str,
        *,
        environment_suffix: str,
        lambda_function_name: pulumi.Output[str],
        kinesis_stream_name: pulumi.Output[str],
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:monitoring:MonitoringStack', name, None, opts)

        # SNS topic for anomaly alerts
        self.sns_topic = aws.sns.Topic(
            f"anomaly-alerts-{environment_suffix}",
            name=f"AnomalyAlerts-{environment_suffix}",
            display_name="IoT Anomaly Detection Alerts",
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # SNS topic for security alerts
        self.security_sns_topic = aws.sns.Topic(
            f"security-alerts-{environment_suffix}",
            name=f"IoTSecurityAlerts-{environment_suffix}",
            display_name="IoT Security Alerts",
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Email subscription (placeholder - replace with actual email)
        self.sns_subscription = aws.sns.TopicSubscription(
            f"anomaly-email-{environment_suffix}",
            topic=self.sns_topic.arn,
            protocol="email",
            endpoint="alerts@example.com",
            opts=ResourceOptions(parent=self)
        )

        # Lambda error rate alarm
        self.lambda_error_alarm = aws.cloudwatch.MetricAlarm(
            f"lambda-error-alarm-{environment_suffix}",
            name=f"Lambda-ErrorRate-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Average",
            threshold=0.01,
            alarm_description="Alert when Lambda error rate exceeds 1%",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "FunctionName": lambda_function_name
            },
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Lambda duration alarm
        self.lambda_duration_alarm = aws.cloudwatch.MetricAlarm(
            f"lambda-duration-alarm-{environment_suffix}",
            name=f"Lambda-Duration-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Duration",
            namespace="AWS/Lambda",
            period=300,
            statistic="Average",
            threshold=500,
            alarm_description="Alert when Lambda processing latency exceeds 500ms",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "FunctionName": lambda_function_name
            },
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Kinesis iterator age alarm
        self.kinesis_iterator_alarm = aws.cloudwatch.MetricAlarm(
            f"kinesis-iterator-alarm-{environment_suffix}",
            name=f"Kinesis-IteratorAge-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="GetRecords.IteratorAgeMilliseconds",
            namespace="AWS/Kinesis",
            period=300,
            statistic="Maximum",
            threshold=60000,
            alarm_description="Alert when Kinesis iterator age exceeds 60 seconds",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "StreamName": kinesis_stream_name
            },
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch Dashboard
        self.dashboard = aws.cloudwatch.Dashboard(
            f"iot-dashboard-{environment_suffix}",
            dashboard_name=f"IoT-Pipeline-{environment_suffix}",
            dashboard_body=pulumi.Output.json_dumps({
                "widgets": [
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Lambda Invocations"}],
                                [".", "Errors", {"stat": "Sum", "label": "Lambda Errors"}],
                                [".", "Duration", {"stat": "Average", "label": "Lambda Duration (ms)"}]
                            ],
                            "view": "timeSeries",
                            "stacked": False,
                            "region": "us-west-1",
                            "title": "Lambda Function Metrics",
                            "period": 300,
                            "dimensions": {
                                "FunctionName": lambda_function_name
                            }
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/Kinesis", "IncomingRecords", {"stat": "Sum"}],
                                [".", "IncomingBytes", {"stat": "Sum"}],
                                [".", "GetRecords.IteratorAgeMilliseconds", {"stat": "Maximum"}]
                            ],
                            "view": "timeSeries",
                            "stacked": False,
                            "region": "us-west-1",
                            "title": "Kinesis Stream Metrics",
                            "period": 300,
                            "dimensions": {
                                "StreamName": kinesis_stream_name
                            }
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/IoT", "PublishIn.Success", {"stat": "Sum"}],
                                [".", "RuleMessageThrottled", {"stat": "Sum"}],
                                [".", "RuleNotFound", {"stat": "Sum"}]
                            ],
                            "view": "timeSeries",
                            "stacked": False,
                            "region": "us-west-1",
                            "title": "IoT Core Metrics",
                            "period": 300
                        }
                    }
                ]
            }),
            opts=ResourceOptions(parent=self)
        )

        self.register_outputs({
            'sns_topic_arn': self.sns_topic.arn,
            'dashboard_name': self.dashboard.dashboard_name
        })
