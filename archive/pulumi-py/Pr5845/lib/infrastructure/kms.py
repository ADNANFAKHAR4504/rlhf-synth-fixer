"""
KMS module for encryption key management.

This module creates and manages KMS keys for encrypting S3 buckets,
DynamoDB tables, and other AWS resources.
"""

from typing import Dict

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig


class KMSStack:
    """Manages KMS keys for encryption."""
    
    def __init__(self, config: ServerlessConfig, provider_manager: AWSProviderManager):
        """
        Initialize the KMS stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.keys: Dict[str, aws.kms.Key] = {}
        
        self._create_keys()
    
    def _create_keys(self):
        """Create KMS keys for different services."""
        self.keys['s3'] = self._create_key(
            's3',
            'KMS key for S3 bucket encryption'
        )
        
        self.keys['dynamodb'] = self._create_key(
            'dynamodb',
            'KMS key for DynamoDB table encryption'
        )
        
        self.keys['sqs'] = self._create_key(
            'sqs',
            'KMS key for SQS queue encryption'
        )
    
    def _create_key(self, key_name: str, description: str) -> aws.kms.Key:
        """
        Create a KMS key with automatic rotation enabled.
        
        Args:
            key_name: Name identifier for the key
            description: Description of the key purpose
            
        Returns:
            KMS Key resource
        """
        resource_name = self.config.get_resource_name(f'kms-{key_name}')
        
        key = aws.kms.Key(
            f'kms-{key_name}',
            description=f'{description} - {self.config.project_name}',
            enable_key_rotation=True,
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        aws.kms.Alias(
            f'kms-{key_name}-alias',
            name=f'alias/{resource_name}',
            target_key_id=key.id,
            opts=self.provider_manager.get_resource_options()
        )
        
        return key
    
    def get_key_id(self, key_name: str) -> Output[str]:
        """
        Get KMS key ID.
        
        Args:
            key_name: Name of the key
            
        Returns:
            Key ID as Output
        """
        return self.keys[key_name].id
    
    def get_key_arn(self, key_name: str) -> Output[str]:
        """
        Get KMS key ARN.
        
        Args:
            key_name: Name of the key
            
        Returns:
            Key ARN as Output
        """
        return self.keys[key_name].arn

