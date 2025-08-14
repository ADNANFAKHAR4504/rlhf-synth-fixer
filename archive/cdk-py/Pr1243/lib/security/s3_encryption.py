from typing import Optional, Literal

from constructs import Construct
from aws_cdk import (
  aws_s3 as s3,
  aws_iam as iam,
  aws_config as config,
  Duration,
  RemovalPolicy,
)

RequireEnc = Literal["SSE-S3", "SSE-KMS"]


class EncryptedBucket(Construct):
  """
  Creates an S3 bucket with:
  - Default encryption
  - Public access blocked
  - A bucket policy that DENIES unencrypted uploads

  This enforces encryption "at the edge" for this specific bucket.
  """
  def __init__(self,
               scope: Construct,
               id: str,
               *,
               bucket_name: Optional[str] = None,
               require_encryption: RequireEnc = "SSE-S3",
               block_public_access: bool = True) -> None:
    super().__init__(scope, id)

    encryption = s3.BucketEncryption.S3_MANAGED if require_encryption == "SSE-S3" \
                 else s3.BucketEncryption.KMS_MANAGED

    self.bucket = s3.Bucket(
      self, "Bucket",
      bucket_name=bucket_name,
      encryption=encryption,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL if block_public_access else None,
      enforce_ssl=True,
      versioned=True,
      removal_policy=RemovalPolicy.RETAIN
    )

    # Deny PUT without encryption headers
    cond_key = "s3:x-amz-server-side-encryption"
    cond_val = "aws:kms" if require_encryption == "SSE-KMS" else "AES256"

    self.bucket.add_to_resource_policy(
      iam.PolicyStatement(
        sid="DenyUnEncryptedObjectUploads",
        effect=iam.Effect.DENY,
        principals=[iam.AnyPrincipal()],
        actions=["s3:PutObject"],
        resources=[self.bucket.arn_for_objects("*")],
        conditions={"StringNotEquals": {cond_key: cond_val}}
      )
    )

    if require_encryption == "SSE-KMS":
      self.bucket.add_to_resource_policy(
        iam.PolicyStatement(
          sid="DenyIncorrectEncryptionHeader",
          effect=iam.Effect.DENY,
          principals=[iam.AnyPrincipal()],
          actions=["s3:PutObject"],
          resources=[self.bucket.arn_for_objects("*")],
          conditions={"Null": {"s3:x-amz-server-side-encryption-aws-kms-key-id": "true"}}
        )
      )


class S3EncryptionBaseline(Construct):
  """
  Account/region baseline using AWS Config managed rule that evaluates ALL buckets:
    - S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED

  This covers existing and future buckets. Optionally wire remediation later.
  """
  def __init__(self,
               scope: Construct,
               id: str,
               *,
               preferred_encryption: RequireEnc = "SSE-S3") -> None:
    super().__init__(scope, id)

    # AWS Config rule checks that server-side encryption is enabled on all buckets
    self.rule = config.ManagedRule(
      self, "S3BucketSseEnabledRule",
      identifier=config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
      config_rule_name="s3-bucket-sse-enabled"
    )
