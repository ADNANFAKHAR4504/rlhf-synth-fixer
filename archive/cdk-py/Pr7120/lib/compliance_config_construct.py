"""compliance_config_construct.py
AWS Config setup with custom rules and aggregator.
"""

import aws_cdk as cdk
from aws_cdk import aws_config as config
from aws_cdk import aws_iam as iam
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_events_targets
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
            target=aws_events_targets.LambdaFunction(remediation_lambda),
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
