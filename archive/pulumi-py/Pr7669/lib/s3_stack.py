"""
s3_stack.py

S3 buckets for API logs with lifecycle policies.
"""

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from typing import Optional


class S3Stack(pulumi.ComponentResource):
    """S3 buckets for API logging."""

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        log_retention_days: int,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__("custom:s3:S3Stack", name, None, opts)

        # Get AWS account ID and region for unique naming
        caller_identity = aws.get_caller_identity()
        region = aws.get_region()

        # API logs bucket with globally unique name
        bucket_name = f"api-logs-{environment_suffix}-{caller_identity.account_id}-{region.name}"

        self.api_logs_bucket = aws.s3.BucketV2(
            f"api-logs-{environment_suffix}",
            bucket=bucket_name,
            tags={**tags, "Name": f"api-logs-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Enable versioning
        aws.s3.BucketVersioningV2(
            f"api-logs-versioning-{environment_suffix}",
            bucket=self.api_logs_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled",
            ),
            opts=ResourceOptions(parent=self)
        )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"api-logs-public-access-block-{environment_suffix}",
            bucket=self.api_logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # Lifecycle policy
        aws.s3.BucketLifecycleConfigurationV2(
            f"api-logs-lifecycle-{environment_suffix}",
            bucket=self.api_logs_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id="expire-old-logs",
                    status="Enabled",
                    expiration=aws.s3.BucketLifecycleConfigurationV2RuleExpirationArgs(
                        days=log_retention_days,
                    ),
                    noncurrent_version_expiration=(
                        aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionExpirationArgs(
                            noncurrent_days=log_retention_days,
                        )
                    ),
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # Server-side encryption
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"api-logs-encryption-{environment_suffix}",
            bucket=self.api_logs_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=(
                        aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                            sse_algorithm="AES256",
                        )
                    ),
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        self.register_outputs({
            "api_logs_bucket_name": self.api_logs_bucket.bucket,
            "api_logs_bucket_arn": self.api_logs_bucket.arn,
        })
