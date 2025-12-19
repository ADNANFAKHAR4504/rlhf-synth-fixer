"""Alerting stack with SNS topics and CloudWatch Alarms"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
)
from constructs import Construct


class AlertingStackProps(cdk.StackProps):
    """Properties for AlertingStack"""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class AlertingStack(Construct):
    """Stack for alerting and notifications"""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[AlertingStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id)

        env_suffix = props.environment_suffix if props else 'dev'

        # Create SNS topics
        self.critical_topic = sns.Topic(
            self,
            f"CriticalAlerts-{env_suffix}",
            topic_name=f"payment-critical-alerts-{env_suffix}",
            display_name=f"Critical Payment Processing Alerts (P1) - {env_suffix}"
        )

        self.warning_topic = sns.Topic(
            self,
            f"WarningAlerts-{env_suffix}",
            topic_name=f"payment-warning-alerts-{env_suffix}",
            display_name=f"Warning Payment Processing Alerts (P2) - {env_suffix}"
        )

        # Add email subscriptions
        self.critical_topic.add_subscription(
            subscriptions.EmailSubscription("ops@company.com")
        )

        self.warning_topic.add_subscription(
            subscriptions.EmailSubscription("ops@company.com")
        )

        # Lambda error rate alarm (> 1%)
        # Calculate error rate as percentage
        lambda_invocations = cloudwatch.Metric(
            namespace="AWS/Lambda",
            metric_name="Invocations",
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        lambda_errors = cloudwatch.Metric(
            namespace="AWS/Lambda",
            metric_name="Errors",
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        lambda_error_rate = cloudwatch.MathExpression(
            expression="(errors / invocations) * 100",
            using_metrics={
                "errors": lambda_errors,
                "invocations": lambda_invocations
            },
            period=cdk.Duration.minutes(5)
        )

        lambda_error_alarm = cloudwatch.Alarm(
            self,
            f"LambdaErrorRateAlarm-{env_suffix}",
            alarm_name=f"lambda-high-error-rate-{env_suffix}",
            metric=lambda_error_rate,
            threshold=1,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
            alarm_description="Lambda error rate exceeds 1%"
        )
        lambda_error_alarm.add_alarm_action(cw_actions.SnsAction(self.critical_topic))

        # API Gateway 4XX error alarm (> 5%)
        api_requests = cloudwatch.Metric(
            namespace="AWS/ApiGateway",
            metric_name="Count",
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        api_4xx = cloudwatch.Metric(
            namespace="AWS/ApiGateway",
            metric_name="4XXError",
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        api_4xx_rate = cloudwatch.MathExpression(
            expression="(errors / requests) * 100",
            using_metrics={
                "errors": api_4xx,
                "requests": api_requests
            },
            period=cdk.Duration.minutes(5)
        )

        api_4xx_alarm = cloudwatch.Alarm(
            self,
            f"Api4xxRateAlarm-{env_suffix}",
            alarm_name=f"api-high-4xx-rate-{env_suffix}",
            metric=api_4xx_rate,
            threshold=5,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
            alarm_description="API Gateway 4XX error rate exceeds 5%"
        )
        api_4xx_alarm.add_alarm_action(cw_actions.SnsAction(self.warning_topic))

        # DynamoDB throttle alarm (> 0)
        dynamodb_throttles = cloudwatch.Metric(
            namespace="AWS/DynamoDB",
            metric_name="UserErrors",
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        dynamodb_throttle_alarm = cloudwatch.Alarm(
            self,
            f"DynamoDBThrottleAlarm-{env_suffix}",
            alarm_name=f"dynamodb-throttles-{env_suffix}",
            metric=dynamodb_throttles,
            threshold=0,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
            alarm_description="DynamoDB is experiencing throttling"
        )
        dynamodb_throttle_alarm.add_alarm_action(cw_actions.SnsAction(self.critical_topic))

        # SQS DLQ messages alarm (> 10)
        sqs_dlq_messages = cloudwatch.Metric(
            namespace="AWS/SQS",
            metric_name="ApproximateNumberOfMessagesVisible",
            statistic="Average",
            period=cdk.Duration.minutes(5)
        )

        sqs_dlq_alarm = cloudwatch.Alarm(
            self,
            f"SqsDlqAlarm-{env_suffix}",
            alarm_name=f"sqs-dlq-messages-{env_suffix}",
            metric=sqs_dlq_messages,
            threshold=10,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
            alarm_description="SQS DLQ has more than 10 messages"
        )
        sqs_dlq_alarm.add_alarm_action(cw_actions.SnsAction(self.critical_topic))
