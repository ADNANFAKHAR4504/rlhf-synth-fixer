from typing import Optional, List
import pulumi
import re
import pulumi_aws as aws
import pulumi_random as random
from pulumi import ResourceOptions
import json
from pulumi_aws import get_caller_identity

"""
Data Protection Infrastructure Component

This component creates and manages:
- S3 buckets with encryption at rest and versioning
- Data retention and backup policies
"""

class DataProtectionInfrastructure(pulumi.ComponentResource):
  def __init__(self,
               name: str,
               region: str,
               vpc_id: pulumi.Input[str],
               private_subnet_ids: pulumi.Input[List[str]],
               database_security_group_id: pulumi.Input[str],
               kms_key_arn: pulumi.Input[str],
               sns_topic_arn: pulumi.Input[str],
               tags: Optional[dict] = None,
               opts: Optional[ResourceOptions] = None):
    super().__init__('projectx:data:DataProtection', name, None, opts)

    self.region = region
    self.vpc_id = vpc_id
    self.private_subnet_ids = private_subnet_ids
    self.database_security_group_id = database_security_group_id
    self.kms_key_arn = kms_key_arn
    self.sns_topic_arn = sns_topic_arn
    self.tags = tags or {}

    if not isinstance(self.tags, dict):
      raise ValueError("tags must be a dictionary")
    if not region:
      raise ValueError("region must be provided")

    self._create_s3_buckets()

    self.register_outputs({
      "secure_s3_bucket_name": self.secure_s3_bucket.bucket,
      "secure_s3_bucket_arn": self.secure_s3_bucket.arn
    })

  def _create_s3_buckets(self):
    safe_stack = re.sub(r'[^a-z0-9\-]', '', pulumi.get_stack().lower())
    bucket_name = f"secure-projectx-data-{self.region}-{safe_stack}"
    assert self.kms_key_arn.apply(lambda arn: f":{self.region}:" in arn), \
      f"KMS key ARN region mismatch: {self.kms_key_arn}"

    self.secure_s3_bucket = aws.s3.Bucket(
      f"{self.region.replace('-', '')}-secure-projectx-data-bucket",
      bucket=bucket_name,
      tags={
        **self.tags,
        "Name": f"secure-projectx-data-{self.region}",
        "Purpose": "DataStorage",
        "Encryption": "KMS"
      },
      opts=ResourceOptions(
        parent=self,
        custom_timeouts={"create": "3m", "update": "3m", "delete": "3m"}
      )
    )

    self.s3_versioning = aws.s3.BucketVersioning(
      f"{self.region.replace('-', '')}-secure-projectx-versioning",
      bucket=self.secure_s3_bucket.id,
      versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
        status="Enabled"
      ),
      opts=ResourceOptions(
        parent=self,
        depends_on=[self.secure_s3_bucket],
        custom_timeouts={"create": "3m", "update": "3m", "delete": "3m"}
      )
    )

    self.s3_encryption = aws.s3.BucketServerSideEncryptionConfiguration(
      f"{self.region.replace('-', '')}-secure-projectx-encryption",
      bucket=self.secure_s3_bucket.id,
      rules=[
        aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
          apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
            sse_algorithm="aws:kms",
            kms_master_key_id=self.kms_key_arn
          ),
          bucket_key_enabled=True
        )
      ],
      opts=ResourceOptions(
        parent=self,
        depends_on=[self.s3_versioning],
        custom_timeouts={"create": "3m", "update": "3m", "delete": "3m"}
      )
    )

    self.s3_public_access_block = aws.s3.BucketPublicAccessBlock(
      f"{self.region.replace('-', '')}-secure-projectx-public-access-block",
      bucket=self.secure_s3_bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
      opts=ResourceOptions(
        parent=self,
        depends_on=[self.s3_encryption],
        custom_timeouts={"create": "3m", "update": "3m", "delete": "3m"}
      )
    )

    bucket_policy = pulumi.Output.all(
      bucket_name=self.secure_s3_bucket.bucket,
      kms_key_arn=self.kms_key_arn
    ).apply(lambda args: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "DenyInsecureConnections",
          "Effect": "Deny",
          "Principal": "*",
          "Action": "s3:*",
          "Resource": [
            f"arn:aws:s3:::{args['bucket_name']}",
            f"arn:aws:s3:::{args['bucket_name']}/*"
          ],
          "Condition": {
            "Bool": {
              "aws:SecureTransport": "false"
            }
          }
        },
        {
          "Sid": "RequireKMSEncryption",
          "Effect": "Deny",
          "Principal": "*",
          "Action": "s3:PutObject",
          "Resource": f"arn:aws:s3:::{args['bucket_name']}/*",
          "Condition": {
            "StringNotEquals": {
              "s3:x-amz-server-side-encryption": "aws:kms"
            }
          }
        }
      ]
    }))

    self.s3_bucket_policy = aws.s3.BucketPolicy(
      f"{self.region.replace('-', '')}-secure-projectx-bucket-policy",
      bucket=self.secure_s3_bucket.id,
      policy=bucket_policy,
      opts=ResourceOptions(
        parent=self,
        depends_on=[self.s3_public_access_block],
        custom_timeouts={"create": "3m", "update": "3m", "delete": "3m"}
      )
    )

    self.s3_lifecycle = aws.s3.BucketLifecycleConfiguration(
      f"{self.region.replace('-', '')}-secure-projectx-lifecycle",
      bucket=self.secure_s3_bucket.id,
      rules=[
        aws.s3.BucketLifecycleConfigurationRuleArgs(
          id="secure-projectx-lifecycle-rule",
          status="Enabled",
          transitions=[
            aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
              days=30,
              storage_class="STANDARD_IA"
            ),
            aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
              days=90,
              storage_class="GLACIER"
            ),
            aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
              days=365,
              storage_class="DEEP_ARCHIVE"
            )
          ],
          noncurrent_version_transitions=[
            aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionTransitionArgs(
              noncurrent_days=30,
              storage_class="STANDARD_IA"
            ),
            aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionTransitionArgs(
              noncurrent_days=90,
              storage_class="GLACIER"
            )
          ],
          noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs(
            noncurrent_days=2555
          )
        )
      ],
      opts=ResourceOptions(
        parent=self,
        depends_on=[self.s3_bucket_policy],
        custom_timeouts={"create": "3m", "update": "3m", "delete": "3m"}
      )
    )
