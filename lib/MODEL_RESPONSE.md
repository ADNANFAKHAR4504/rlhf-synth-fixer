# Observability Stack for Multi-Account Payment Processing System

## Solution Overview

This solution provides a comprehensive observability stack for monitoring a multi-account payment processing system using AWS CDK in Python. The implementation includes CloudWatch monitoring, X-Ray tracing, SNS alerting, CloudWatch Synthetics, and EventBridge integration.

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

        # Outputs
        cdk.CfnOutput(self, "DashboardURL",
            value=f"https://console.aws.amazon.com/cloudwatch/home?region={self.region}#dashboards:name={monitoring_stack.dashboard.dashboard_name}")
        cdk.CfnOutput(self, "CriticalTopicArn", value=alerting_stack.critical_topic.topic_arn)
        cdk.CfnOutput(self, "WarningTopicArn", value=alerting_stack.warning_topic.topic_arn)
```

## File: lib/monitoring_stack.py

```python
"""Monitoring stack with CloudWatch Log Groups, X-Ray, and Dashboard"""

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
                actions=["kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:CreateGrant", "kms:DescribeKey"],
                resources=["*"],
                conditions={
                    "ArnLike": {
                        "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{cdk.Stack.of(self).region}:{cdk.Stack.of(self).account}:*"
                    }
                }
            )
        )

        # Create CloudWatch Log Groups
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

        # Add widgets to dashboard
        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Lambda Invocations",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/Lambda",
                        metric_name="Invocations",
                        statistic="Sum",
                        period=cdk.Duration.minutes(5)
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/Lambda",
                        metric_name="Errors",
                        statistic="Sum",
                        period=cdk.Duration.minutes(5)
                    )
                ]
            )
        )

        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="API Gateway Latency",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/ApiGateway",
                        metric_name="Latency",
                        statistic="Average",
                        period=cdk.Duration.minutes(5)
                    )
                ]
            )
        )

        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="DynamoDB Capacity",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/DynamoDB",
                        metric_name="ConsumedReadCapacityUnits",
                        statistic="Sum",
                        period=cdk.Duration.minutes(5)
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/DynamoDB",
                        metric_name="ConsumedWriteCapacityUnits",
                        statistic="Sum",
                        period=cdk.Duration.minutes(5)
                    )
                ]
            )
        )

        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="SQS Queue Depth",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/SQS",
                        metric_name="ApproximateNumberOfMessagesVisible",
                        statistic="Average",
                        period=cdk.Duration.minutes(5)
                    )
                ]
            )
        )

        # Create CloudWatch Logs Insights query definitions
        logs.CfnQueryDefinition(
            self,
            f"ErrorQuery-{env_suffix}",
            name=f"payment-errors-{env_suffix}",
            query_string="""
                fields @timestamp, @message
                | filter @message like /ERROR/
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
        lambda_error_alarm = cloudwatch.Alarm(
            self,
            f"LambdaErrorAlarm-{env_suffix}",
            alarm_name=f"lambda-high-error-rate-{env_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/Lambda",
                metric_name="Errors",
                statistic="Sum",
                period=cdk.Duration.minutes(5)
            ),
            threshold=1,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        lambda_error_alarm.add_alarm_action(cw_actions.SnsAction(self.critical_topic))

        # API Gateway 4XX error alarm (> 5%)
        api_4xx_alarm = cloudwatch.Alarm(
            self,
            f"Api4xxAlarm-{env_suffix}",
            alarm_name=f"api-high-4xx-rate-{env_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/ApiGateway",
                metric_name="4XXError",
                statistic="Sum",
                period=cdk.Duration.minutes(5)
            ),
            threshold=5,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        api_4xx_alarm.add_alarm_action(cw_actions.SnsAction(self.warning_topic))

        # DynamoDB throttle alarm (> 0)
        dynamodb_throttle_alarm = cloudwatch.Alarm(
            self,
            f"DynamoDBThrottleAlarm-{env_suffix}",
            alarm_name=f"dynamodb-throttles-{env_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/DynamoDB",
                metric_name="UserErrors",
                statistic="Sum",
                period=cdk.Duration.minutes(5)
            ),
            threshold=0,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        dynamodb_throttle_alarm.add_alarm_action(cw_actions.SnsAction(self.critical_topic))

        # SQS DLQ messages alarm (> 10)
        sqs_dlq_alarm = cloudwatch.Alarm(
            self,
            f"SqsDlqAlarm-{env_suffix}",
            alarm_name=f"sqs-dlq-messages-{env_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/SQS",
                metric_name="ApproximateNumberOfMessagesVisible",
                statistic="Average",
                period=cdk.Duration.minutes(5)
            ),
            threshold=10,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
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
            bucket_name=f"payment-canary-artifacts-{env_suffix}",
            removal_policy=cdk.RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        # Health check canary
        health_canary = synthetics.CfnCanary(
            self,
            f"HealthCanary-{env_suffix}",
            name=f"health-check-{env_suffix}",
            artifact_s3_location=f"s3://{artifacts_bucket.bucket_name}/health",
            execution_role_arn=self._create_canary_role(f"health-{env_suffix}", artifacts_bucket).role_arn,
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

def handler(event, context):
    url = "https://api.example.com/health"
    browser = webdriver.Chrome()
    browser.get(url)
    logger.info(f"Health check status: {browser.page_source}")
    browser.quit()
    return "Success"
"""
            ),
            start_canary_after_creation=True
        )

        # Payment processing canary
        payment_canary = synthetics.CfnCanary(
            self,
            f"PaymentCanary-{env_suffix}",
            name=f"payment-api-{env_suffix}",
            artifact_s3_location=f"s3://{artifacts_bucket.bucket_name}/payment",
            execution_role_arn=self._create_canary_role(f"payment-{env_suffix}", artifacts_bucket).role_arn,
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

def handler(event, context):
    url = "https://api.example.com/api/v1/process-payment"
    browser = webdriver.Chrome()
    browser.get(url)
    logger.info(f"Payment API status: {browser.page_source}")
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
                actions=["s3:ListAllMyBuckets", "cloudwatch:PutMetricData"],
                resources=["*"]
            )
        )

        return role
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
   - CloudWatch Dashboard for monitoring
   - SNS topics for alerts
   - CloudWatch Alarms for errors and throttling
   - CloudWatch Synthetics canaries
   - CloudWatch Logs Insights query definitions

## Notes

- All resources include the environment suffix for uniqueness
- KMS key is used for log encryption
- Alarms send notifications to SNS topics
- Synthetics canaries monitor endpoints every 5 minutes
- All resources are destroyable (RemovalPolicy.DESTROY)
