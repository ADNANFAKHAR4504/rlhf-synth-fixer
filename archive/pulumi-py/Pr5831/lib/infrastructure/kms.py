"""
KMS module for encryption key management.

This module creates and manages KMS keys for encrypting S3 buckets
and other AWS resources.
"""

from typing import Dict

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessProcessorConfig


class KMSStack:
    """
    Manages KMS encryption keys for the serverless processor.
    
    Creates customer-managed KMS keys with automatic key rotation enabled
    for encrypting S3 buckets and other sensitive data.
    """
    
    def __init__(
        self,
        config: ServerlessProcessorConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the KMS stack.
        
        Args:
            config: ServerlessProcessorConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.keys: Dict[str, aws.kms.Key] = {}
        self.aliases: Dict[str, aws.kms.Alias] = {}
        
        self._create_keys()
    
    def _create_keys(self):
        """Create KMS keys for different services."""
        self._create_s3_key()
    
    def _create_s3_key(self):
        """Create KMS key for S3 bucket encryption."""
        key_name = self.config.get_resource_name('s3-kms-key')
        alias_name = f"alias/{self.config.get_normalized_resource_name('s3-key', include_region=False)}"
        
        key = aws.kms.Key(
            's3-kms-key',
            description=f'KMS key for S3 bucket encryption - {self.config.project_name}',
            enable_key_rotation=True,
            deletion_window_in_days=30,
            tags={
                **self.config.get_common_tags(),
                'Name': key_name,
                'Purpose': 'S3 Encryption'
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        alias = aws.kms.Alias(
            's3-kms-alias',
            name=alias_name,
            target_key_id=key.id,
            opts=self.provider_manager.get_resource_options()
        )
        
        self.keys['s3'] = key
        self.aliases['s3'] = alias
    
    def get_key_id(self, key_name: str) -> Output[str]:
        """
        Get KMS key ID.
        
        Args:
            key_name: Name of the key (e.g., 's3')
            
        Returns:
            KMS key ID as Output
        """
        return self.keys[key_name].id
    
    def get_key_arn(self, key_name: str) -> Output[str]:
        """
        Get KMS key ARN.
        
        Args:
            key_name: Name of the key (e.g., 's3')
            
        Returns:
            KMS key ARN as Output
        """
        return self.keys[key_name].arn

