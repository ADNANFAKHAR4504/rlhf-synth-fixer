"""
S3 module for the serverless infrastructure.

This module creates S3 buckets with proper public access blocking, versioning,
and encryption, addressing the model failures about incorrect public access configuration.
"""

from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

from .config import InfrastructureConfig


class S3Stack:
    """
    S3 stack for managing static assets with proper security configuration.
    
    Creates S3 buckets with:
    - Proper public access blocking (using BucketPublicAccessBlock resource)
    - Versioning enabled
    - Server-side encryption
    - No deprecated V2 configurations
    """
    
    def __init__(self, config: InfrastructureConfig, opts: Optional[ResourceOptions] = None):
        """
        Initialize the S3 stack.
        
        Args:
            config: Infrastructure configuration
            opts: Pulumi resource options
        """
        self.config = config
        self.opts = opts or ResourceOptions()
        
        # Create main S3 bucket for static assets
        self.static_assets_bucket = self._create_static_assets_bucket()
        
        # Create bucket for Lambda deployment packages
        self.lambda_deployments_bucket = self._create_lambda_deployments_bucket()
    
    def _create_static_assets_bucket(self):
        """Create S3 bucket for static assets with proper security configuration."""
        bucket_name = f"{self.config.get_resource_name('s3-bucket', 'static-assets')}-{self.config.environment}"
        
        # Create the bucket
        bucket = aws.s3.Bucket(
            bucket_name,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        # Configure public access blocking - CORRECT way (not as bucket args)
        public_access_block = aws.s3.BucketPublicAccessBlock(
            f"{bucket_name}-public-access-block",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        # Configure versioning - using non-deprecated approach
        versioning = aws.s3.BucketVersioning(
            f"{bucket_name}-versioning",
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        # Configure server-side encryption - using non-deprecated approach
        if self.config.enable_encryption:
            encryption = aws.s3.BucketServerSideEncryptionConfiguration(
                f"{bucket_name}-encryption",
                bucket=bucket.id,
                rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )],
                opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
            )
        
        # Configure lifecycle policy for cost optimization
        lifecycle = aws.s3.BucketLifecycleConfiguration(
            f"{bucket_name}-lifecycle",
            bucket=bucket.id,
            rules=[aws.s3.BucketLifecycleConfigurationRuleArgs(
                id="delete_old_versions",
                status="Enabled",
                noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs(
                    noncurrent_days=30
                )
            )],
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        return bucket
    
    def _create_lambda_deployments_bucket(self):
        """Create S3 bucket for Lambda deployment packages."""
        bucket_name = f"{self.config.get_resource_name('s3-bucket', 'lambda-deployments')}-{self.config.environment}"
        
        # Create the bucket
        bucket = aws.s3.Bucket(
            bucket_name,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        # Configure public access blocking
        public_access_block = aws.s3.BucketPublicAccessBlock(
            f"{bucket_name}-public-access-block",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        # Configure versioning for deployment packages
        versioning = aws.s3.BucketVersioning(
            f"{bucket_name}-versioning",
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        # Configure server-side encryption
        if self.config.enable_encryption:
            encryption = aws.s3.BucketServerSideEncryptionConfiguration(
                f"{bucket_name}-encryption",
                bucket=bucket.id,
                rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )],
                opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
            )
        
        return bucket
    
    def get_static_assets_bucket_name(self) -> pulumi.Output[str]:
        """Get static assets bucket name."""
        return self.static_assets_bucket.bucket
    
    def get_static_assets_bucket_arn(self) -> pulumi.Output[str]:
        """Get static assets bucket ARN."""
        return self.static_assets_bucket.arn
    
    def get_lambda_deployments_bucket_name(self) -> pulumi.Output[str]:
        """Get Lambda deployments bucket name."""
        return self.lambda_deployments_bucket.bucket
    
    def get_lambda_deployments_bucket_arn(self) -> pulumi.Output[str]:
        """Get Lambda deployments bucket ARN."""
        return self.lambda_deployments_bucket.arn
