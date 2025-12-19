"""
S3 buckets for log storage with versioning and security.

This module creates versioned S3 buckets for storing application logs with
proper encryption, access controls, and lifecycle policies.
"""

from typing import Optional

import pulumi
from pulumi import ResourceOptions
from pulumi_aws import s3

from .config import InfrastructureConfig


class S3Stack:
    """
    S3 stack for log storage with versioning and security.
    
    Creates versioned S3 buckets for storing Lambda and application logs
    with encryption, access controls, and lifecycle policies.
    """
    
    def __init__(self, config: InfrastructureConfig, opts: Optional[ResourceOptions] = None):
        """
        Initialize S3 stack with versioned buckets for log storage.
        
        Args:
            config: Infrastructure configuration
            opts: Pulumi resource options
        """
        self.config = config
        self.opts = opts or ResourceOptions()
        
        # Create S3 buckets
        self.logs_bucket = self._create_logs_bucket()
        self._create_bucket_policies()
        
    def _create_logs_bucket(self) -> s3.Bucket:
        """
        Create versioned S3 bucket for log storage.
        
        Returns:
            S3 bucket for log storage
        """
        bucket_name = self.config.get_resource_name('logs')
        
        # Create the bucket (without deprecated configurations)
        bucket = s3.Bucket(
            bucket_name,
            bucket=bucket_name,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        return bucket
    
    def _create_bucket_policies(self) -> None:
        """
        Create bucket policies and configurations for secure access.
        """
        # Enable versioning using latest resource
        s3.BucketVersioning(
            f"{self.config.get_resource_name('logs')}-versioning",
            bucket=self.logs_bucket.id,
            versioning_configuration=s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self.logs_bucket)
        )
        
        # Enable server-side encryption using latest resource
        s3.BucketServerSideEncryptionConfiguration(
            f"{self.config.get_resource_name('logs')}-encryption",
            bucket=self.logs_bucket.id,
            rules=[s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                )
            )],
            opts=ResourceOptions(parent=self.logs_bucket)
        )
        
        # Configure lifecycle using latest resource
        s3.BucketLifecycleConfiguration(
            f"{self.config.get_resource_name('logs')}-lifecycle",
            bucket=self.logs_bucket.id,
            rules=[s3.BucketLifecycleConfigurationRuleArgs(
                id="log_retention",
                status="Enabled",
                expiration=s3.BucketLifecycleConfigurationRuleExpirationArgs(
                    days=self.config.s3_log_retention_days
                ),
                noncurrent_version_expiration=s3.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs(
                    noncurrent_days=30
                )
            )],
            opts=ResourceOptions(parent=self.logs_bucket)
        )
        
        # Deny public access policy
        s3.BucketPublicAccessBlock(
            f"{self.config.get_resource_name('logs')}-public-access-block",
            bucket=self.logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self.logs_bucket)
        )
        
        # Bucket policy for CloudWatch Logs export
        bucket_policy = s3.BucketPolicy(
            f"{self.config.get_resource_name('logs')}-policy",
            bucket=self.logs_bucket.id,
            policy=pulumi.Output.all(
                bucket_arn=self.logs_bucket.arn
            ).apply(lambda args: {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AllowCloudWatchLogsExport",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "logs.amazonaws.com"
                        },
                        "Action": [
                            "s3:GetBucketAcl",
                            "s3:GetBucketLocation"
                        ],
                        "Resource": args["bucket_arn"]
                    },
                    {
                        "Sid": "AllowCloudWatchLogsPutObject",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "logs.amazonaws.com"
                        },
                        "Action": "s3:PutObject",
                        "Resource": f"{args['bucket_arn']}/*",
                        "Condition": {
                            "StringEquals": {
                                "s3:x-amz-acl": "bucket-owner-full-control"
                            }
                        }
                    }
                ]
            }),
            opts=ResourceOptions(parent=self.logs_bucket)
        )
    
    def get_logs_bucket_name(self) -> pulumi.Output[str]:
        """
        Get the name of the logs bucket.
        
        Returns:
            Name of the logs bucket
        """
        return self.logs_bucket.bucket
    
    def get_logs_bucket_arn(self) -> pulumi.Output[str]:
        """
        Get the ARN of the logs bucket.
        
        Returns:
            ARN of the logs bucket
        """
        return self.logs_bucket.arn
    
    def get_logs_bucket_domain_name(self) -> pulumi.Output[str]:
        """
        Get the domain name of the logs bucket.
        
        Returns:
            Domain name of the logs bucket
        """
        return self.logs_bucket.bucket_domain_name
