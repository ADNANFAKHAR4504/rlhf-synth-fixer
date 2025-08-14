"""
Main orchestration stack for TAP security compliance.
Do NOT create resources directly here—compose from nested constructs/stacks.
"""

from typing import Optional

import aws_cdk as cdk
from constructs import Construct

from lib.security.s3_encryption import S3EncryptionBaseline, EncryptedBucket
from lib.security.iam_least_priv import IamLeastPrivilegeExamples
from lib.security.logging_per_account import PerAccountSecurityLogging


class TapStackProps(cdk.StackProps):
  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
  def __init__(self,
               scope: Construct,
               construct_id: str,
               props: Optional[TapStackProps] = None,
               *,
               central_destination_arn: Optional[str] = None,
               **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    env_suffix = (props.environment_suffix if props else None) \
                 or self.node.try_get_context("environmentSuffix") or "dev"

    # 1) Org/account‑wide S3 encryption compliance via AWS Config managed rule
    s3_baseline = S3EncryptionBaseline(
      self, f"S3EncryptionBaseline-{env_suffix}",
      preferred_encryption="SSE-S3"  # or "SSE-KMS"
    )

    # Example of creating a bucket that *also* enforces encryption by policy at the edge
    encrypted_bucket = EncryptedBucket(
      self, f"AppDataBucket-{env_suffix}",
      bucket_name=None,             # let CDK name it, or put a string to fix name
      require_encryption="SSE-S3",  # or "SSE-KMS"
      block_public_access=True
    )

    # 2) IAM least‑privilege role examples (scoped to the example bucket)
    IamLeastPrivilegeExamples(
      self, f"IamLeastPrivilege-{env_suffix}",
      bucket=encrypted_bucket.bucket
    )

    # 3) Per‑account CloudTrail -> CloudWatch Logs, then cross‑account
    #    subscription to the central security destination
    PerAccountSecurityLogging(
      self, f"PerAccountSecurityLogging-{env_suffix}",
      log_group_name=f"/aws/tap/security/{env_suffix}",
      central_destination_arn=central_destination_arn
    )
