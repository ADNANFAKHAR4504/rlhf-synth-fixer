"""
storage.py

Storage module for S3 bucket configuration.
Addresses model failures: S3 bucket parameter misuse, encryption requirements.
"""

import json

import pulumi
import pulumi_aws as aws

from .config import config


def create_logs_bucket(bucket_name: str):
    """
    Create an S3 bucket for storing Lambda logs with proper encryption and configuration.
    Addresses model failure: S3 bucket parameter misuse.
    """
    
    # Create S3 bucket
    bucket = aws.s3.Bucket(
        bucket_name,
        bucket=bucket_name,  # Explicitly set bucket name to avoid parameter misuse
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )
    
    # Separate versioning resource
    versioning = aws.s3.BucketVersioning(
        f"{bucket_name}-versioning",
        bucket=bucket.id,
        versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
            status="Enabled"
        ),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )
    
    # Separate encryption resource
    encryption = aws.s3.BucketServerSideEncryptionConfiguration(
        f"{bucket_name}-encryption",
        bucket=bucket.id,
        rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256"
            ),
            bucket_key_enabled=True
        )],
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )
    
    # Note: Modern S3 buckets don't support ACLs, so we skip ACL configuration

    # Create public access block for the bucket
    public_access_block = aws.s3.BucketPublicAccessBlock(
        f"{bucket_name}-public-access-block",
        bucket=bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True,
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Create bucket policy to enforce encryption and restrict access
    bucket_policy = aws.s3.BucketPolicy(
        f"{bucket_name}-policy",
        bucket=bucket.id,
        policy=pulumi.Output.all(bucket.arn, bucket.id).apply(
            lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "DenyInsecureConnections",
                        "Effect": "Deny",
                        "Principal": "*",
                        "Action": "s3:*",
                        "Resource": [args[0], args[0] + "/*"],
                        "Condition": {
                            "Bool": {
                                "aws:SecureTransport": "false"
                            }
                        }
                    },
                    {
                        "Sid": "DenyUnencryptedObjectUploads",
                        "Effect": "Deny",
                        "Principal": "*",
                        "Action": "s3:PutObject",
                        "Resource": args[0] + "/*",
                        "Condition": {
                            "StringNotEquals": {
                                "s3:x-amz-server-side-encryption": "AES256"
                            }
                        }
                    },
                ]
            })
        ),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Create lifecycle configuration for log retention
    lifecycle_configuration = aws.s3.BucketLifecycleConfiguration(
        f"{bucket_name}-lifecycle",
        bucket=bucket.id,
        rules=[aws.s3.BucketLifecycleConfigurationRuleArgs(
            id="log_retention",
            status="Enabled",
            expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                days=config.log_retention_days
            ),
            noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs(
                noncurrent_days=7
            )
        )],
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    return bucket, versioning, encryption


def create_cloudformation_logs_bucket():
    """
    Create S3 bucket for centralized CloudFormation logs.
    Addresses model failure: Centralized CloudFormation logs missing.
    """
    
    # Ensure bucket name is lowercase and valid for S3
    stack_name = pulumi.get_stack()[:6].lower().replace('_', '-')
    # Add timestamp suffix to ensure uniqueness
    import time
    timestamp = str(int(time.time()))[-6:]  # Last 6 digits of timestamp
    bucket_name = f"cf-{stack_name}-{config.aws_region}-{timestamp}"
    
    bucket = aws.s3.Bucket(
        f"cloudformation-logs-bucket",
        bucket=bucket_name,
        tags={
            **config.get_tags(),
            "Purpose": "CloudFormation-Logs"
        },
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )
    
    # Separate versioning resource for CloudFormation bucket
    cfn_versioning = aws.s3.BucketVersioning(
        f"cloudformation-logs-versioning",
        bucket=bucket.id,
        versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
            status="Enabled"
        ),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )
    
    # Separate encryption resource for CloudFormation bucket
    cfn_encryption = aws.s3.BucketServerSideEncryptionConfiguration(
        f"cloudformation-logs-encryption",
        bucket=bucket.id,
        rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256"
            ),
            bucket_key_enabled=True
        )],
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )
    
    # Note: Modern S3 buckets don't support ACLs, so we skip ACL configuration

    # Create public access block for CloudFormation bucket
    cfn_public_access_block = aws.s3.BucketPublicAccessBlock(
        f"cloudformation-logs-public-access-block",
        bucket=bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True,
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Create bucket policy for CloudFormation access
    bucket_policy = aws.s3.BucketPolicy(
        f"cloudformation-logs-policy",
        bucket=bucket.id,
        policy=pulumi.Output.all(bucket.arn, bucket.id).apply(
            lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "DenyInsecureConnections",
                        "Effect": "Deny",
                        "Principal": "*",
                        "Action": "s3:*",
                        "Resource": [args[0], args[0] + "/*"],
                        "Condition": {
                            "Bool": {
                                "aws:SecureTransport": "false"
                            }
                        }
                    },
                    {
                        "Sid": "AllowCloudFormationAccess",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "cloudformation.amazonaws.com"
                        },
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject"
                        ],
                        "Resource": args[0] + "/*"
                    },
                ]
            })
        ),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    return bucket, cfn_versioning, cfn_encryption
