"""
S3 module for the serverless infrastructure.

This module creates S3 buckets with KMS encryption, correct lifecycle rules,
and event notifications as required by model failures.
"""

import pulumi_aws as aws
from infrastructure.config import ServerlessConfig
from pulumi import Output, ResourceOptions


class StorageStack:
    """
    Manages S3 buckets for the serverless infrastructure.
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager,
        kms_key_id: Output[str]
    ):
        """
        Initialize Storage Stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            kms_key_id: KMS key ID for bucket encryption
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.kms_key_id = kms_key_id
        self.buckets = {}
        
        # Create data bucket
        self.data_bucket = self._create_data_bucket()
    
    def _create_data_bucket(self) -> aws.s3.Bucket:
        """
        Create S3 bucket with KMS encryption and lifecycle rules.
        
        Returns:
            S3 Bucket resource
        """
        bucket_name = self.config.get_normalized_resource_name("data-bucket")
        
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        # Create bucket
        bucket = aws.s3.Bucket(
            "data-bucket",
            bucket=bucket_name,
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        # Enable versioning
        aws.s3.BucketVersioning(
            "data-bucket-versioning",
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=opts
        )
        
        # Configure KMS encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            "data-bucket-encryption",
            bucket=bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="aws:kms",
                        kms_master_key_id=self.kms_key_id
                    ),
                    bucket_key_enabled=True
                )
            ],
            opts=opts
        )
        
        # Block public access
        aws.s3.BucketPublicAccessBlock(
            "data-bucket-public-access-block",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=opts
        )
        
        # Configure lifecycle rules (model failure fix)
        # Delete processed files after 30 days
        aws.s3.BucketLifecycleConfiguration(
            "data-bucket-lifecycle",
            bucket=bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id="delete-processed-files",
                    status="Enabled",
                    filter=aws.s3.BucketLifecycleConfigurationRuleFilterArgs(
                        prefix="processed/"  # Files moved to processed/ after processing
                    ),
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=self.config.s3_lifecycle_delete_days  # 30 days
                    )
                ),
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id="expire-old-versions",
                    status="Enabled",
                    noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs(
                        noncurrent_days=30
                    )
                ),
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id="abort-incomplete-uploads",
                    status="Enabled",
                    abort_incomplete_multipart_upload=aws.s3.BucketLifecycleConfigurationRuleAbortIncompleteMultipartUploadArgs(
                        days_after_initiation=7
                    )
                )
            ],
            opts=opts
        )
        
        self.buckets['data'] = bucket
        return bucket
    
    def configure_event_notification(
        self,
        lambda_function_arn: Output[str]
    ) -> None:
        """
        Configure S3 event notifications for Lambda trigger.
        
        Model failure fix: Uses correct prefix (incoming/) and suffix (.csv).
        
        Args:
            lambda_function_arn: Lambda function ARN to trigger
        """
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        # Configure S3 bucket notification
        aws.s3.BucketNotification(
            "data-bucket-notification",
            bucket=self.data_bucket.id,
            lambda_functions=[
                aws.s3.BucketNotificationLambdaFunctionArgs(
                    lambda_function_arn=lambda_function_arn,
                    events=["s3:ObjectCreated:*"],
                    filter_prefix=self.config.s3_incoming_prefix,  # incoming/
                    filter_suffix=self.config.s3_file_suffix  # .csv
                )
            ],
            opts=opts
        )
    
    def get_bucket_name(self) -> Output[str]:
        """Get data bucket name."""
        return self.data_bucket.bucket
    
    def get_bucket_arn(self) -> Output[str]:
        """Get data bucket ARN."""
        return self.data_bucket.arn
    
    def get_bucket_id(self) -> Output[str]:
        """Get data bucket ID."""
        return self.data_bucket.id

