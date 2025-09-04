from typing import Optional, Any
import dataclasses
import random
import string

import pulumi
import pulumi_aws as aws

@dataclasses.dataclass
class SecureS3BucketConfig:
  kms_key_id: pulumi.Output[str]
  sns_topic_arn: pulumi.Output[str]
  access_logging_bucket: Optional[str] = None
  enable_mfa_delete: bool = False
  tags: Optional[dict] = None
  # Optional SNS topic component for proper dependency management
  sns_topic_component: Optional[Any] = None


class SecureS3Bucket(pulumi.ComponentResource):
  def __init__(self, name: str, config: SecureS3BucketConfig,
               opts: Optional[pulumi.ResourceOptions] = None):
    super().__init__("custom:aws:SecureS3Bucket", name, None, opts)

    # Generate random suffix for bucket name security
    random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    
    # Apply default tags
    default_tags = {
      "Name": f"{name}-secure-s3-bucket",
      "Component": "SecureS3Bucket", 
      "Stack": pulumi.get_stack(),
      "Purpose": "Secure storage with encryption and monitoring"
    }
    if config.tags:
      default_tags.update(config.tags)

    # Create the main S3 bucket
    self.bucket = aws.s3.Bucket(
      f"{name}-bucket",
      bucket=f"{name}-secure-bucket-{pulumi.get_stack()}-{random_suffix}".lower(),
      tags=default_tags,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Enable versioning with optional MFA delete
    versioning_config = aws.s3.BucketVersioningV2VersioningConfigurationArgs(
      status="Enabled"
    )
    if config.enable_mfa_delete:
      versioning_config = aws.s3.BucketVersioningV2VersioningConfigurationArgs(
        status="Enabled",
        mfa_delete="Enabled"
      )
    
    self.versioning = aws.s3.BucketVersioningV2(
      f"{name}-versioning",
      bucket=self.bucket.id,
      versioning_configuration=versioning_config,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Configure server-side encryption
    self.bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
      f"{name}-encryption",
      bucket=self.bucket.id,
      rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
        apply_server_side_encryption_by_default=
        aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
          sse_algorithm="aws:kms",
          kms_master_key_id=config.kms_key_id
        ),
        bucket_key_enabled=True
      )],
      opts=pulumi.ResourceOptions(
        parent=self,
        depends_on=[self.bucket]
      )
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
          noncurrent_version_expiration=
          aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionExpirationArgs(
            noncurrent_days=90
          ),
          abort_incomplete_multipart_upload=
          aws.s3.BucketLifecycleConfigurationV2RuleAbortIncompleteMultipartUploadArgs(
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
      opts=pulumi.ResourceOptions(
        parent=self,
        depends_on=[self.bucket, self.versioning]
      )
    )

    # Configure access logging if logging bucket is provided
    if config.access_logging_bucket:
      self.logging = aws.s3.BucketLoggingV2(
        f"{name}-logging",
        bucket=self.bucket.id,
        target_bucket=config.access_logging_bucket,
        target_prefix=f"{name}-access-logs/",
        opts=pulumi.ResourceOptions(
          parent=self,
          depends_on=[self.bucket]
        )
      )

    # Configure SNS notifications
    # Note: SNS topic policy must be created before bucket notification
    notification_depends_on = [self.bucket, self.bucket_encryption, self.versioning, self.public_access_block, self.lifecycle]
    if config.access_logging_bucket:
      notification_depends_on.append(self.logging)
    if config.sns_topic_component:
      # Add both the SNS topic and its policy as dependencies
      notification_depends_on.extend([
        config.sns_topic_component,
        config.sns_topic_component.topic_policy if hasattr(config.sns_topic_component, 'topic_policy') else None
      ])
      # Remove None values
      notification_depends_on = [dep for dep in notification_depends_on if dep is not None]
    
    self.notification = aws.s3.BucketNotification(
      f"{name}-notification",
      bucket=self.bucket.id,
      topics=[
        aws.s3.BucketNotificationTopicArgs(
          topic_arn=config.sns_topic_arn,
          events=[
            "s3:ObjectCreated:*",
            "s3:ObjectRemoved:*"
          ]
        )
      ],
      opts=pulumi.ResourceOptions(
        parent=self, 
        depends_on=notification_depends_on,
        # Ensure topic policy is created first by adding explicit dependency
        # The SNS topic and its policy must exist before S3 can validate the notification
        delete_before_replace=True
      )
    )

    self.register_outputs({
      "bucket_name": self.bucket.bucket,
      "bucket_arn": self.bucket.arn,
      "bucket_id": self.bucket.id
    })
