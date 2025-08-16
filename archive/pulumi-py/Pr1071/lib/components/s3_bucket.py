"""
S3 Bucket Component with versioning, KMS encryption, and access logging
"""

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions
from typing import Dict, Any, Optional


class S3BucketComponent(ComponentResource):
  """
  A component that creates an S3 bucket with security best practices:
  - Versioning enabled
  - KMS encryption at rest
  - Access logging to a dedicated log bucket
  - Environment-specific naming and tagging
  """

  def __init__(
      self,
      name: str,
      environment: str,
      tags: Optional[Dict[str, str]] = None,
      opts: Optional[ResourceOptions] = None
  ):
    super().__init__("custom:aws:S3BucketComponent", name, None, opts)

    # Default tags
    default_tags = {
      "Environment": environment,
      "ManagedBy": "Pulumi",
      "Project": "aws-infrastructure"
    }
    if tags:
      default_tags.update(tags)

    # Create KMS key for bucket encryption
    self.kms_key = aws.kms.Key(
      f"{name}-kms-key",
      description=f"KMS key for {name} S3 bucket encryption",
      tags={**default_tags, "Purpose": "S3Encryption"},
      opts=ResourceOptions(parent=self)
    )

    self.kms_key_alias = aws.kms.Alias(
      f"{name}-kms-key-alias",
      name=f"alias/{environment}-{name}-s3-key",
      target_key_id=self.kms_key.key_id,
      opts=ResourceOptions(parent=self)
    )

    # Create access log bucket
    self.log_bucket = aws.s3.Bucket(
      f"{name}-access-logs",
      bucket=f"{environment}-{name}-access-logs",
      tags={**default_tags, "Purpose": "AccessLogs"},
      opts=ResourceOptions(parent=self)
    )

    # Create main S3 bucket
    self.bucket = aws.s3.Bucket(
      f"{name}-bucket",
      bucket=f"{environment}-{name}-main".lower(),
      tags=default_tags,
      opts=ResourceOptions(parent=self)
    )

    # Configure bucket versioning
    self.bucket_versioning = aws.s3.BucketVersioningV2(
      f"{name}-versioning",
      bucket=self.bucket.id,
      versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
        status="Enabled"
      ),
      opts=ResourceOptions(parent=self)
    )

    # Configure server-side encryption
    self.bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
      f"{name}-encryption",
      bucket=self.bucket.id,
      rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
        apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
          sse_algorithm="aws:kms",
          kms_master_key_id=self.kms_key.key_id
        ))],
      opts=ResourceOptions(parent=self)
    )

    # Configure access logging
    self.bucket_logging = aws.s3.BucketLoggingV2(
      f"{name}-logging",
      bucket=self.bucket.id,
      target_bucket=self.log_bucket.id,
      target_prefix=f"{name}-access-logs/",
      opts=ResourceOptions(parent=self)
    )

    # Block public access
    self.bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
      f"{name}-public-access-block",
      bucket=self.bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
      opts=ResourceOptions(parent=self)
    )

    # Register outputs
    self.register_outputs({
      "s3_bucket_name": self.bucket.bucket,
      "bucket_arn": self.bucket.arn,
      "kms_key_id": self.kms_key.key_id,
      "log_bucket_name": self.log_bucket.bucket
    })

  @property
  def bucket_name(self) -> pulumi.Output[str]:
    """Returns the bucket name"""
    return self.bucket.bucket

  @property
  def bucket_arn(self) -> pulumi.Output[str]:
    """Returns the bucket ARN"""
    return self.bucket.arn
