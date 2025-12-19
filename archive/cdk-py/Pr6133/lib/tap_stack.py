"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

import json
from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_events as events,
    aws_events_targets as events_targets,
    aws_iam as iam,
    aws_logs as logs,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subs,
    aws_synthetics as synthetics,
    aws_xray as xray,
    Duration,
    Stack,
)
from constructs import Construct

# Import your stacks here
# from .ddb_stack import DynamoDBStack, DynamoDBStackProps


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the
        deployment environment (e.g., 'dev', 'prod').
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the Tap project.

    This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
    It determines the environment suffix from the provided properties,
        CDK context, or defaults to 'dev'.
    Note:
        - Do NOT create AWS resources directly in this stack.
        - Instead, instantiate separate stacks for each resource type within this stack.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the
          stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming and configuration.
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create monitoring and observability resources
        self._create_log_groups(environment_suffix)
        self._create_sns_topics(environment_suffix)
        self._create_cloudwatch_alarms(environment_suffix)
        self._create_cloudwatch_dashboards(environment_suffix)
        self._create_xray_configuration()
        self._create_eventbridge_rules(environment_suffix)
        self._create_synthetics_canaries(environment_suffix)
        self._create_contributor_insights(environment_suffix)

    def _create_log_groups(self, environment_suffix: str) -> None:
        """Create CloudWatch log groups for centralized logging"""
        # API Gateway log group
        self.api_gateway_log_group = logs.LogGroup(
            self, f"ApiGatewayLogs{environment_suffix}",
            log_group_name=f"/aws/apigateway/payment-api-{environment_suffix}",
            retention=logs.RetentionDays.ONE_MONTH,
        )

        # Lambda function log group
        self.lambda_log_group = logs.LogGroup(
            self, f"LambdaLogs{environment_suffix}",
            log_group_name=f"/aws/lambda/payment-processor-{environment_suffix}",
            retention=logs.RetentionDays.ONE_MONTH,
        )

        # Application log group
        self.app_log_group = logs.LogGroup(
            self, f"AppLogs{environment_suffix}",
            log_group_name=f"/aws/payment-app-{environment_suffix}",
            retention=logs.RetentionDays.ONE_MONTH,
        )

    def _create_sns_topics(self, environment_suffix: str) -> None:
        """Create SNS topics for different alert priorities"""
        # Critical alerts topic
        self.critical_topic = sns.Topic(
            self, f"CriticalAlerts{environment_suffix}",
            topic_name=f"payment-critical-alerts-{environment_suffix}",
            display_name="Payment Critical Alerts"
        )

        # Warning alerts topic
        self.warning_topic = sns.Topic(
            self, f"WarningAlerts{environment_suffix}",
            topic_name=f"payment-warning-alerts-{environment_suffix}",
            display_name="Payment Warning Alerts"
        )

        # Info alerts topic
        self.info_topic = sns.Topic(
            self, f"InfoAlerts{environment_suffix}",
            topic_name=f"payment-info-alerts-{environment_suffix}",
            display_name="Payment Info Alerts"
        )

        # Add email subscriptions (placeholder emails)
        self.critical_topic.add_subscription(
            sns_subs.EmailSubscription("alerts@company.com")
        )
        self.warning_topic.add_subscription(
            sns_subs.EmailSubscription("warnings@company.com")
        )

    def _create_cloudwatch_alarms(self, environment_suffix: str) -> None:
        """Create CloudWatch alarms for monitoring"""
        # API Gateway 4XX errors alarm
        api_4xx_alarm = cloudwatch.Alarm(
            self, f"Api4xxErrors{environment_suffix}",
            alarm_name=f"payment-api-4xx-errors-{environment_suffix}",
            alarm_description="API Gateway 4XX errors above 1%",
            metric=cloudwatch.Metric(
                namespace="AWS/ApiGateway",
                metric_name="4XXError",
                dimensions_map={
                    "ApiName": f"payment-api-{environment_suffix}"
                },
                statistic="Sum"
            ),
            threshold=1,
            evaluation_periods=5,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )
        api_4xx_alarm.add_alarm_action(cw_actions.SnsAction(self.warning_topic))

        # API Gateway 5XX errors alarm
        api_5xx_alarm = cloudwatch.Alarm(
            self, f"Api5xxErrors{environment_suffix}",
            alarm_name=f"payment-api-5xx-errors-{environment_suffix}",
            alarm_description="API Gateway 5XX errors above 1%",
            metric=cloudwatch.Metric(
                namespace="AWS/ApiGateway",
                metric_name="5XXError",
                dimensions_map={
                    "ApiName": f"payment-api-{environment_suffix}"
                },
                statistic="Sum"
            ),
            threshold=1,
            evaluation_periods=3,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )
        api_5xx_alarm.add_alarm_action(cw_actions.SnsAction(self.critical_topic))

        # Lambda errors alarm
        lambda_errors_alarm = cloudwatch.Alarm(
            self, f"LambdaErrors{environment_suffix}",
            alarm_name=f"payment-lambda-errors-{environment_suffix}",
            alarm_description="Lambda function errors exceeding 0.5%",
            metric=cloudwatch.Metric(
                namespace="AWS/Lambda",
                metric_name="Errors",
                dimensions_map={
                    "FunctionName": f"payment-processor-{environment_suffix}"
                },
                statistic="Sum"
            ),
            threshold=0.5,
            evaluation_periods=5,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )
        lambda_errors_alarm.add_alarm_action(cw_actions.SnsAction(self.warning_topic))

    def _create_cloudwatch_dashboards(self, environment_suffix: str) -> None:
        """Create CloudWatch dashboards for monitoring
        
        Note: CloudWatch metrics retention is automatically set to 15 months for standard metrics.
        Custom metrics published via PutMetricData also follow this retention policy.
        """
        dashboard = cloudwatch.Dashboard(
            self, f"PaymentDashboard{environment_suffix}",
            dashboard_name=f"payment-monitoring-{environment_suffix}",
        )

        # API Gateway metrics widgets
        api_latency_widget = cloudwatch.GraphWidget(
            title="API Gateway Latency",
            left=[
                cloudwatch.Metric(
                    namespace="AWS/ApiGateway",
                    metric_name="Latency",
                    dimensions_map={
                        "ApiName": f"payment-api-{environment_suffix}"
                    },
                    statistic="Average"
                )
            ]
        )

        # Lambda metrics widgets
        lambda_duration_widget = cloudwatch.GraphWidget(
            title="Lambda Function Duration",
            left=[
                cloudwatch.Metric(
                    namespace="AWS/Lambda",
                    metric_name="Duration",
                    dimensions_map={
                        "FunctionName": f"payment-processor-{environment_suffix}"
                    },
                    statistic="Average"
                )
            ]
        )

        # Transaction metrics (custom metrics would be added here)
        transaction_widget = cloudwatch.SingleValueWidget(
            title="Transaction Success Rate",
            metrics=[
                cloudwatch.Metric(
                    namespace="Payment/Transactions",
                    metric_name="SuccessRate",
                    dimensions_map={
                        "Environment": environment_suffix
                    },
                    statistic="Average"
                )
            ]
        )

        dashboard.add_widgets(api_latency_widget, lambda_duration_widget, transaction_widget)

    def _create_xray_configuration(self) -> None:
        """Configure AWS X-Ray for tracing"""
        # Enable X-Ray tracing
        xray.CfnSamplingRule(
            self, "PaymentApiSamplingRule",
            sampling_rule={
                "ruleName": "payment-api-sampling",
                "resourceArn": "*",
                "priority": 10,
                "fixedRate": 0.1,
                "reservoirSize": 100,
                "serviceName": "payment-api",
                "serviceType": "AWS::ApiGateway::Stage",
                "host": "*",
                "httpMethod": "*",
                "urlPath": "/payment/*",
                "version": 1
            }
        )

    def _create_eventbridge_rules(self, environment_suffix: str) -> None:
        """Create EventBridge rules for event routing"""
        # Rule for CloudWatch alarms
        alarm_rule = events.Rule(
            self, f"AlarmEvents{environment_suffix}",
            rule_name=f"payment-alarm-events-{environment_suffix}",
            description="Route CloudWatch alarm events to monitoring dashboard",
            event_pattern=events.EventPattern(
                source=["aws.cloudwatch"],
                detail_type=["CloudWatch Alarm State Change"]
            )
        )

        # Add target (could be Lambda function or SNS)
        alarm_rule.add_target(events_targets.SnsTopic(self.info_topic))

    def _create_synthetics_canaries(self, environment_suffix: str) -> None:
        """Create Synthetics canaries for endpoint monitoring
        
        Note: Using example.com as a placeholder. Replace with your actual API endpoint.
        Example: https://api.yourcompany.com/health or your API Gateway URL
        """
        # API availability canary
        synthetics.Canary(
            self, f"ApiAvailabilityCanary{environment_suffix}",
            canary_name=f"payment-api-canary-{environment_suffix}",
            schedule=synthetics.Schedule.rate(Duration.minutes(5)),
            test=synthetics.Test.custom(
                code=synthetics.Code.from_inline("""
from aws_synthetics.selenium import synthetics_webdriver as webdriver
from aws_synthetics.common import synthetics_logger as logger

def handler(event, context):
    logger.info("Canary check starting")
    
    # Example: Check public endpoint availability
    # Replace https://example.com with your actual API endpoint
    browser = webdriver.Chrome()
    browser.get("https://example.com")
    
    logger.info(f"Page title: {browser.title}")
    browser.quit()
    
    return {"statusCode": 200, "body": "Success"}
"""),
                handler="index.handler"
            ),
            runtime=synthetics.Runtime.SYNTHETICS_PYTHON_SELENIUM_6_0,
        )

    def _create_contributor_insights(self, environment_suffix: str) -> None:
        """Create CloudWatch Contributor Insights rules"""
        # Top API consumers rule
        cloudwatch.CfnInsightRule(
            self, f"TopApiConsumers{environment_suffix}",
            rule_name=f"payment-top-api-consumers-{environment_suffix}",
            rule_state="ENABLED",
            rule_body=json.dumps({
                "Schema": {
                    "Name": "CloudWatchLogRule",
                    "Version": 1
                },
                "LogGroupNames": [
                    f"/aws/apigateway/payment-api-{environment_suffix}"
                ],
                "LogFormat": "JSON",
                "Contribution": {
                    "Keys": ["$.requestContext.identity.sourceIp"],
                    "ValueOf": "$.requestContext.requestId",
                    "Filters": []
                },
                "AggregateOn": "Count"
            })
        )
