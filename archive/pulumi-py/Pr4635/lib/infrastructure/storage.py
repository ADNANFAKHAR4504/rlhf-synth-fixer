"""
S3 storage configuration for logs and state management.

This module creates S3 buckets with proper encryption, versioning,
and lifecycle policies. Uses non-deprecated APIs.
"""

from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .config import Config


class StorageStack:
    """
    Manages S3 buckets for logs and state storage.
    
    Uses non-deprecated S3 APIs (no V2 resources).
    All bucket names are lowercase for compatibility.
    """
    
    def __init__(self, config: Config):
        """
        Initialize storage stack.
        
        Args:
            config: Configuration object
        """
        self.config = config
        self.log_bucket = self._create_log_bucket()
        self.state_bucket = self._create_state_bucket()
    
    def _create_log_bucket(self) -> aws.s3.Bucket:
        """Create encrypted S3 bucket for log storage."""
        bucket_name = self.config.get_bucket_name('logs')
        
        # Create bucket with lowercase name
        bucket = aws.s3.Bucket(
            'logs-bucket',
            bucket=bucket_name,
            tags=self.config.get_tags({
                'Purpose': 'LogStorage',
                'Encryption': 'AES256'
            })
        )
        
        # Enable versioning (non-deprecated API)
        aws.s3.BucketVersioning(
            'logs-bucket-versioning',
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            )
        )
        
        # Server-side encryption (non-deprecated API)
        aws.s3.BucketServerSideEncryptionConfiguration(
            'logs-bucket-encryption',
            bucket=bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm='AES256'
                ),
                bucket_key_enabled=True
            )]
        )
        
        # Lifecycle configuration (non-deprecated API)
        aws.s3.BucketLifecycleConfiguration(
            'logs-bucket-lifecycle',
            bucket=bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='transition-old-logs',
                    status='Enabled',
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=30,
                            storage_class='STANDARD_IA'
                        ),
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=60,
                            storage_class='GLACIER'
                        )
                    ],
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=self.config.log_bucket_lifecycle_days
                    )
                )
            ]
        )
        
        # Block public access
        aws.s3.BucketPublicAccessBlock(
            'logs-bucket-public-access-block',
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )
        
        return bucket
    
    def _create_state_bucket(self) -> aws.s3.Bucket:
        """
        Create S3 bucket for infrastructure state storage.
        
        Includes versioning for state history and concurrency control.
        """
        bucket_name = self.config.get_bucket_name('state')
        
        # Create bucket
        bucket = aws.s3.Bucket(
            'state-bucket',
            bucket=bucket_name,
            tags=self.config.get_tags({
                'Purpose': 'StateManagement',
                'Critical': 'true'
            })
        )
        
        # Enable versioning for state history
        aws.s3.BucketVersioning(
            'state-bucket-versioning',
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            )
        )
        
        # KMS encryption for state bucket
        # Get default KMS key for S3
        aws.s3.BucketServerSideEncryptionConfiguration(
            'state-bucket-encryption',
            bucket=bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm='aws:kms'
                ),
                bucket_key_enabled=True
            )]
        )
        
        # Lifecycle for old versions
        aws.s3.BucketLifecycleConfiguration(
            'state-bucket-lifecycle',
            bucket=bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='expire-old-versions',
                    status='Enabled',
                    noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs(
                        noncurrent_days=self.config.state_retention_days
                    )
                )
            ]
        )
        
        # Block public access
        aws.s3.BucketPublicAccessBlock(
            'state-bucket-public-access-block',
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )
        
        return bucket
    
    def get_log_bucket_name(self) -> Output[str]:
        """
        Get log bucket name as Output[str].
        
        Returns:
            Bucket name as Output[str]
        """
        return self.log_bucket.bucket
    
    def get_state_bucket_name(self) -> Output[str]:
        """
        Get state bucket name as Output[str].
        
        Returns:
            Bucket name as Output[str]
        """
        return self.state_bucket.bucket
    
    def get_log_bucket_arn(self) -> Output[str]:
        """
        Get log bucket ARN.
        
        Returns:
            Bucket ARN as Output[str]
        """
        return self.log_bucket.arn
    
    def get_state_bucket_arn(self) -> Output[str]:
        """
        Get state bucket ARN.
        
        Returns:
            Bucket ARN as Output[str]
        """
        return self.state_bucket.arn

