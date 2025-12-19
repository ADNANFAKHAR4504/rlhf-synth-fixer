# Observability Stack for Multi-Account Payment Processing System - CORRECTED

## Solution Overview

This solution provides a comprehensive observability stack for monitoring a multi-account payment processing system using AWS CDK in Python. This corrected version addresses X-Ray tracing, EventBridge integration, CloudWatch Contributor Insights, custom metrics, and improved error handling.

## File: tap.py

```python
#!/usr/bin/env python3
"""
CDK application entry point for the Observability Stack.
"""
import os
from datetime import datetime, timezone

import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

# Get environment suffix from context
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')
pr_number = os.getenv('PR_NUMBER', 'unknown')
team = os.getenv('TEAM', 'unknown')
created_at = datetime.now(timezone.utc).isoformat()

Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)
Tags.of(app).add('PRNumber', pr_number)
Tags.of(app).add('Team', team)
Tags.of(app).add('CreatedAt', created_at)

props = TapStackProps(
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region=os.getenv('CDK_DEFAULT_REGION', 'us-east-1')
    )
)

TapStack(app, STACK_NAME, props=props)

app.synth()
```

## File: lib/tap_stack.py

```python
"""Main CDK stack for the Observability Platform"""

from typing import Optional
import aws_cdk as cdk
from constructs import Construct
from .monitoring_stack import MonitoringStack, MonitoringStackProps
from .alerting_stack import AlertingStack, AlertingStackProps
from .synthetics_stack import SyntheticsStack, SyntheticsStackProps
from .xray_stack import XRayStack, XRayStackProps
from .eventbridge_stack import EventBridgeStack, EventBridgeStackProps
from .contributor_insights_stack import ContributorInsightsStack, ContributorInsightsStackProps


class TapStackProps(cdk.StackProps):
    """Properties for TapStack"""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """Main stack orchestrating observability components"""

    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create nested stacks
        class NestedMonitoringStack(cdk.NestedStack):
            def __init__(self, scope, id, props=None, **kwargs):
                super().__init__(scope, id, **kwargs)
                self.monitoring = MonitoringStack(self, "Resource", props=props)
                self.kms_key = self.monitoring.kms_key
                self.log_groups = self.monitoring.log_groups
                self.dashboard = self.monitoring.dashboard

        monitoring_props = MonitoringStackProps(environment_suffix=environment_suffix)
        monitoring_stack = NestedMonitoringStack(
            self,
            f"MonitoringStack{environment_suffix}",
            props=monitoring_props
        )

        class NestedAlertingStack(cdk.NestedStack):
            def __init__(self, scope, id, props=None, **kwargs):
                super().__init__(scope, id, **kwargs)
                self.alerting = AlertingStack(self, "Resource", props=props)
                self.critical_topic = self.alerting.critical_topic
                self.warning_topic = self.alerting.warning_topic

        alerting_props = AlertingStackProps(environment_suffix=environment_suffix)
        alerting_stack = NestedAlertingStack(
            self,
            f"AlertingStack{environment_suffix}",
            props=alerting_props
        )

        class NestedSyntheticsStack(cdk.NestedStack):
            def __init__(self, scope, id, props=None, **kwargs):
                super().__init__(scope, id, **kwargs)
                self.synthetics = SyntheticsStack(self, "Resource", props=props)

        synthetics_props = SyntheticsStackProps(environment_suffix=environment_suffix)
        synthetics_stack = NestedSyntheticsStack(
            self,
            f"SyntheticsStack{environment_suffix}",
            props=synthetics_props
        )

        class NestedXRayStack(cdk.NestedStack):
            def __init__(self, scope, id, props=None, **kwargs):
                super().__init__(scope, id, **kwargs)
                self.xray = XRayStack(self, "Resource", props=props)

        xray_props = XRayStackProps(environment_suffix=environment_suffix)
        xray_stack = NestedXRayStack(
            self,
            f"XRayStack{environment_suffix}",
            props=xray_props
        )

        class NestedEventBridgeStack(cdk.NestedStack):
            def __init__(self, scope, id, props=None, **kwargs):
                super().__init__(scope, id, **kwargs)
                self.eventbridge = EventBridgeStack(self, "Resource", props=props)

        eventbridge_props = EventBridgeStackProps(environment_suffix=environment_suffix)
        eventbridge_stack = NestedEventBridgeStack(
            self,
            f"EventBridgeStack{environment_suffix}",
            props=eventbridge_props
        )

        class NestedContributorInsightsStack(cdk.NestedStack):
            def __init__(self, scope, id, props=None, **kwargs):
                super().__init__(scope, id, **kwargs)
                self.insights = ContributorInsightsStack(self, "Resource", props=props)

        insights_props = ContributorInsightsStackProps(environment_suffix=environment_suffix)
        insights_stack = NestedContributorInsightsStack(
            self,
            f"ContributorInsightsStack{environment_suffix}",
            props=insights_props
        )

        # Outputs
        cdk.CfnOutput(self, "DashboardURL",
            value=f"https://console.aws.amazon.com/cloudwatch/home?region={self.region}#dashboards:name={monitoring_stack.dashboard.dashboard_name}")
        cdk.CfnOutput(self, "CriticalTopicArn", value=alerting_stack.critical_topic.topic_arn)
        cdk.CfnOutput(self, "WarningTopicArn", value=alerting_stack.warning_topic.topic_arn)
```

## File: lib/monitoring_stack.py

```python
"""Monitoring stack with CloudWatch Log Groups, Dashboard, and Custom Metrics"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_logs as logs,
    aws_kms as kms,
    aws_cloudwatch as cloudwatch,
    aws_iam as iam,
)
from constructs import Construct


class MonitoringStackProps(cdk.StackProps):
    """Properties for MonitoringStack"""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class MonitoringStack(Construct):
    """Stack for monitoring resources"""

    def __init__(self, scope: Construct, construct_id: str, props: Optional[MonitoringStackProps] = None, **kwargs):
        super().__init__(scope, construct_id)

        env_suffix = props.environment_suffix if props else 'dev'

        # Create KMS key for log encryption
        self.kms_key = kms.Key(
            self,
            f"LogsKmsKey-{env_suffix}",
            description=f"KMS key for CloudWatch Logs encryption - {env_suffix}",
            enable_key_rotation=True,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Add key policy for CloudWatch Logs
        self.kms_key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="Allow CloudWatch Logs",
                principals=[iam.ServicePrincipal(f"logs.{cdk.Stack.of(self).region}.amazonaws.com")],
                actions=[
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:CreateGrant",
                    "kms:DescribeKey"
                ],
                resources=["*"],
                conditions={
                    "ArnLike": {
                        "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{cdk.Stack.of(self).region}:{cdk.Stack.of(self).account}:*"
                    }
                }
            )
        )

        # Create CloudWatch Log Groups with 90-day retention
        self.log_groups = {}

        # Lambda log group
        self.log_groups['lambda'] = logs.LogGroup(
            self,
            f"LambdaLogGroup-{env_suffix}",
            log_group_name=f"/aws/lambda/payment-processing-{env_suffix}",
            retention=logs.RetentionDays.THREE_MONTHS,
            encryption_key=self.kms_key,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # API Gateway log group
        self.log_groups['apigateway'] = logs.LogGroup(
            self,
            f"ApiGatewayLogGroup-{env_suffix}",
            log_group_name=f"/aws/apigateway/payment-api-{env_suffix}",
            retention=logs.RetentionDays.THREE_MONTHS,
            encryption_key=self.kms_key,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # DynamoDB log group
        self.log_groups['dynamodb'] = logs.LogGroup(
            self,
            f"DynamoDBLogGroup-{env_suffix}",
            log_group_name=f"/aws/dynamodb/transactions-{env_suffix}",
            retention=logs.RetentionDays.THREE_MONTHS,
            encryption_key=self.kms_key,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Create CloudWatch Dashboard
        self.dashboard = cloudwatch.Dashboard(
            self,
            f"PaymentsDashboard-{env_suffix}",
            dashboard_name=f"payments-observability-{env_suffix}"
        )

        # Lambda metrics
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

        lambda_duration = cloudwatch.Metric(
            namespace="AWS/Lambda",
            metric_name="Duration",
            statistic="Average",
            period=cdk.Duration.minutes(5)
        )

        # API Gateway metrics
        api_latency = cloudwatch.Metric(
            namespace="AWS/ApiGateway",
            metric_name="Latency",
            statistic="Average",
            period=cdk.Duration.minutes(5)
        )

        api_4xx = cloudwatch.Metric(
            namespace="AWS/ApiGateway",
            metric_name="4XXError",
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        api_5xx = cloudwatch.Metric(
            namespace="AWS/ApiGateway",
            metric_name="5XXError",
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        # DynamoDB metrics
        dynamodb_read_capacity = cloudwatch.Metric(
            namespace="AWS/DynamoDB",
            metric_name="ConsumedReadCapacityUnits",
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        dynamodb_write_capacity = cloudwatch.Metric(
            namespace="AWS/DynamoDB",
            metric_name="ConsumedWriteCapacityUnits",
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        # SQS metrics
        sqs_queue_depth = cloudwatch.Metric(
            namespace="AWS/SQS",
            metric_name="ApproximateNumberOfMessagesVisible",
            statistic="Average",
            period=cdk.Duration.minutes(5)
        )

        # Custom business metrics
        payment_success_rate = cloudwatch.Metric(
            namespace="PaymentProcessing",
            metric_name="PaymentSuccessRate",
            statistic="Average",
            period=cdk.Duration.minutes(5)
        )

        avg_transaction_value = cloudwatch.Metric(
            namespace="PaymentProcessing",
            metric_name="AverageTransactionValue",
            statistic="Average",
            period=cdk.Duration.minutes(5)
        )

        fraud_detections = cloudwatch.Metric(
            namespace="PaymentProcessing",
            metric_name="FraudDetectionTriggers",
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        # Add widgets to dashboard
        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Lambda Invocations & Errors",
                left=[lambda_invocations, lambda_errors],
                right=[lambda_duration],
                width=12,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="API Gateway Latency & Errors",
                left=[api_latency],
                right=[api_4xx, api_5xx],
                width=12,
                height=6
            )
        )

        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="DynamoDB Capacity Consumption",
                left=[dynamodb_read_capacity, dynamodb_write_capacity],
                width=12,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="SQS Queue Depth",
                left=[sqs_queue_depth],
                width=12,
                height=6
            )
        )

        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Payment Success Rate",
                left=[payment_success_rate],
                width=8,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="Average Transaction Value",
                left=[avg_transaction_value],
                width=8,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="Fraud Detection Triggers",
                left=[fraud_detections],
                width=8,
                height=6
            )
        )

        # Create CloudWatch Logs Insights query definitions
        logs.CfnQueryDefinition(
            self,
            f"ErrorQuery-{env_suffix}",
            name=f"payment-errors-{env_suffix}",
            query_string="""
                fields @timestamp, @message, @logStream
                | filter @message like /ERROR/ or @message like /Exception/
                | sort @timestamp desc
                | limit 100
            """,
            log_group_names=[lg.log_group_name for lg in self.log_groups.values()]
        )

        logs.CfnQueryDefinition(
            self,
            f"LatencyQuery-{env_suffix}",
            name=f"high-latency-requests-{env_suffix}",
            query_string="""
                fields @timestamp, @message, @duration
                | filter @duration > 1000
                | sort @duration desc
                | limit 50
            """,
            log_group_names=[lg.log_group_name for lg in self.log_groups.values()]
        )

        logs.CfnQueryDefinition(
            self,
            f"FailedTransactionsQuery-{env_suffix}",
            name=f"failed-payment-transactions-{env_suffix}",
            query_string="""
                fields @timestamp, @message
                | filter @message like /payment.*failed/ or @message like /transaction.*error/
                | parse @message "transactionId=*," as txId
                | stats count() by txId
                | sort count desc
                | limit 20
            """,
            log_group_names=[lg.log_group_name for lg in self.log_groups.values()]
        )
```

## File: lib/alerting_stack.py

```python
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

    def __init__(self, scope: Construct, construct_id: str, props: Optional[AlertingStackProps] = None, **kwargs):
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
```

## File: lib/synthetics_stack.py

```python
"""Synthetics stack with CloudWatch Synthetics canaries"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_synthetics as synthetics,
    aws_iam as iam,
    aws_s3 as s3,
)
from constructs import Construct


class SyntheticsStackProps(cdk.StackProps):
    """Properties for SyntheticsStack"""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class SyntheticsStack(Construct):
    """Stack for CloudWatch Synthetics canaries"""

    def __init__(self, scope: Construct, construct_id: str, props: Optional[SyntheticsStackProps] = None, **kwargs):
        super().__init__(scope, construct_id)

        env_suffix = props.environment_suffix if props else 'dev'

        # Create S3 bucket for canary artifacts
        artifacts_bucket = s3.Bucket(
            self,
            f"CanaryArtifacts-{env_suffix}",
            bucket_name=f"payment-canary-artifacts-{env_suffix}-{cdk.Stack.of(self).account}",
            removal_policy=cdk.RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL
        )

        # Health check canary
        health_canary_role = self._create_canary_role(f"health-{env_suffix}", artifacts_bucket)

        health_canary = synthetics.CfnCanary(
            self,
            f"HealthCanary-{env_suffix}",
            name=f"health-check-{env_suffix}",
            artifact_s3_location=f"s3://{artifacts_bucket.bucket_name}/health",
            execution_role_arn=health_canary_role.role_arn,
            runtime_version="syn-python-selenium-1.3",
            schedule=synthetics.CfnCanary.ScheduleProperty(
                expression="rate(5 minutes)",
                duration_in_seconds=0
            ),
            code=synthetics.CfnCanary.CodeProperty(
                handler="health_check.handler",
                script="""
from aws_synthetics.selenium import synthetics_webdriver as webdriver
from aws_synthetics.common import synthetics_logger as logger
from aws_synthetics.common import synthetics_configuration

def handler(event, context):
    # Configure synthetics
    synthetics_configuration.set_config({
        "screenshot_on_step_start": False,
        "screenshot_on_step_success": False,
        "screenshot_on_step_failure": True
    })

    url = "https://api.example.com/health"
    browser = webdriver.Chrome()
    browser.set_viewport_size(1920, 1080)

    try:
        browser.get(url)
        response_text = browser.page_source
        logger.info(f"Health check completed for {url}")

        # Verify response contains expected content
        if "OK" in response_text or "healthy" in response_text.lower():
            logger.info("Health check passed")
        else:
            logger.error("Health check failed - unexpected response")

    except Exception as e:
        logger.error(f"Health check failed with error: {str(e)}")
        raise
    finally:
        browser.quit()

    return "Success"
"""
            ),
            start_canary_after_creation=True
        )

        # Payment processing canary
        payment_canary_role = self._create_canary_role(f"payment-{env_suffix}", artifacts_bucket)

        payment_canary = synthetics.CfnCanary(
            self,
            f"PaymentCanary-{env_suffix}",
            name=f"payment-api-{env_suffix}",
            artifact_s3_location=f"s3://{artifacts_bucket.bucket_name}/payment",
            execution_role_arn=payment_canary_role.role_arn,
            runtime_version="syn-python-selenium-1.3",
            schedule=synthetics.CfnCanary.ScheduleProperty(
                expression="rate(5 minutes)",
                duration_in_seconds=0
            ),
            code=synthetics.CfnCanary.CodeProperty(
                handler="payment_check.handler",
                script="""
from aws_synthetics.selenium import synthetics_webdriver as webdriver
from aws_synthetics.common import synthetics_logger as logger
from aws_synthetics.common import synthetics_configuration
import time

def handler(event, context):
    # Configure synthetics
    synthetics_configuration.set_config({
        "screenshot_on_step_start": False,
        "screenshot_on_step_success": False,
        "screenshot_on_step_failure": True
    })

    url = "https://api.example.com/api/v1/process-payment"
    browser = webdriver.Chrome()
    browser.set_viewport_size(1920, 1080)

    try:
        start_time = time.time()
        browser.get(url)
        end_time = time.time()

        response_time = (end_time - start_time) * 1000
        logger.info(f"Payment API response time: {response_time}ms")

        # Check response time SLA
        if response_time > 3000:
            logger.warning(f"Payment API slow response: {response_time}ms")

        response_text = browser.page_source
        logger.info(f"Payment API check completed")

    except Exception as e:
        logger.error(f"Payment API check failed with error: {str(e)}")
        raise
    finally:
        browser.quit()

    return "Success"
"""
            ),
            start_canary_after_creation=True
        )

    def _create_canary_role(self, name: str, bucket: s3.Bucket) -> iam.Role:
        """Create IAM role for canary execution"""
        role = iam.Role(
            self,
            f"CanaryRole-{name}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        bucket.grant_read_write(role)

        role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "s3:ListAllMyBuckets",
                    "cloudwatch:PutMetricData",
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                resources=["*"]
            )
        )

        return role
```

## File: lib/xray_stack.py

```python
"""X-Ray tracing configuration stack"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_xray as xray,
)
from constructs import Construct


class XRayStackProps(cdk.StackProps):
    """Properties for XRayStack"""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class XRayStack(Construct):
    """Stack for X-Ray tracing configuration"""

    def __init__(self, scope: Construct, construct_id: str, props: Optional[XRayStackProps] = None, **kwargs):
        super().__init__(scope, construct_id)

        env_suffix = props.environment_suffix if props else 'dev'

        # Create X-Ray sampling rule with 0.1 sampling rate (10%)
        sampling_rule = xray.CfnSamplingRule(
            self,
            f"PaymentSamplingRule-{env_suffix}",
            sampling_rule=xray.CfnSamplingRule.SamplingRuleProperty(
                fixed_rate=0.1,
                host="*",
                http_method="*",
                priority=100,
                reservoir_size=1,
                resource_arn="*",
                rule_name=f"payment-processing-sampling-{env_suffix}",
                service_name="*",
                service_type="*",
                url_path="*",
                version=1
            )
        )

        # Create X-Ray group for payment processing
        payment_group = xray.CfnGroup(
            self,
            f"PaymentGroup-{env_suffix}",
            group_name=f"payment-processing-{env_suffix}",
            filter_expression='service("payment-api") OR service("payment-lambda")'
        )

        # Create X-Ray group for API Gateway
        api_group = xray.CfnGroup(
            self,
            f"ApiGatewayGroup-{env_suffix}",
            group_name=f"api-gateway-{env_suffix}",
            filter_expression='service("AWS::ApiGateway::Stage")'
        )

        # Create X-Ray group for Lambda functions
        lambda_group = xray.CfnGroup(
            self,
            f"LambdaGroup-{env_suffix}",
            group_name=f"lambda-functions-{env_suffix}",
            filter_expression='service("AWS::Lambda") OR service("AWS::Lambda::Function")'
        )
```

## File: lib/eventbridge_stack.py

```python
"""EventBridge rules for capturing AWS service events"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_events as events,
    aws_events_targets as targets,
    aws_logs as logs,
)
from constructs import Construct


class EventBridgeStackProps(cdk.StackProps):
    """Properties for EventBridgeStack"""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class EventBridgeStack(Construct):
    """Stack for EventBridge rules and event forwarding"""

    def __init__(self, scope: Construct, construct_id: str, props: Optional[EventBridgeStackProps] = None, **kwargs):
        super().__init__(scope, construct_id)

        env_suffix = props.environment_suffix if props else 'dev'

        # Create log group for EventBridge events
        event_log_group = logs.LogGroup(
            self,
            f"EventBridgeLogGroup-{env_suffix}",
            log_group_name=f"/aws/events/payment-processing-{env_suffix}",
            retention=logs.RetentionDays.THREE_MONTHS,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Rule for Lambda function state changes
        lambda_state_rule = events.Rule(
            self,
            f"LambdaStateRule-{env_suffix}",
            rule_name=f"lambda-state-changes-{env_suffix}",
            description="Capture Lambda function state changes",
            event_pattern=events.EventPattern(
                source=["aws.lambda"],
                detail_type=[
                    "AWS API Call via CloudTrail"
                ],
                detail={
                    "eventName": [
                        "CreateFunction",
                        "DeleteFunction",
                        "UpdateFunctionConfiguration",
                        "UpdateFunctionCode"
                    ]
                }
            )
        )
        lambda_state_rule.add_target(targets.CloudWatchLogGroup(event_log_group))

        # Rule for API Gateway changes
        api_gateway_rule = events.Rule(
            self,
            f"ApiGatewayRule-{env_suffix}",
            rule_name=f"api-gateway-changes-{env_suffix}",
            description="Capture API Gateway changes",
            event_pattern=events.EventPattern(
                source=["aws.apigateway"],
                detail_type=[
                    "AWS API Call via CloudTrail"
                ]
            )
        )
        api_gateway_rule.add_target(targets.CloudWatchLogGroup(event_log_group))

        # Rule for DynamoDB changes
        dynamodb_rule = events.Rule(
            self,
            f"DynamoDBRule-{env_suffix}",
            rule_name=f"dynamodb-changes-{env_suffix}",
            description="Capture DynamoDB table changes",
            event_pattern=events.EventPattern(
                source=["aws.dynamodb"],
                detail_type=[
                    "AWS API Call via CloudTrail"
                ],
                detail={
                    "eventName": [
                        "CreateTable",
                        "DeleteTable",
                        "UpdateTable",
                        "UpdateTimeToLive"
                    ]
                }
            )
        )
        dynamodb_rule.add_target(targets.CloudWatchLogGroup(event_log_group))

        # Rule for SQS changes
        sqs_rule = events.Rule(
            self,
            f"SqsRule-{env_suffix}",
            rule_name=f"sqs-changes-{env_suffix}",
            description="Capture SQS queue changes",
            event_pattern=events.EventPattern(
                source=["aws.sqs"],
                detail_type=[
                    "AWS API Call via CloudTrail"
                ]
            )
        )
        sqs_rule.add_target(targets.CloudWatchLogGroup(event_log_group))

        # Rule for CloudWatch alarm state changes
        alarm_state_rule = events.Rule(
            self,
            f"AlarmStateRule-{env_suffix}",
            rule_name=f"alarm-state-changes-{env_suffix}",
            description="Capture CloudWatch alarm state changes",
            event_pattern=events.EventPattern(
                source=["aws.cloudwatch"],
                detail_type=[
                    "CloudWatch Alarm State Change"
                ]
            )
        )
        alarm_state_rule.add_target(targets.CloudWatchLogGroup(event_log_group))
```

## File: lib/contributor_insights_stack.py

```python
"""CloudWatch Contributor Insights rules stack"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_cloudwatch as cloudwatch,
)
from constructs import Construct


class ContributorInsightsStackProps(cdk.StackProps):
    """Properties for ContributorInsightsStack"""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class ContributorInsightsStack(Construct):
    """Stack for CloudWatch Contributor Insights rules"""

    def __init__(self, scope: Construct, construct_id: str, props: Optional[ContributorInsightsStackProps] = None, **kwargs):
        super().__init__(scope, construct_id)

        env_suffix = props.environment_suffix if props else 'dev'

        # Contributor Insights rule for top API consumers
        api_consumers_rule = cloudwatch.CfnInsightRule(
            self,
            f"TopApiConsumersRule-{env_suffix}",
            rule_name=f"top-api-consumers-{env_suffix}",
            rule_state="ENABLED",
            rule_body="""{
                "Schema": {
                    "Name": "CloudWatchLogRule",
                    "Version": 1
                },
                "LogGroupNames": [
                    "/aws/apigateway/payment-api-""" + env_suffix + """"
                ],
                "LogFormat": "JSON",
                "Fields": {
                    "2": "$.sourceIpAddress",
                    "3": "$.userAgent"
                },
                "Contribution": {
                    "Keys": [
                        "$.sourceIpAddress"
                    ],
                    "Filters": []
                },
                "AggregateOn": "Count"
            }"""
        )

        # Contributor Insights rule for error-prone Lambda functions
        lambda_errors_rule = cloudwatch.CfnInsightRule(
            self,
            f"ErrorProneLambdasRule-{env_suffix}",
            rule_name=f"error-prone-lambdas-{env_suffix}",
            rule_state="ENABLED",
            rule_body="""{
                "Schema": {
                    "Name": "CloudWatchLogRule",
                    "Version": 1
                },
                "LogGroupNames": [
                    "/aws/lambda/payment-processing-""" + env_suffix + """"
                ],
                "LogFormat": "JSON",
                "Contribution": {
                    "Keys": [
                        "$.functionName",
                        "$.errorType"
                    ],
                    "Filters": [
                        {
                            "Match": "$.level",
                            "In": [
                                "ERROR",
                                "FATAL"
                            ]
                        }
                    ]
                },
                "AggregateOn": "Count"
            }"""
        )

        # Contributor Insights rule for DynamoDB throttling by table
        dynamodb_throttles_rule = cloudwatch.CfnInsightRule(
            self,
            f"DynamoDBThrottlesRule-{env_suffix}",
            rule_name=f"dynamodb-throttles-by-table-{env_suffix}",
            rule_state="ENABLED",
            rule_body="""{
                "Schema": {
                    "Name": "CloudWatchLogRule",
                    "Version": 1
                },
                "LogGroupNames": [
                    "/aws/dynamodb/transactions-""" + env_suffix + """"
                ],
                "LogFormat": "JSON",
                "Contribution": {
                    "Keys": [
                        "$.tableName",
                        "$.operation"
                    ],
                    "Filters": [
                        {
                            "Match": "$.errorCode",
                            "In": [
                                "ProvisionedThroughputExceededException",
                                "ThrottlingException"
                            ]
                        }
                    ]
                },
                "AggregateOn": "Count"
            }"""
        )
```

## Deployment Instructions

1. Install dependencies:
   ```bash
   pip install aws-cdk-lib constructs
   ```

2. Deploy the stack:
   ```bash
   cdk deploy --context environmentSuffix=dev
   ```

3. The stack will create:
   - CloudWatch Log Groups with 90-day retention and KMS encryption
   - X-Ray sampling rules with 0.1 sampling rate
   - CloudWatch Dashboard with Lambda, API Gateway, DynamoDB, and SQS metrics
   - Custom CloudWatch metrics for business KPIs
   - CloudWatch Synthetics canaries monitoring /health and /api/v1/process-payment
   - CloudWatch Alarms for errors and throttling
   - SNS topics for critical and warning alerts
   - CloudWatch Logs Insights saved queries
   - EventBridge rules for AWS service events
   - CloudWatch Contributor Insights rules

## Key Improvements

1. **X-Ray Integration**: Added X-Ray sampling rules and groups for distributed tracing
2. **EventBridge Rules**: Capture AWS service events and forward to CloudWatch Logs
3. **Contributor Insights**: Rules to identify top API consumers and error-prone functions
4. **Custom Metrics**: Dashboard includes business KPI metrics
5. **Improved Alarms**: Use MathExpressions for percentage-based thresholds
6. **Enhanced Synthetics**: Better error handling and logging in canary scripts
7. **Security**: S3 bucket encryption and public access blocking
8. **Log Insights**: Additional query for failed transactions
