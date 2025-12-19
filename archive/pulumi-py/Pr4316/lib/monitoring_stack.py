"""
Monitoring Stack - CloudWatch and S3 logging infrastructure.

This module creates CloudWatch log groups and S3 buckets for storing
audit logs required for PCI-DSS compliance.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class MonitoringStackArgs:
    """
    Arguments for Monitoring Stack.

    Args:
        environment_suffix: Environment identifier for resource naming
        log_retention_days: CloudWatch log retention in days
    """
    def __init__(
        self,
        environment_suffix: str,
        log_retention_days: int = 7
    ):
        self.environment_suffix = environment_suffix
        self.log_retention_days = log_retention_days


class MonitoringStack(pulumi.ComponentResource):
    """
    Monitoring Component Resource for logging and audit trails.

    Creates:
    - S3 bucket for VPC Flow Logs (encrypted, versioned)
    - CloudWatch log groups for ECS tasks
    - Lifecycle policies for log retention
    """

    def __init__(
        self,
        name: str,
        args: MonitoringStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('custom:monitoring:MonitoringStack', name, None, opts)

        # PCI-DSS Requirement: Encrypted storage for audit logs
        self.log_bucket = aws.s3.Bucket(
            f"payment-logs-{args.environment_suffix}",
            bucket=f"payment-logs-{args.environment_suffix}",
            acl="private",
            versioning=aws.s3.BucketVersioningArgs(
                enabled=True,
            ),
            server_side_encryption_configuration=(
                aws.s3.BucketServerSideEncryptionConfigurationArgs(
                    rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=(
                            aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                                sse_algorithm="AES256",
                            )
                        ),
                    ),
                )
            ),
            lifecycle_rules=[
                aws.s3.BucketLifecycleRuleArgs(
                    enabled=True,
                    expiration=aws.s3.BucketLifecycleRuleExpirationArgs(
                        days=30,
                    ),
                )
            ],
            force_destroy=True,  # Allow cleanup in test environments
            tags={
                "Name": f"payment-logs-{args.environment_suffix}",
                "Environment": args.environment_suffix,
                "Purpose": "audit-logs",
            },
            opts=ResourceOptions(parent=self)
        )

        # Block all public access to logs bucket
        self.bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"log-bucket-public-access-block-{args.environment_suffix}",
            bucket=self.log_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch Log Group for ECS tasks
        # PCI-DSS Requirement: Application logging for security monitoring
        self.ecs_log_group = aws.cloudwatch.LogGroup(
            f"ecs-payment-processor-{args.environment_suffix}",
            name=f"/ecs/payment-processor-{args.environment_suffix}",
            retention_in_days=args.log_retention_days,
            tags={
                "Name": f"ecs-payment-processor-{args.environment_suffix}",
                "Environment": args.environment_suffix,
                "Service": "payment-processor",
            },
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            "log_bucket_arn": self.log_bucket.arn,
            "log_bucket_name": self.log_bucket.bucket,
            "ecs_log_group_name": self.ecs_log_group.name,
        })
