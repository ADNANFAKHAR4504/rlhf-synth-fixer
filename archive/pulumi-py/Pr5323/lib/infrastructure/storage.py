"""
Storage infrastructure module.

This module creates S3 buckets with versioning, encryption,
and lifecycle policies for secure and cost-effective storage.
"""

import pulumi
import pulumi_aws as aws
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class StorageStack:
    """
    Creates and manages S3 buckets with security and lifecycle policies.
    """
    
    def __init__(
        self,
        config: InfraConfig,
        provider_manager: AWSProviderManager,
        parent: pulumi.ComponentResource
    ):
        """
        Initialize the storage stack.
        
        Args:
            config: Infrastructure configuration
            provider_manager: AWS provider manager
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.parent = parent
        
        # Create S3 buckets
        self.logs_bucket = self._create_logs_bucket()
        self.data_bucket = self._create_data_bucket()
    
    def _create_logs_bucket(self) -> aws.s3.Bucket:
        """
        Create S3 bucket for logs with versioning and encryption.
        
        Returns:
            S3 Bucket
        """
        bucket_name = self.config.get_resource_name('logs-bucket')
        
        bucket = aws.s3.Bucket(
            bucket_name,
            bucket=bucket_name,
            tags={
                **self.config.get_tags_for_resource('S3-Bucket'),
                'Name': bucket_name,
                'Purpose': 'Logs'
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.parent
            )
        )
        
        # Enable versioning
        aws.s3.BucketVersioning(
            f"{bucket_name}-versioning",
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=bucket
            )
        )
        
        # Enable server-side encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            f"{bucket_name}-encryption",
            bucket=bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=(
                    aws.s3.
                    BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm='AES256'
                    )
                )
            )],
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=bucket
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
                provider=self.provider_manager.get_provider(),
                parent=bucket
            )
        )
        
        # Configure lifecycle policy
        aws.s3.BucketLifecycleConfiguration(
            f"{bucket_name}-lifecycle",
            bucket=bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='transition-to-ia',
                    status='Enabled',
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=self.config.s3_transition_to_ia_days,
                            storage_class='STANDARD_IA'
                        )
                    ]
                ),
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='transition-to-glacier',
                    status='Enabled',
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=self.config.s3_transition_to_glacier_days,
                            storage_class='GLACIER'
                        )
                    ]
                ),
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='expire-old-versions',
                    status='Enabled',
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=self.config.s3_expiration_days
                    )
                )
            ],
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=bucket
            )
        )
        
        return bucket
    
    def _create_data_bucket(self) -> aws.s3.Bucket:
        """
        Create S3 bucket for data with versioning and encryption.
        
        Returns:
            S3 Bucket
        """
        bucket_name = self.config.get_resource_name('data-bucket')
        
        bucket = aws.s3.Bucket(
            bucket_name,
            bucket=bucket_name,
            tags={
                **self.config.get_tags_for_resource('S3-Bucket'),
                'Name': bucket_name,
                'Purpose': 'Data'
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.parent
            )
        )
        
        # Enable versioning
        aws.s3.BucketVersioning(
            f"{bucket_name}-versioning",
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=bucket
            )
        )
        
        # Enable server-side encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            f"{bucket_name}-encryption",
            bucket=bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=(
                    aws.s3.
                    BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm='AES256'
                    )
                )
            )],
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=bucket
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
                provider=self.provider_manager.get_provider(),
                parent=bucket
            )
        )
        
        return bucket
    
    # Getter methods
    
    def get_logs_bucket_name(self) -> Output[str]:
        """Get logs bucket name."""
        return self.logs_bucket.id
    
    def get_logs_bucket_arn(self) -> Output[str]:
        """Get logs bucket ARN."""
        return self.logs_bucket.arn
    
    def get_data_bucket_name(self) -> Output[str]:
        """Get data bucket name."""
        return self.data_bucket.id
    
    def get_data_bucket_arn(self) -> Output[str]:
        """Get data bucket ARN."""
        return self.data_bucket.arn
