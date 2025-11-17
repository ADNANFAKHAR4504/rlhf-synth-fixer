"""
KMS module for encryption keys.

This module creates KMS keys for encrypting S3, DynamoDB, and SQS resources.
"""

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import FileUploadConfig


class KMSStack:
    """
    Manages KMS encryption keys.
    
    Creates customer-managed KMS keys with automatic rotation enabled
    for encrypting various AWS services.
    """
    
    def __init__(
        self,
        config: FileUploadConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the KMS stack.
        
        Args:
            config: FileUploadConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.keys = {}
        self.aliases = {}
        
        self._create_keys()
    
    def _create_keys(self):
        """Create KMS keys for different services."""
        key_types = ['s3', 'dynamodb', 'sqs', 'sns']
        
        for key_type in key_types:
            key_name = f'{key_type}-key'
            alias_name = f'alias/{self.config.get_resource_name(key_type)}'
            
            key = aws.kms.Key(
                key_name,
                description=f'KMS key for {key_type.upper()} encryption - {self.config.project_name}',
                enable_key_rotation=True,
                deletion_window_in_days=10,
                tags={
                    **self.config.get_common_tags(),
                    'Name': self.config.get_resource_name(key_name),
                    'Service': key_type.upper()
                },
                opts=self.provider_manager.get_resource_options()
            )
            
            alias = aws.kms.Alias(
                f'{key_type}-alias',
                name=alias_name,
                target_key_id=key.id,
                opts=self.provider_manager.get_resource_options(depends_on=[key])
            )
            
            self.keys[key_type] = key
            self.aliases[key_type] = alias
    
    def get_key(self, key_type: str) -> aws.kms.Key:
        """
        Get a KMS key by type.
        
        Args:
            key_type: Type of key (s3, dynamodb, sqs, sns)
            
        Returns:
            KMS Key resource
        """
        return self.keys.get(key_type)
    
    def get_key_id(self, key_type: str) -> Output[str]:
        """
        Get the ID of a KMS key.
        
        Args:
            key_type: Type of key
            
        Returns:
            Key ID as Output
        """
        key = self.get_key(key_type)
        return key.id if key else None
    
    def get_key_arn(self, key_type: str) -> Output[str]:
        """
        Get the ARN of a KMS key.
        
        Args:
            key_type: Type of key
            
        Returns:
            Key ARN as Output
        """
        key = self.get_key(key_type)
        return key.arn if key else None

