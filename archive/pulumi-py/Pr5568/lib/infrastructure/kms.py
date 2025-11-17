"""
KMS module for encryption key management.

This module creates and manages KMS keys for encrypting data at rest
across all services with automatic key rotation enabled.
"""

import json
from typing import Dict

import pulumi
import pulumi_aws as aws

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig


class KMSStack:
    """
    Manages KMS keys for encryption at rest.
    
    Creates KMS keys with automatic rotation enabled and proper key policies.
    """
    
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
        self.aliases: Dict[str, aws.kms.Alias] = {}
        
        self._create_data_key()
    
    def _create_data_key(self):
        """Create KMS key for general data encryption."""
        account_id = aws.get_caller_identity().account_id
        region = self.config.primary_region
        
        key_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{account_id}:root"
                    },
                    "Action": "kms:*",
                    "Resource": "*"
                },
                {
                    "Sid": "Allow services to use the key",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": [
                            "lambda.amazonaws.com",
                            "dynamodb.amazonaws.com",
                            "s3.amazonaws.com",
                            "secretsmanager.amazonaws.com",
                            "sqs.amazonaws.com"
                        ]
                    },
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey",
                        "kms:CreateGrant"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "StringEquals": {
                            "kms:ViaService": [
                                f"dynamodb.{region}.amazonaws.com",
                                f"s3.{region}.amazonaws.com",
                                f"secretsmanager.{region}.amazonaws.com",
                                f"sqs.{region}.amazonaws.com"
                            ]
                        }
                    }
                },
                {
                    "Sid": "Allow CloudWatch Logs",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": f"logs.{region}.amazonaws.com"
                    },
                    "Action": [
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:CreateGrant",
                        "kms:DescribeKey"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "ArnLike": {
                            "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{region}:{account_id}:log-group:*"
                        }
                    }
                }
            ]
        })
        
        opts = self.provider_manager.get_resource_options()
        
        key = aws.kms.Key(
            'data-encryption-key',
            description='KMS key for encrypting data at rest',
            deletion_window_in_days=10,
            enable_key_rotation=True,
            policy=key_policy,
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        alias = aws.kms.Alias(
            'data-encryption-key-alias',
            name=f"alias/{self.config.get_resource_name('data-key', include_region=False)}",
            target_key_id=key.id,
            opts=opts
        )
        
        self.keys['data'] = key
        self.aliases['data'] = alias
    
    def get_key(self, key_name: str) -> aws.kms.Key:
        """
        Get a KMS key by name.
        
        Args:
            key_name: Name of the key
            
        Returns:
            KMS Key resource
        """
        return self.keys.get(key_name)
    
    def get_key_arn(self, key_name: str) -> pulumi.Output[str]:
        """
        Get the ARN of a KMS key.
        
        Args:
            key_name: Name of the key
            
        Returns:
            Key ARN as Output
        """
        key = self.get_key(key_name)
        return key.arn if key else None
    
    def get_key_id(self, key_name: str) -> pulumi.Output[str]:
        """
        Get the ID of a KMS key.
        
        Args:
            key_name: Name of the key
            
        Returns:
            Key ID as Output
        """
        key = self.get_key(key_name)
        return key.id if key else None

