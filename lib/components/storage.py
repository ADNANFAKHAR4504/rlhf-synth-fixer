"""
Storage Component - Creates S3 buckets with encryption and security best practices
"""

import json
import pulumi
import pulumi_aws as aws


class StorageComponent(pulumi.ComponentResource):
  def __init__(self, name: str, environment: str, tags: dict, opts=None):
    super().__init__("custom:aws:Storage", name, None, opts)

    # S3 Bucket for application data
    self.bucket = aws.s3.Bucket(
        f"{name}-app-bucket",
        bucket=f"appdatarlhfturing",
        tags={**tags, "Name": f"rlhfappbucketturing"},
        opts=pulumi.ResourceOptions(parent=self),
    )

    # S3 Bucket Versioning
    self.bucket_versioning = aws.s3.BucketVersioningV2(
        f"{name}-bucket-versioning",
        bucket=self.bucket.id,
        versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
            status="Enabled"
        ),
        opts=pulumi.ResourceOptions(parent=self),
    )

    # S3 Bucket Server-Side Encryption
    self.bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
        f"{name}-bucket-encryption",
        bucket=self.bucket.id,
        rules=[  # ✅ pass rules directly, no extra nested arg class
            aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                ),
                bucket_key_enabled=True,
            )
        ],
        opts=pulumi.ResourceOptions(parent=self),
    )

    # S3 Bucket Public Access Block
    self.bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
        f"{name}-bucket-pab",
        bucket=self.bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True,
        opts=pulumi.ResourceOptions(parent=self),
    )

    # S3 Bucket Policy for secure access
    self.bucket_policy = aws.s3.BucketPolicy(
        f"{name}-bucket-policy",
        bucket=self.bucket.id,
        policy=self.bucket.arn.apply(
            lambda arn: json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "DenyInsecureConnections",
                            "Effect": "Deny",
                            "Principal": "*",
                            "Action": "s3:*",
                            "Resource": [arn, f"{arn}/*"],
                            "Condition": {"Bool": {"aws:SecureTransport": "false"}},
                        }
                    ],
                }
            )
        ),
        opts=pulumi.ResourceOptions(
            parent=self, depends_on=[self.bucket_public_access_block]
        ),
    )

    # S3 Bucket Lifecycle Configuration
    self.bucket_lifecycle = aws.s3.BucketLifecycleConfigurationV2(
        f"{name}-bucket-lifecycle",
        bucket=self.bucket.id,
        rules=[
            aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                id="transition_to_ia",
                status="Enabled",
                transitions=[
                    aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
                        days=30, storage_class="STANDARD_IA"
                    ),
                    aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
                        days=90, storage_class="GLACIER"
                    ),
                ],
            ),
            aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                id="delete_old_versions",
                status="Enabled",
                noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionExpirationArgs(
                    noncurrent_days=365
                ),
            ),
        ],
        opts=pulumi.ResourceOptions(parent=self),
    )

    # Create Systems Manager Parameters for configuration
    self.ssm_parameter_db_config = aws.ssm.Parameter(
        f"{name}-db-config",
        name=f"/{environment}/database/config",
        type="String",
        value=json.dumps(
            {
                "read_capacity": 5 if environment in ["dev", "test"] else 10,
                "write_capacity": 5 if environment in ["dev", "test"] else 10,
                "backup_retention_days": 7
                if environment in ["dev", "test"]
                else 30,
            }
        ),
        description=f"Database configuration for {environment}",
        tags={**tags, "Name": f"{environment}-db-config"},
        opts=pulumi.ResourceOptions(parent=self),
    )

    self.ssm_parameter_app_config = aws.ssm.Parameter(
        f"{name}-app-config",
        name=f"/{environment}/application/config",
        type="String",
        value=json.dumps(
            {
                "log_level": "DEBUG" if environment in ["dev", "test"] else "INFO",
                "cache_ttl": 300,
                "max_connections": 10 if environment in ["dev", "test"] else 50,
            }
        ),
        description=f"Application configuration for {environment}",
        tags={**tags, "Name": f"{environment}-app-config"},
        opts=pulumi.ResourceOptions(parent=self),
    )

    self.register_outputs(
        {
            "bucket_name": self.bucket.bucket,
            "bucket_arn": self.bucket.arn,
            "db_config_parameter": self.ssm_parameter_db_config.name,
            "app_config_parameter": self.ssm_parameter_app_config.name,
        }
    )
