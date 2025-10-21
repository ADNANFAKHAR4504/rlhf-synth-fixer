"""
Storage infrastructure module.

This module creates S3 buckets with lifecycle policies for backup and recovery.
"""
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class StorageStack:
    """
    Creates and manages S3 buckets with lifecycle policies for backup and recovery.
    """
    
    def __init__(self, config: InfraConfig, parent: pulumi.ComponentResource):
        """
        Initialize the storage stack.
        
        Args:
            config: Infrastructure configuration
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.parent = parent
        
        # Create backup bucket
        self.backup_bucket = self._create_backup_bucket()
    
    def _create_backup_bucket(self) -> aws.s3.Bucket:
        """
        Create S3 bucket for backups with lifecycle policies.
        Includes region in name for global uniqueness.
        
        Returns:
            S3 Bucket resource
        """
        bucket_name = self.config.get_resource_name('backup-bucket', include_region=True)
        
        bucket = aws.s3.Bucket(
            bucket_name,
            bucket=bucket_name,
            tags=self.config.get_tags_for_resource('S3Bucket', Name=bucket_name),
            opts=ResourceOptions(parent=self.parent)
        )
        
        # Enable versioning
        aws.s3.BucketVersioning(
            f"{bucket_name}-versioning",
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=ResourceOptions(parent=bucket)
        )
        
        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"{bucket_name}-public-access-block",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=bucket)
        )
        
        # Enable server-side encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            f"{bucket_name}-encryption",
            bucket=bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm='AES256'
                    ),
                    bucket_key_enabled=True
                )
            ],
            opts=ResourceOptions(parent=bucket)
        )
        
        # Add lifecycle configuration
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
                    id='expire-old-backups',
                    status='Enabled',
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=self.config.s3_expiration_days
                    )
                )
            ],
            opts=ResourceOptions(parent=bucket)
        )
        
        return bucket
    
    def get_backup_bucket_name(self) -> Output[str]:
        """Get backup bucket name."""
        return self.backup_bucket.id
    
    def get_backup_bucket_arn(self) -> Output[str]:
        """Get backup bucket ARN."""
        return self.backup_bucket.arn

