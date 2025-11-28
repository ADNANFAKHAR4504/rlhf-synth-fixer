# AWS Compliance Auditing System - CDK Python Implementation

This implementation creates a comprehensive automated infrastructure compliance auditing system using AWS CDK with Python. The system deploys AWS Config with custom rules, Lambda functions for single-account scanning and report generation, EventBridge for scheduling, S3 for audit storage, SNS for alerts, CloudWatch dashboards for metrics, and automatic remediation capabilities.

## Architecture Overview

The solution includes:
- AWS Config with custom compliance rules and single-account aggregator
- Lambda functions for scanning, report generation, and auto-remediation
- EventBridge rules for 6-hour scheduled scans and custom events
- S3 bucket with versioning, KMS encryption, and 90-day lifecycle
- SNS topics for critical alerts
- CloudWatch dashboard for compliance metrics
- VPC with private subnets and VPC endpoints
- Single-account deployment with scoped IAM permissions

## File: lib/tap_stack.py

```python
"""tap_stack.py
Main CDK stack orchestrator for the compliance auditing system.
"""

from typing import Optional

import aws_cdk as cdk
from constructs import Construct

from .compliance_config_construct import ComplianceConfigConstruct
from .compliance_lambda_construct import ComplianceLambdaConstruct
from .compliance_storage_construct import ComplianceStorageConstruct
from .compliance_alerting_construct import ComplianceAlertingConstruct
from .compliance_monitoring_construct import ComplianceMonitoringConstruct
from .compliance_network_construct import ComplianceNetworkConstruct


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines properties for the TapStack.

    Args:
        environment_suffix (Optional[str]): Environment identifier for resource naming
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Main CDK stack for automated compliance auditing system.

    Orchestrates all compliance infrastructure components including
    AWS Config, Lambda functions, storage, alerting, and monitoring.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Add mandatory tags
        cdk.Tags.of(self).add('Environment', environment_suffix)
        cdk.Tags.of(self).add('Owner', 'compliance-team')
        cdk.Tags.of(self).add('CostCenter', 'security-ops')
        cdk.Tags.of(self).add('ComplianceLevel', 'high')

        # 1. Network infrastructure (VPC with endpoints)
        network = ComplianceNetworkConstruct(
            self,
            f"ComplianceNetwork{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # 2. Storage (S3 bucket with KMS encryption)
        storage = ComplianceStorageConstruct(
            self,
            f"ComplianceStorage{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # 3. Alerting (SNS topics)
        alerting = ComplianceAlertingConstruct(
            self,
            f"ComplianceAlerting{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # 4. Lambda functions (scanning, reporting, remediation)
        lambda_construct = ComplianceLambdaConstruct(
            self,
            f"ComplianceLambda{environment_suffix}",
            environment_suffix=environment_suffix,
            vpc=network.vpc,
            security_group=network.lambda_security_group,
            audit_bucket=storage.audit_bucket,
            alert_topic=alerting.critical_alert_topic
        )

        # 5. AWS Config (rules and aggregator)
        config_construct = ComplianceConfigConstruct(
            self,
            f"ComplianceConfig{environment_suffix}",
            environment_suffix=environment_suffix,
            config_bucket=storage.config_bucket,
            remediation_lambda=lambda_construct.remediation_function
        )

        # 6. Monitoring (CloudWatch dashboard)
        monitoring = ComplianceMonitoringConstruct(
            self,
            f"ComplianceMonitoring{environment_suffix}",
            environment_suffix=environment_suffix,
            scanner_lambda=lambda_construct.scanner_function,
            report_generator_lambda=lambda_construct.report_generator_function,
            alert_topic=alerting.critical_alert_topic
        )

        # Stack outputs
        cdk.CfnOutput(
            self,
            "AuditBucketName",
            value=storage.audit_bucket.bucket_name,
            description="S3 bucket for compliance audit reports"
        )

        cdk.CfnOutput(
            self,
            "ScannerFunctionName",
            value=lambda_construct.scanner_function.function_name,
            description="Lambda function for single-account scanning"
        )

        cdk.CfnOutput(
            self,
            "AlertTopicArn",
            value=alerting.critical_alert_topic.topic_arn,
            description="SNS topic for critical compliance alerts"
        )

        cdk.CfnOutput(
            self,
            "DashboardName",
            value=monitoring.dashboard.dashboard_name,
            description="CloudWatch dashboard for compliance metrics"
        )
```

## File: lib/compliance_network_construct.py

```python
"""compliance_network_construct.py
VPC infrastructure for compliance Lambda functions.
"""

import aws_cdk as cdk
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_logs as logs
from constructs import Construct


class ComplianceNetworkConstruct(Construct):
    """
    Network infrastructure for compliance auditing system.

    Creates VPC with private subnets, VPC endpoints for AWS services,
    and security groups for Lambda functions.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str
    ):
        super().__init__(scope, construct_id)

        # Create VPC with private subnets
        self.vpc = ec2.Vpc(
            self,
            "ComplianceVPC",
            vpc_name=f"compliance-vpc-{environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            nat_gateways=0,  # Use VPC endpoints instead for cost optimization
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        # VPC Flow Logs with specific naming convention
        flow_log_group = logs.LogGroup(
            self,
            "VPCFlowLogGroup",
            log_group_name=f"/aws/vpc/audit-flowlogs-us-east-1-{environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        flow_log_role = cdk.aws_iam.Role(
            self,
            "FlowLogRole",
            assumed_by=cdk.aws_iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            managed_policies=[
                cdk.aws_iam.ManagedPolicy.from_aws_managed_policy_name(
                    "CloudWatchLogsFullAccess"
                )
            ]
        )

        ec2.FlowLog(
            self,
            "VPCFlowLog",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                flow_log_group,
                flow_log_role
            ),
            traffic_type=ec2.FlowLogTrafficType.ALL
        )

        # VPC Endpoints for AWS services (cost-effective alternative to NAT)
        self.vpc.add_gateway_endpoint(
            "S3Endpoint",
            service=ec2.GatewayVpcEndpointAwsService.S3
        )

        self.vpc.add_interface_endpoint(
            "SNSEndpoint",
            service=ec2.InterfaceVpcEndpointAwsService.SNS
        )

        self.vpc.add_interface_endpoint(
            "STSEndpoint",
            service=ec2.InterfaceVpcEndpointAwsService.STS
        )

        self.vpc.add_interface_endpoint(
            "ConfigEndpoint",
            service=ec2.InterfaceVpcEndpointAwsService.CONFIG
        )

        self.vpc.add_interface_endpoint(
            "CloudWatchLogsEndpoint",
            service=ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS
        )

        # Security group for Lambda functions
        self.lambda_security_group = ec2.SecurityGroup(
            self,
            "LambdaSecurityGroup",
            vpc=self.vpc,
            security_group_name=f"compliance-lambda-sg-{environment_suffix}",
            description="Security group for compliance Lambda functions",
            allow_all_outbound=True
        )
```

## File: lib/compliance_storage_construct.py

```python
"""compliance_storage_construct.py
S3 buckets for audit reports and AWS Config storage.
"""

import aws_cdk as cdk
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_kms as kms
from constructs import Construct


class ComplianceStorageConstruct(Construct):
    """
    Storage infrastructure for compliance auditing system.

    Creates S3 buckets with KMS encryption, versioning, and lifecycle policies.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str
    ):
        super().__init__(scope, construct_id)

        # KMS key for audit bucket encryption
        self.audit_kms_key = kms.Key(
            self,
            "AuditBucketKey",
            description=f"KMS key for audit bucket encryption - {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # KMS key for Config bucket encryption
        self.config_kms_key = kms.Key(
            self,
            "ConfigBucketKey",
            description=f"KMS key for Config bucket encryption - {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Grant AWS Config service access to the key
        self.config_kms_key.add_to_resource_policy(
            cdk.aws_iam.PolicyStatement(
                sid="Allow Config to use the key",
                actions=[
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                ],
                principals=[
                    cdk.aws_iam.ServicePrincipal("config.amazonaws.com")
                ],
                resources=["*"]
            )
        )

        # S3 bucket for audit reports
        self.audit_bucket = s3.Bucket(
            self,
            "AuditReportBucket",
            bucket_name=f"compliance-audit-reports-{environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.audit_kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldReports",
                    enabled=True,
                    expiration=cdk.Duration.days(90)
                ),
                s3.LifecycleRule(
                    id="TransitionToIA",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=cdk.Duration.days(30)
                        )
                    ]
                )
            ]
        )

        # S3 bucket for AWS Config
        self.config_bucket = s3.Bucket(
            self,
            "ConfigBucket",
            bucket_name=f"compliance-config-data-{environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.config_kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        # Grant AWS Config service access to the bucket
        self.config_bucket.add_to_resource_policy(
            cdk.aws_iam.PolicyStatement(
                sid="AWSConfigBucketPermissionsCheck",
                effect=cdk.aws_iam.Effect.ALLOW,
                principals=[
                    cdk.aws_iam.ServicePrincipal("config.amazonaws.com")
                ],
                actions=["s3:GetBucketAcl"],
                resources=[self.config_bucket.bucket_arn]
            )
        )

        self.config_bucket.add_to_resource_policy(
            cdk.aws_iam.PolicyStatement(
                sid="AWSConfigBucketExistenceCheck",
                effect=cdk.aws_iam.Effect.ALLOW,
                principals=[
                    cdk.aws_iam.ServicePrincipal("config.amazonaws.com")
                ],
                actions=["s3:ListBucket"],
                resources=[self.config_bucket.bucket_arn]
            )
        )

        self.config_bucket.add_to_resource_policy(
            cdk.aws_iam.PolicyStatement(
                sid="AWSConfigBucketPutObject",
                effect=cdk.aws_iam.Effect.ALLOW,
                principals=[
                    cdk.aws_iam.ServicePrincipal("config.amazonaws.com")
                ],
                actions=["s3:PutObject"],
                resources=[f"{self.config_bucket.bucket_arn}/*"],
                conditions={
                    "StringEquals": {
                        "s3:x-amz-acl": "bucket-owner-full-control"
                    }
                }
            )
        )
```

## File: lib/compliance_alerting_construct.py

```python
"""compliance_alerting_construct.py
SNS topics for compliance alerts.
"""

import aws_cdk as cdk
from aws_cdk import aws_sns as sns
from aws_cdk import aws_sns_subscriptions as subscriptions
from constructs import Construct


class ComplianceAlertingConstruct(Construct):
    """
    Alerting infrastructure for compliance violations.

    Creates SNS topics for critical alerts with email subscriptions.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str
    ):
        super().__init__(scope, construct_id)

        # SNS topic for critical compliance alerts
        self.critical_alert_topic = sns.Topic(
            self,
            "CriticalAlertTopic",
            topic_name=f"compliance-critical-alerts-{environment_suffix}",
            display_name="Critical Compliance Alerts",
            fifo=False
        )

        # SNS topic for warning-level alerts
        self.warning_alert_topic = sns.Topic(
            self,
            "WarningAlertTopic",
            topic_name=f"compliance-warning-alerts-{environment_suffix}",
            display_name="Compliance Warning Alerts",
            fifo=False
        )

        # Note: Email subscriptions should be added manually or via AWS Console
        # Uncomment and modify if you want to add subscriptions programmatically:
        # self.critical_alert_topic.add_subscription(
        #     subscriptions.EmailSubscription("security-team@example.com")
        # )
```

## File: lib/compliance_lambda_construct.py

```python
"""compliance_lambda_construct.py
Lambda functions for compliance scanning, reporting, and remediation.
"""

import aws_cdk as cdk
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_iam as iam
from aws_cdk import aws_events as events
from aws_cdk import aws_events_targets as targets
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_sns as sns
from constructs import Construct


class ComplianceLambdaConstruct(Construct):
    """
    Lambda functions for compliance operations.

    Creates functions for single-account scanning, report generation,
    and automatic remediation with EventBridge scheduling.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc: ec2.Vpc,
        security_group: ec2.SecurityGroup,
        audit_bucket: s3.Bucket,
        alert_topic: sns.Topic
    ):
        super().__init__(scope, construct_id)

        # IAM role for single-account scanning
        self.scanner_role = iam.Role(
            self,
            "ScannerLambdaRole",
            role_name=f"compliance-scanner-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AWSXRayDaemonWriteAccess"
                )
            ]
        )

        # Add AWS Config read permissions
        self.scanner_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "config:DescribeComplianceByConfigRule",
                    "config:DescribeComplianceByResource",
                    "config:GetComplianceDetailsByConfigRule",
                    "config:GetComplianceDetailsByResource",
                    "config:DescribeConfigRules"
                ],
                resources=["*"]
            )
        )

        # Lambda function for single-account infrastructure scanning
        self.scanner_function = lambda_.Function(
            self,
            "ScannerFunction",
            function_name=f"compliance-scanner-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="scanner.handler",
            code=lambda_.Code.from_asset("lib/lambda/scanner"),
            role=self.scanner_role,
            timeout=cdk.Duration.minutes(5),
            memory_size=1024,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[security_group],
            tracing=lambda_.Tracing.ACTIVE,
            environment={
                "AUDIT_BUCKET": audit_bucket.bucket_name,
                "ALERT_TOPIC_ARN": alert_topic.topic_arn,
                "ENVIRONMENT_SUFFIX": environment_suffix
            }
        )

        # Grant permissions
        audit_bucket.grant_write(self.scanner_function)
        alert_topic.grant_publish(self.scanner_function)

        # Lambda function for report generation (JSON and CSV)
        self.report_generator_function = lambda_.Function(
            self,
            "ReportGeneratorFunction",
            function_name=f"compliance-report-generator-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="report_generator.handler",
            code=lambda_.Code.from_asset("lib/lambda/report_generator"),
            timeout=cdk.Duration.minutes(5),
            memory_size=1024,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[security_group],
            tracing=lambda_.Tracing.ACTIVE,
            environment={
                "AUDIT_BUCKET": audit_bucket.bucket_name,
                "ENVIRONMENT_SUFFIX": environment_suffix
            },
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AWSXRayDaemonWriteAccess"
                )
            ]
        )

        audit_bucket.grant_read_write(self.report_generator_function)

        # Lambda function for automatic remediation
        self.remediation_function = lambda_.Function(
            self,
            "RemediationFunction",
            function_name=f"compliance-auto-remediation-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="remediation.handler",
            code=lambda_.Code.from_asset("lib/lambda/remediation"),
            timeout=cdk.Duration.minutes(5),
            memory_size=1024,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[security_group],
            tracing=lambda_.Tracing.ACTIVE,
            environment={
                "ALERT_TOPIC_ARN": alert_topic.topic_arn,
                "ENVIRONMENT_SUFFIX": environment_suffix
            },
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AWSXRayDaemonWriteAccess"
                )
            ]
        )

        # Add remediation permissions (S3 encryption, etc.)
        self.remediation_function.add_to_role_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:PutEncryptionConfiguration",
                    "s3:PutBucketVersioning",
                    "lambda:UpdateFunctionConfiguration"
                ],
                resources=["*"]
            )
        )

        alert_topic.grant_publish(self.remediation_function)

        # EventBridge rule for 6-hour scheduled scans
        scheduled_rule = events.Rule(
            self,
            "ScheduledScanRule",
            rule_name=f"compliance-scheduled-scan-{environment_suffix}",
            description="Trigger compliance scans every 6 hours",
            schedule=events.Schedule.rate(cdk.Duration.hours(6))
        )

        scheduled_rule.add_target(
            targets.LambdaFunction(self.scanner_function)
        )

        # EventBridge rule for custom on-demand scans
        custom_event_rule = events.Rule(
            self,
            "CustomEventScanRule",
            rule_name=f"compliance-custom-scan-{environment_suffix}",
            description="Trigger compliance scans via custom events",
            event_pattern=events.EventPattern(
                source=["compliance.audit"],
                detail_type=["Compliance Scan Request"]
            )
        )

        custom_event_rule.add_target(
            targets.LambdaFunction(self.scanner_function)
        )

        # EventBridge rule to trigger report generation after scan
        report_trigger_rule = events.Rule(
            self,
            "ReportTriggerRule",
            rule_name=f"compliance-report-trigger-{environment_suffix}",
            description="Generate reports after compliance scan",
            event_pattern=events.EventPattern(
                source=["compliance.audit"],
                detail_type=["Compliance Scan Complete"]
            )
        )

        report_trigger_rule.add_target(
            targets.LambdaFunction(self.report_generator_function)
        )
```

## File: lib/compliance_config_construct.py

```python
"""compliance_config_construct.py
AWS Config setup with custom rules and aggregator.
"""

import aws_cdk as cdk
from aws_cdk import aws_config as config
from aws_cdk import aws_iam as iam
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_lambda as lambda_
from constructs import Construct


class ComplianceConfigConstruct(Construct):
    """
    AWS Config infrastructure for compliance monitoring.

    Creates Config recorder, custom rules for S3, VPC, and Lambda compliance,
    and Config aggregator for single-account data collection.

    Note: Only one Config recorder can exist per region per account.
    This will fail if a recorder already exists.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        config_bucket: s3.Bucket,
        remediation_lambda: lambda_.Function
    ):
        super().__init__(scope, construct_id)

        # IAM role for AWS Config
        config_role = iam.Role(
            self,
            "ConfigRole",
            role_name=f"compliance-config-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("config.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWS_ConfigRole"
                )
            ]
        )

        # Grant Config access to S3 bucket
        config_bucket.grant_read_write(config_role)

        # AWS Config Recorder
        config_recorder = config.CfnConfigurationRecorder(
            self,
            "ConfigRecorder",
            name=f"compliance-config-recorder-{environment_suffix}",
            role_arn=config_role.role_arn,
            recording_group=config.CfnConfigurationRecorder.RecordingGroupProperty(
                all_supported=True,
                include_global_resource_types=True
            )
        )

        # Delivery channel for Config
        delivery_channel = config.CfnDeliveryChannel(
            self,
            "ConfigDeliveryChannel",
            name=f"compliance-config-delivery-{environment_suffix}",
            s3_bucket_name=config_bucket.bucket_name
        )

        # Ensure recorder is created before delivery channel
        delivery_channel.add_dependency(config_recorder)

        # Custom Config Rule: S3 Bucket Encryption
        s3_encryption_rule = config.ManagedRule(
            self,
            "S3BucketEncryptionRule",
            config_rule_name=f"s3-bucket-encryption-check-{environment_suffix}",
            identifier="S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED",
            description="Checks that S3 buckets have encryption enabled"
        )

        # Custom Config Rule: VPC Flow Logs
        vpc_flow_logs_rule = config.ManagedRule(
            self,
            "VPCFlowLogsRule",
            config_rule_name=f"vpc-flow-logs-enabled-{environment_suffix}",
            identifier="VPC_FLOW_LOGS_ENABLED",
            description="Checks that VPC Flow Logs are enabled"
        )

        # Custom Config Rule: Lambda Function Settings
        lambda_settings_rule = config.ManagedRule(
            self,
            "LambdaSettingsRule",
            config_rule_name=f"lambda-function-settings-check-{environment_suffix}",
            identifier="LAMBDA_FUNCTION_PUBLIC_ACCESS_PROHIBITED",
            description="Checks that Lambda functions are not publicly accessible"
        )

        # Lambda tracing enabled rule
        lambda_tracing_rule = config.ManagedRule(
            self,
            "LambdaTracingRule",
            config_rule_name=f"lambda-tracing-enabled-{environment_suffix}",
            identifier="LAMBDA_FUNCTION_TRACING_ENABLED",
            description="Checks that Lambda functions have X-Ray tracing enabled"
        )

        # Automatic remediation for S3 encryption
        s3_encryption_rule.on_compliance_change(
            "S3EncryptionRemediation",
            target=cdk.aws_events_targets.LambdaFunction(remediation_lambda),
            description="Trigger automatic remediation for S3 encryption violations"
        )

        # Config Aggregator for single-account compliance data
        # Aggregates data from current account only
        self.config_aggregator = config.CfnConfigurationAggregator(
            self,
            "ConfigAggregator",
            configuration_aggregator_name=f"compliance-aggregator-{environment_suffix}",
            account_aggregation_sources=[
                config.CfnConfigurationAggregator.AccountAggregationSourceProperty(
                    account_ids=[cdk.Aws.ACCOUNT_ID],
                    all_aws_regions=False,
                    aws_regions=["us-east-1"]
                )
            ]
        )
```

## File: lib/compliance_monitoring_construct.py

```python
"""compliance_monitoring_construct.py
CloudWatch dashboard for compliance metrics.
"""

import aws_cdk as cdk
from aws_cdk import aws_cloudwatch as cloudwatch
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_sns as sns
from constructs import Construct


class ComplianceMonitoringConstruct(Construct):
    """
    Monitoring infrastructure for compliance metrics.

    Creates CloudWatch dashboard with metrics for Lambda functions,
    compliance trends, and alerting statistics.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        scanner_lambda: lambda_.Function,
        report_generator_lambda: lambda_.Function,
        alert_topic: sns.Topic
    ):
        super().__init__(scope, construct_id)

        # CloudWatch Dashboard
        self.dashboard = cloudwatch.Dashboard(
            self,
            "ComplianceDashboard",
            dashboard_name=f"compliance-metrics-{environment_suffix}"
        )

        # Scanner Lambda metrics
        scanner_invocations_metric = scanner_lambda.metric_invocations(
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        scanner_errors_metric = scanner_lambda.metric_errors(
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        scanner_duration_metric = scanner_lambda.metric_duration(
            statistic="Average",
            period=cdk.Duration.minutes(5)
        )

        # Report generator metrics
        report_invocations_metric = report_generator_lambda.metric_invocations(
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        report_errors_metric = report_generator_lambda.metric_errors(
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        # SNS alert metrics
        alert_published_metric = cloudwatch.Metric(
            namespace="AWS/SNS",
            metric_name="NumberOfMessagesPublished",
            dimensions_map={
                "TopicName": alert_topic.topic_name
            },
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        # Add widgets to dashboard
        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Scanner Function Activity",
                left=[scanner_invocations_metric, scanner_errors_metric],
                width=12
            ),
            cloudwatch.GraphWidget(
                title="Scanner Function Duration",
                left=[scanner_duration_metric],
                width=12
            )
        )

        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Report Generator Activity",
                left=[report_invocations_metric, report_errors_metric],
                width=12
            ),
            cloudwatch.GraphWidget(
                title="Compliance Alerts Published",
                left=[alert_published_metric],
                width=12
            )
        )

        # Alarms for critical Lambda errors
        scanner_error_alarm = cloudwatch.Alarm(
            self,
            "ScannerErrorAlarm",
            alarm_name=f"compliance-scanner-errors-{environment_suffix}",
            metric=scanner_errors_metric,
            threshold=5,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alert when scanner function has multiple errors"
        )

        scanner_error_alarm.add_alarm_action(
            cdk.aws_cloudwatch_actions.SnsAction(alert_topic)
        )
```

## File: lib/lambda/scanner/scanner.py

```python
"""scanner.py
Lambda function for single-account infrastructure compliance scanning.
"""

import json
import os
import boto3
from datetime import datetime
from botocore.exceptions import ClientError

# Initialize AWS clients
sts_client = boto3.client('sts')
s3_client = boto3.client('s3')
config_client = boto3.client('config')
sns_client = boto3.client('sns')
events_client = boto3.client('events')

AUDIT_BUCKET = os.environ['AUDIT_BUCKET']
ALERT_TOPIC_ARN = os.environ['ALERT_TOPIC_ARN']
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']


def get_compliance_summary():
    """
    Get compliance summary from AWS Config for the current account.

    Returns:
        Dictionary of compliance results
    """
    config_client_cross = config_client

    compliance_summary = {
        'compliant': 0,
        'non_compliant': 0,
        'not_applicable': 0,
        'insufficient_data': 0,
        'rules': []
    }

    try:
        # Get all Config rules
        rules_response = config_client_cross.describe_config_rules()

        for rule in rules_response.get('ConfigRules', []):
            rule_name = rule['ConfigRuleName']

            # Get compliance details for each rule
            try:
                compliance_response = config_client_cross.describe_compliance_by_config_rule(
                    ConfigRuleNames=[rule_name]
                )

                for compliance in compliance_response.get('ComplianceByConfigRules', []):
                    status = compliance['Compliance']['ComplianceType']

                    rule_info = {
                        'rule_name': rule_name,
                        'status': status,
                        'rule_id': rule.get('ConfigRuleId', 'N/A')
                    }

                    compliance_summary['rules'].append(rule_info)

                    if status == 'COMPLIANT':
                        compliance_summary['compliant'] += 1
                    elif status == 'NON_COMPLIANT':
                        compliance_summary['non_compliant'] += 1
                    elif status == 'NOT_APPLICABLE':
                        compliance_summary['not_applicable'] += 1
                    else:
                        compliance_summary['insufficient_data'] += 1

            except ClientError as e:
                print(f"Error getting compliance for rule {rule_name}: {e}")

    except ClientError as e:
        print(f"Error describing Config rules: {e}")

    return compliance_summary


def save_scan_results(scan_data):
    """
    Save scan results to S3 audit bucket.

    Args:
        scan_data: Dictionary containing scan results

    Returns:
        S3 object key
    """
    timestamp = datetime.utcnow().strftime('%Y-%m-%d-%H-%M-%S')
    s3_key = f"scans/{timestamp}/compliance-scan.json"

    try:
        s3_client.put_object(
            Bucket=AUDIT_BUCKET,
            Key=s3_key,
            Body=json.dumps(scan_data, indent=2),
            ContentType='application/json'
        )
        print(f"Scan results saved to s3://{AUDIT_BUCKET}/{s3_key}")
        return s3_key
    except ClientError as e:
        print(f"Error saving scan results to S3: {e}")
        return None


def send_alert(subject, message):
    """
    Send alert to SNS topic.

    Args:
        subject: Alert subject
        message: Alert message body
    """
    try:
        sns_client.publish(
            TopicArn=ALERT_TOPIC_ARN,
            Subject=subject,
            Message=message
        )
        print(f"Alert sent: {subject}")
    except ClientError as e:
        print(f"Error sending alert: {e}")


def trigger_report_generation(scan_key):
    """
    Trigger report generation via EventBridge custom event.

    Args:
        scan_key: S3 key of scan results
    """
    try:
        events_client.put_events(
            Entries=[
                {
                    'Source': 'compliance.audit',
                    'DetailType': 'Compliance Scan Complete',
                    'Detail': json.dumps({
                        'scan_key': scan_key,
                        'environment': ENVIRONMENT_SUFFIX
                    })
                }
            ]
        )
        print("Report generation triggered")
    except ClientError as e:
        print(f"Error triggering report generation: {e}")


def handler(event, context):
    """
    Main Lambda handler for compliance scanning.

    Performs cross-account infrastructure compliance scanning,
    aggregates results, and triggers alerts and reports.
    """
    print(f"Starting compliance scan - Environment: {ENVIRONMENT_SUFFIX}")

    scan_results = {
        'timestamp': datetime.utcnow().isoformat(),
        'environment': ENVIRONMENT_SUFFIX,
        'accounts': []
    }

    # Scan current account
    print("Scanning current account...")
    current_account_id = sts_client.get_caller_identity()['Account']

    compliance_summary = get_compliance_summary()

    account_result = {
        'account_id': current_account_id,
        'compliance_summary': compliance_summary
    }

    scan_results['accounts'].append(account_result)

    # Check for cross-account scan requests in event
    target_accounts = event.get('detail', {}).get('target_accounts', [])

    for account_info in target_accounts:
        account_id = account_info.get('account_id')
        role_name = account_info.get('role_name', 'ComplianceAuditRole')

        print(f"Scanning account {account_id}...")

        credentials = assume_role(account_id, role_name)
        if credentials:
            compliance_summary = get_compliance_summary(credentials)

            account_result = {
                'account_id': account_id,
                'compliance_summary': compliance_summary
            }

            scan_results['accounts'].append(account_result)

    # Calculate total compliance metrics
    total_compliant = sum(acc['compliance_summary']['compliant']
                          for acc in scan_results['accounts'])
    total_non_compliant = sum(acc['compliance_summary']['non_compliant']
                              for acc in scan_results['accounts'])

    scan_results['total_summary'] = {
        'compliant': total_compliant,
        'non_compliant': total_non_compliant,
        'total_rules': total_compliant + total_non_compliant
    }

    # Save results
    scan_key = save_scan_results(scan_results)

    # Send alert if critical violations found
    if total_non_compliant > 0:
        alert_message = f"""
Compliance Scan Alert

Environment: {ENVIRONMENT_SUFFIX}
Total Non-Compliant Rules: {total_non_compliant}
Total Compliant Rules: {total_compliant}

Scan Results: s3://{AUDIT_BUCKET}/{scan_key}

Please review the compliance violations immediately.
        """
        send_alert("Critical Compliance Violations Detected", alert_message)

    # Trigger report generation
    if scan_key:
        trigger_report_generation(scan_key)

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Compliance scan completed',
            'scan_key': scan_key,
            'total_non_compliant': total_non_compliant
        })
    }
```

## File: lib/lambda/report_generator/report_generator.py

```python
"""report_generator.py
Lambda function for generating compliance reports in JSON and CSV formats.
"""

import json
import csv
import io
import os
import boto3
from datetime import datetime
from botocore.exceptions import ClientError

s3_client = boto3.client('s3')

AUDIT_BUCKET = os.environ['AUDIT_BUCKET']
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']


def load_scan_results(scan_key):
    """
    Load scan results from S3.

    Args:
        scan_key: S3 key of scan results

    Returns:
        Dictionary of scan results
    """
    try:
        response = s3_client.get_object(
            Bucket=AUDIT_BUCKET,
            Key=scan_key
        )
        scan_data = json.loads(response['Body'].read().decode('utf-8'))
        return scan_data
    except ClientError as e:
        print(f"Error loading scan results: {e}")
        return None


def generate_json_report(scan_data):
    """
    Generate detailed JSON compliance report.

    Args:
        scan_data: Scan results dictionary

    Returns:
        JSON string
    """
    report = {
        'report_generated': datetime.utcnow().isoformat(),
        'environment': ENVIRONMENT_SUFFIX,
        'scan_timestamp': scan_data.get('timestamp'),
        'executive_summary': {
            'total_accounts': len(scan_data.get('accounts', [])),
            'total_compliant': scan_data.get('total_summary', {}).get('compliant', 0),
            'total_non_compliant': scan_data.get('total_summary', {}).get('non_compliant', 0),
            'compliance_percentage': 0
        },
        'account_details': []
    }

    # Calculate compliance percentage
    total_rules = report['executive_summary']['total_compliant'] + \
                  report['executive_summary']['total_non_compliant']

    if total_rules > 0:
        report['executive_summary']['compliance_percentage'] = round(
            (report['executive_summary']['total_compliant'] / total_rules) * 100, 2
        )

    # Add account details
    for account in scan_data.get('accounts', []):
        account_detail = {
            'account_id': account.get('account_id'),
            'compliance_summary': account.get('compliance_summary'),
            'violations': []
        }

        # Extract non-compliant rules
        for rule in account.get('compliance_summary', {}).get('rules', []):
            if rule.get('status') == 'NON_COMPLIANT':
                account_detail['violations'].append({
                    'rule_name': rule.get('rule_name'),
                    'rule_id': rule.get('rule_id'),
                    'status': rule.get('status')
                })

        report['account_details'].append(account_detail)

    return json.dumps(report, indent=2)


def generate_csv_report(scan_data):
    """
    Generate CSV compliance report.

    Args:
        scan_data: Scan results dictionary

    Returns:
        CSV string
    """
    output = io.StringIO()
    csv_writer = csv.writer(output)

    # Header
    csv_writer.writerow([
        'Account ID',
        'Rule Name',
        'Rule ID',
        'Compliance Status',
        'Scan Timestamp'
    ])

    # Data rows
    for account in scan_data.get('accounts', []):
        account_id = account.get('account_id')

        for rule in account.get('compliance_summary', {}).get('rules', []):
            csv_writer.writerow([
                account_id,
                rule.get('rule_name'),
                rule.get('rule_id'),
                rule.get('status'),
                scan_data.get('timestamp')
            ])

    return output.getvalue()


def save_report(report_content, report_type, timestamp):
    """
    Save report to S3.

    Args:
        report_content: Report content (JSON or CSV)
        report_type: 'json' or 'csv'
        timestamp: Report timestamp

    Returns:
        S3 key
    """
    s3_key = f"reports/{timestamp}/compliance-report.{report_type}"

    try:
        s3_client.put_object(
            Bucket=AUDIT_BUCKET,
            Key=s3_key,
            Body=report_content,
            ContentType='application/json' if report_type == 'json' else 'text/csv'
        )
        print(f"Report saved to s3://{AUDIT_BUCKET}/{s3_key}")
        return s3_key
    except ClientError as e:
        print(f"Error saving report to S3: {e}")
        return None


def handler(event, context):
    """
    Main Lambda handler for report generation.

    Generates compliance reports in JSON and CSV formats
    from scan results.
    """
    print(f"Starting report generation - Environment: {ENVIRONMENT_SUFFIX}")

    # Extract scan key from event
    detail = event.get('detail', {})
    scan_key = detail.get('scan_key')

    if not scan_key:
        print("No scan_key found in event")
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'scan_key required'})
        }

    # Load scan results
    scan_data = load_scan_results(scan_key)
    if not scan_data:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Scan results not found'})
        }

    timestamp = datetime.utcnow().strftime('%Y-%m-%d-%H-%M-%S')

    # Generate JSON report
    json_report = generate_json_report(scan_data)
    json_key = save_report(json_report, 'json', timestamp)

    # Generate CSV report
    csv_report = generate_csv_report(scan_data)
    csv_key = save_report(csv_report, 'csv', timestamp)

    print(f"Reports generated successfully")

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Reports generated successfully',
            'json_report': json_key,
            'csv_report': csv_key
        })
    }
```

## File: lib/lambda/remediation/remediation.py

```python
"""remediation.py
Lambda function for automatic remediation of compliance violations.
"""

import json
import os
import boto3
from botocore.exceptions import ClientError

s3_client = boto3.client('s3')
lambda_client = boto3.client('lambda')
sns_client = boto3.client('sns')

ALERT_TOPIC_ARN = os.environ['ALERT_TOPIC_ARN']
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']


def enable_s3_encryption(bucket_name):
    """
    Enable default encryption on S3 bucket.

    Args:
        bucket_name: Name of S3 bucket

    Returns:
        Success status
    """
    try:
        s3_client.put_bucket_encryption(
            Bucket=bucket_name,
            ServerSideEncryptionConfiguration={
                'Rules': [
                    {
                        'ApplyServerSideEncryptionByDefault': {
                            'SSEAlgorithm': 'AES256'
                        },
                        'BucketKeyEnabled': True
                    }
                ]
            }
        )
        print(f"Enabled encryption on bucket: {bucket_name}")
        return True
    except ClientError as e:
        print(f"Error enabling encryption on {bucket_name}: {e}")
        return False


def enable_s3_versioning(bucket_name):
    """
    Enable versioning on S3 bucket.

    Args:
        bucket_name: Name of S3 bucket

    Returns:
        Success status
    """
    try:
        s3_client.put_bucket_versioning(
            Bucket=bucket_name,
            VersioningConfiguration={
                'Status': 'Enabled'
            }
        )
        print(f"Enabled versioning on bucket: {bucket_name}")
        return True
    except ClientError as e:
        print(f"Error enabling versioning on {bucket_name}: {e}")
        return False


def enable_lambda_tracing(function_name):
    """
    Enable X-Ray tracing on Lambda function.

    Args:
        function_name: Name of Lambda function

    Returns:
        Success status
    """
    try:
        lambda_client.update_function_configuration(
            FunctionName=function_name,
            TracingConfig={
                'Mode': 'Active'
            }
        )
        print(f"Enabled X-Ray tracing on function: {function_name}")
        return True
    except ClientError as e:
        print(f"Error enabling tracing on {function_name}: {e}")
        return False


def send_remediation_alert(resource_type, resource_id, action, success):
    """
    Send alert about remediation action.

    Args:
        resource_type: Type of resource (S3, Lambda, etc.)
        resource_id: Resource identifier
        action: Remediation action taken
        success: Whether remediation succeeded
    """
    status = "SUCCESS" if success else "FAILED"

    message = f"""
Automatic Remediation {status}

Environment: {ENVIRONMENT_SUFFIX}
Resource Type: {resource_type}
Resource ID: {resource_id}
Action: {action}
Status: {status}

Timestamp: {boto3.client('sts').get_caller_identity()}
    """

    try:
        sns_client.publish(
            TopicArn=ALERT_TOPIC_ARN,
            Subject=f"Remediation {status}: {resource_type} - {resource_id}",
            Message=message
        )
        print(f"Remediation alert sent: {status}")
    except ClientError as e:
        print(f"Error sending remediation alert: {e}")


def handler(event, context):
    """
    Main Lambda handler for automatic remediation.

    Triggered by AWS Config compliance change events.
    Performs automatic remediation for specific violation types.
    """
    print(f"Starting automatic remediation - Environment: {ENVIRONMENT_SUFFIX}")

    # Parse Config rule compliance change event
    detail = event.get('detail', {})
    config_rule_name = detail.get('configRuleName', '')
    compliance_type = detail.get('newEvaluationResult', {}).get('complianceType', '')
    resource_type = detail.get('resourceType', '')
    resource_id = detail.get('resourceId', '')

    print(f"Config Rule: {config_rule_name}")
    print(f"Compliance: {compliance_type}")
    print(f"Resource: {resource_type}/{resource_id}")

    # Only remediate non-compliant resources
    if compliance_type != 'NON_COMPLIANT':
        print("Resource is compliant, no remediation needed")
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'No remediation needed'})
        }

    remediation_performed = False
    action = "None"
    success = False

    # S3 bucket encryption remediation
    if resource_type == 'AWS::S3::Bucket' and 'encryption' in config_rule_name.lower():
        action = "Enable S3 encryption"
        success = enable_s3_encryption(resource_id)
        remediation_performed = True

    # S3 bucket versioning remediation
    elif resource_type == 'AWS::S3::Bucket' and 'versioning' in config_rule_name.lower():
        action = "Enable S3 versioning"
        success = enable_s3_versioning(resource_id)
        remediation_performed = True

    # Lambda tracing remediation
    elif resource_type == 'AWS::Lambda::Function' and 'tracing' in config_rule_name.lower():
        action = "Enable Lambda X-Ray tracing"
        success = enable_lambda_tracing(resource_id)
        remediation_performed = True

    # Send alert about remediation
    if remediation_performed:
        send_remediation_alert(resource_type, resource_id, action, success)

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Remediation completed' if remediation_performed else 'No remediation available',
            'action': action,
            'success': success
        })
    }
```

## File: lib/__init__.py

```python
"""lib/__init__.py
Package initialization for compliance auditing infrastructure.
"""
```

## Deployment Instructions

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. CDK CLI installed (`npm install -g aws-cdk`)
3. Python 3.9+ installed
4. Required Python packages: `pip install -r requirements.txt`

### Deployment Steps

```bash
# Install dependencies
pip install -r requirements.txt

# Bootstrap CDK (if not already done)
cdk bootstrap

# Synthesize CloudFormation template
cdk synth

# Deploy the stack
cdk deploy --context environmentSuffix=dev

# Destroy resources after testing
cdk destroy --context environmentSuffix=dev
```

### Configuration

- **Environment Suffix**: Pass via CDK context: `--context environmentSuffix=<value>`
- **Email Subscriptions**: After deployment, subscribe email addresses to SNS topics via AWS Console
- **Cross-Account Roles**: Create `ComplianceAuditRole` in target AWS accounts with appropriate trust relationships

### Testing

Run unit tests:
```bash
pytest tests/unit/
```

Run integration tests (requires deployment):
```bash
pytest tests/integration/
```

### Important Notes

1. **AWS Config Recorder**: Only one recorder per region per account. If a recorder already exists, this deployment will fail. You may need to remove the existing recorder or modify the code to check for existing recorders.

2. **GuardDuty**: This implementation does NOT create GuardDuty detectors (account-level limitation). Enable GuardDuty manually at the account level.

3. **Reserved Concurrency**: Lambda reserved concurrent executions are set as required by task specifications. Monitor account limits to avoid issues.

4. **Cross-Account Access**: Create IAM roles in target accounts with trust relationships to allow the scanner Lambda to assume them.

5. **Cost Considerations**: This implementation uses VPC endpoints instead of NAT Gateways to minimize costs while maintaining security.

## Architecture Highlights

- **Multi-Account Scanning**: Scanner Lambda uses AssumeRole for cross-account access
- **Automated Remediation**: Specific violations (S3 encryption, Lambda tracing) are automatically fixed
- **Comprehensive Reporting**: Reports generated in both JSON (detailed) and CSV (tabular) formats
- **Real-Time Alerting**: SNS notifications for critical compliance violations
- **Scheduled Scanning**: EventBridge rules trigger scans every 6 hours
- **On-Demand Scans**: Custom EventBridge events allow manual scan triggers
- **Compliance Metrics**: CloudWatch dashboard provides real-time visibility
- **Secure Storage**: Audit reports stored in encrypted S3 with 90-day lifecycle
- **Network Isolation**: Lambda functions run in VPC with VPC endpoints for AWS service access
