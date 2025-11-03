"""
S3 module for bucket management.

This module creates S3 buckets with KMS encryption, lifecycle rules,
and proper event notifications for Lambda triggers.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .kms import KMSStack


class S3Stack:
    """
    Manages S3 buckets.
    
    Creates buckets with KMS encryption, lifecycle rules, versioning,
    and event notifications with correct prefix/suffix filters.
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the S3 stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.buckets: Dict[str, aws.s3.Bucket] = {}
        self.bucket_policies: Dict[str, aws.s3.BucketPolicy] = {}
        
        self._create_content_bucket()
        self._create_data_bucket()
    
    def _create_content_bucket(self):
        """Create S3 bucket for static content (CloudFront origin)."""
        bucket_name = self.config.get_normalized_resource_name('content', include_region=True)
        opts = self.provider_manager.get_resource_options()
        
        bucket = aws.s3.Bucket(
            'content-bucket',
            bucket=bucket_name,
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        aws.s3.BucketVersioning(
            'content-bucket-versioning',
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=opts
        )
        
        aws.s3.BucketServerSideEncryptionConfiguration(
            'content-bucket-encryption',
            bucket=bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm='aws:kms',
                        kms_master_key_id=self.kms_stack.get_key_id('data')
                    ),
                    bucket_key_enabled=True
                )
            ],
            opts=opts
        )
        
        aws.s3.BucketPublicAccessBlock(
            'content-bucket-public-access-block',
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=opts
        )
        
        self.buckets['content'] = bucket
    
    def _create_data_bucket(self):
        """Create S3 bucket for data processing with lifecycle rules."""
        bucket_name = self.config.get_normalized_resource_name('data', include_region=True)
        opts = self.provider_manager.get_resource_options()
        
        bucket = aws.s3.Bucket(
            'data-bucket',
            bucket=bucket_name,
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        aws.s3.BucketVersioning(
            'data-bucket-versioning',
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=opts
        )
        
        aws.s3.BucketServerSideEncryptionConfiguration(
            'data-bucket-encryption',
            bucket=bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm='aws:kms',
                        kms_master_key_id=self.kms_stack.get_key_id('data')
                    ),
                    bucket_key_enabled=True
                )
            ],
            opts=opts
        )
        
        aws.s3.BucketLifecycleConfiguration(
            'data-bucket-lifecycle',
            bucket=bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='expire-processed-files',
                    status='Enabled',
                    filter=aws.s3.BucketLifecycleConfigurationRuleFilterArgs(
                        prefix='processed/'
                    ),
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=self.config.s3_lifecycle_expiration_days
                    )
                )
            ],
            opts=opts
        )
        
        aws.s3.BucketPublicAccessBlock(
            'data-bucket-public-access-block',
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=opts
        )
        
        self.buckets['data'] = bucket
    
    def add_lambda_notification(
        self,
        bucket_key: str,
        lambda_function_arn: pulumi.Output[str],
        events: list = None,
        filter_prefix: str = None,
        filter_suffix: str = None
    ):
        """
        Add Lambda notification to a bucket.
        
        Args:
            bucket_key: Key of the bucket
            lambda_function_arn: Lambda function ARN
            events: List of S3 events (default: ['s3:ObjectCreated:*'])
            filter_prefix: Prefix filter for objects
            filter_suffix: Suffix filter for objects
        """
        if events is None:
            events = ['s3:ObjectCreated:*']
        
        bucket = self.get_bucket(bucket_key)
        if not bucket:
            return
        
        opts = self.provider_manager.get_resource_options()
        
        filter_rules = []
        if filter_prefix:
            filter_rules.append(aws.s3.BucketNotificationLambdaFunctionFilterRuleArgs(
                name='prefix',
                value=filter_prefix
            ))
        if filter_suffix:
            filter_rules.append(aws.s3.BucketNotificationLambdaFunctionFilterRuleArgs(
                name='suffix',
                value=filter_suffix
            ))
        
        lambda_function_config = aws.s3.BucketNotificationLambdaFunctionArgs(
            lambda_function_arn=lambda_function_arn,
            events=events
        )
        
        if filter_rules:
            lambda_function_config = aws.s3.BucketNotificationLambdaFunctionArgs(
                lambda_function_arn=lambda_function_arn,
                events=events,
                filter_prefix=filter_prefix,
                filter_suffix=filter_suffix
            )
        
        aws.s3.BucketNotification(
            f'{bucket_key}-bucket-notification',
            bucket=bucket.id,
            lambda_functions=[lambda_function_config],
            opts=opts
        )
    
    def get_bucket(self, bucket_key: str) -> aws.s3.Bucket:
        """
        Get a bucket by key.
        
        Args:
            bucket_key: Key of the bucket
            
        Returns:
            S3 Bucket resource
        """
        return self.buckets.get(bucket_key)
    
    def get_bucket_name(self, bucket_key: str) -> pulumi.Output[str]:
        """
        Get the name of a bucket.
        
        Args:
            bucket_key: Key of the bucket
            
        Returns:
            Bucket name as Output
        """
        bucket = self.get_bucket(bucket_key)
        return bucket.bucket if bucket else None
    
    def get_bucket_arn(self, bucket_key: str) -> pulumi.Output[str]:
        """
        Get the ARN of a bucket.
        
        Args:
            bucket_key: Key of the bucket
            
        Returns:
            Bucket ARN as Output
        """
        bucket = self.get_bucket(bucket_key)
        return bucket.arn if bucket else None
    
    def get_bucket_domain_name(self, bucket_key: str) -> pulumi.Output[str]:
        """
        Get the regional domain name of a bucket.
        
        Args:
            bucket_key: Key of the bucket
            
        Returns:
            Bucket regional domain name as Output
        """
        bucket = self.get_bucket(bucket_key)
        return bucket.bucket_regional_domain_name if bucket else None

