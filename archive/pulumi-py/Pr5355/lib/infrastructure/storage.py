"""
Storage module for S3 bucket configuration.

This module creates S3 buckets with server-side encryption, event notifications,
and lifecycle policies for the financial data processing pipeline.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import FinancialDataPipelineConfig


class StorageStack:
    """
    Manages S3 buckets for the financial data pipeline.
    
    Creates buckets with encryption, lifecycle policies, and event notifications.
    """
    
    def __init__(
        self,
        config: FinancialDataPipelineConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the storage stack.
        
        Args:
            config: FinancialDataPipelineConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        
        self._create_data_bucket()
    
    def _create_data_bucket(self):
        """Create S3 bucket for CSV data with encryption and lifecycle policies."""
        bucket_name = self.config.get_normalized_resource_name('data-bucket')
        
        self.data_bucket = aws.s3.Bucket(
            "data-bucket",
            bucket=bucket_name,
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        aws.s3.BucketServerSideEncryptionConfiguration(
            "data-bucket-encryption",
            bucket=self.data_bucket.id,
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
                parent=self.data_bucket
            )
        )
        
        aws.s3.BucketPublicAccessBlock(
            "data-bucket-public-access-block",
            bucket=self.data_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.data_bucket
            )
        )
        
        aws.s3.BucketLifecycleConfiguration(
            "data-bucket-lifecycle",
            bucket=self.data_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id="delete-processed-files",
                    status="Enabled",
                    filter=aws.s3.BucketLifecycleConfigurationRuleFilterArgs(
                        prefix="processed/"
                    ),
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=self.config.s3_lifecycle_days
                    )
                )
            ],
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.data_bucket
            )
        )
        
        self.data_bucket_arn = self.data_bucket.arn
        self.data_bucket_name = self.data_bucket.id
    
    def setup_event_notification(self, lambda_function_arn: Output[str]):
        """
        Set up S3 event notification to trigger Lambda on CSV uploads.
        
        Args:
            lambda_function_arn: ARN of the Lambda function to trigger
        """
        aws.s3.BucketNotification(
            "data-bucket-notification",
            bucket=self.data_bucket.id,
            lambda_functions=[
                aws.s3.BucketNotificationLambdaFunctionArgs(
                    lambda_function_arn=lambda_function_arn,
                    events=["s3:ObjectCreated:*"],
                    filter_prefix="incoming/",
                    filter_suffix=".csv"
                )
            ],
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.data_bucket
            )
        )
    
    def get_bucket_arn(self) -> Output[str]:
        """Get the data bucket ARN."""
        return self.data_bucket_arn
    
    def get_bucket_name(self) -> Output[str]:
        """Get the data bucket name."""
        return self.data_bucket_name




