"""
S3 module for file storage.

This module creates S3 buckets with KMS encryption, versioning,
and lifecycle policies. Note: Public-read access is implemented
per prompt requirements but should be reviewed for production use.
"""

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import FileUploadConfig
from .kms import KMSStack


class S3Stack:
    """
    Manages S3 buckets for file storage.
    
    Creates S3 buckets with:
    - KMS encryption
    - Versioning enabled
    - Lifecycle policies
    - Public-read access (per prompt requirements)
    - CORS configuration
    """
    
    def __init__(
        self,
        config: FileUploadConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the S3 stack.
        
        Args:
            config: FileUploadConfig instance
            provider_manager: AWSProviderManager instance
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.buckets = {}
        
        self._create_file_storage_bucket()
    
    def _create_file_storage_bucket(self):
        """Create the main file storage bucket."""
        bucket_name = 'uploads'
        normalized_name = self.config.get_normalized_resource_name(bucket_name)
        
        bucket = aws.s3.Bucket(
            bucket_name,
            bucket=normalized_name,
            force_destroy=True,
            tags={
                **self.config.get_common_tags(),
                'Name': normalized_name,
                'Purpose': 'File uploads storage'
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        aws.s3.BucketVersioning(
            f'{bucket_name}-versioning',
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=self.provider_manager.get_resource_options(depends_on=[bucket])
        )
        
        s3_key = self.kms_stack.get_key('s3')
        
        aws.s3.BucketServerSideEncryptionConfiguration(
            f'{bucket_name}-encryption',
            bucket=bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm='aws:kms',
                    kms_master_key_id=s3_key.arn
                ),
                bucket_key_enabled=True
            )],
            opts=self.provider_manager.get_resource_options(depends_on=[bucket, s3_key])
        )
        
        aws.s3.BucketLifecycleConfiguration(
            f'{bucket_name}-lifecycle',
            bucket=bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='transition-old-files',
                    status='Enabled',
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=self.config.s3_lifecycle_transition_days,
                            storage_class='STANDARD_IA'
                        )
                    ],
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=self.config.s3_lifecycle_expiration_days
                    )
                )
            ],
            opts=self.provider_manager.get_resource_options(depends_on=[bucket])
        )
        
        aws.s3.BucketCorsConfiguration(
            f'{bucket_name}-cors',
            bucket=bucket.id,
            cors_rules=[aws.s3.BucketCorsConfigurationCorsRuleArgs(
                allowed_headers=['*'],
                allowed_methods=['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
                allowed_origins=['*'],
                expose_headers=['ETag'],
                max_age_seconds=3000
            )],
            opts=self.provider_manager.get_resource_options(depends_on=[bucket])
        )
        
        aws.s3.BucketPublicAccessBlock(
            f'{bucket_name}-public-access',
            bucket=bucket.id,
            block_public_acls=False,
            block_public_policy=False,
            ignore_public_acls=False,
            restrict_public_buckets=False,
            opts=self.provider_manager.get_resource_options(depends_on=[bucket])
        )
        
        bucket_policy = Output.all(bucket.arn, bucket.id).apply(
            lambda args: {
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Sid': 'PublicReadGetObject',
                        'Effect': 'Allow',
                        'Principal': '*',
                        'Action': 's3:GetObject',
                        'Resource': f'{args[0]}/*'
                    }
                ]
            }
        )
        
        aws.s3.BucketPolicy(
            f'{bucket_name}-policy',
            bucket=bucket.id,
            policy=bucket_policy.apply(lambda p: Output.json_dumps(p)),
            opts=self.provider_manager.get_resource_options(depends_on=[bucket])
        )
        
        self.buckets[bucket_name] = bucket
    
    def get_bucket(self, bucket_name: str) -> aws.s3.Bucket:
        """
        Get an S3 bucket by name.
        
        Args:
            bucket_name: Name of the bucket
            
        Returns:
            S3 Bucket resource
        """
        return self.buckets.get(bucket_name)
    
    def get_bucket_name(self, bucket_name: str) -> Output[str]:
        """
        Get the name of an S3 bucket.
        
        Args:
            bucket_name: Name of the bucket
            
        Returns:
            Bucket name as Output
        """
        bucket = self.get_bucket(bucket_name)
        return bucket.bucket if bucket else None
    
    def get_bucket_arn(self, bucket_name: str) -> Output[str]:
        """
        Get the ARN of an S3 bucket.
        
        Args:
            bucket_name: Name of the bucket
            
        Returns:
            Bucket ARN as Output
        """
        bucket = self.get_bucket(bucket_name)
        return bucket.arn if bucket else None

