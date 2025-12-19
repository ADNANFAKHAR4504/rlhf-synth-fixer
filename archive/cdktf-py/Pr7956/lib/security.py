from typing import Dict, List
import json
from constructs import Construct
from cdktf_cdktf_provider_aws.securityhub_account import SecurityhubAccount
from cdktf_cdktf_provider_aws.securityhub_standards_subscription import SecurityhubStandardsSubscription
from cdktf_cdktf_provider_aws.securityhub_insight import SecurityhubInsight
from cdktf_cdktf_provider_aws.config_configuration_recorder import ConfigConfigurationRecorder
from cdktf_cdktf_provider_aws.config_delivery_channel import ConfigDeliveryChannel
from cdktf_cdktf_provider_aws.config_configuration_recorder_status import ConfigConfigurationRecorderStatus
from cdktf_cdktf_provider_aws.config_config_rule import ConfigConfigRule, ConfigConfigRuleSource
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import DataAwsIamPolicyDocument


class ZeroTrustSecurity(Construct):
    """
    Creates Security Hub and AWS Config for compliance monitoring.

    This construct implements:
    - Security Hub with custom insights
    - AWS Config rules for compliance monitoring
    - Custom compliance standards

    Note: GuardDuty detector is NOT created as it's an account-level resource
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        aws_region: str,
        config_role_arn: str,
        enable_config: bool = False,
        enable_security_hub: bool = False,
    ):
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix
        self.aws_region = aws_region
        self.config_role_arn = config_role_arn
        self.enable_config = enable_config
        self.enable_security_hub = enable_security_hub

        # Enable Security Hub (only if enabled)
        if self.enable_security_hub:
            self.security_hub = self._enable_security_hub()
            # Create custom insights
            self._create_custom_insights()

        # Create AWS Config (only if enabled)
        if self.enable_config:
            self.config_bucket = self._create_config_bucket()
            self.config_recorder = self._create_config_recorder()
            self.config_delivery_channel = self._create_config_delivery_channel()
            # Enable Config rules
            self._create_config_rules()
            # Enable Config Recorder
            self._enable_config_recorder()

    def _enable_security_hub(self) -> SecurityhubAccount:
        """Enable Security Hub"""

        security_hub = SecurityhubAccount(
            self,
            "security_hub",
            enable_default_standards=True,
        )

        # Subscribe to security standards
        SecurityhubStandardsSubscription(
            self,
            "cis_standard",
            standards_arn=f"arn:aws:securityhub:{self.aws_region}::standards/cis-aws-foundations-benchmark/v/1.2.0",
            depends_on=[security_hub],
        )

        aws_standards_arn = (
            f"arn:aws:securityhub:{self.aws_region}::"
            "standards/aws-foundational-security-best-practices/v/1.0.0"
        )
        SecurityhubStandardsSubscription(
            self,
            "aws_foundational_standard",
            standards_arn=aws_standards_arn,
            depends_on=[security_hub],
        )

        return security_hub

    def _create_custom_insights(self) -> None:
        """Create custom Security Hub insights"""

        # Insight for critical findings
        SecurityhubInsight(
            self,
            "critical_findings_insight",
            filters={
                "severity_label": [
                    {
                        "comparison": "EQUALS",
                        "value": "CRITICAL"
                    }
                ],
                "workflow_status": [
                    {
                        "comparison": "EQUALS",
                        "value": "NEW"
                    }
                ]
            },
            group_by_attribute="ResourceType",
            name=f"Critical Findings - {self.environment_suffix}",
        )

        # Insight for unencrypted resources
        SecurityhubInsight(
            self,
            "unencrypted_resources_insight",
            filters={
                "compliance_status": [
                    {
                        "comparison": "EQUALS",
                        "value": "FAILED"
                    }
                ],
                "title": [
                    {
                        "comparison": "CONTAINS",
                        "value": "encrypted"
                    }
                ]
            },
            group_by_attribute="ResourceType",
            name=f"Unencrypted Resources - {self.environment_suffix}",
        )

        # Insight for public-facing resources
        SecurityhubInsight(
            self,
            "public_resources_insight",
            filters={
                "title": [
                    {
                        "comparison": "CONTAINS",
                        "value": "public"
                    }
                ],
                "severity_label": [
                    {
                        "comparison": "EQUALS",
                        "value": "HIGH"
                    },
                    {
                        "comparison": "EQUALS",
                        "value": "CRITICAL"
                    }
                ]
            },
            group_by_attribute="ResourceType",
            name=f"Publicly Accessible Resources - {self.environment_suffix}",
        )

    def _create_config_bucket(self) -> S3Bucket:
        """Create S3 bucket for AWS Config"""

        bucket = S3Bucket(
            self,
            "config_bucket",
            bucket=f"zero-trust-config-{self.environment_suffix}",
            tags={
                "Name": f"zero-trust-config-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Purpose": "Config",
            },
        )

        # Block public access
        S3BucketPublicAccessBlock(
            self,
            "config_bucket_public_access_block",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
        )

        return bucket

    def _create_config_recorder(self) -> ConfigConfigurationRecorder:
        """Create AWS Config configuration recorder"""

        recorder = ConfigConfigurationRecorder(
            self,
            "config_recorder",
            name=f"zero-trust-config-recorder-{self.environment_suffix}",
            role_arn=self.config_role_arn,
            recording_group={
                "all_supported": True,
                "include_global_resource_types": True,
            },
        )

        return recorder

    def _create_config_delivery_channel(self) -> ConfigDeliveryChannel:
        """Create AWS Config delivery channel"""

        delivery_channel = ConfigDeliveryChannel(
            self,
            "config_delivery_channel",
            name=f"zero-trust-config-channel-{self.environment_suffix}",
            s3_bucket_name=self.config_bucket.id,
            snapshot_delivery_properties={
                "delivery_frequency": "Six_Hours",
            },
            depends_on=[self.config_recorder],
        )

        return delivery_channel

    def _create_config_rules(self) -> None:
        """Create AWS Config rules for compliance monitoring"""

        # Rule: Encrypted EBS volumes
        ConfigConfigRule(
            self,
            "encrypted_volumes_rule",
            name=f"zero-trust-encrypted-volumes-{self.environment_suffix}",
            description="Check that EBS volumes are encrypted",
            source=ConfigConfigRuleSource(
                owner="AWS",
                source_identifier="ENCRYPTED_VOLUMES",
            ),
            depends_on=[self.config_recorder],
        )

        # Rule: RDS public access
        ConfigConfigRule(
            self,
            "rds_public_access_rule",
            name=f"zero-trust-rds-public-access-{self.environment_suffix}",
            description="Check that RDS instances are not publicly accessible",
            source=ConfigConfigRuleSource(
                owner="AWS",
                source_identifier="RDS_INSTANCE_PUBLIC_ACCESS_CHECK",
            ),
            depends_on=[self.config_recorder],
        )

        # Rule: S3 bucket public read prohibited
        ConfigConfigRule(
            self,
            "s3_public_read_rule",
            name=f"zero-trust-s3-public-read-{self.environment_suffix}",
            description="Check that S3 buckets do not allow public read access",
            source=ConfigConfigRuleSource(
                owner="AWS",
                source_identifier="S3_BUCKET_PUBLIC_READ_PROHIBITED",
            ),
            depends_on=[self.config_recorder],
        )

        # Rule: S3 bucket public write prohibited
        ConfigConfigRule(
            self,
            "s3_public_write_rule",
            name=f"zero-trust-s3-public-write-{self.environment_suffix}",
            description="Check that S3 buckets do not allow public write access",
            source=ConfigConfigRuleSource(
                owner="AWS",
                source_identifier="S3_BUCKET_PUBLIC_WRITE_PROHIBITED",
            ),
            depends_on=[self.config_recorder],
        )

        # Rule: S3 bucket encryption
        ConfigConfigRule(
            self,
            "s3_encryption_rule",
            name=f"zero-trust-s3-encryption-{self.environment_suffix}",
            description="Check that S3 buckets have default encryption enabled",
            source=ConfigConfigRuleSource(
                owner="AWS",
                source_identifier="S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED",
            ),
            depends_on=[self.config_recorder],
        )

        # Rule: RDS encryption at rest
        ConfigConfigRule(
            self,
            "rds_encryption_rule",
            name=f"zero-trust-rds-encryption-{self.environment_suffix}",
            description="Check that RDS instances have encryption at rest enabled",
            source=ConfigConfigRuleSource(
                owner="AWS",
                source_identifier="RDS_STORAGE_ENCRYPTED",
            ),
            depends_on=[self.config_recorder],
        )

        # Rule: Root account MFA enabled
        ConfigConfigRule(
            self,
            "root_mfa_rule",
            name=f"zero-trust-root-mfa-{self.environment_suffix}",
            description="Check that root account has MFA enabled",
            source=ConfigConfigRuleSource(
                owner="AWS",
                source_identifier="ROOT_ACCOUNT_MFA_ENABLED",
            ),
            depends_on=[self.config_recorder],
        )

    def _enable_config_recorder(self) -> None:
        """Enable the AWS Config recorder"""

        ConfigConfigurationRecorderStatus(
            self,
            "config_recorder_status",
            name=self.config_recorder.name,
            is_enabled=True,
            depends_on=[self.config_recorder, self.config_delivery_channel],
        )
