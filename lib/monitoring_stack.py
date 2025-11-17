"""
Monitoring infrastructure module for logging and compliance.

This module creates:
- S3 buckets for VPC Flow Logs and AWS Config
- VPC Flow Logs capturing all traffic
- AWS Config recorder and delivery channel
- Custom Config Rules for EBS encryption and S3 public access
- CloudWatch Log Groups
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
import json


class MonitoringStackArgs:
    """Arguments for MonitoringStack component."""

    def __init__(
        self,
        environment_suffix: str,
        vpc_id: Output[str],
        region: str = "us-east-2"
    ):
        self.environment_suffix = environment_suffix
        self.vpc_id = vpc_id
        self.region = region


class MonitoringStack(pulumi.ComponentResource):
    """
    MonitoringStack component creates logging and compliance monitoring resources.

    Exports:
        flow_logs_bucket: S3 bucket for VPC Flow Logs
        config_bucket: S3 bucket for AWS Config
        log_group_name: CloudWatch Log Group name
    """

    def __init__(
        self,
        name: str,
        args: MonitoringStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:monitoring:MonitoringStack', name, None, opts)

        self.environment_suffix = args.environment_suffix

        # Create S3 bucket for VPC Flow Logs
        self.flow_logs_bucket = aws.s3.Bucket(
            f"vpc-flow-logs-{self.environment_suffix}",
            bucket=f"vpc-flow-logs-{self.environment_suffix}",
            force_destroy=True,
            tags={
                "Name": f"vpc-flow-logs-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "monitoring-team",
                "CostCenter": "monitoring"
            },
            opts=ResourceOptions(parent=self)
        )

        # Configure bucket ACL using separate resource
        aws.s3.BucketAclV2(
            f"flow-logs-bucket-acl-{self.environment_suffix}",
            bucket=self.flow_logs_bucket.id,
            acl="private",
            opts=ResourceOptions(parent=self.flow_logs_bucket)
        )

        # Configure lifecycle rules using separate resource
        aws.s3.BucketLifecycleConfigurationV2(
            f"flow-logs-bucket-lifecycle-{self.environment_suffix}",
            bucket=self.flow_logs_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id="expire-old-logs",
                    status="Enabled",
                    expiration=aws.s3.BucketLifecycleConfigurationV2RuleExpirationArgs(days=90)
                )
            ],
            opts=ResourceOptions(parent=self.flow_logs_bucket)
        )

        # Configure server-side encryption using separate resource
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"flow-logs-bucket-encryption-{self.environment_suffix}",
            bucket=self.flow_logs_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ],
            opts=ResourceOptions(parent=self.flow_logs_bucket)
        )

        # Block public access for Flow Logs bucket
        aws.s3.BucketPublicAccessBlock(
            f"flow-logs-bucket-block-{self.environment_suffix}",
            bucket=self.flow_logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self.flow_logs_bucket)
        )

        # Create bucket policy for VPC Flow Logs
        flow_logs_bucket_policy = aws.s3.BucketPolicy(
            f"flow-logs-bucket-policy-{self.environment_suffix}",
            bucket=self.flow_logs_bucket.id,
            policy=pulumi.Output.all(self.flow_logs_bucket.arn).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "AWSLogDeliveryWrite",
                            "Effect": "Allow",
                            "Principal": {"Service": "delivery.logs.amazonaws.com"},
                            "Action": "s3:PutObject",
                            "Resource": f"{args[0]}/*",
                            "Condition": {
                                "StringEquals": {"s3:x-amz-acl": "bucket-owner-full-control"}
                            }
                        },
                        {
                            "Sid": "AWSLogDeliveryAclCheck",
                            "Effect": "Allow",
                            "Principal": {"Service": "delivery.logs.amazonaws.com"},
                            "Action": "s3:GetBucketAcl",
                            "Resource": args[0]
                        }
                    ]
                })
            ),
            opts=ResourceOptions(parent=self.flow_logs_bucket)
        )

        # Create VPC Flow Logs
        self.flow_log = aws.ec2.FlowLog(
            f"vpc-flow-log-{self.environment_suffix}",
            vpc_id=args.vpc_id,
            traffic_type="ALL",
            log_destination_type="s3",
            log_destination=self.flow_logs_bucket.arn,
            tags={
                "Name": f"vpc-flow-log-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "monitoring-team",
                "CostCenter": "monitoring"
            },
            opts=ResourceOptions(parent=self.flow_logs_bucket, depends_on=[flow_logs_bucket_policy])
        )

        # Create S3 bucket for AWS Config
        self.config_bucket = aws.s3.Bucket(
            f"aws-config-{self.environment_suffix}",
            bucket=f"aws-config-{self.environment_suffix}",
            force_destroy=True,
            tags={
                "Name": f"aws-config-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "compliance-team",
                "CostCenter": "compliance"
            },
            opts=ResourceOptions(parent=self)
        )

        # Configure bucket ACL using separate resource
        aws.s3.BucketAclV2(
            f"config-bucket-acl-{self.environment_suffix}",
            bucket=self.config_bucket.id,
            acl="private",
            opts=ResourceOptions(parent=self.config_bucket)
        )

        # Configure server-side encryption using separate resource
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"config-bucket-encryption-{self.environment_suffix}",
            bucket=self.config_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ],
            opts=ResourceOptions(parent=self.config_bucket)
        )

        # Block public access for Config bucket
        aws.s3.BucketPublicAccessBlock(
            f"config-bucket-block-{self.environment_suffix}",
            bucket=self.config_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self.config_bucket)
        )

        # Create IAM role for AWS Config
        config_assume_role = aws.iam.get_policy_document(
            statements=[aws.iam.GetPolicyDocumentStatementArgs(
                actions=["sts:AssumeRole"],
                principals=[aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                    type="Service",
                    identifiers=["config.amazonaws.com"]
                )]
            )]
        )

        self.config_role = aws.iam.Role(
            f"aws-config-role-{self.environment_suffix}",
            name=f"aws-config-role-{self.environment_suffix}",
            assume_role_policy=config_assume_role.json,
            tags={
                "Name": f"aws-config-role-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "compliance-team",
                "CostCenter": "compliance"
            },
            opts=ResourceOptions(parent=self)
        )

        # Attach AWS Config managed policy
        aws.iam.RolePolicyAttachment(
            f"config-policy-attach-{self.environment_suffix}",
            role=self.config_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
            opts=ResourceOptions(parent=self.config_role)
        )

        # Create inline policy for Config S3 access
        config_s3_policy = aws.iam.RolePolicy(
            f"config-s3-policy-{self.environment_suffix}",
            role=self.config_role.id,
            policy=pulumi.Output.all(self.config_bucket.arn).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": ["s3:GetBucketVersioning", "s3:PutObject", "s3:GetObject"],
                            "Resource": [args[0], f"{args[0]}/*"]
                        }
                    ]
                })
            ),
            opts=ResourceOptions(parent=self.config_role)
        )

        # Create AWS Config recorder
        self.config_recorder = aws.cfg.Recorder(
            f"config-recorder-{self.environment_suffix}",
            name=f"config-recorder-{self.environment_suffix}",
            role_arn=self.config_role.arn,
            recording_group=aws.cfg.RecorderRecordingGroupArgs(
                all_supported=True,
                include_global_resource_types=True
            ),
            opts=ResourceOptions(parent=self.config_role, depends_on=[config_s3_policy])
        )

        # Create AWS Config delivery channel
        self.delivery_channel = aws.cfg.DeliveryChannel(
            f"config-delivery-{self.environment_suffix}",
            name=f"config-delivery-{self.environment_suffix}",
            s3_bucket_name=self.config_bucket.bucket,
            opts=ResourceOptions(parent=self.config_recorder, depends_on=[self.config_recorder])
        )

        # Start Config recorder
        self.recorder_status = aws.cfg.RecorderStatus(
            f"config-recorder-status-{self.environment_suffix}",
            name=self.config_recorder.name,
            is_enabled=True,
            opts=ResourceOptions(parent=self.delivery_channel, depends_on=[self.delivery_channel])
        )

        # Create Config Rule for encrypted EBS volumes
        self.ebs_encryption_rule = aws.cfg.Rule(
            f"ebs-encryption-rule-{self.environment_suffix}",
            name=f"ebs-encryption-rule-{self.environment_suffix}",
            description="Check that EBS volumes are encrypted",
            source=aws.cfg.RuleSourceArgs(
                owner="AWS",
                source_identifier="ENCRYPTED_VOLUMES"
            ),
            tags={
                "Name": f"ebs-encryption-rule-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "compliance-team",
                "CostCenter": "compliance"
            },
            opts=ResourceOptions(parent=self.config_recorder, depends_on=[self.recorder_status])
        )

        # Create Config Rule for public S3 buckets
        self.s3_public_read_rule = aws.cfg.Rule(
            f"s3-public-read-rule-{self.environment_suffix}",
            name=f"s3-public-read-rule-{self.environment_suffix}",
            description="Check that S3 buckets do not allow public read access",
            source=aws.cfg.RuleSourceArgs(
                owner="AWS",
                source_identifier="S3_BUCKET_PUBLIC_READ_PROHIBITED"
            ),
            tags={
                "Name": f"s3-public-read-rule-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "compliance-team",
                "CostCenter": "compliance"
            },
            opts=ResourceOptions(parent=self.config_recorder, depends_on=[self.recorder_status])
        )

        # Create CloudWatch Log Group for EventBridge
        self.log_group = aws.cloudwatch.LogGroup(
            f"eventbridge-logs-{self.environment_suffix}",
            name=f"/aws/events/{self.environment_suffix}",
            retention_in_days=7,
            tags={
                "Name": f"eventbridge-logs-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "monitoring-team",
                "CostCenter": "monitoring"
            },
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.flow_logs_bucket_name = self.flow_logs_bucket.bucket
        self.config_bucket_name = self.config_bucket.bucket
        self.log_group_name = self.log_group.name

        self.register_outputs({
            "flow_logs_bucket_name": self.flow_logs_bucket_name,
            "config_bucket_name": self.config_bucket_name,
            "log_group_name": self.log_group_name
        })
