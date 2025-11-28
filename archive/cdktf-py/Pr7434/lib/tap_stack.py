"""TAP Stack module for CDKTF Python infrastructure - Security Configuration as Code."""

import os
import json
from cdktf import TerraformStack, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.config_configuration_recorder import (
    ConfigConfigurationRecorder,
    ConfigConfigurationRecorderRecordingGroup
)
from cdktf_cdktf_provider_aws.config_delivery_channel import ConfigDeliveryChannel
from cdktf_cdktf_provider_aws.config_configuration_aggregator import (
    ConfigConfigurationAggregator,
    ConfigConfigurationAggregatorAccountAggregationSource
)
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.iam_role import IamRole, IamRoleInlinePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.config_config_rule import (
    ConfigConfigRule,
    ConfigConfigRuleSource,
    ConfigConfigRuleSourceSourceDetail
)
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_policy import SnsTopicPolicy
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import (
    CloudwatchEventTarget,
    CloudwatchEventTargetEcsTarget
)
from cdktf_cdktf_provider_aws.ssm_document import SsmDocument
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.data_aws_region import DataAwsRegion


class TapStack(TerraformStack):
    """CDKTF Python stack for Security Configuration as Code."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with AWS security compliance infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider for primary region (us-east-1)
        primary_provider = AwsProvider(
            self,
            "aws",
            region="us-east-1",
            default_tags=[default_tags],
            alias="primary"
        )

        # Configure AWS Provider for secondary region (us-west-2)
        secondary_provider = AwsProvider(
            self,
            "aws_secondary",
            region="us-west-2",
            default_tags=[default_tags],
            alias="secondary"
        )

        # Use local state (no S3 backend)
        # Remove S3Backend configuration for testing

        # Get current account and region info
        current = DataAwsCallerIdentity(self, "current")
        primary_region = DataAwsRegion(self, "primary_region", provider=primary_provider)
        secondary_region = DataAwsRegion(self, "secondary_region", provider=secondary_provider)

        # ===== PRIMARY REGION RESOURCES (us-east-1) =====

        # Create S3 bucket for Config snapshots (Primary)
        config_bucket_primary = S3Bucket(
            self,
            "config_bucket_primary",
            bucket=f"config-snapshots-primary-{environment_suffix}",
            provider=primary_provider
        )

        S3BucketVersioningA(
            self,
            "config_bucket_primary_versioning",
            bucket=config_bucket_primary.id,
            versioning_configuration={"status": "Enabled"},
            provider=primary_provider
        )

        S3BucketServerSideEncryptionConfigurationA(
            self,
            "config_bucket_primary_encryption",
            bucket=config_bucket_primary.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=
                S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="AES256"
                )
            )],
            provider=primary_provider
        )

        # Create IAM role for Config Recorder (Primary)
        config_role_primary = IamRole(
            self,
            "config_role_primary",
            name=f"config-recorder-role-primary-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "config.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            inline_policy=[IamRoleInlinePolicy(
                name="config-permissions",
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": ["s3:PutObject", "s3:GetBucketLocation"],
                            "Resource": [
                                f"{config_bucket_primary.arn}/*",
                                config_bucket_primary.arn
                            ]
                        },
                        {
                            "Effect": "Allow",
                            "Action": "config:Put*",
                            "Resource": "*"
                        }
                    ]
                })
            )],
            provider=primary_provider
        )

        IamRolePolicyAttachment(
            self,
            "config_role_primary_policy",
            role=config_role_primary.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
            provider=primary_provider
        )

        # Create Config Recorder (Primary)
        config_recorder_primary = ConfigConfigurationRecorder(
            self,
            "config_recorder_primary",
            name=f"config-recorder-primary-{environment_suffix}",
            role_arn=config_role_primary.arn,
            recording_group=ConfigConfigurationRecorderRecordingGroup(
                all_supported=True,
                include_global_resource_types=True
            ),
            provider=primary_provider
        )

        # Create Config Delivery Channel (Primary)
        ConfigDeliveryChannel(
            self,
            "config_delivery_primary",
            name=f"config-delivery-primary-{environment_suffix}",
            s3_bucket_name=config_bucket_primary.id,
            depends_on=[config_recorder_primary],
            provider=primary_provider
        )

        # ===== SECONDARY REGION RESOURCES (us-west-2) =====

        # Create S3 bucket for Config snapshots (Secondary)
        config_bucket_secondary = S3Bucket(
            self,
            "config_bucket_secondary",
            bucket=f"config-snapshots-secondary-{environment_suffix}",
            provider=secondary_provider
        )

        S3BucketVersioningA(
            self,
            "config_bucket_secondary_versioning",
            bucket=config_bucket_secondary.id,
            versioning_configuration={"status": "Enabled"},
            provider=secondary_provider
        )

        S3BucketServerSideEncryptionConfigurationA(
            self,
            "config_bucket_secondary_encryption",
            bucket=config_bucket_secondary.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=
                S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="AES256"
                )
            )],
            provider=secondary_provider
        )

        # Create IAM role for Config Recorder (Secondary)
        config_role_secondary = IamRole(
            self,
            "config_role_secondary",
            name=f"config-recorder-role-secondary-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "config.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            inline_policy=[IamRoleInlinePolicy(
                name="config-permissions",
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": ["s3:PutObject", "s3:GetBucketLocation"],
                            "Resource": [
                                f"{config_bucket_secondary.arn}/*",
                                config_bucket_secondary.arn
                            ]
                        },
                        {
                            "Effect": "Allow",
                            "Action": "config:Put*",
                            "Resource": "*"
                        }
                    ]
                })
            )],
            provider=secondary_provider
        )

        IamRolePolicyAttachment(
            self,
            "config_role_secondary_policy",
            role=config_role_secondary.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
            provider=secondary_provider
        )

        # Create Config Recorder (Secondary)
        config_recorder_secondary = ConfigConfigurationRecorder(
            self,
            "config_recorder_secondary",
            name=f"config-recorder-secondary-{environment_suffix}",
            role_arn=config_role_secondary.arn,
            recording_group=ConfigConfigurationRecorderRecordingGroup(
                all_supported=True,
                include_global_resource_types=False
            ),
            provider=secondary_provider
        )

        # Create Config Delivery Channel (Secondary)
        ConfigDeliveryChannel(
            self,
            "config_delivery_secondary",
            name=f"config-delivery-secondary-{environment_suffix}",
            s3_bucket_name=config_bucket_secondary.id,
            depends_on=[config_recorder_secondary],
            provider=secondary_provider
        )

        # ===== LAMBDA FUNCTIONS FOR COMPLIANCE CHECKS (Primary Region) =====

        # Lambda execution role
        lambda_role = IamRole(
            self,
            "lambda_role",
            name=f"config-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            inline_policy=[IamRoleInlinePolicy(
                name="lambda-permissions",
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "config:PutEvaluations",
                                "ec2:DescribeInstances",
                                "ec2:DescribeTags",
                                "rds:DescribeDBInstances",
                                "s3:GetPublicAccessBlock",
                                "s3:GetBucketPolicy",
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            "Resource": "*"
                        }
                    ]
                })
            )],
            provider=primary_provider
        )

        IamRolePolicyAttachment(
            self,
            "lambda_role_policy",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            provider=primary_provider
        )

        # CloudWatch Log Groups for Lambda functions
        ec2_log_group = CloudwatchLogGroup(
            self,
            "ec2_lambda_logs",
            name=f"/aws/lambda/ec2-tags-checker-{environment_suffix}",
            retention_in_days=7,
            provider=primary_provider
        )

        rds_log_group = CloudwatchLogGroup(
            self,
            "rds_lambda_logs",
            name=f"/aws/lambda/rds-encryption-checker-{environment_suffix}",
            retention_in_days=7,
            provider=primary_provider
        )

        s3_log_group = CloudwatchLogGroup(
            self,
            "s3_lambda_logs",
            name=f"/aws/lambda/s3-policies-checker-{environment_suffix}",
            retention_in_days=7,
            provider=primary_provider
        )

        # Get absolute paths for Lambda ZIP files (needed for CDKTF deployment)
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        ec2_lambda_zip = os.path.join(project_root, "lib", "lambda", "ec2_tags_checker.zip")
        rds_lambda_zip = os.path.join(project_root, "lib", "lambda", "rds_encryption_checker.zip")
        s3_lambda_zip = os.path.join(project_root, "lib", "lambda", "s3_policies_checker.zip")

        # Lambda Function: EC2 Tags Checker
        ec2_lambda = LambdaFunction(
            self,
            "ec2_tags_lambda",
            function_name=f"ec2-tags-checker-{environment_suffix}",
            filename=ec2_lambda_zip,
            handler="ec2_tags_checker.lambda_handler",
            runtime="python3.11",
            role=lambda_role.arn,
            timeout=60,
            depends_on=[ec2_log_group],
            provider=primary_provider
        )

        # Lambda Function: RDS Encryption Checker
        rds_lambda = LambdaFunction(
            self,
            "rds_encryption_lambda",
            function_name=f"rds-encryption-checker-{environment_suffix}",
            filename=rds_lambda_zip,
            handler="rds_encryption_checker.lambda_handler",
            runtime="python3.11",
            role=lambda_role.arn,
            timeout=60,
            depends_on=[rds_log_group],
            provider=primary_provider
        )

        # Lambda Function: S3 Policies Checker
        s3_lambda = LambdaFunction(
            self,
            "s3_policies_lambda",
            function_name=f"s3-policies-checker-{environment_suffix}",
            filename=s3_lambda_zip,
            handler="s3_policies_checker.lambda_handler",
            runtime="python3.11",
            role=lambda_role.arn,
            timeout=60,
            depends_on=[s3_log_group],
            provider=primary_provider
        )

        # Lambda permissions for Config to invoke functions
        LambdaPermission(
            self,
            "ec2_lambda_permission",
            statement_id="AllowConfigInvoke",
            action="lambda:InvokeFunction",
            function_name=ec2_lambda.function_name,
            principal="config.amazonaws.com",
            provider=primary_provider
        )

        LambdaPermission(
            self,
            "rds_lambda_permission",
            statement_id="AllowConfigInvoke",
            action="lambda:InvokeFunction",
            function_name=rds_lambda.function_name,
            principal="config.amazonaws.com",
            provider=primary_provider
        )

        LambdaPermission(
            self,
            "s3_lambda_permission",
            statement_id="AllowConfigInvoke",
            action="lambda:InvokeFunction",
            function_name=s3_lambda.function_name,
            principal="config.amazonaws.com",
            provider=primary_provider
        )

        # ===== CONFIG RULES =====

        # Config Rule: EC2 Tagging Compliance
        ec2_config_rule = ConfigConfigRule(
            self,
            "ec2_tags_rule",
            name=f"ec2-required-tags-{environment_suffix}",
            source=ConfigConfigRuleSource(
                owner="CUSTOM_LAMBDA",
                source_identifier=ec2_lambda.arn,
                source_detail=[ConfigConfigRuleSourceSourceDetail(
                    event_source="aws.config",
                    message_type="ConfigurationItemChangeNotification"
                )]
            ),
            depends_on=[ec2_lambda, config_recorder_primary],
            provider=primary_provider
        )

        # Config Rule: RDS Encryption Compliance
        rds_config_rule = ConfigConfigRule(
            self,
            "rds_encryption_rule",
            name=f"rds-encryption-enabled-{environment_suffix}",
            source=ConfigConfigRuleSource(
                owner="CUSTOM_LAMBDA",
                source_identifier=rds_lambda.arn,
                source_detail=[ConfigConfigRuleSourceSourceDetail(
                    event_source="aws.config",
                    message_type="ConfigurationItemChangeNotification"
                )]
            ),
            depends_on=[rds_lambda, config_recorder_primary],
            provider=primary_provider
        )

        # Config Rule: S3 Bucket Policy Compliance
        s3_config_rule = ConfigConfigRule(
            self,
            "s3_policies_rule",
            name=f"s3-public-access-blocked-{environment_suffix}",
            source=ConfigConfigRuleSource(
                owner="CUSTOM_LAMBDA",
                source_identifier=s3_lambda.arn,
                source_detail=[ConfigConfigRuleSourceSourceDetail(
                    event_source="aws.config",
                    message_type="ConfigurationItemChangeNotification"
                )]
            ),
            depends_on=[s3_lambda, config_recorder_primary],
            provider=primary_provider
        )

        # ===== SNS TOPICS FOR NOTIFICATIONS =====

        # SNS Topic (Primary)
        sns_topic_primary = SnsTopic(
            self,
            "compliance_topic_primary",
            name=f"config-compliance-primary-{environment_suffix}",
            provider=primary_provider
        )

        # SNS Topic Policy (Primary) - Allow EventBridge to publish
        SnsTopicPolicy(
            self,
            "sns_policy_primary",
            arn=sns_topic_primary.arn,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "events.amazonaws.com"},
                    "Action": "SNS:Publish",
                    "Resource": sns_topic_primary.arn
                }]
            }),
            provider=primary_provider
        )

        # SNS Topic (Secondary)
        sns_topic_secondary = SnsTopic(
            self,
            "compliance_topic_secondary",
            name=f"config-compliance-secondary-{environment_suffix}",
            provider=secondary_provider
        )

        # SNS Topic Policy (Secondary)
        SnsTopicPolicy(
            self,
            "sns_policy_secondary",
            arn=sns_topic_secondary.arn,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "events.amazonaws.com"},
                    "Action": "SNS:Publish",
                    "Resource": sns_topic_secondary.arn
                }]
            }),
            provider=secondary_provider
        )

        # ===== EVENTBRIDGE RULES FOR COMPLIANCE CHANGES =====

        # EventBridge Rule (Primary)
        event_rule_primary = CloudwatchEventRule(
            self,
            "compliance_event_rule_primary",
            name=f"config-compliance-change-primary-{environment_suffix}",
            description="Trigger on Config compliance changes",
            event_pattern=json.dumps({
                "source": ["aws.config"],
                "detail-type": ["Config Rules Compliance Change"]
            }),
            provider=primary_provider
        )

        CloudwatchEventTarget(
            self,
            "compliance_event_target_primary",
            rule=event_rule_primary.name,
            arn=sns_topic_primary.arn,
            provider=primary_provider
        )

        # EventBridge Rule (Secondary)
        event_rule_secondary = CloudwatchEventRule(
            self,
            "compliance_event_rule_secondary",
            name=f"config-compliance-change-secondary-{environment_suffix}",
            description="Trigger on Config compliance changes",
            event_pattern=json.dumps({
                "source": ["aws.config"],
                "detail-type": ["Config Rules Compliance Change"]
            }),
            provider=secondary_provider
        )

        CloudwatchEventTarget(
            self,
            "compliance_event_target_secondary",
            rule=event_rule_secondary.name,
            arn=sns_topic_secondary.arn,
            provider=secondary_provider
        )

        # ===== SSM AUTOMATION DOCUMENTS =====

        # SSM Document: Add EC2 Tags
        ssm_doc_ec2_tags = SsmDocument(
            self,
            "ssm_doc_ec2_tags",
            name=f"AddEC2RequiredTags-{environment_suffix}",
            document_type="Automation",
            content=json.dumps({
                "schemaVersion": "0.3",
                "description": "Automation to add required tags to EC2 instances",
                "parameters": {
                    "InstanceId": {
                        "type": "String",
                        "description": "EC2 Instance ID"
                    }
                },
                "mainSteps": [{
                    "name": "AddTags",
                    "action": "aws:createTags",
                    "inputs": {
                        "ResourceType": "EC2",
                        "ResourceIds": ["{{ InstanceId }}"],
                        "Tags": [
                            {"Key": "Environment", "Value": "Production"},
                            {"Key": "Owner", "Value": "SecurityTeam"},
                            {"Key": "CostCenter", "Value": "IT"}
                        ]
                    }
                }]
            }),
            provider=primary_provider
        )

        # SSM Document: Enable RDS Encryption (placeholder - requires manual intervention)
        ssm_doc_rds_encryption = SsmDocument(
            self,
            "ssm_doc_rds_encryption",
            name=f"EnableRDSEncryption-{environment_suffix}",
            document_type="Automation",
            content=json.dumps({
                "schemaVersion": "0.3",
                "description": "Automation to enable RDS encryption (requires snapshot and restore)",
                "parameters": {
                    "DBInstanceId": {
                        "type": "String",
                        "description": "RDS Instance ID"
                    }
                },
                "mainSteps": [{
                    "name": "NotifyManualAction",
                    "action": "aws:sleep",
                    "inputs": {
                        "Duration": "PT1S"
                    }
                }]
            }),
            provider=primary_provider
        )

        # ===== CONFIG AGGREGATOR =====

        # Config Aggregator (Primary Region)
        config_aggregator = ConfigConfigurationAggregator(
            self,
            "config_aggregator",
            name=f"config-aggregator-{environment_suffix}",
            account_aggregation_source=ConfigConfigurationAggregatorAccountAggregationSource(
                account_ids=[current.account_id],
                all_regions=True
            ),
            depends_on=[config_recorder_primary, config_recorder_secondary],
            provider=primary_provider
        )

        # ===== CLOUDWATCH DASHBOARD =====

        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Config", "ComplianceScore", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-east-1",
                        "title": "Config Compliance Score"
                    }
                },
                {
                    "type": "log",
                    "properties": {
                        "query": (
                            f"SOURCE '{ec2_log_group.name}'\n"
                            "| fields @timestamp, @message\n"
                            "| sort @timestamp desc\n"
                            "| limit 20"
                        ),
                        "region": "us-east-1",
                        "title": "EC2 Tags Checker Logs"
                    }
                },
                {
                    "type": "log",
                    "properties": {
                        "query": (
                            f"SOURCE '{rds_log_group.name}'\n"
                            "| fields @timestamp, @message\n"
                            "| sort @timestamp desc\n"
                            "| limit 20"
                        ),
                        "region": "us-east-1",
                        "title": "RDS Encryption Checker Logs"
                    }
                },
                {
                    "type": "log",
                    "properties": {
                        "query": (
                            f"SOURCE '{s3_log_group.name}'\n"
                            "| fields @timestamp, @message\n"
                            "| sort @timestamp desc\n"
                            "| limit 20"
                        ),
                        "region": "us-east-1",
                        "title": "S3 Policies Checker Logs"
                    }
                }
            ]
        }

        cloudwatch_dashboard = CloudwatchDashboard(
            self,
            "compliance_dashboard",
            dashboard_name=f"config-compliance-{environment_suffix}",
            dashboard_body=json.dumps(dashboard_body),
            provider=primary_provider
        )

        # ===== TERRAFORM OUTPUTS =====

        TerraformOutput(
            self,
            "config_bucket_primary_name",
            value=config_bucket_primary.id
        )

        TerraformOutput(
            self,
            "config_bucket_secondary_name",
            value=config_bucket_secondary.id
        )

        TerraformOutput(
            self,
            "config_recorder_primary_name",
            value=config_recorder_primary.name
        )

        TerraformOutput(
            self,
            "config_recorder_secondary_name",
            value=config_recorder_secondary.name
        )

        TerraformOutput(
            self,
            "config_aggregator_name",
            value=config_aggregator.name
        )

        TerraformOutput(
            self,
            "config_aggregator_arn",
            value=config_aggregator.arn
        )

        TerraformOutput(
            self,
            "ec2_lambda_arn",
            value=ec2_lambda.arn
        )

        TerraformOutput(
            self,
            "rds_lambda_arn",
            value=rds_lambda.arn
        )

        TerraformOutput(
            self,
            "s3_lambda_arn",
            value=s3_lambda.arn
        )

        TerraformOutput(
            self,
            "sns_topic_primary_arn",
            value=sns_topic_primary.arn
        )

        TerraformOutput(
            self,
            "sns_topic_secondary_arn",
            value=sns_topic_secondary.arn
        )

        TerraformOutput(
            self,
            "event_rule_primary_arn",
            value=event_rule_primary.arn
        )

        TerraformOutput(
            self,
            "event_rule_secondary_arn",
            value=event_rule_secondary.arn
        )

        TerraformOutput(
            self,
            "dashboard_name",
            value=cloudwatch_dashboard.dashboard_name
        )

        TerraformOutput(
            self,
            "ssm_doc_ec2_tags_name",
            value=ssm_doc_ec2_tags.name
        )

        TerraformOutput(
            self,
            "ssm_doc_rds_encryption_name",
            value=ssm_doc_rds_encryption.name
        )
