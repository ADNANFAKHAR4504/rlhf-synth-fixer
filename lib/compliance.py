"""Compliance module for AWS Config and EventBridge."""

import json
from constructs import Construct
from cdktf import Token
from cdktf_cdktf_provider_aws.config_configuration_recorder import ConfigConfigurationRecorder, ConfigConfigurationRecorderRecordingGroup
from cdktf_cdktf_provider_aws.config_delivery_channel import ConfigDeliveryChannel
from cdktf_cdktf_provider_aws.config_configuration_recorder_status import ConfigConfigurationRecorderStatus
from cdktf_cdktf_provider_aws.config_config_rule import ConfigConfigRule, ConfigConfigRuleSource
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget


class ComplianceModule(Construct):
    """Compliance infrastructure module."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        aws_region: str,
        config_role_arn: str,
        sns_topic_arn: str,
    ):
        """Initialize compliance module."""
        super().__init__(scope, construct_id)

        # Create S3 bucket for Config
        config_bucket = S3Bucket(
            self,
            "config_bucket",
            bucket=f"config-bucket-{environment_suffix}",
            force_destroy=True,
            tags={
                "Name": f"config-bucket-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        S3BucketPublicAccessBlock(
            self,
            "config_bucket_public_block",
            bucket=config_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
        )

        # Create Config recorder
        config_recorder = ConfigConfigurationRecorder(
            self,
            "config_recorder",
            name=f"config-recorder-{environment_suffix}",
            role_arn=config_role_arn,
            recording_group=ConfigConfigurationRecorderRecordingGroup(
                all_supported=True,
                include_global_resource_types=True,
            ),
        )

        self.config_recorder_name = config_recorder.name

        # Create Config delivery channel
        delivery_channel = ConfigDeliveryChannel(
            self,
            "config_delivery_channel",
            name=f"config-delivery-{environment_suffix}",
            s3_bucket_name=config_bucket.bucket,
            depends_on=[config_recorder],
        )

        # Start Config recorder
        ConfigConfigurationRecorderStatus(
            self,
            "config_recorder_status",
            name=config_recorder.name,
            is_enabled=True,
            depends_on=[delivery_channel],
        )

        # Config rule: S3 bucket encryption
        ConfigConfigRule(
            self,
            "s3_encryption_rule",
            name=f"s3-bucket-server-side-encryption-{environment_suffix}",
            source=ConfigConfigRuleSource(
                owner="AWS",
                source_identifier="S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED",
            ),
            depends_on=[config_recorder],
        )

        # Config rule: Required tags
        ConfigConfigRule(
            self,
            "required_tags_rule",
            name=f"required-tags-{environment_suffix}",
            source=ConfigConfigRuleSource(
                owner="AWS",
                source_identifier="REQUIRED_TAGS",
            ),
            input_parameters=json.dumps({
                "tag1Key": "Environment",
                "tag2Key": "DataClassification",
                "tag3Key": "Owner",
            }),
            depends_on=[config_recorder],
        )

        # Config rule: Encrypted volumes
        ConfigConfigRule(
            self,
            "encrypted_volumes_rule",
            name=f"encrypted-volumes-{environment_suffix}",
            source=ConfigConfigRuleSource(
                owner="AWS",
                source_identifier="ENCRYPTED_VOLUMES",
            ),
            depends_on=[config_recorder],
        )

        # EventBridge rule for security events
        security_event_rule = CloudwatchEventRule(
            self,
            "security_event_rule",
            name=f"security-events-{environment_suffix}",
            description="Capture critical security events",
            event_pattern=json.dumps({
                "source": ["aws.guardduty", "aws.securityhub", "aws.config"],
                "detail-type": [
                    "GuardDuty Finding",
                    "Security Hub Findings - Imported",
                    "Config Rules Compliance Change"
                ]
            }),
            tags={
                "Name": f"security-events-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        # EventBridge target: SNS
        CloudwatchEventTarget(
            self,
            "security_event_target",
            rule=security_event_rule.name,
            arn=sns_topic_arn,
            target_id="SecurityAlertsSNS",
        )
