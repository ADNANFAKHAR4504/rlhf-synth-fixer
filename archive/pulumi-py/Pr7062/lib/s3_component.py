"""
S3 Component for Audit Logs.
Creates S3 buckets with environment-specific lifecycle policies.
"""

from typing import Optional, Dict
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from lib.environment_config import EnvironmentConfig


class S3ComponentArgs:
    """Arguments for S3 Component."""

    def __init__(
        self,
        environment_suffix: str,
        env_config: EnvironmentConfig,
        tags: Optional[Dict[str, str]] = None
    ):
        self.environment_suffix = environment_suffix
        self.env_config = env_config
        self.tags = tags or {}


class S3Component(pulumi.ComponentResource):
    """
    Reusable S3 component for audit logs.
    Creates bucket with environment-specific lifecycle policies.
    """

    def __init__(
        self,
        name: str,
        args: S3ComponentArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('payment:storage:S3Component', name, None, opts)

        child_opts = ResourceOptions(parent=self)

        # Create S3 bucket
        self.bucket = aws.s3.BucketV2(
            f"payment-audit-logs-{args.environment_suffix}",
            tags={
                **args.tags,
                'Name': f"payment-audit-logs-{args.environment_suffix}",
            },
            opts=child_opts
        )

        # Enable versioning
        self.versioning = aws.s3.BucketVersioningV2(
            f"payment-audit-logs-versioning-{args.environment_suffix}",
            bucket=self.bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=child_opts
        )

        # Configure server-side encryption
        self.encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"payment-audit-logs-encryption-{args.environment_suffix}",
            bucket=self.bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(  # pylint: disable=line-too-long
                        sse_algorithm="AES256"
                    )
                )
            ],
            opts=child_opts
        )

        # Block public access
        self.public_access_block = aws.s3.BucketPublicAccessBlock(
            f"payment-audit-logs-public-access-{args.environment_suffix}",
            bucket=self.bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=child_opts
        )

        # Configure lifecycle policy
        self.lifecycle = aws.s3.BucketLifecycleConfigurationV2(
            f"payment-audit-logs-lifecycle-{args.environment_suffix}",
            bucket=self.bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id="expire-old-logs",
                    status="Enabled",
                    expiration=aws.s3.BucketLifecycleConfigurationV2RuleExpirationArgs(
                        days=args.env_config.s3_log_retention_days
                    )
                ),
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id="transition-to-ia",
                    status="Enabled",
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
                            days=30,
                            storage_class="STANDARD_IA"
                        )
                    ]
                )
            ],
            opts=child_opts
        )

        # Register outputs
        self.register_outputs({
            'bucket_name': self.bucket.id,
            'bucket_arn': self.bucket.arn,
        })
