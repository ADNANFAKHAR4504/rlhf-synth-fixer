"""
Storage Component - Creates S3 buckets with encryption and security best practices
"""

import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws


class StorageComponent(pulumi.ComponentResource):
  def __init__(
          self,
          name: str,
          environment: str,
          region_suffix: str,
          tags: dict,
          opts: pulumi.ResourceOptions = None):
    super().__init__("custom:aws:Storage", name, None, opts)

    account_id = aws.get_caller_identity_output().account_id
    child_opts = ResourceOptions.merge(opts, ResourceOptions(parent=self))

    self.environment = environment
    # S3 Bucket for application data
    self.bucket = aws.s3.Bucket(
        f"{name}-app-bucket-{region_suffix}",
        bucket=f"apprlhfturing{region_suffix}",
        tags={**tags, "Name": f"rlhfbucketturing{region_suffix}"},
        # opts=pulumi.ResourceOptions(parent=self),
        opts=child_opts
    )

    # S3 Bucket Versioning
    self.bucket_versioning = aws.s3.BucketVersioningV2(
        f"{name}-bucket-versioning",
        bucket=self.bucket.id,
        versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
            status="Enabled"
        ),
        opts=child_opts
        # opts=pulumi.ResourceOptions(parent=self),
    )

    # LOCALSTACK FIX: Removed CloudTrail bucket policy (CloudTrail not supported)
    # No bucket policy needed for LocalStack Community Edition

    # LOCALSTACK FIX: Simplified S3 encryption for LocalStack
    self.bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
        f"{name}-bucket-encryption",
        bucket=self.bucket.id,
        rules=[
            aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"  # Use simple AES256, not KMS
                ),
                bucket_key_enabled=False,  # LOCALSTACK FIX: Disable bucket key
            )
        ],
        opts=child_opts
    )

    # S3 Bucket Public Access Block
    self.bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
        f"{name}-bucket-pab",
        bucket=self.bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True,
        # opts=pulumi.ResourceOptions(parent=self),
        opts=child_opts
    )

    # LOCALSTACK FIX: Simplified lifecycle rules for LocalStack
    self.bucket_lifecycle = aws.s3.BucketLifecycleConfigurationV2(
        f"{name}-bucket-lifecycle",
        bucket=self.bucket.id,
        rules=[
            aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                id="expire_old_objects",
                status="Enabled",
                expiration=aws.s3.BucketLifecycleConfigurationV2RuleExpirationArgs(
                    days=90  # Simple expiration rule
                ),
            ),
        ],
        opts=child_opts
    )
