"""
KMS module for managing encryption keys.

This module creates and manages AWS KMS customer-managed keys for encrypting
data at rest including Lambda environment variables, S3 artifacts, and SNS topics.
"""

import json
from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import CICDConfig


class KMSStack:
    """
    Manages KMS keys for encryption at rest.
    
    Creates customer-managed KMS keys for different services with
    automatic key rotation enabled.
    """
    
    def __init__(self, config: CICDConfig, provider_manager: AWSProviderManager):
        """
        Initialize the KMS stack.
        
        Args:
            config: CICDConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.keys: Dict[str, aws.kms.Key] = {}
        self.aliases: Dict[str, aws.kms.Alias] = {}
        
        self._create_kms_keys()
    
    def _create_kms_keys(self):
        """Create KMS keys for different services."""
        key_types = ['lambda', 's3', 'sns']
        
        for key_type in key_types:
            self._create_key(key_type)
    
    def _create_key(self, key_name: str):
        """
        Create a KMS key with proper policy.
        
        Args:
            key_name: Name identifier for the key
        """
        resource_name = self.config.get_resource_name(f'{key_name}-key')
        
        account_id = aws.get_caller_identity().account_id
        
        key_policy = Output.all(account_id).apply(
            lambda args: json.dumps({
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Sid': 'Enable IAM User Permissions',
                        'Effect': 'Allow',
                        'Principal': {
                            'AWS': f'arn:aws:iam::{args[0]}:root'
                        },
                        'Action': 'kms:*',
                        'Resource': '*'
                    },
                    {
                        'Sid': 'Allow services to use the key',
                        'Effect': 'Allow',
                        'Principal': {
                            'Service': [
                                'lambda.amazonaws.com',
                                's3.amazonaws.com',
                                'sns.amazonaws.com',
                                'codebuild.amazonaws.com',
                                'codepipeline.amazonaws.com',
                                'codedeploy.amazonaws.com'
                            ]
                        },
                        'Action': [
                            'kms:Decrypt',
                            'kms:GenerateDataKey',
                            'kms:DescribeKey'
                        ],
                        'Resource': '*'
                    }
                ]
            })
        )
        
        key = aws.kms.Key(
            f'{key_name}-key',
            description=f'KMS key for {key_name} encryption',
            deletion_window_in_days=30,
            enable_key_rotation=True,
            policy=key_policy,
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name,
                'Purpose': f'{key_name} encryption'
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        alias = aws.kms.Alias(
            f'{key_name}-key-alias',
            name=f'alias/{resource_name}',
            target_key_id=key.id,
            opts=self.provider_manager.get_resource_options(depends_on=[key])
        )
        
        self.keys[key_name] = key
        self.aliases[key_name] = alias
    
    def get_key(self, key_name: str) -> aws.kms.Key:
        """
        Get a KMS key by name.
        
        Args:
            key_name: Name of the key
            
        Returns:
            KMS Key resource
        """
        if key_name not in self.keys:
            raise ValueError(f"KMS key '{key_name}' not found")
        return self.keys[key_name]
    
    def get_key_arn(self, key_name: str) -> Output[str]:
        """
        Get the ARN of a KMS key.
        
        Args:
            key_name: Name of the key
            
        Returns:
            Key ARN as Output[str]
        """
        return self.get_key(key_name).arn
    
    def get_key_id(self, key_name: str) -> Output[str]:
        """
        Get the ID of a KMS key.
        
        Args:
            key_name: Name of the key
            
        Returns:
            Key ID as Output[str]
        """
        return self.get_key(key_name).id

