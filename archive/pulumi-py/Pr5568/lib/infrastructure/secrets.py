"""
Secrets Manager module for secure secret storage.

This module creates and manages AWS Secrets Manager secrets with KMS encryption
for secure injection into Lambda environment variables.
"""

import json
from typing import Dict

import pulumi
import pulumi_aws as aws

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .kms import KMSStack


class SecretsStack:
    """
    Manages AWS Secrets Manager secrets.
    
    Creates secrets with KMS encryption for secure storage and retrieval.
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the Secrets stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.secrets: Dict[str, aws.secretsmanager.Secret] = {}
        self.secret_versions: Dict[str, aws.secretsmanager.SecretVersion] = {}
        
        self._create_api_secret()
        self._create_database_secret()
    
    def _create_api_secret(self):
        """Create secret for API credentials."""
        secret_name = self.config.get_resource_name('api-secret', include_region=False)
        opts = self.provider_manager.get_resource_options()
        
        secret = aws.secretsmanager.Secret(
            'api-secret',
            name=secret_name,
            description='API credentials for external services',
            kms_key_id=self.kms_stack.get_key_id('data'),
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        secret_value = json.dumps({
            'api_key': 'placeholder-api-key',
            'api_secret': 'placeholder-api-secret'
        })
        
        secret_version = aws.secretsmanager.SecretVersion(
            'api-secret-version',
            secret_id=secret.id,
            secret_string=secret_value,
            opts=opts
        )
        
        self.secrets['api'] = secret
        self.secret_versions['api'] = secret_version
    
    def _create_database_secret(self):
        """Create secret for database credentials."""
        secret_name = self.config.get_resource_name('db-secret', include_region=False)
        opts = self.provider_manager.get_resource_options()
        
        secret = aws.secretsmanager.Secret(
            'database-secret',
            name=secret_name,
            description='Database credentials',
            kms_key_id=self.kms_stack.get_key_id('data'),
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        secret_value = json.dumps({
            'username': 'admin',
            'password': 'placeholder-password'
        })
        
        secret_version = aws.secretsmanager.SecretVersion(
            'database-secret-version',
            secret_id=secret.id,
            secret_string=secret_value,
            opts=opts
        )
        
        self.secrets['database'] = secret
        self.secret_versions['database'] = secret_version
    
    def get_secret(self, secret_name: str) -> aws.secretsmanager.Secret:
        """
        Get a secret by name.
        
        Args:
            secret_name: Name of the secret
            
        Returns:
            Secret resource
        """
        return self.secrets.get(secret_name)
    
    def get_secret_arn(self, secret_name: str) -> pulumi.Output[str]:
        """
        Get the ARN of a secret.
        
        Args:
            secret_name: Name of the secret
            
        Returns:
            Secret ARN as Output
        """
        secret = self.get_secret(secret_name)
        return secret.arn if secret else None

