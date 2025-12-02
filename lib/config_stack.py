"""
config_stack.py

Creates AWS Config setup with recorder, delivery channel, and custom rules
"""

from typing import Optional, Dict
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
import json


class ConfigStack(pulumi.ComponentResource):
    """
    ConfigStack creates AWS Config infrastructure.

    Creates:
    - IAM role for AWS Config
    - Configuration recorder (skipped if one already exists in the region)
    - Delivery channel
    - Custom Config rules
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        config_bucket_name: Output[str],
        compliance_rules: Dict[str, aws.lambda_.Function],
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:config:ConfigStack', name, None, opts)

        self.environment_suffix = environment_suffix
        self.config_bucket_name = config_bucket_name

        # Define tags
        tags = {
            'Environment': 'Production',
            'Compliance': 'Required',
            'ManagedBy': 'Pulumi',
        }

        # Check if we should create config recorder (default: skip to avoid conflict)
        config = pulumi.Config()
        create_config_recorder = config.get_bool("create_config_recorder") or False

        # Create IAM role for AWS Config
        self.config_role = aws.iam.Role(
            f"config-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "config.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach AWS managed policy for Config
        self.config_policy_attachment = aws.iam.RolePolicyAttachment(
            f"config-policy-{environment_suffix}",
            role=self.config_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
            opts=ResourceOptions(parent=self)
        )

        # Add S3 permissions for Config role
        self.config_s3_policy = aws.iam.RolePolicy(
            f"config-s3-policy-{environment_suffix}",
            role=self.config_role.id,
            policy=config_bucket_name.apply(lambda bucket: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetBucketVersioning",
                            "s3:PutObject",
                            "s3:GetObject"
                        ],
                        "Resource": [
                            f"arn:aws:s3:::{bucket}",
                            f"arn:aws:s3:::{bucket}/*"
                        ]
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

        # AWS Config only allows 1 recorder per region
        # Only create recorder/delivery channel if explicitly enabled
        recorder_name = "default"

        if create_config_recorder:
            # Create configuration recorder
            self.config_recorder = aws.cfg.Recorder(
                f"config-recorder-{environment_suffix}",
                name=recorder_name,
                role_arn=self.config_role.arn,
                recording_group=aws.cfg.RecorderRecordingGroupArgs(
                    all_supported=False,
                    resource_types=[
                        "AWS::EC2::Instance",
                        "AWS::RDS::DBInstance",
                        "AWS::S3::Bucket",
                        "AWS::IAM::User",
                        "AWS::IAM::Role",
                        "AWS::IAM::Policy",
                    ]
                ),
                opts=ResourceOptions(
                    parent=self,
                    depends_on=[self.config_policy_attachment, self.config_s3_policy],
                )
            )

            # Create delivery channel
            self.delivery_channel = aws.cfg.DeliveryChannel(
                f"config-delivery-{environment_suffix}",
                name=recorder_name,
                s3_bucket_name=config_bucket_name,
                opts=ResourceOptions(
                    parent=self,
                    depends_on=[self.config_recorder],
                )
            )

            # Start configuration recorder
            self.recorder_status = aws.cfg.RecorderStatus(
                f"config-recorder-status-{environment_suffix}",
                name=self.config_recorder.name,
                is_enabled=True,
                opts=ResourceOptions(parent=self, depends_on=[self.delivery_channel])
            )
        else:
            # Use existing config recorder - set attributes to None for tests
            self.config_recorder = None
            self.delivery_channel = None
            self.recorder_status = None

        # Create AWS Config custom rules
        # Build depends_on list - only include recorder_status if it was created
        rule_depends_on = [self.recorder_status] if self.recorder_status else []

        # EC2 Tag Compliance Rule
        self.ec2_tag_config_rule = aws.cfg.Rule(
            f"ec2-tag-compliance-{environment_suffix}",
            source=aws.cfg.RuleSourceArgs(
                owner="CUSTOM_LAMBDA",
                source_identifier=compliance_rules['ec2_tags'].arn,
                source_details=[
                    aws.cfg.RuleSourceSourceDetailArgs(
                        event_source="aws.config",
                        message_type="ConfigurationItemChangeNotification",
                    ),
                    aws.cfg.RuleSourceSourceDetailArgs(
                        event_source="aws.config",
                        message_type="OversizedConfigurationItemChangeNotification",
                    ),
                ]
            ),
            tags=tags,
            opts=ResourceOptions(parent=self, depends_on=rule_depends_on)
        )

        # S3 Encryption Compliance Rule
        self.s3_encryption_config_rule = aws.cfg.Rule(
            f"s3-encryption-compliance-{environment_suffix}",
            source=aws.cfg.RuleSourceArgs(
                owner="CUSTOM_LAMBDA",
                source_identifier=compliance_rules['s3_encryption'].arn,
                source_details=[
                    aws.cfg.RuleSourceSourceDetailArgs(
                        event_source="aws.config",
                        message_type="ConfigurationItemChangeNotification",
                    ),
                    aws.cfg.RuleSourceSourceDetailArgs(
                        event_source="aws.config",
                        message_type="OversizedConfigurationItemChangeNotification",
                    ),
                ]
            ),
            tags=tags,
            opts=ResourceOptions(parent=self, depends_on=rule_depends_on)
        )

        # RDS Backup Compliance Rule
        self.rds_backup_config_rule = aws.cfg.Rule(
            f"rds-backup-compliance-{environment_suffix}",
            source=aws.cfg.RuleSourceArgs(
                owner="CUSTOM_LAMBDA",
                source_identifier=compliance_rules['rds_backups'].arn,
                source_details=[
                    aws.cfg.RuleSourceSourceDetailArgs(
                        event_source="aws.config",
                        message_type="ConfigurationItemChangeNotification",
                    ),
                    aws.cfg.RuleSourceSourceDetailArgs(
                        event_source="aws.config",
                        message_type="OversizedConfigurationItemChangeNotification",
                    ),
                ]
            ),
            tags=tags,
            opts=ResourceOptions(parent=self, depends_on=rule_depends_on)
        )

        # Add permissions for Config to invoke Lambda functions
        self.ec2_config_permission = aws.lambda_.Permission(
            f"ec2-tag-config-invoke-{environment_suffix}",
            action="lambda:InvokeFunction",
            function=compliance_rules['ec2_tags'].name,
            principal="config.amazonaws.com",
            opts=ResourceOptions(parent=self)
        )

        self.s3_config_permission = aws.lambda_.Permission(
            f"s3-encryption-config-invoke-{environment_suffix}",
            action="lambda:InvokeFunction",
            function=compliance_rules['s3_encryption'].name,
            principal="config.amazonaws.com",
            opts=ResourceOptions(parent=self)
        )

        self.rds_config_permission = aws.lambda_.Permission(
            f"rds-backup-config-invoke-{environment_suffix}",
            action="lambda:InvokeFunction",
            function=compliance_rules['rds_backups'].name,
            principal="config.amazonaws.com",
            opts=ResourceOptions(parent=self)
        )

        self.register_outputs({})
