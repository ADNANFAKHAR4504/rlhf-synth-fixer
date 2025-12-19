"""
S3 module for managing storage buckets.

This module creates S3 buckets with KMS encryption, versioning,
lifecycle policies, and public access blocks.
"""

from typing import Dict

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionConfig
from .kms import KMSStack


class S3Stack:
    """Manages S3 buckets for log storage and exports."""
    
    def __init__(
        self,
        config: TransactionConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the S3 stack.
        
        Args:
            config: TransactionConfig instance
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
        self._create_logs_bucket()
    
    def _create_logs_bucket(self):
        """Create S3 bucket for CloudWatch log exports with Glacier lifecycle."""
        bucket_name = self.config.get_normalized_resource_name('logs-bucket')
        
        bucket = aws.s3.Bucket(
            'logs-bucket',
            bucket=bucket_name,
            tags={
                **self.config.get_common_tags(),
                'Name': bucket_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        aws.s3.BucketVersioning(
            'logs-bucket-versioning',
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=self.provider_manager.get_resource_options()
        )
        
        aws.s3.BucketServerSideEncryptionConfiguration(
            'logs-bucket-encryption',
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
            'logs-bucket-public-access-block',
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=self.provider_manager.get_resource_options()
        )
        
        aws.s3.BucketLifecycleConfiguration(
            'logs-bucket-lifecycle',
            bucket=bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='archive-old-logs-to-glacier',
                    status='Enabled',
                    filter=aws.s3.BucketLifecycleConfigurationRuleFilterArgs(
                        prefix='logs/'
                    ),
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=self.config.s3_glacier_transition_days,
                            storage_class='GLACIER'
                        )
                    ],
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=self.config.s3_log_expiration_days
                    )
                )
            ],
            opts=self.provider_manager.get_resource_options()
        )
        
        self.buckets['logs'] = bucket
    
    def get_bucket_name(self, bucket_type: str) -> Output[str]:
        """Get S3 bucket name."""
        return self.buckets[bucket_type].bucket
    
    def get_bucket_arn(self, bucket_type: str) -> Output[str]:
        """Get S3 bucket ARN."""
        return self.buckets[bucket_type].arn
    
    def get_bucket_id(self, bucket_type: str) -> Output[str]:
        """Get S3 bucket ID."""
        return self.buckets[bucket_type].id
