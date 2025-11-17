"""
Monitoring infrastructure module for logging and compliance.

This module creates:
- S3 bucket for VPC Flow Logs
- VPC Flow Logs capturing all traffic
- CloudWatch Log Groups for EventBridge
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
    MonitoringStack component creates logging and monitoring resources.

    Exports:
        flow_logs_bucket: S3 bucket for VPC Flow Logs
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
            force_destroy=True,
            tags={
                "Name": f"vpc-flow-logs-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "monitoring-team",
                "CostCenter": "monitoring"
            },
            opts=ResourceOptions(parent=self)
        )

        # Configure bucket ownership controls to allow ACLs
        aws.s3.BucketOwnershipControls(
            f"flow-logs-bucket-ownership-{self.environment_suffix}",
            bucket=self.flow_logs_bucket.id,
            rule=aws.s3.BucketOwnershipControlsRuleArgs(
                object_ownership="BucketOwnerPreferred"
            ),
            opts=ResourceOptions(parent=self.flow_logs_bucket)
        )

        # Configure bucket ACL using separate resource
        aws.s3.BucketAcl(
            f"flow-logs-bucket-acl-{self.environment_suffix}",
            bucket=self.flow_logs_bucket.id,
            acl="private",
            opts=ResourceOptions(parent=self.flow_logs_bucket)
        )

        # Configure lifecycle rules using separate resource
        aws.s3.BucketLifecycleConfiguration(
            f"flow-logs-bucket-lifecycle-{self.environment_suffix}",
            bucket=self.flow_logs_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id="expire-old-logs",
                    status="Enabled",
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(days=90)
                )
            ],
            opts=ResourceOptions(parent=self.flow_logs_bucket)
        )

        # Configure server-side encryption using separate resource
        aws.s3.BucketServerSideEncryptionConfiguration(
            f"flow-logs-bucket-encryption-{self.environment_suffix}",
            bucket=self.flow_logs_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
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


        # Create CloudWatch Log Group for EventBridge
        self.log_group = aws.cloudwatch.LogGroup(
            f"eventbridge-logs-{self.environment_suffix}",
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
        self.log_group_name = self.log_group.name

        self.register_outputs({
            "flow_logs_bucket_name": self.flow_logs_bucket_name,
            "log_group_name": self.log_group_name
        })
