import json

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions
from ..config import InfrastructureConfig


class StorageComponent(ComponentResource):
  def __init__(self, name: str, config: InfrastructureConfig, opts: ResourceOptions = None):
    super().__init__('custom:storage:StorageComponent', name, None, opts)

    # Create S3 buckets with security best practices
    self._create_app_bucket(name, config)
    self._create_backup_bucket(name, config)
    self._create_logs_bucket(name, config)

    self.register_outputs({
      "app_bucket_name": self.app_bucket.bucket,
      "backup_bucket_name": self.backup_bucket.bucket,
      "logs_bucket_name": self.logs_bucket.bucket
    })

  def _create_app_bucket(self, name: str, config: InfrastructureConfig):
    # Main application S3 bucket
    self.app_bucket = aws.s3.Bucket(
      f"{name}-app-bucket",
      tags={
        **config.tags,
        "Name": f"{config.app_name}-{config.environment}-app",
        "Purpose": "Application Data"
      },
      opts=ResourceOptions(parent=self)
    )

    # Configure bucket versioning
    aws.s3.BucketVersioningV2(
      f"{name}-app-bucket-versioning",
      bucket=self.app_bucket.id,
      versioning_configuration={
        "status": "Enabled" if config.storage.versioning_enabled else "Suspended"
      },
      opts=ResourceOptions(parent=self)
    )

    # Configure server-side encryption
    aws.s3.BucketServerSideEncryptionConfigurationV2(
      f"{name}-app-bucket-encryption",
      bucket=self.app_bucket.id,
      rules=[{
        "apply_server_side_encryption_by_default": {
          "sse_algorithm": "AES256"
        },
        "bucket_key_enabled": True
      }],
      opts=ResourceOptions(parent=self)
    )

    # Block public access
    aws.s3.BucketPublicAccessBlock(
      f"{name}-app-bucket-pab",
      bucket=self.app_bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
      opts=ResourceOptions(parent=self)
    )

    # Configure lifecycle management
    aws.s3.BucketLifecycleConfigurationV2(
      f"{name}-app-bucket-lifecycle",
      bucket=self.app_bucket.id,
      rules=[{
        "id": "transition_to_ia",
        "status": "Enabled",
        "transitions": [{
          "days": 30,
          "storage_class": "STANDARD_IA"
        }, {
          "days": 90,
          "storage_class": "GLACIER"
        }]
      }, {
        "id": "delete_old_versions",
        "status": "Enabled",
        "noncurrent_version_expiration": {
          "noncurrent_days": 90
        }
      }],
      opts=ResourceOptions(parent=self)
    )

  def _create_backup_bucket(self, name: str, config: InfrastructureConfig):
    # Backup S3 bucket
    self.backup_bucket = aws.s3.Bucket(
      f"{name}-backup-bucket",
      tags={
        "Name": f"{config.app_name}-{config.environment}-backup".lower(),
        **config.tags,
        "Purpose": "Database Backups"
      },
      opts=ResourceOptions(parent=self)
    )

    # Configure bucket versioning
    aws.s3.BucketVersioningV2(
      f"{name}-backup-bucket-versioning",
      bucket=self.backup_bucket.id,
      versioning_configuration={
        "status": "Enabled"
      },
      opts=ResourceOptions(parent=self)
    )

    # Configure server-side encryption with KMS
    kms_key = aws.kms.Key(
      f"{name}-backup-kms-key",
      description=f"KMS key for {config.app_name}-{config.environment} backup bucket",
      tags={
        "Name": f"{config.app_name}-{config.environment}-backup-key",
        **config.tags
      },
      opts=ResourceOptions(parent=self)
    )

    aws.kms.Alias(
      f"{name}-backup-kms-alias",
      name=f"alias/{config.app_name}-{config.environment}-backup",
      target_key_id=kms_key.key_id,
      opts=ResourceOptions(parent=self)
    )

    aws.s3.BucketServerSideEncryptionConfigurationV2(
      f"{name}-backup-bucket-encryption",
      bucket=self.backup_bucket.id,
      rules=[{
        "apply_server_side_encryption_by_default": {
          "kms_master_key_id": kms_key.arn,
          "sse_algorithm": "aws:kms"
        },
        "bucket_key_enabled": True
      }],
      opts=ResourceOptions(parent=self)
    )

    # Block public access
    aws.s3.BucketPublicAccessBlock(
      f"{name}-backup-bucket-pab",
      bucket=self.backup_bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
      opts=ResourceOptions(parent=self)
    )

  def _create_logs_bucket(self, name: str, config: InfrastructureConfig):
    # ALB logs S3 bucket
    self.logs_bucket = aws.s3.Bucket(
      f"{name}-logs-bucket",
      tags={
        "Name": f"{config.app_name}-{config.environment}-alb-logs".lower(),
        **config.tags,
        "Purpose": "ALB Access Logs"
      },
      opts=ResourceOptions(parent=self)
    )

    # Configure server-side encryption
    aws.s3.BucketServerSideEncryptionConfigurationV2(
      f"{name}-logs-bucket-encryption",
      bucket=self.logs_bucket.id,
      rules=[{
        "apply_server_side_encryption_by_default": {
          "sse_algorithm": "AES256"
        }
      }],
      opts=ResourceOptions(parent=self)
    )

    # Block public access
    aws.s3.BucketPublicAccessBlock(
      f"{name}-logs-bucket-pab",
      bucket=self.logs_bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
      opts=ResourceOptions(parent=self)
    )

    # Configure lifecycle for log retention
    aws.s3.BucketLifecycleConfigurationV2(
      f"{name}-logs-bucket-lifecycle",
      bucket=self.logs_bucket.id,
      rules=[{
        "id": "delete_old_logs",
        "status": "Enabled",
        "expiration": {
          "days": 90
        }
      }],
      opts=ResourceOptions(parent=self)
    )

    # Bucket policy for ALB access logs
    current = aws.get_caller_identity()
    region_data = aws.get_region()

    # ELB service account IDs by region
    elb_service_accounts = {
      "us-east-1": "127311923021",
      "us-east-2": "033677994240",
      "us-west-1": "027434742980",
      "us-west-2": "797873946194",
      "eu-west-1": "156460612806",
      "eu-central-1": "054676820928"
    }

    elb_account = elb_service_accounts.get(region_data.name, "127311923021")

    aws.s3.BucketPolicy(
      f"{name}-logs-bucket-policy",
      bucket=self.logs_bucket.id,
      policy=pulumi.Output.all(self.logs_bucket.arn, current.account_id).apply(
        lambda args: json.dumps({
          "Version": "2012-10-17",
          "Statement": [{
            "Effect": "Allow",
            "Principal": {
              "AWS": f"arn:aws:iam::{elb_account}:root"
            },
            "Action": "s3:PutObject",
            "Resource": f"{args[0]}/*"
          }]
        })
      ),
      opts=ResourceOptions(parent=self)
    )
