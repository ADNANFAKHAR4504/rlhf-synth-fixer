"""
S3 module for managing source and artifact buckets.

This module creates and configures S3 buckets for storing source code and
build artifacts with KMS encryption, versioning, and lifecycle policies.
"""

import json
from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import CICDConfig
from .kms import KMSStack


class S3Stack:
    """
    Manages S3 buckets for CI/CD pipeline.
    
    Creates source and artifact buckets with KMS encryption,
    versioning, and lifecycle policies.
    """
    
    def __init__(
        self,
        config: CICDConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the S3 stack.
        
        Args:
            config: CICDConfig instance
            provider_manager: AWSProviderManager instance
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.buckets: Dict[str, aws.s3.Bucket] = {}
        
        self._create_source_bucket()
        self._create_artifacts_bucket()
    
    def _create_source_bucket(self):
        """Create the source code bucket."""
        bucket_name = 'source'
        normalized_name = self.config.get_normalized_resource_name(bucket_name)
        
        bucket = aws.s3.Bucket(
            bucket_name,
            bucket=normalized_name,
            force_destroy=True,
            tags={
                **self.config.get_common_tags(),
                'Name': normalized_name,
                'Purpose': 'Source code storage'
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
        
        aws.s3.BucketPolicy(
            f'{bucket_name}-policy',
            bucket=bucket.id,
            policy=Output.all(bucket.arn, s3_key.arn).apply(
                lambda args: json.dumps({
                    'Version': '2012-10-17',
                    'Statement': [
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
                        },
                        {
                            'Sid': 'DenyInsecureConnections',
                            'Effect': 'Deny',
                            'Principal': '*',
                            'Action': 's3:*',
                            'Resource': [args[0], f'{args[0]}/*'],
                            'Condition': {
                                'Bool': {
                                    'aws:SecureTransport': 'false'
                                }
                            }
                        }
                    ]
                })
            ),
            opts=self.provider_manager.get_resource_options(depends_on=[bucket])
        )
        
        self.buckets[bucket_name] = bucket
    
    def _create_artifacts_bucket(self):
        """Create the build artifacts bucket."""
        bucket_name = 'artifacts'
        normalized_name = self.config.get_normalized_resource_name(bucket_name)
        
        bucket = aws.s3.Bucket(
            bucket_name,
            bucket=normalized_name,
            force_destroy=True,
            tags={
                **self.config.get_common_tags(),
                'Name': normalized_name,
                'Purpose': 'Build artifacts storage'
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
                    id='expire-old-artifacts',
                    status='Enabled',
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=90
                    ),
                    noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs(
                        noncurrent_days=30
                    )
                )
            ],
            opts=self.provider_manager.get_resource_options(depends_on=[bucket])
        )
        
        aws.s3.BucketPolicy(
            f'{bucket_name}-policy',
            bucket=bucket.id,
            policy=Output.all(bucket.arn, s3_key.arn).apply(
                lambda args: json.dumps({
                    'Version': '2012-10-17',
                    'Statement': [
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
                        },
                        {
                            'Sid': 'DenyInsecureConnections',
                            'Effect': 'Deny',
                            'Principal': '*',
                            'Action': 's3:*',
                            'Resource': [args[0], f'{args[0]}/*'],
                            'Condition': {
                                'Bool': {
                                    'aws:SecureTransport': 'false'
                                }
                            }
                        }
                    ]
                })
            ),
            opts=self.provider_manager.get_resource_options(depends_on=[bucket])
        )
        
        self.buckets[bucket_name] = bucket
    
    def enable_eventbridge_notifications(self, bucket_type: str):
        """
        Enable EventBridge notifications for a bucket.
        
        Args:
            bucket_type: Type of bucket to enable notifications for
        """
        bucket = self.get_bucket(bucket_type)
        
        aws.s3.BucketNotification(
            f'{bucket_type}-eventbridge-notification',
            bucket=bucket.id,
            eventbridge=True,
            opts=self.provider_manager.get_resource_options(depends_on=[bucket])
        )
    
    def get_bucket(self, bucket_type: str) -> aws.s3.Bucket:
        """
        Get a bucket by type.
        
        Args:
            bucket_type: Type of bucket ('source' or 'artifacts')
            
        Returns:
            S3 Bucket resource
        """
        if bucket_type not in self.buckets:
            raise ValueError(f"Bucket type '{bucket_type}' not found")
        return self.buckets[bucket_type]
    
    def get_bucket_name(self, bucket_type: str) -> Output[str]:
        """
        Get the name of a bucket.
        
        Args:
            bucket_type: Type of bucket
            
        Returns:
            Bucket name as Output[str]
        """
        return self.get_bucket(bucket_type).bucket
    
    def get_bucket_arn(self, bucket_type: str) -> Output[str]:
        """
        Get the ARN of a bucket.
        
        Args:
            bucket_type: Type of bucket
            
        Returns:
            Bucket ARN as Output[str]
        """
        return self.get_bucket(bucket_type).arn

