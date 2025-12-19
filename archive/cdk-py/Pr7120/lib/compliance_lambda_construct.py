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

        # Add permissions to check S3, EC2, and Lambda resources
        self.scanner_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:ListAllMyBuckets",
                    "s3:GetBucketEncryption",
                    "ec2:DescribeVpcs",
                    "ec2:DescribeFlowLogs",
                    "lambda:ListFunctions",
                    "lambda:GetFunction"
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

        # IAM role for report generator
        self.report_generator_role = iam.Role(
            self,
            "ReportGeneratorLambdaRole",
            role_name=f"compliance-report-generator-role-{environment_suffix}",
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

        # Lambda function for report generation (JSON and CSV)
        self.report_generator_function = lambda_.Function(
            self,
            "ReportGeneratorFunction",
            function_name=f"compliance-report-generator-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="report_generator.handler",
            code=lambda_.Code.from_asset("lib/lambda/report_generator"),
            role=self.report_generator_role,
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
            }
        )

        audit_bucket.grant_read_write(self.report_generator_function)

        # IAM role for remediation
        self.remediation_role = iam.Role(
            self,
            "RemediationLambdaRole",
            role_name=f"compliance-remediation-role-{environment_suffix}",
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

        # Lambda function for automatic remediation
        self.remediation_function = lambda_.Function(
            self,
            "RemediationFunction",
            function_name=f"compliance-auto-remediation-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="remediation.handler",
            code=lambda_.Code.from_asset("lib/lambda/remediation"),
            role=self.remediation_role,
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
            }
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
