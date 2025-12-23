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

        vpc.add_gateway_endpoint(
            f"s3-endpoint-{env_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.S3,
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

        # Additional permissions for reading AWS resources in current account
        lambda_execution_role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("ReadOnlyAccess")
        )

        # 1. Compliance Scanner Lambda
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
