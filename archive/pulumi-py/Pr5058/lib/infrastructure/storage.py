"""
S3 bucket management for serverless application.

This module creates S3 buckets with proper security configuration
including encryption, versioning, and public access blocking.
"""

import pulumi
import pulumi_aws as aws

from .config import ServerlessConfig


class StorageStack(pulumi.ComponentResource):
    """
    Manages S3 buckets for the serverless application.
    
    Creates buckets with:
    - Server-side encryption (AES256)
    - Versioning
    - Lifecycle policies
    - Public access blocking
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider: aws.Provider,
        parent: pulumi.Resource = None
    ):
        """
        Initialize storage stack.
        
        Args:
            config: ServerlessConfig instance
            provider: AWS provider instance
            parent: Parent Pulumi resource
        """
        super().__init__(
            "serverless:storage:StorageStack",
            config.get_resource_name("storage"),
            None,
            pulumi.ResourceOptions(parent=parent, provider=provider)
        )
        
        self.config = config
        self.provider = provider
        
        # Create files bucket
        self.files_bucket = self._create_files_bucket()
        
        # Configure bucket settings
        self._configure_bucket_encryption()
        self._configure_bucket_versioning()
        self._configure_bucket_lifecycle()
        self._configure_public_access_block()
        
        self.register_outputs({
            "files_bucket_name": self.files_bucket.id,
            "files_bucket_arn": self.files_bucket.arn,
        })
    
    def _create_files_bucket(self) -> aws.s3.Bucket:
        """
        Create the main files bucket.
        
        Returns:
            S3 Bucket resource
        """
        bucket_name = self.config.get_s3_bucket_name("files")
        
        return aws.s3.Bucket(
            resource_name=bucket_name,
            bucket=bucket_name,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )
    
    def _configure_bucket_encryption(self) -> None:
        """Configure server-side encryption for the bucket."""
        aws.s3.BucketServerSideEncryptionConfiguration(
            resource_name=f"{self.files_bucket._name}-encryption",
            bucket=self.files_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    ),
                    bucket_key_enabled=True,
                )
            ],
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )
    
    def _configure_bucket_versioning(self) -> None:
        """Configure versioning for the bucket."""
        if self.config.s3_versioning_enabled:
            aws.s3.BucketVersioning(
                resource_name=f"{self.files_bucket._name}-versioning",
                bucket=self.files_bucket.id,
                versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                    status="Enabled"
                ),
                opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
            )
    
    def _configure_bucket_lifecycle(self) -> None:
        """Configure lifecycle policy for the bucket."""
        aws.s3.BucketLifecycleConfiguration(
            resource_name=f"{self.files_bucket._name}-lifecycle",
            bucket=self.files_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id="transition-to-ia",
                    status="Enabled",
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=self.config.s3_lifecycle_days,
                            storage_class="STANDARD_IA"
                        )
                    ]
                )
            ],
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )
    
    def _configure_public_access_block(self) -> None:
        """Block all public access to the bucket."""
        aws.s3.BucketPublicAccessBlock(
            resource_name=f"{self.files_bucket._name}-public-access-block",
            bucket=self.files_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

