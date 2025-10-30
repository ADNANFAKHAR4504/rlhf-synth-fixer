"""
Storage module for S3 bucket management.

This module creates S3 buckets with server-side encryption, versioning,
and lifecycle policies using current (non-deprecated) APIs.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import ServerlessConfig


class StorageStack:
    """
    Manages S3 buckets for file storage with encryption and lifecycle policies.
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider: aws.Provider,
        parent: pulumi.Resource
    ):
        """
        Initialize storage stack.
        
        Args:
            config: Serverless configuration
            provider: AWS provider instance
            parent: Parent resource for dependency management
        """
        self.config = config
        self.provider = provider
        self.parent = parent
        
        # Create S3 bucket for file processing
        self.bucket = self._create_bucket()
        self._configure_bucket_encryption()
        if self.config.enable_versioning:
            self._configure_bucket_versioning()
        self._configure_lifecycle_policy()
    
    def _create_bucket(self) -> aws.s3.Bucket:
        """
        Create S3 bucket with proper naming.
        
        Returns:
            S3 Bucket resource
        """
        bucket_name = self.config.get_s3_bucket_name('files')
        
        bucket = aws.s3.Bucket(
            bucket_name,
            bucket=bucket_name,
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent,
                protect=True  # Prevent accidental deletion
            )
        )
        
        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"{bucket_name}-public-access-block",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent
            )
        )
        
        return bucket
    
    def _configure_bucket_encryption(self):
        """Configure server-side encryption with AWS managed keys."""
        bucket_name = self.config.get_s3_bucket_name('files')
        
        aws.s3.BucketServerSideEncryptionConfiguration(
            f"{bucket_name}-encryption",
            bucket=self.bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                ),
                bucket_key_enabled=True
            )],
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent
            )
        )
    
    def _configure_bucket_versioning(self):
        """Configure bucket versioning for data protection."""
        bucket_name = self.config.get_s3_bucket_name('files')
        
        aws.s3.BucketVersioning(
            f"{bucket_name}-versioning",
            bucket=self.bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent
            )
        )
    
    def _configure_lifecycle_policy(self):
        """Configure lifecycle policy to transition objects to cheaper storage."""
        bucket_name = self.config.get_s3_bucket_name('files')
        
        aws.s3.BucketLifecycleConfiguration(
            f"{bucket_name}-lifecycle",
            bucket=self.bucket.id,
            rules=[aws.s3.BucketLifecycleConfigurationRuleArgs(
                id="transition-to-ia",
                status="Enabled",
                transitions=[aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                    days=self.config.lifecycle_transition_days,
                    storage_class="STANDARD_IA"
                )]
            )],
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent
            )
        )
    
    def get_bucket_name(self) -> Output[str]:
        """
        Get bucket name.
        
        Returns:
            Bucket name as Output
        """
        return self.bucket.id
    
    def get_bucket_arn(self) -> Output[str]:
        """
        Get bucket ARN.
        
        Returns:
            Bucket ARN as Output
        """
        return self.bucket.arn
    
    def get_bucket(self) -> aws.s3.Bucket:
        """
        Get bucket resource.
        
        Returns:
            S3 Bucket resource
        """
        return self.bucket

