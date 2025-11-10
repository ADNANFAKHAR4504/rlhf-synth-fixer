"""
S3 module for bucket management.

This module creates and manages S3 buckets with KMS encryption, versioning,
lifecycle policies, and event notifications.
"""

from typing import Dict, Optional

import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .kms import KMSStack


class S3Stack:
    """Manages S3 buckets with encryption, versioning, and lifecycle policies."""
    
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
            kms_stack: KMSStack instance for encryption
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.buckets: Dict[str, aws.s3.Bucket] = {}
        
        self._create_buckets()
    
    def _create_buckets(self):
        """Create S3 buckets."""
        self.buckets['data'] = self._create_bucket('data')
        self.buckets['pipeline-artifacts'] = self._create_bucket('pipeline-artifacts')
    
    def _create_bucket(self, bucket_name: str) -> aws.s3.Bucket:
        """
        Create an S3 bucket with all required features.
        
        Args:
            bucket_name: Name identifier for the bucket
            
        Returns:
            S3 Bucket resource
        """
        resource_name = self.config.get_normalized_resource_name(f'bucket-{bucket_name}')
        
        bucket = aws.s3.Bucket(
            f's3-bucket-{bucket_name}',
            bucket=resource_name,
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                retain_on_delete=self.config.s3_retain_on_delete
            )
        )
        
        aws.s3.BucketPublicAccessBlock(
            f's3-public-access-block-{bucket_name}',
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=self.provider_manager.get_resource_options(depends_on=[bucket])
        )
        
        aws.s3.BucketVersioning(
            f's3-versioning-{bucket_name}',
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=self.provider_manager.get_resource_options(depends_on=[bucket])
        )
        
        aws.s3.BucketServerSideEncryptionConfiguration(
            f's3-encryption-{bucket_name}',
            bucket=bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm='aws:kms',
                    kms_master_key_id=self.kms_stack.get_key_arn('s3')
                ),
                bucket_key_enabled=True
            )],
            opts=self.provider_manager.get_resource_options(depends_on=[bucket])
        )
        
        if bucket_name == 'data':
            aws.s3.BucketLifecycleConfiguration(
                f's3-lifecycle-{bucket_name}',
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
                        ),
                        noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs(
                            noncurrent_days=self.config.s3_lifecycle_expiration_days
                        )
                    )
                ],
                opts=self.provider_manager.get_resource_options(depends_on=[bucket])
            )
        
        return bucket
    
    def setup_event_notification(
        self,
        bucket_name: str,
        lambda_function_arn: Output[str],
        lambda_function_name: Output[str]
    ):
        """
        Setup S3 event notification to trigger Lambda.
        
        Args:
            bucket_name: Name identifier for the bucket
            lambda_function_arn: ARN of the Lambda function
            lambda_function_name: Name of the Lambda function
        """
        bucket = self.buckets[bucket_name]
        
        permission = aws.lambda_.Permission(
            f's3-lambda-permission-{bucket_name}',
            action='lambda:InvokeFunction',
            function=lambda_function_name,
            principal='s3.amazonaws.com',
            source_arn=bucket.arn,
            opts=self.provider_manager.get_resource_options()
        )
        
        aws.s3.BucketNotification(
            f's3-notification-{bucket_name}',
            bucket=bucket.id,
            lambda_functions=[
                aws.s3.BucketNotificationLambdaFunctionArgs(
                    lambda_function_arn=lambda_function_arn,
                    events=['s3:ObjectCreated:*'],
                    filter_prefix=self.config.s3_event_prefix,
                    filter_suffix=self.config.s3_event_suffix
                )
            ],
            opts=self.provider_manager.get_resource_options(depends_on=[permission])
        )
    
    def get_bucket_name(self, bucket_name: str) -> Output[str]:
        """
        Get S3 bucket name.
        
        Args:
            bucket_name: Name identifier for the bucket
            
        Returns:
            Bucket name as Output
        """
        return self.buckets[bucket_name].bucket
    
    def get_bucket_arn(self, bucket_name: str) -> Output[str]:
        """
        Get S3 bucket ARN.
        
        Args:
            bucket_name: Name identifier for the bucket
            
        Returns:
            Bucket ARN as Output
        """
        return self.buckets[bucket_name].arn

