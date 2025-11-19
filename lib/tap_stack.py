from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    Tags,
    CfnParameter,
    CfnOutput,
    aws_s3 as s3,
    aws_kms as kms,
    aws_lambda as lambda_,
    aws_iam as iam,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
    aws_events as events,
    aws_events_targets as targets,
    aws_ec2 as ec2,
    aws_logs as logs,
    aws_config as config,
    aws_cloudwatch as cloudwatch,
)
from constructs import Construct
from dataclasses import dataclass
from typing import Optional
import os


@dataclass
class TapStackProps:
    """Props for TapStack"""
    environment_suffix: str = "dev"
    env: Optional[object] = None


class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, props: TapStackProps, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props (required)
        env_suffix = props.environment_suffix

        # Mandatory tags
        Tags.of(self).add("Environment", "production")
        Tags.of(self).add("Owner", "compliance-team")
        Tags.of(self).add("CostCenter", "security-ops")
        Tags.of(self).add("ComplianceLevel", "high")

        # ===== VPC Configuration =====
        vpc = ec2.Vpc(
            self,
            f"compliance-vpc-{env_suffix}",
            max_azs=2,
            nat_gateways=0,  # Cost optimization - use VPC endpoints instead
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"private-subnet-{env_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                )
            ],
        )

        # VPC Flow Logs with specific naming convention
        flow_log_group = logs.LogGroup(
            self,
            f"flowlogs-{env_suffix}",
            log_group_name=f"/aws/vpc/audit-flowlogs-us-east-1-{env_suffix}",
            removal_policy=RemovalPolicy.DESTROY,
            retention=logs.RetentionDays.ONE_MONTH,
        )

        flow_log_role = iam.Role(
            self,
            f"flowlog-role-{env_suffix}",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonAPIGatewayPushToCloudWatchLogs"
                )
            ],
        )

        vpc.add_flow_log(
            f"flowlog-{env_suffix}",
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                flow_log_group, flow_log_role
            ),
            traffic_type=ec2.FlowLogTrafficType.ALL,
        )

        # VPC Endpoints for AWS services
        vpc.add_interface_endpoint(
            f"lambda-endpoint-{env_suffix}",
            service=ec2.InterfaceVpcEndpointAwsService.LAMBDA_,
        )

        vpc.add_interface_endpoint(
            f"s3-endpoint-{env_suffix}",
            service=ec2.InterfaceVpcEndpointAwsService.S3,
        )

        vpc.add_interface_endpoint(
            f"config-endpoint-{env_suffix}",
            service=ec2.InterfaceVpcEndpointAwsService.CONFIG,
        )

        # Security group for Lambda functions
        lambda_sg = ec2.SecurityGroup(
            self,
            f"lambda-sg-{env_suffix}",
            vpc=vpc,
            description="Security group for compliance Lambda functions",
            allow_all_outbound=True,
        )

        # ===== KMS Keys for S3 Encryption =====
        audit_bucket_key = kms.Key(
            self,
            f"audit-bucket-key-{env_suffix}",
            description=f"KMS key for audit reports bucket - {env_suffix}",
            removal_policy=RemovalPolicy.DESTROY,
            enable_key_rotation=True,
        )

        # ===== S3 Bucket for Audit Reports =====
        audit_bucket = s3.Bucket(
            self,
            f"audit-reports-bucket-{env_suffix}",
            bucket_name=f"compliance-audit-reports-{env_suffix}-{self.account}",
            versioned=True,
            encryption_key=audit_bucket_key,
            encryption=s3.BucketEncryption.KMS,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="expire-old-reports",
                    enabled=True,
                    expiration=Duration.days(90),
                )
            ],
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        )

        # ===== SNS Topic for Compliance Alerts =====
        compliance_alerts_topic = sns.Topic(
            self,
            f"compliance-alerts-{env_suffix}",
            topic_name=f"compliance-alerts-{env_suffix}",
            display_name="Critical Compliance Alerts",
        )

        # Email subscription (placeholder - update with actual email)
        compliance_alerts_topic.add_subscription(
            subscriptions.EmailSubscription("compliance-team@example.com")
        )

        # ===== IAM Role for AWS Config =====
        config_role = iam.Role(
            self,
            f"config-role-{env_suffix}",
            assumed_by=iam.ServicePrincipal("config.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWS_ConfigRole"
                )
            ],
        )

        # Additional permissions for Config to write to S3
        audit_bucket.grant_write(config_role)

        # ===== AWS Config Setup =====
        config_bucket = s3.Bucket(
            self,
            f"config-bucket-{env_suffix}",
            bucket_name=f"config-recordings-{env_suffix}-{self.account}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        )

        config_recorder = config.CfnConfigurationRecorder(
            self,
            f"config-recorder-{env_suffix}",
            role_arn=config_role.role_arn,
            recording_group=config.CfnConfigurationRecorder.RecordingGroupProperty(
                all_supported=True,
                include_global_resource_types=True,
            ),
        )

        config_delivery_channel = config.CfnDeliveryChannel(
            self,
            f"config-delivery-channel-{env_suffix}",
            s3_bucket_name=config_bucket.bucket_name,
        )

        config_delivery_channel.add_dependency(config_recorder)

        # ===== Lambda Functions =====

        # Lambda execution role with managed policies only
        lambda_execution_role = iam.Role(
            self,
            f"lambda-execution-role-{env_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AWSXRayDaemonWriteAccess"
                ),
            ],
        )

        # Grant permissions via managed policies and resource-based grants
        audit_bucket.grant_read_write(lambda_execution_role)
        compliance_alerts_topic.grant_publish(lambda_execution_role)

        # Additional permissions for cross-account access
        lambda_execution_role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("ReadOnlyAccess")
        )

        # Add AssumeRole permission to managed policy
        assume_role_policy = iam.PolicyDocument(
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=["sts:AssumeRole"],
                    resources=[
                        f"arn:aws:iam::*:role/compliance-scanner-role-{env_suffix}"
                    ],
                )
            ]
        )

        # Create a managed policy for AssumeRole
        assume_role_managed_policy = iam.ManagedPolicy(
            self,
            f"assume-role-policy-{env_suffix}",
            document=assume_role_policy,
        )

        lambda_execution_role.add_managed_policy(assume_role_managed_policy)

        # 1. Cross-Account Scanner Lambda
        scanner_lambda = lambda_.Function(
            self,
            f"scanner-lambda-{env_suffix}",
            function_name=f"compliance-scanner-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="scanner.handler",
            code=lambda_.Code.from_asset(
                os.path.join(os.path.dirname(__file__), "lambda/scanner")
            ),
            timeout=Duration.minutes(5),
            memory_size=1024,
            role=lambda_execution_role,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[lambda_sg],
            tracing=lambda_.Tracing.ACTIVE,
            reserved_concurrent_executions=10,
            environment={
                "AUDIT_BUCKET": audit_bucket.bucket_name,
                "SNS_TOPIC_ARN": compliance_alerts_topic.topic_arn,
                "ENVIRONMENT_SUFFIX": env_suffix,
            },
        )

        # 2. JSON Report Generator Lambda
        json_report_lambda = lambda_.Function(
            self,
            f"json-report-lambda-{env_suffix}",
            function_name=f"json-report-generator-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="json_report.handler",
            code=lambda_.Code.from_asset(
                os.path.join(os.path.dirname(__file__), "lambda/json_report")
            ),
            timeout=Duration.minutes(3),
            memory_size=512,
            role=lambda_execution_role,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[lambda_sg],
            tracing=lambda_.Tracing.ACTIVE,
            reserved_concurrent_executions=5,
            environment={
                "AUDIT_BUCKET": audit_bucket.bucket_name,
                "ENVIRONMENT_SUFFIX": env_suffix,
            },
        )

        # 3. CSV Report Generator Lambda
        csv_report_lambda = lambda_.Function(
            self,
            f"csv-report-lambda-{env_suffix}",
            function_name=f"csv-report-generator-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="csv_report.handler",
            code=lambda_.Code.from_asset(
                os.path.join(os.path.dirname(__file__), "lambda/csv_report")
            ),
            timeout=Duration.minutes(3),
            memory_size=512,
            role=lambda_execution_role,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[lambda_sg],
            tracing=lambda_.Tracing.ACTIVE,
            reserved_concurrent_executions=5,
            environment={
                "AUDIT_BUCKET": audit_bucket.bucket_name,
                "ENVIRONMENT_SUFFIX": env_suffix,
            },
        )

        # Create managed policy for S3 remediation permissions
        s3_remediation_policy = iam.ManagedPolicy(
            self,
            f"s3-remediation-policy-{env_suffix}",
            document=iam.PolicyDocument(
                statements=[
                    iam.PolicyStatement(
                        effect=iam.Effect.ALLOW,
                        actions=[
                            "s3:PutEncryptionConfiguration",
                            "s3:GetBucketEncryption",
                            "s3:ListAllMyBuckets",
                        ],
                        resources=["*"],
                    )
                ]
            ),
        )

        # Create separate role for remediation Lambda with managed policy
        remediation_role = iam.Role(
            self,
            f"remediation-lambda-role-{env_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AWSXRayDaemonWriteAccess"
                ),
                s3_remediation_policy,
            ],
        )

        # Grant SNS publish permission via resource-based policy
        compliance_alerts_topic.grant_publish(remediation_role)

        # 4. Auto-Remediation Lambda
        remediation_lambda = lambda_.Function(
            self,
            f"remediation-lambda-{env_suffix}",
            function_name=f"auto-remediation-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="remediation.handler",
            code=lambda_.Code.from_asset(
                os.path.join(os.path.dirname(__file__), "lambda/remediation")
            ),
            timeout=Duration.minutes(5),
            memory_size=512,
            role=remediation_role,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[lambda_sg],
            tracing=lambda_.Tracing.ACTIVE,
            reserved_concurrent_executions=5,
            environment={
                "SNS_TOPIC_ARN": compliance_alerts_topic.topic_arn,
                "ENVIRONMENT_SUFFIX": env_suffix,
            },
        )

        # ===== EventBridge Rules =====

        # Scheduled scan every 6 hours
        scheduled_scan_rule = events.Rule(
            self,
            f"scheduled-scan-rule-{env_suffix}",
            schedule=events.Schedule.rate(Duration.hours(6)),
            description="Trigger compliance scan every 6 hours",
        )

        scheduled_scan_rule.add_target(targets.LambdaFunction(scanner_lambda))

        # On-demand scan via custom events
        ondemand_scan_rule = events.Rule(
            self,
            f"ondemand-scan-rule-{env_suffix}",
            event_pattern=events.EventPattern(
                source=["compliance.scanner"],
                detail_type=["Compliance Scan Request"],
            ),
            description="Trigger compliance scan on-demand",
        )

        ondemand_scan_rule.add_target(targets.LambdaFunction(scanner_lambda))

        # Scanner completion triggers report generation
        scanner_complete_rule = events.Rule(
            self,
            f"scanner-complete-rule-{env_suffix}",
            event_pattern=events.EventPattern(
                source=["compliance.scanner"],
                detail_type=["Scan Complete"],
            ),
        )

        scanner_complete_rule.add_target(targets.LambdaFunction(json_report_lambda))
        scanner_complete_rule.add_target(targets.LambdaFunction(csv_report_lambda))

        # Config rule violations trigger remediation
        config_violation_rule = events.Rule(
            self,
            f"config-violation-rule-{env_suffix}",
            event_pattern=events.EventPattern(
                source=["aws.config"],
                detail_type=["Config Rules Compliance Change"],
                detail={"newEvaluationResult": {"complianceType": ["NON_COMPLIANT"]}},
            ),
        )

        config_violation_rule.add_target(targets.LambdaFunction(remediation_lambda))

        # ===== AWS Config Rules =====

        # Config rule for S3 bucket encryption
        s3_encryption_rule_lambda = lambda_.Function(
            self,
            f"config-s3-encryption-rule-{env_suffix}",
            function_name=f"config-rule-s3-encryption-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="s3_encryption_rule.handler",
            code=lambda_.Code.from_asset(
                os.path.join(os.path.dirname(__file__), "lambda/config_rules")
            ),
            timeout=Duration.minutes(1),
            memory_size=256,
            tracing=lambda_.Tracing.ACTIVE,
            reserved_concurrent_executions=2,
        )

        s3_encryption_rule_lambda.add_permission(
            "ConfigInvoke",
            principal=iam.ServicePrincipal("config.amazonaws.com"),
            action="lambda:InvokeFunction",
        )

        s3_encryption_config_rule = config.ManagedRule(
            self,
            f"s3-encryption-rule-{env_suffix}",
            config_rule_name=f"s3-bucket-encryption-{env_suffix}",
            identifier="S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED",
            description="Checks that S3 buckets have encryption enabled",
        )

        # Config rule for VPC flow logs
        vpc_flowlogs_rule_lambda = lambda_.Function(
            self,
            f"config-vpc-flowlogs-rule-{env_suffix}",
            function_name=f"config-rule-vpc-flowlogs-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="vpc_flowlogs_rule.handler",
            code=lambda_.Code.from_asset(
                os.path.join(os.path.dirname(__file__), "lambda/config_rules")
            ),
            timeout=Duration.minutes(1),
            memory_size=256,
            tracing=lambda_.Tracing.ACTIVE,
            reserved_concurrent_executions=2,
        )

        vpc_flowlogs_rule_lambda.add_permission(
            "ConfigInvoke",
            principal=iam.ServicePrincipal("config.amazonaws.com"),
            action="lambda:InvokeFunction",
        )

        vpc_flowlogs_config_rule = config.CustomRule(
            self,
            f"vpc-flowlogs-rule-{env_suffix}",
            config_rule_name=f"vpc-flow-logs-enabled-{env_suffix}",
            lambda_function=vpc_flowlogs_rule_lambda,
            configuration_changes=True,
            description="Checks that VPC flow logs are enabled",
        )

        # Config rule for Lambda settings
        lambda_settings_rule_lambda = lambda_.Function(
            self,
            f"config-lambda-settings-rule-{env_suffix}",
            function_name=f"config-rule-lambda-settings-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="lambda_settings_rule.handler",
            code=lambda_.Code.from_asset(
                os.path.join(os.path.dirname(__file__), "lambda/config_rules")
            ),
            timeout=Duration.minutes(1),
            memory_size=256,
            tracing=lambda_.Tracing.ACTIVE,
            reserved_concurrent_executions=2,
        )

        lambda_settings_rule_lambda.add_permission(
            "ConfigInvoke",
            principal=iam.ServicePrincipal("config.amazonaws.com"),
            action="lambda:InvokeFunction",
        )

        lambda_settings_config_rule = config.CustomRule(
            self,
            f"lambda-settings-rule-{env_suffix}",
            config_rule_name=f"lambda-settings-compliant-{env_suffix}",
            lambda_function=lambda_settings_rule_lambda,
            configuration_changes=True,
            description="Checks Lambda function settings for compliance",
        )

        # ===== Config Aggregator for Multi-Account =====
        config_aggregator = config.CfnConfigurationAggregator(
            self,
            f"config-aggregator-{env_suffix}",
            configuration_aggregator_name=f"compliance-aggregator-{env_suffix}",
            account_aggregation_sources=[
                config.CfnConfigurationAggregator.AccountAggregationSourceProperty(
                    account_ids=[self.account],
                    all_aws_regions=False,
                    aws_regions=["us-east-1"],
                )
            ],
        )

        # ===== CloudWatch Dashboard =====
        dashboard = cloudwatch.Dashboard(
            self,
            f"compliance-dashboard-{env_suffix}",
            dashboard_name=f"ComplianceMetrics-{env_suffix}",
        )

        # Add widgets for compliance metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Lambda Invocations",
                left=[
                    scanner_lambda.metric_invocations(),
                    json_report_lambda.metric_invocations(),
                    csv_report_lambda.metric_invocations(),
                    remediation_lambda.metric_invocations(),
                ],
            )
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Lambda Errors",
                left=[
                    scanner_lambda.metric_errors(),
                    json_report_lambda.metric_errors(),
                    csv_report_lambda.metric_errors(),
                    remediation_lambda.metric_errors(),
                ],
            )
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Lambda Duration",
                left=[
                    scanner_lambda.metric_duration(),
                    json_report_lambda.metric_duration(),
                    csv_report_lambda.metric_duration(),
                    remediation_lambda.metric_duration(),
                ],
            )
        )

        # SNS topic metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Compliance Alerts Published",
                left=[
                    compliance_alerts_topic.metric_number_of_messages_published()
                ],
            )
        )

        # ===== Stack Outputs =====
        CfnOutput(
            self,
            "VpcId",
            value=vpc.vpc_id,
            description="VPC ID for compliance infrastructure"
        )

        CfnOutput(
            self,
            "AuditBucketName",
            value=audit_bucket.bucket_name,
            description="S3 bucket for audit reports"
        )

        CfnOutput(
            self,
            "ConfigBucketName",
            value=config_bucket.bucket_name,
            description="S3 bucket for Config recordings"
        )

        CfnOutput(
            self,
            "SnsTopicArn",
            value=compliance_alerts_topic.topic_arn,
            description="SNS topic ARN for compliance alerts"
        )

        CfnOutput(
            self,
            "ScannerLambdaArn",
            value=scanner_lambda.function_arn,
            description="Scanner Lambda function ARN"
        )

        CfnOutput(
            self,
            "JsonReportLambdaArn",
            value=json_report_lambda.function_arn,
            description="JSON report generator Lambda ARN"
        )

        CfnOutput(
            self,
            "CsvReportLambdaArn",
            value=csv_report_lambda.function_arn,
            description="CSV report generator Lambda ARN"
        )

        CfnOutput(
            self,
            "RemediationLambdaArn",
            value=remediation_lambda.function_arn,
            description="Auto-remediation Lambda ARN"
        )

        CfnOutput(
            self,
            "DashboardName",
            value=dashboard.dashboard_name,
            description="CloudWatch dashboard name"
        )
