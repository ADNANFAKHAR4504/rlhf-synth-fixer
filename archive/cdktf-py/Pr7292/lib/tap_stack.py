from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput, Fn
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_account_password_policy import IamAccountPasswordPolicy
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_policy import SnsTopicPolicy
from cdktf_cdktf_provider_aws.config_configuration_recorder import ConfigConfigurationRecorder, ConfigConfigurationRecorderRecordingGroup
from cdktf_cdktf_provider_aws.config_delivery_channel import ConfigDeliveryChannel
from cdktf_cdktf_provider_aws.config_configuration_recorder_status import ConfigConfigurationRecorderStatus
from cdktf_cdktf_provider_aws.config_configuration_aggregator import ConfigConfigurationAggregator, ConfigConfigurationAggregatorAccountAggregationSource
from cdktf_cdktf_provider_aws.config_config_rule import ConfigConfigRule, ConfigConfigRuleScope, ConfigConfigRuleSource, ConfigConfigRuleSourceSourceDetail
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.securityhub_account import SecurityhubAccount
from cdktf_cdktf_provider_aws.securityhub_standards_subscription import SecurityhubStandardsSubscription
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.data_aws_region import DataAwsRegion
import json
import os


class TapStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix

        # Get account ID and current region
        caller_identity = DataAwsCallerIdentity(self, "current")
        current_region = DataAwsRegion(self, "current_region")

        # Define regions
        self.regions = ["us-east-1", "us-west-2", "eu-west-1"]
        self.primary_region = "us-east-1"

        # Create providers for each region
        self.providers = {}
        for region in self.regions:
            alias = region.replace("-", "_")
            self.providers[region] = AwsProvider(
                self,
                f"aws_{alias}",
                region=region,
                alias=alias
            )

        # Primary provider (us-east-1)
        AwsProvider(self, "aws", region=self.primary_region)

        # Create KMS key for encryption
        self.kms_key = KmsKey(
            self,
            f"config_kms_key_{environment_suffix}",
            description=f"KMS key for Config encryption {environment_suffix}",
            enable_key_rotation=True,
            tags={
                "Name": f"config-kms-key-{environment_suffix}",
                "CostCenter": "security",
                "Environment": environment_suffix,
                "ComplianceLevel": "high"
            }
        )

        KmsAlias(
            self,
            f"config_kms_alias_{environment_suffix}",
            name=f"alias/config-key-{environment_suffix}",
            target_key_id=self.kms_key.id
        )

        # DISABLED: IAM Account Password Policy is account-wide singleton
        # Cannot be created per-PR due to AWS account limits
        # IamAccountPasswordPolicy(
        #     self,
        #     f"password_policy_{environment_suffix}",
        #     minimum_password_length=14,
        #     require_uppercase_characters=True,
        #     require_lowercase_characters=True,
        #     require_numbers=True,
        #     require_symbols=True,
        #     allow_users_to_change_password=True,
        #     max_password_age=90,
        #     password_reuse_prevention=24
        # )

        # Create CloudWatch Log Group for remediation
        self.remediation_log_group = CloudwatchLogGroup(
            self,
            f"remediation_logs_{environment_suffix}",
            name=f"/aws/lambda/config-remediation-{environment_suffix}",
            retention_in_days=90,
            tags={
                "Name": f"config-remediation-logs-{environment_suffix}",
                "CostCenter": "security",
                "Environment": environment_suffix,
                "ComplianceLevel": "high"
            }
        )

        # Create SNS topic for critical violations
        self.sns_topic = SnsTopic(
            self,
            f"compliance_alerts_{environment_suffix}",
            name=f"compliance-alerts-{environment_suffix}",
            display_name=f"Compliance Alerts {environment_suffix}",
            tags={
                "Name": f"compliance-alerts-{environment_suffix}",
                "CostCenter": "security",
                "Environment": environment_suffix,
                "ComplianceLevel": "high"
            }
        )

        # SNS topic policy
        sns_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AllowConfigPublish",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "config.amazonaws.com"
                    },
                    "Action": "SNS:Publish",
                    "Resource": self.sns_topic.arn
                },
                {
                    "Sid": "AllowEventsPublish",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "events.amazonaws.com"
                    },
                    "Action": "SNS:Publish",
                    "Resource": self.sns_topic.arn
                }
            ]
        }

        SnsTopicPolicy(
            self,
            f"sns_policy_{environment_suffix}",
            arn=self.sns_topic.arn,
            policy=json.dumps(sns_policy)
        )

        # Deploy resources in each region
        self.config_resources = {}
        for region in self.regions:
            self.config_resources[region] = self._create_regional_resources(
                region, caller_identity.account_id
            )

        # Create Config Aggregator in primary region
        self._create_config_aggregator(caller_identity.account_id)

        # Create Lambda functions for remediation
        self._create_remediation_lambdas()

        # Create Config Rules with remediation
        self._create_config_rules()

        # Create Security Hub resources
        self._create_security_hub_resources()

        # Create EventBridge rules for notifications
        self._create_eventbridge_rules()

        # Outputs
        TerraformOutput(
            self,
            "config_bucket_name",
            value=self.config_resources[self.primary_region]["bucket"].id
        )

        TerraformOutput(
            self,
            "sns_topic_arn",
            value=self.sns_topic.arn
        )

        TerraformOutput(
            self,
            "remediation_log_group",
            value=self.remediation_log_group.name
        )

    def _create_regional_resources(self, region: str, account_id: str):
        """Create AWS Config resources in a specific region"""

        alias = region.replace("-", "_")
        provider = self.providers[region]

        # S3 bucket for Config
        bucket = S3Bucket(
            self,
            f"config_bucket_{alias}_{self.environment_suffix}",
            bucket=f"config-bucket-{region}-{self.environment_suffix}",
            force_destroy=True,
            provider=provider,
            tags={
                "Name": f"config-bucket-{region}-{self.environment_suffix}",
                "CostCenter": "security",
                "Environment": self.environment_suffix,
                "ComplianceLevel": "high"
            }
        )

        # Enable versioning
        S3BucketVersioningA(
            self,
            f"config_bucket_versioning_{alias}_{self.environment_suffix}",
            bucket=bucket.id,
            provider=provider,
            versioning_configuration={
                "status": "Enabled"
            }
        )

        # Enable encryption
        S3BucketServerSideEncryptionConfigurationA(
            self,
            f"config_bucket_encryption_{alias}_{self.environment_suffix}",
            bucket=bucket.id,
            provider=provider,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=self.kms_key.arn
                ),
                bucket_key_enabled=True
            )]
        )

        # Block public access
        S3BucketPublicAccessBlock(
            self,
            f"config_bucket_public_block_{alias}_{self.environment_suffix}",
            bucket=bucket.id,
            provider=provider,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # IAM role for Config
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "config.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        config_role = IamRole(
            self,
            f"config_role_{alias}_{self.environment_suffix}",
            name=f"config-role-{region}-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            provider=provider,
            tags={
                "Name": f"config-role-{region}-{self.environment_suffix}",
                "CostCenter": "security",
                "Environment": self.environment_suffix,
                "ComplianceLevel": "high"
            }
        )

        # Attach AWS managed policy
        IamRolePolicyAttachment(
            self,
            f"config_role_policy_{alias}_{self.environment_suffix}",
            role=config_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
            provider=provider
        )

        # Additional inline policy for S3 and SNS access
        inline_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:PutObjectAcl"
                    ],
                    "Resource": f"{bucket.arn}/*",
                    "Condition": {
                        "StringLike": {
                            "s3:x-amz-acl": "bucket-owner-full-control"
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": "s3:GetBucketAcl",
                    "Resource": bucket.arn
                },
                {
                    "Effect": "Allow",
                    "Action": "sns:Publish",
                    "Resource": self.sns_topic.arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": self.kms_key.arn
                }
            ]
        }

        from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
        IamRolePolicy(
            self,
            f"config_role_inline_policy_{alias}_{self.environment_suffix}",
            name=f"ConfigS3Policy-{region}",
            role=config_role.id,
            policy=json.dumps(inline_policy),
            provider=provider
        )

        # DISABLED: Configuration recorder is limited to 1 per region per account
        # Cannot be created per-PR due to AWS service limits
        # Use existing Config recorder in the account instead
        # recorder = ConfigConfigurationRecorder(
        #     self,
        #     f"config_recorder_{alias}_{self.environment_suffix}",
        #     name=f"config-recorder-{region}-{self.environment_suffix}",
        #     role_arn=config_role.arn,
        #     provider=provider,
        #     recording_group=ConfigConfigurationRecorderRecordingGroup(
        #         all_supported=True,
        #         include_global_resource_types=(region == self.primary_region)
        #     )
        # )

        # DISABLED: Delivery channel depends on recorder
        # delivery_channel = ConfigDeliveryChannel(
        #     self,
        #     f"config_delivery_{alias}_{self.environment_suffix}",
        #     name=f"config-delivery-{region}-{self.environment_suffix}",
        #     s3_bucket_name=bucket.id,
        #     sns_topic_arn=self.sns_topic.arn,
        #     provider=provider,
        #     depends_on=[recorder]
        # )

        # DISABLED: Recorder status depends on recorder
        # ConfigConfigurationRecorderStatus(
        #     self,
        #     f"config_recorder_status_{alias}_{self.environment_suffix}",
        #     name=recorder.name,
        #     is_enabled=True,
        #     provider=provider,
        #     depends_on=[delivery_channel]
        # )

        # Placeholder for recorder (used in dependencies)
        recorder = None

        # CloudWatch Log Group for region
        CloudwatchLogGroup(
            self,
            f"config_logs_{alias}_{self.environment_suffix}",
            name=f"/aws/config/{region}-{self.environment_suffix}",
            retention_in_days=90,
            provider=provider,
            tags={
                "Name": f"config-logs-{region}-{self.environment_suffix}",
                "CostCenter": "security",
                "Environment": self.environment_suffix,
                "ComplianceLevel": "high"
            }
        )

        return {
            "bucket": bucket,
            "role": config_role,
            "recorder": recorder
        }

    def _create_config_aggregator(self, account_id: str):
        """Create Config aggregator in primary region"""

        # DISABLED: Config Aggregator requires Config Recorders to exist
        # Cannot create aggregator per-PR without account-level recorders
        # ConfigConfigurationAggregator(
        #     self,
        #     f"config_aggregator_{self.environment_suffix}",
        #     name=f"config-aggregator-{self.environment_suffix}",
        #     account_aggregation_source=ConfigConfigurationAggregatorAccountAggregationSource(
        #         account_ids=[account_id],
        #         all_regions=False,
        #         regions=self.regions
        #     ),
        #     tags={
        #         "Name": f"config-aggregator-{self.environment_suffix}",
        #         "CostCenter": "security",
        #         "Environment": self.environment_suffix,
        #         "ComplianceLevel": "high"
        #     }
        # )
        pass  # No-op function now

    def _create_remediation_lambdas(self):
        """Create Lambda functions for auto-remediation"""

        # IAM role for Lambda
        lambda_assume_role = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        lambda_role = IamRole(
            self,
            f"lambda_remediation_role_{self.environment_suffix}",
            name=f"lambda-remediation-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(lambda_assume_role),
            tags={
                "Name": f"lambda-remediation-role-{self.environment_suffix}",
                "CostCenter": "security",
                "Environment": self.environment_suffix,
                "ComplianceLevel": "high"
            }
        )

        # Attach basic execution role
        IamRolePolicyAttachment(
            self,
            f"lambda_basic_execution_{self.environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # Inline policy for S3 remediation
        lambda_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutBucketVersioning",
                        "s3:PutEncryptionConfiguration",
                        "s3:GetBucketVersioning",
                        "s3:GetEncryptionConfiguration",
                        "s3:ListBucket"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:DescribeKey",
                        "kms:ListAliases"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": f"{self.remediation_log_group.arn}:*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "config:PutEvaluations"
                    ],
                    "Resource": "*"
                }
            ]
        }

        from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
        IamRolePolicy(
            self,
            f"lambda_remediation_policy_{self.environment_suffix}",
            name="S3RemediationPolicy",
            role=lambda_role.id,
            policy=json.dumps(lambda_policy)
        )

        # Lambda function for versioning remediation
        lambda_zip_path = os.path.join(os.path.dirname(__file__), "lambda_function.zip")
        self.versioning_lambda = LambdaFunction(
            self,
            f"versioning_remediation_{self.environment_suffix}",
            function_name=f"s3-versioning-remediation-{self.environment_suffix}",
            runtime="python3.9",
            handler="index.lambda_handler",
            role=lambda_role.arn,
            filename=lambda_zip_path,
            source_code_hash=Fn.filebase64sha256(lambda_zip_path),
            timeout=300,
            memory_size=256,
            architectures=["arm64"],
            environment={
                "variables": {
                    "ENVIRONMENT": self.environment_suffix,
                    "LOG_GROUP": self.remediation_log_group.name
                }
            },
            tags={
                "Name": f"s3-versioning-remediation-{self.environment_suffix}",
                "CostCenter": "security",
                "Environment": self.environment_suffix,
                "ComplianceLevel": "high"
            }
        )

        # Lambda function for encryption remediation
        self.encryption_lambda = LambdaFunction(
            self,
            f"encryption_remediation_{self.environment_suffix}",
            function_name=f"s3-encryption-remediation-{self.environment_suffix}",
            runtime="python3.9",
            handler="index.lambda_handler",
            role=lambda_role.arn,
            filename=lambda_zip_path,
            source_code_hash=Fn.filebase64sha256(lambda_zip_path),
            timeout=300,
            memory_size=256,
            architectures=["arm64"],
            environment={
                "variables": {
                    "ENVIRONMENT": self.environment_suffix,
                    "LOG_GROUP": self.remediation_log_group.name,
                    "KMS_KEY_ID": self.kms_key.id
                }
            },
            tags={
                "Name": f"s3-encryption-remediation-{self.environment_suffix}",
                "CostCenter": "security",
                "Environment": self.environment_suffix,
                "ComplianceLevel": "high"
            }
        )

        # Lambda permissions for Config
        LambdaPermission(
            self,
            f"versioning_lambda_permission_{self.environment_suffix}",
            statement_id="AllowConfigInvoke",
            action="lambda:InvokeFunction",
            function_name=self.versioning_lambda.function_name,
            principal="config.amazonaws.com"
        )

        LambdaPermission(
            self,
            f"encryption_lambda_permission_{self.environment_suffix}",
            statement_id="AllowConfigInvoke",
            action="lambda:InvokeFunction",
            function_name=self.encryption_lambda.function_name,
            principal="config.amazonaws.com"
        )

    def _create_config_rules(self):
        """Create Config rules with Lambda-based remediation"""

        # DISABLED: Config Rules require Config Recorder which is account-level
        # Cannot create Config Rules without recorder in place
        # These would need existing account-level Config Recorder to work

        # S3 Versioning Rule
        # ConfigConfigRule(
        #     self,
        #     f"s3_versioning_rule_{self.environment_suffix}",
        #     name=f"s3-bucket-versioning-enabled-{self.environment_suffix}",
        #     description="Checks if S3 bucket versioning is enabled",
        #     source=ConfigConfigRuleSource(
        #         owner="AWS",
        #         source_identifier="S3_BUCKET_VERSIONING_ENABLED"
        #     ),
        #     scope=ConfigConfigRuleScope(
        #         compliance_resource_types=["AWS::S3::Bucket"]
        #     ),
        #     tags={
        #         "Name": f"s3-versioning-rule-{self.environment_suffix}",
        #         "CostCenter": "security",
        #         "Environment": self.environment_suffix,
        #         "ComplianceLevel": "high"
        #     }
        # )

        # S3 Encryption Rule
        # ConfigConfigRule(
        #     self,
        #     f"s3_encryption_rule_{self.environment_suffix}",
        #     name=f"s3-bucket-server-side-encryption-{self.environment_suffix}",
        #     description="Checks if S3 bucket has server-side encryption enabled",
        #     source=ConfigConfigRuleSource(
        #         owner="AWS",
        #         source_identifier="S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
        #     ),
        #     scope=ConfigConfigRuleScope(
        #         compliance_resource_types=["AWS::S3::Bucket"]
        #     ),
        #     tags={
        #         "Name": f"s3-encryption-rule-{self.environment_suffix}",
        #         "CostCenter": "security",
        #         "Environment": self.environment_suffix,
        #         "ComplianceLevel": "high"
        #     }
        # )

    def _create_security_hub_resources(self):
        """Create Security Hub in all regions"""

        # DISABLED: Security Hub is account-wide singleton per region
        # Account already subscribed to Security Hub - cannot create per-PR
        # Use existing Security Hub subscription instead

        # for region in self.regions:
        #     alias = region.replace("-", "_")
        #     provider = self.providers[region]

        #     # Enable Security Hub
        #     security_hub = SecurityhubAccount(
        #         self,
        #         f"security_hub_{alias}_{self.environment_suffix}",
        #         provider=provider
        #     )

        #     # Subscribe to CIS AWS Foundations Benchmark
        #     SecurityhubStandardsSubscription(
        #         self,
        #         f"cis_standard_{alias}_{self.environment_suffix}",
        #         standards_arn=f"arn:aws:securityhub:{region}::standards/cis-aws-foundations-benchmark/v/1.4.0",
        #         provider=provider,
        #         depends_on=[security_hub]
        #     )

        pass  # No-op function now

    def _create_eventbridge_rules(self):
        """Create EventBridge rules for critical compliance violations"""

        # EventBridge rule for Config compliance changes
        event_pattern = {
            "source": ["aws.config"],
            "detail-type": ["Config Rules Compliance Change"],
            "detail": {
                "messageType": ["ComplianceChangeNotification"],
                "newEvaluationResult": {
                    "complianceType": ["NON_COMPLIANT"]
                }
            }
        }

        compliance_rule = CloudwatchEventRule(
            self,
            f"compliance_violations_{self.environment_suffix}",
            name=f"config-compliance-violations-{self.environment_suffix}",
            description="Trigger on Config compliance violations",
            event_pattern=json.dumps(event_pattern),
            tags={
                "Name": f"compliance-violations-{self.environment_suffix}",
                "CostCenter": "security",
                "Environment": self.environment_suffix,
                "ComplianceLevel": "high"
            }
        )

        # Target SNS topic
        CloudwatchEventTarget(
            self,
            f"compliance_sns_target_{self.environment_suffix}",
            rule=compliance_rule.name,
            arn=self.sns_topic.arn,
            target_id="ComplianceAlertSNS"
        )

        # EventBridge rule for Security Hub findings
        security_hub_pattern = {
            "source": ["aws.securityhub"],
            "detail-type": ["Security Hub Findings - Imported"],
            "detail": {
                "findings": {
                    "Severity": {
                        "Label": ["CRITICAL", "HIGH"]
                    }
                }
            }
        }

        security_hub_rule = CloudwatchEventRule(
            self,
            f"security_hub_findings_{self.environment_suffix}",
            name=f"security-hub-critical-findings-{self.environment_suffix}",
            description="Trigger on critical Security Hub findings",
            event_pattern=json.dumps(security_hub_pattern),
            tags={
                "Name": f"security-hub-findings-{self.environment_suffix}",
                "CostCenter": "security",
                "Environment": self.environment_suffix,
                "ComplianceLevel": "high"
            }
        )

        # Target SNS topic
        CloudwatchEventTarget(
            self,
            f"security_hub_sns_target_{self.environment_suffix}",
            rule=security_hub_rule.name,
            arn=self.sns_topic.arn,
            target_id="SecurityHubAlertSNS"
        )
