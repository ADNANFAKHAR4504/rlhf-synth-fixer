"""
S3 storage module for the serverless backend.

This module creates S3 buckets with proper encryption, public access blocking,
and versioning configuration. It uses non-deprecated S3 resource types.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig


class StorageStack:
    """
    Manages S3 buckets for static file storage.
    
    Creates buckets with:
    - Server-side encryption (SSE-S3 or SSE-KMS)
    - Public access block
    - Optional versioning
    - Proper naming with environment suffix
    """
    
    def __init__(self, config: ServerlessConfig, provider_manager: AWSProviderManager):
        """
        Initialize the storage stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.buckets: Dict[str, aws.s3.Bucket] = {}
        
        # Create buckets
        self._create_static_bucket()
        self._create_uploads_bucket()
    
    def _create_static_bucket(self):
        """Create S3 bucket for static files."""
        bucket_name = self.config.get_normalized_resource_name('s3-static')
        
        # Create bucket
        bucket = aws.s3.Bucket(
            "static-bucket",
            bucket=bucket_name,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        # Block public access
        aws.s3.BucketPublicAccessBlock(
            "static-bucket-public-access-block",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        # Enable server-side encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            "static-bucket-encryption",
            bucket=bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm=self.config.s3_encryption_algorithm
                    ),
                    bucket_key_enabled=True
                )
            ],
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        # Enable versioning if configured
        if self.config.enable_s3_versioning:
            aws.s3.BucketVersioning(
                "static-bucket-versioning",
                bucket=bucket.id,
                versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                    status="Enabled"
                ),
                opts=pulumi.ResourceOptions(
                    provider=self.provider_manager.get_provider()
                )
            )
        
        self.buckets['static'] = bucket
    
    def _create_uploads_bucket(self):
        """Create S3 bucket for user uploads."""
        bucket_name = self.config.get_normalized_resource_name('s3-uploads')
        
        # Create bucket
        bucket = aws.s3.Bucket(
            "uploads-bucket",
            bucket=bucket_name,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        # Block public access
        aws.s3.BucketPublicAccessBlock(
            "uploads-bucket-public-access-block",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        # Enable server-side encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            "uploads-bucket-encryption",
            bucket=bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm=self.config.s3_encryption_algorithm
                    ),
                    bucket_key_enabled=True
                )
            ],
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        # Enable versioning if configured
        if self.config.enable_s3_versioning:
            aws.s3.BucketVersioning(
                "uploads-bucket-versioning",
                bucket=bucket.id,
                versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                    status="Enabled"
                ),
                opts=pulumi.ResourceOptions(
                    provider=self.provider_manager.get_provider()
                )
            )
        
        self.buckets['uploads'] = bucket
    
    def get_bucket(self, bucket_name: str) -> aws.s3.Bucket:
        """
        Get a bucket by name.
        
        Args:
            bucket_name: Bucket name ('static' or 'uploads')
            
        Returns:
            S3 Bucket resource
        """
        return self.buckets[bucket_name]
    
    def get_bucket_name(self, bucket_name: str) -> Output[str]:
        """
        Get the actual bucket name.
        
        Args:
            bucket_name: Bucket name ('static' or 'uploads')
            
        Returns:
            Bucket name as Output
        """
        return self.buckets[bucket_name].bucket
    
    def get_bucket_arn(self, bucket_name: str) -> Output[str]:
        """
        Get the bucket ARN.
        
        Args:
            bucket_name: Bucket name ('static' or 'uploads')
            
        Returns:
            Bucket ARN as Output
        """
        return self.buckets[bucket_name].arn


