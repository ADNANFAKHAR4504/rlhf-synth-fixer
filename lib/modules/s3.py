"""S3 module for secure centralized logging storage."""
import pulumi
import pulumi_aws as aws
import os
import json


class S3Manager:
  """Manages S3 buckets for secure log storage."""

  def __init__(
          self,
          project_name: str,
          environment: str,
          kms_key: aws.kms.Key):
    self.project_name = project_name
    self.environment = environment
    self.kms_key = kms_key
    self.account_id = os.getenv('AWS_ACCOUNT_ID')

  def create_logging_bucket(self) -> aws.s3.Bucket:
    """Create secure S3 bucket for centralized logging."""

    bucket_name = f"{self.project_name}-secure-logs-{self.account_id}"

    # Create the bucket
    logging_bucket = aws.s3.Bucket(
        f"{self.project_name}-logging-bucket",
        bucket=bucket_name,
        tags={
            "Name": bucket_name,
            "Environment": self.environment,
            "Purpose": "centralized-logging",
            "ManagedBy": "pulumi"
        }
    )

    # Enable versioning
    aws.s3.BucketVersioningV2(
        f"{self.project_name}-logging-bucket-versioning",
        bucket=logging_bucket.id,
        versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
            status="Enabled",
            mfa_delete="Disabled"  # Set to "Enabled" if MFA delete is required
        )
    )

    # Configure server-side encryption
    aws.s3.BucketServerSideEncryptionConfigurationV2(
        f"{
            self.project_name}-logging-bucket-encryption",
        bucket=logging_bucket.id,
        rules=[
            aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=self.kms_key.arn),
                bucket_key_enabled=True)])

    # Block all public access
    aws.s3.BucketPublicAccessBlock(
        f"{self.project_name}-logging-bucket-pab",
        bucket=logging_bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True
    )

    # Configure lifecycle policy
    retention_days = int(os.getenv('LOG_RETENTION_DAYS', '90'))

    aws.s3.BucketLifecycleConfigurationV2(
        f"{
            self.project_name}-logging-bucket-lifecycle",
        bucket=logging_bucket.id,
        rules=[
            aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                id="log-retention-policy",
                status="Enabled",
                expiration=aws.s3.BucketLifecycleConfigurationV2RuleExpirationArgs(
                    days=retention_days),
                noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionExpirationArgs(
                    noncurrent_days=30))])

    # Bucket policy for secure access
    bucket_policy = pulumi.Output.all(logging_bucket.arn, self.kms_key.arn).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "DenyUnSecureCommunications",
                    "Effect": "Deny",
                    "Principal": "*",
                    "Action": "s3:*",
                    "Resource": [
                        args[0],
                        f"{args[0]}/*"
                    ],
                    "Condition": {
                        "Bool": {
                            "aws:SecureTransport": "false"
                        }
                    }
                },
                {
                    "Sid": "AllowCloudTrailPuts",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "cloudtrail.amazonaws.com"
                    },
                    "Action": "s3:PutObject",
                    "Resource": f"{args[0]}/*",
                    "Condition": {
                        "StringEquals": {
                            "s3:x-amz-acl": "bucket-owner-full-control"
                        }
                    }
                },
                {
                    "Sid": "AllowCloudTrailAclCheck",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "cloudtrail.amazonaws.com"
                    },
                    "Action": "s3:GetBucketAcl",
                    "Resource": args[0]
                }
            ]
        })
    )

    aws.s3.BucketPolicy(
        f"{self.project_name}-logging-bucket-policy",
        bucket=logging_bucket.id,
        policy=bucket_policy
    )

    return logging_bucket
