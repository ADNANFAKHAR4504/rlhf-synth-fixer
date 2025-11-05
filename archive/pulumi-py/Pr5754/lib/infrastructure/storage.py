"""
Storage module for S3 buckets and KMS encryption.

This module creates S3 buckets for CI/CD artifacts with proper
encryption, versioning, lifecycle policies, and public access blocks.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import CICDPipelineConfig


class StorageStack:
    """
    Manages S3 buckets and KMS keys for CI/CD artifacts.
    
    Creates buckets with KMS encryption, versioning, lifecycle policies,
    and public access blocks for security.
    """
    
    def __init__(
        self,
        config: CICDPipelineConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the storage stack.
        
        Args:
            config: CICDPipelineConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.buckets: Dict[str, aws.s3.Bucket] = {}
        self.kms_keys: Dict[str, aws.kms.Key] = {}
        
        self._create_kms_keys()
        self._create_artifact_bucket()
    
    def _create_kms_keys(self):
        """Create KMS keys for S3 encryption."""
        s3_key_name = self.config.get_resource_name('s3-key')
        
        s3_key = aws.kms.Key(
            's3-kms-key',
            description='KMS key for S3 bucket encryption',
            enable_key_rotation=self.config.kms_key_rotation_enabled,
            tags={
                **self.config.get_common_tags(),
                'Name': s3_key_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        aws.kms.Alias(
            's3-kms-alias',
            target_key_id=s3_key.id,
            name=f'alias/{self.config.get_resource_name("s3", include_region=False)}',
            opts=self.provider_manager.get_resource_options()
        )
        
        self.kms_keys['s3'] = s3_key
    
    def _create_artifact_bucket(self):
        """Create S3 bucket for CI/CD artifacts."""
        bucket_name = self.config.get_normalized_resource_name('artifacts')
        
        artifact_bucket = aws.s3.Bucket(
            'artifact-bucket',
            bucket=bucket_name,
            tags={
                **self.config.get_common_tags(),
                'Name': bucket_name,
                'Purpose': 'CI/CD Artifacts'
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        aws.s3.BucketVersioning(
            'artifact-bucket-versioning',
            bucket=artifact_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=self.provider_manager.get_resource_options()
        )
        
        aws.s3.BucketServerSideEncryptionConfiguration(
            'artifact-bucket-encryption',
            bucket=artifact_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm='aws:kms',
                    kms_master_key_id=self.kms_keys['s3'].arn
                ),
                bucket_key_enabled=True
            )],
            opts=self.provider_manager.get_resource_options()
        )
        
        aws.s3.BucketPublicAccessBlock(
            'artifact-bucket-public-access-block',
            bucket=artifact_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=self.provider_manager.get_resource_options()
        )
        
        aws.s3.BucketLifecycleConfiguration(
            'artifact-bucket-lifecycle',
            bucket=artifact_bucket.id,
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
                    id='expire-old-artifacts',
                    status='Enabled',
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=180
                    )
                )
            ],
            opts=self.provider_manager.get_resource_options()
        )
        
        Output.all(artifact_bucket.arn).apply(
            lambda arns: aws.s3.BucketPolicy(
                'artifact-bucket-policy',
                bucket=artifact_bucket.id,
                policy=pulumi.Output.json_dumps({
                    'Version': '2012-10-17',
                    'Statement': [
                        {
                            'Sid': 'DenyUnencryptedObjectUploads',
                            'Effect': 'Deny',
                            'Principal': '*',
                            'Action': 's3:PutObject',
                            'Resource': f'{arns[0]}/*',
                            'Condition': {
                                'StringNotEquals': {
                                    's3:x-amz-server-side-encryption': 'aws:kms'
                                }
                            }
                        },
                        {
                            'Sid': 'DenyInsecureConnections',
                            'Effect': 'Deny',
                            'Principal': '*',
                            'Action': 's3:*',
                            'Resource': [arns[0], f'{arns[0]}/*'],
                            'Condition': {
                                'Bool': {
                                    'aws:SecureTransport': 'false'
                                }
                            }
                        }
                    ]
                }),
                opts=self.provider_manager.get_resource_options()
            )
        )
        
        self.buckets['artifacts'] = artifact_bucket
    
    def get_bucket(self, bucket_type: str) -> aws.s3.Bucket:
        """Get bucket by type."""
        return self.buckets.get(bucket_type)
    
    def get_bucket_name(self, bucket_type: str) -> Output[str]:
        """Get bucket name."""
        bucket = self.buckets.get(bucket_type)
        return bucket.id if bucket else Output.from_input('')
    
    def get_bucket_arn(self, bucket_type: str) -> Output[str]:
        """Get bucket ARN."""
        bucket = self.buckets.get(bucket_type)
        return bucket.arn if bucket else Output.from_input('')
    
    def get_kms_key_arn(self, key_type: str) -> Output[str]:
        """Get KMS key ARN."""
        key = self.kms_keys.get(key_type)
        return key.arn if key else Output.from_input('')
    
    def get_kms_key_id(self, key_type: str) -> Output[str]:
        """Get KMS key ID."""
        key = self.kms_keys.get(key_type)
        return key.id if key else Output.from_input('')
