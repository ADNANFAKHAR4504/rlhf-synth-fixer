import pulumi
import pulumi_aws as aws
from typing import Optional


class SecureS3Bucket(pulumi.ComponentResource):
  def __init__(self, name: str,
               kms_key_id: pulumi.Output[str],
               sns_topic_arn: pulumi.Output[str],
               access_logging_bucket: Optional[str] = None,
               opts: Optional[pulumi.ResourceOptions] = None):
    super().__init__("custom:aws:SecureS3Bucket", name, None, opts)

    # Create the main S3 bucket
    self.bucket = aws.s3.Bucket(
      f"{name}-bucket",
      bucket=f"{name}-secure-bucket-{pulumi.get_stack()}",
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Enable versioning
    self.versioning = aws.s3.BucketVersioningV2(
      f"{name}-versioning",
      bucket=self.bucket.id,
      versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
        status="Enabled"
      ),
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Configure server-side encryption
    self.bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
      f"{name}-encryption",
      bucket=self.bucket.id,
      rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
        apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
          sse_algorithm="aws:kms",
          kms_master_key_id=kms_key_id
        ))],
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Block public access
    self.public_access_block = aws.s3.BucketPublicAccessBlock(
      f"{name}-public-access-block",
      bucket=self.bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Configure lifecycle policy
    self.lifecycle = aws.s3.BucketLifecycleConfigurationV2(
      f"{name}-lifecycle",
      bucket=self.bucket.id,
      rules=[
        aws.s3.BucketLifecycleConfigurationV2RuleArgs(
          id="delete_old_versions",
          status="Enabled",
          noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionExpirationArgs(
            noncurrent_days=90
          ),
          abort_incomplete_multipart_upload=aws.s3.BucketLifecycleConfigurationV2RuleAbortIncompleteMultipartUploadArgs(
            days_after_initiation=7
          )
        ),
        aws.s3.BucketLifecycleConfigurationV2RuleArgs(
          id="transition_to_ia",
          status="Enabled",
          transitions=[
            aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
              days=30,
              storage_class="STANDARD_IA"
            ),
            aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
              days=90,
              storage_class="GLACIER"
            )
          ]
        )
      ],
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Configure access logging if logging bucket is provided
    if access_logging_bucket:
      self.logging = aws.s3.BucketLoggingV2(
        f"{name}-logging",
        bucket=self.bucket.id,
        target_bucket=access_logging_bucket,
        target_prefix=f"{name}-access-logs/",
        opts=pulumi.ResourceOptions(parent=self)
      )

    # Configure SNS notifications
    self.notification = aws.s3.BucketNotification(
      f"{name}-notification",
      bucket=self.bucket.id,
      topics=[
        aws.s3.BucketNotificationTopicArgs(
          topic_arn=sns_topic_arn,
          events=[
            "s3:ObjectCreated:*",
            "s3:ObjectRemoved:*"
          ]
        )
      ],
      opts=pulumi.ResourceOptions(parent=self, depends_on=[self.bucket])
    )

    self.register_outputs({
      "bucket_name": self.bucket.bucket,
      "bucket_arn": self.bucket.arn,
      "bucket_id": self.bucket.id
    })
