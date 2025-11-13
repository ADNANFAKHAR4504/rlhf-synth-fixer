"""
Storage module for S3 bucket management.

This module creates S3 buckets for storing processed data with proper
encryption, versioning, lifecycle policies, and public access blocking.
"""

from typing import Dict

import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import ServerlessProcessorConfig
from .kms import KMSStack


class StorageStack:
    """
    Manages S3 buckets for the serverless processor.
    
    Creates S3 buckets with KMS encryption, versioning, lifecycle policies,
    and public access blocking for storing processed data.
    """
    
    def __init__(
        self,
        config: ServerlessProcessorConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the storage stack.
        
        Args:
            config: ServerlessProcessorConfig instance
            provider_manager: AWSProviderManager instance
            kms_stack: KMSStack instance for encryption
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.buckets: Dict[str, aws.s3.Bucket] = {}
        
        self._create_buckets()
    
    def _create_buckets(self):
        """Create S3 buckets."""
        self._create_processed_data_bucket()
    
    def _create_processed_data_bucket(self):
        """Create S3 bucket for storing processed data."""
        bucket_name = self.config.get_normalized_resource_name('processed-data')
        
        bucket = aws.s3.Bucket(
            'processed-data-bucket',
            bucket=bucket_name,
            tags={
                **self.config.get_common_tags(),
                'Name': bucket_name,
                'Purpose': 'Processed Data Storage'
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                protect=True,
                retain_on_delete=self.config.s3_retain_on_delete
            )
        )
        
        aws.s3.BucketVersioning(
            'processed-data-versioning',
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=self.provider_manager.get_resource_options()
        )
        
        aws.s3.BucketServerSideEncryptionConfiguration(
            'processed-data-encryption',
            bucket=bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm='aws:kms',
                    kms_master_key_id=self.kms_stack.get_key_arn('s3')
                ),
                bucket_key_enabled=True
            )],
            opts=self.provider_manager.get_resource_options()
        )
        
        aws.s3.BucketPublicAccessBlock(
            'processed-data-public-access-block',
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=self.provider_manager.get_resource_options()
        )
        
        aws.s3.BucketLifecycleConfiguration(
            'processed-data-lifecycle',
            bucket=bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='transition-to-glacier',
                    status='Enabled',
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=self.config.s3_lifecycle_glacier_days,
                            storage_class='GLACIER'
                        )
                    ]
                ),
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='expire-old-data',
                    status='Enabled',
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=self.config.s3_lifecycle_expiration_days
                    )
                ),
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='cleanup-incomplete-uploads',
                    status='Enabled',
                    abort_incomplete_multipart_upload=aws.s3.BucketLifecycleConfigurationRuleAbortIncompleteMultipartUploadArgs(
                        days_after_initiation=7
                    )
                )
            ],
            opts=self.provider_manager.get_resource_options()
        )
        
        self.buckets['processed-data'] = bucket
    
    def get_bucket_name(self, bucket_key: str) -> Output[str]:
        """
        Get S3 bucket name.
        
        Args:
            bucket_key: Key identifying the bucket (e.g., 'processed-data')
            
        Returns:
            Bucket name as Output
        """
        return self.buckets[bucket_key].bucket
    
    def get_bucket_arn(self, bucket_key: str) -> Output[str]:
        """
        Get S3 bucket ARN.
        
        Args:
            bucket_key: Key identifying the bucket (e.g., 'processed-data')
            
        Returns:
            Bucket ARN as Output
        """
        return self.buckets[bucket_key].arn
    
    def get_bucket_id(self, bucket_key: str) -> Output[str]:
        """
        Get S3 bucket ID.
        
        Args:
            bucket_key: Key identifying the bucket (e.g., 'processed-data')
            
        Returns:
            Bucket ID as Output
        """
        return self.buckets[bucket_key].id

