"""
KMS module for managing encryption keys.

This module creates and manages KMS keys for encrypting S3 buckets,
DynamoDB tables, SQS queues, and other AWS resources.
"""

import json
from typing import Dict

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionConfig


class KMSStack:
    """Manages KMS keys for encryption."""
    
    def __init__(
        self,
        config: TransactionConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the KMS stack.
        
        Args:
            config: TransactionConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.keys: Dict[str, aws.kms.Key] = {}
        self.aliases: Dict[str, aws.kms.Alias] = {}
        
        self._create_keys()
    
    def _create_keys(self):
        """Create KMS keys for different services."""
        key_configs = {
            's3': 'KMS key for S3 bucket encryption',
            'dynamodb': 'KMS key for DynamoDB table encryption',
            'sqs': 'KMS key for SQS queue encryption',
            'logs': 'KMS key for CloudWatch Logs encryption'
        }
        
        for key_name, description in key_configs.items():
            self._create_key(key_name, description)
    
    def _create_key(self, key_name: str, description: str):
        """
        Create a KMS key with alias.
        
        Args:
            key_name: Name identifier for the key
            description: Description of the key's purpose
        """
        resource_name = self.config.get_resource_name(f'kms-{key_name}')
        
        caller_identity = aws.get_caller_identity()
        
        policy = Output.all(caller_identity.account_id, self.config.primary_region).apply(
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
                                's3.amazonaws.com',
                                'dynamodb.amazonaws.com',
                                'sqs.amazonaws.com',
                                'logs.amazonaws.com',
                                'lambda.amazonaws.com'
                            ]
                        },
                        'Action': [
                            'kms:Decrypt',
                            'kms:GenerateDataKey',
                            'kms:CreateGrant'
                        ],
                        'Resource': '*',
                        'Condition': {
                            'StringEquals': {
                                'kms:ViaService': [
                                    f's3.{args[1]}.amazonaws.com',
                                    f'dynamodb.{args[1]}.amazonaws.com',
                                    f'sqs.{args[1]}.amazonaws.com',
                                    f'logs.{args[1]}.amazonaws.com',
                                    f'lambda.{args[1]}.amazonaws.com'
                                ]
                            }
                        }
                    }
                ]
            })
        )
        
        key = aws.kms.Key(
            f'kms-{key_name}',
            description=f'{description} - {resource_name}',
            enable_key_rotation=True,
            policy=policy,
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        alias = aws.kms.Alias(
            f'kms-alias-{key_name}',
            name=f'alias/{resource_name}',
            target_key_id=key.id,
            opts=self.provider_manager.get_resource_options()
        )
        
        self.keys[key_name] = key
        self.aliases[key_name] = alias
    
    def get_key_id(self, key_name: str) -> Output[str]:
        """Get KMS key ID."""
        return self.keys[key_name].id
    
    def get_key_arn(self, key_name: str) -> Output[str]:
        """Get KMS key ARN."""
        return self.keys[key_name].arn



