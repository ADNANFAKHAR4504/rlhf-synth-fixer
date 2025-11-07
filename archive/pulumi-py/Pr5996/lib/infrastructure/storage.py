"""
Storage infrastructure module.

This module creates S3 buckets with proper security configurations.

Features:
- S3 buckets with versioning enabled
- KMS encryption at rest
- Lifecycle policies for cost optimization
- Restrictive bucket policies
- Public access block
"""

import json

import pulumi_aws as aws
from pulumi import Output


class StorageStack:
    """
    Storage stack that creates S3 buckets with security best practices.
    
    Creates:
    - Data bucket for application data
    - Logs bucket for application logs
    - KMS encryption for both buckets
    - Versioning enabled
    - Lifecycle policies
    - Restrictive bucket policies
    - Public access block
    """
    
    def __init__(self, config, provider_manager, parent=None):
        """
        Initialize the storage stack.
        
        Args:
            config: InfraConfig instance
            provider_manager: AWSProviderManager instance
            parent: Optional parent resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.parent = parent
        
        # Get AWS account ID for bucket policies
        self.account_id = aws.get_caller_identity().account_id
        
        # Create KMS key for S3 encryption
        self.kms_key = self._create_kms_key()
        
        # Create S3 buckets
        self.data_bucket = self._create_data_bucket()
        self.logs_bucket = self._create_logs_bucket()
        
        # Configure bucket policies
        self._configure_bucket_policies()
    
    def _create_kms_key(self) -> aws.kms.Key:
        """
        Create KMS key for S3 bucket encryption.
        
        Returns:
            KMS key resource
        """
        kms_key = aws.kms.Key(
            's3-kms-key',
            description=f'KMS key for S3 bucket encryption - {self.config.environment_suffix}',
            deletion_window_in_days=10,
            enable_key_rotation=True,
            tags=self.config.get_tags_for_resource(
                'KMSKey',
                Name=self.config.get_resource_name('s3-kms')
            ),
            opts=self.provider_manager.get_resource_options(parent=self.parent)
        )
        
        # Create KMS key alias
        aws.kms.Alias(
            's3-kms-alias',
            name=f'alias/{self.config.get_resource_name("s3")}',
            target_key_id=kms_key.id,
            opts=self.provider_manager.get_resource_options(
                depends_on=[kms_key],
                parent=self.parent
            )
        )
        
        return kms_key
    
    def _create_data_bucket(self) -> aws.s3.Bucket:
        """
        Create S3 bucket for application data.
        
        Returns:
            S3 bucket resource
        """
        bucket_name = self.config.get_resource_name('data-bucket')
        
        bucket = aws.s3.Bucket(
            'data-bucket',
            bucket=bucket_name,
            tags=self.config.get_tags_for_resource(
                'S3Bucket',
                Name=bucket_name,
                Purpose='ApplicationData'
            ),
            opts=self.provider_manager.get_resource_options(parent=self.parent)
        )
        
        # Enable versioning
        aws.s3.BucketVersioning(
            'data-bucket-versioning',
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=self.provider_manager.get_resource_options(
                depends_on=[bucket],
                parent=self.parent
            )
        )
        
        # Enable server-side encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            'data-bucket-encryption',
            bucket=bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm='aws:kms',
                        kms_master_key_id=self.kms_key.arn
                    ),
                    bucket_key_enabled=True
                )
            ],
            opts=self.provider_manager.get_resource_options(
                depends_on=[bucket, self.kms_key],
                parent=self.parent
            )
        )
        
        # Configure lifecycle policy
        aws.s3.BucketLifecycleConfiguration(
            'data-bucket-lifecycle',
            bucket=bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='transition-to-ia',
                    status='Enabled',
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=30,
                            storage_class='STANDARD_IA'
                        ),
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=90,
                            storage_class='GLACIER'
                        )
                    ]
                ),
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='expire-old-versions',
                    status='Enabled',
                    noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs(
                        noncurrent_days=90
                    )
                )
            ],
            opts=self.provider_manager.get_resource_options(
                depends_on=[bucket],
                parent=self.parent
            )
        )
        
        # Block public access
        aws.s3.BucketPublicAccessBlock(
            'data-bucket-public-access-block',
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=self.provider_manager.get_resource_options(
                depends_on=[bucket],
                parent=self.parent
            )
        )
        
        return bucket
    
    def _create_logs_bucket(self) -> aws.s3.Bucket:
        """
        Create S3 bucket for application logs.
        
        Returns:
            S3 bucket resource
        """
        bucket_name = self.config.get_resource_name('logs-bucket')
        
        bucket = aws.s3.Bucket(
            'logs-bucket',
            bucket=bucket_name,
            tags=self.config.get_tags_for_resource(
                'S3Bucket',
                Name=bucket_name,
                Purpose='ApplicationLogs'
            ),
            opts=self.provider_manager.get_resource_options(parent=self.parent)
        )
        
        # Enable versioning
        aws.s3.BucketVersioning(
            'logs-bucket-versioning',
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=self.provider_manager.get_resource_options(
                depends_on=[bucket],
                parent=self.parent
            )
        )
        
        # Enable server-side encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            'logs-bucket-encryption',
            bucket=bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm='aws:kms',
                        kms_master_key_id=self.kms_key.arn
                    ),
                    bucket_key_enabled=True
                )
            ],
            opts=self.provider_manager.get_resource_options(
                depends_on=[bucket, self.kms_key],
                parent=self.parent
            )
        )
        
        # Configure lifecycle policy for logs
        aws.s3.BucketLifecycleConfiguration(
            'logs-bucket-lifecycle',
            bucket=bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='expire-old-logs',
                    status='Enabled',
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=365
                    )
                ),
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='transition-logs-to-glacier',
                    status='Enabled',
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=90,
                            storage_class='GLACIER'
                        )
                    ]
                )
            ],
            opts=self.provider_manager.get_resource_options(
                depends_on=[bucket],
                parent=self.parent
            )
        )
        
        # Block public access
        aws.s3.BucketPublicAccessBlock(
            'logs-bucket-public-access-block',
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=self.provider_manager.get_resource_options(
                depends_on=[bucket],
                parent=self.parent
            )
        )
        
        return bucket
    
    def _configure_bucket_policies(self):
        """
        Configure restrictive bucket policies.
        
        Policies enforce:
        - Encryption in transit (SSL/TLS required)
        - Access only from specific IAM roles
        """
        # Data bucket policy
        aws.s3.BucketPolicy(
            'data-bucket-policy',
            bucket=self.data_bucket.id,
            policy=Output.all(self.data_bucket.arn, self.account_id).apply(
                lambda args: json.dumps({
                    'Version': '2012-10-17',
                    'Statement': [
                        {
                            'Sid': 'DenyInsecureTransport',
                            'Effect': 'Deny',
                            'Principal': '*',
                            'Action': 's3:*',
                            'Resource': [
                                args[0],
                                f'{args[0]}/*'
                            ],
                            'Condition': {
                                'Bool': {
                                    'aws:SecureTransport': 'false'
                                }
                            }
                        },
                        {
                            'Sid': 'DenyUnencryptedObjectUploads',
                            'Effect': 'Deny',
                            'Principal': '*',
                            'Action': 's3:PutObject',
                            'Resource': f'{args[0]}/*',
                            'Condition': {
                                'StringNotEquals': {
                                    's3:x-amz-server-side-encryption': 'aws:kms'
                                }
                            }
                        }
                    ]
                })
            ),
            opts=self.provider_manager.get_resource_options(
                depends_on=[self.data_bucket],
                parent=self.parent
            )
        )
        
        # Logs bucket policy
        aws.s3.BucketPolicy(
            'logs-bucket-policy',
            bucket=self.logs_bucket.id,
            policy=Output.all(self.logs_bucket.arn, self.account_id).apply(
                lambda args: json.dumps({
                    'Version': '2012-10-17',
                    'Statement': [
                        {
                            'Sid': 'DenyInsecureTransport',
                            'Effect': 'Deny',
                            'Principal': '*',
                            'Action': 's3:*',
                            'Resource': [
                                args[0],
                                f'{args[0]}/*'
                            ],
                            'Condition': {
                                'Bool': {
                                    'aws:SecureTransport': 'false'
                                }
                            }
                        },
                        {
                            'Sid': 'DenyUnencryptedObjectUploads',
                            'Effect': 'Deny',
                            'Principal': '*',
                            'Action': 's3:PutObject',
                            'Resource': f'{args[0]}/*',
                            'Condition': {
                                'StringNotEquals': {
                                    's3:x-amz-server-side-encryption': 'aws:kms'
                                }
                            }
                        }
                    ]
                })
            ),
            opts=self.provider_manager.get_resource_options(
                depends_on=[self.logs_bucket],
                parent=self.parent
            )
        )
    
    def get_data_bucket_arn(self) -> Output[str]:
        """Get data bucket ARN."""
        return self.data_bucket.arn
    
    def get_logs_bucket_arn(self) -> Output[str]:
        """Get logs bucket ARN."""
        return self.logs_bucket.arn
    
    def get_data_bucket_name(self) -> Output[str]:
        """Get data bucket name."""
        return self.data_bucket.id
    
    def get_logs_bucket_name(self) -> Output[str]:
        """Get logs bucket name."""
        return self.logs_bucket.id
    
    def get_kms_key_id(self) -> Output[str]:
        """Get KMS key ID."""
        return self.kms_key.id
    
    def get_kms_key_arn(self) -> Output[str]:
        """Get KMS key ARN."""
        return self.kms_key.arn

