"""
S3 Storage module for data buckets.

This module creates S3 buckets with versioning, lifecycle policies, encryption,
and proper naming to avoid duplication issues.
"""

from typing import Dict

import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import MultiEnvConfig


class StorageStack:
    """
    Manages S3 buckets for the multi-environment infrastructure.
    
    Creates buckets with:
    - Environment-specific naming (normalized for case sensitivity)
    - Versioning enabled
    - Consistent lifecycle policies
    - Server-side encryption (SSE-S3)
    - Public access blocked
    """
    
    def __init__(self, config: MultiEnvConfig, provider_manager: AWSProviderManager):
        """
        Initialize the storage stack.
        
        Args:
            config: MultiEnvConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.buckets: Dict[str, aws.s3.Bucket] = {}
        
        self._create_data_bucket()
    
    def _create_data_bucket(self) -> None:
        """Create the data bucket with proper configuration."""
        bucket_name = self.config.get_normalized_resource_name('data')
        
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        self.buckets['data'] = aws.s3.Bucket(
            f"{bucket_name}-bucket",
            bucket=bucket_name,
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        aws.s3.BucketVersioning(
            f"{bucket_name}-versioning",
            bucket=self.buckets['data'].id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled' if self.config.s3_versioning_enabled else 'Suspended'
            ),
            opts=opts
        )
        
        aws.s3.BucketServerSideEncryptionConfiguration(
            f"{bucket_name}-encryption",
            bucket=self.buckets['data'].id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm=self.config.s3_encryption_algorithm
                )
            )],
            opts=opts
        )
        
        aws.s3.BucketLifecycleConfiguration(
            f"{bucket_name}-lifecycle",
            bucket=self.buckets['data'].id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id=rule['id'],
                    status=rule['status'],
                    noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs(
                        noncurrent_days=rule['noncurrent_version_expiration']['noncurrent_days']
                    ),
                    abort_incomplete_multipart_upload=aws.s3.BucketLifecycleConfigurationRuleAbortIncompleteMultipartUploadArgs(
                        days_after_initiation=rule['abort_incomplete_multipart_upload']['days_after_initiation']
                    )
                )
                for rule in self.config.s3_lifecycle_rules
            ],
            opts=opts
        )
        
        aws.s3.BucketPublicAccessBlock(
            f"{bucket_name}-public-access-block",
            bucket=self.buckets['data'].id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=opts
        )
        
        aws.s3.BucketNotification(
            f"{bucket_name}-notification",
            bucket=self.buckets['data'].id,
            eventbridge=True,
            opts=opts
        )
    
    def get_bucket(self, name: str = 'data') -> aws.s3.Bucket:
        """
        Get bucket by name.
        
        Args:
            name: Bucket name (default: 'data')
        
        Returns:
            S3 Bucket resource
        """
        return self.buckets.get(name)
    
    def get_bucket_name(self, name: str = 'data') -> Output[str]:
        """
        Get bucket name by name.
        
        Args:
            name: Bucket name (default: 'data')
        
        Returns:
            Bucket name as Output[str]
        """
        bucket = self.get_bucket(name)
        return bucket.bucket if bucket else None
    
    def get_bucket_arn(self, name: str = 'data') -> Output[str]:
        """
        Get bucket ARN by name.
        
        Args:
            name: Bucket name (default: 'data')
        
        Returns:
            Bucket ARN as Output[str]
        """
        bucket = self.get_bucket(name)
        return bucket.arn if bucket else None

