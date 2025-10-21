"""
Secrets management infrastructure module.

This module creates AWS Secrets Manager secrets and SSM parameters
for secure configuration management.
"""
import json

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class SecretsStack:
    """
    Creates and manages AWS Secrets Manager secrets and SSM parameters.
    """
    
    def __init__(self, config: InfraConfig, parent: pulumi.ComponentResource):
        """
        Initialize the secrets stack.
        
        Args:
            config: Infrastructure configuration
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.parent = parent
        
        # Create SSM parameters
        self.app_config_parameter = self._create_app_config_parameter()
        self.environment_parameter = self._create_environment_parameter()
        
        # Create Secrets Manager secrets if enabled
        if self.config.use_secrets_manager:
            self.app_secret = self._create_app_secret()
    
    def _create_app_config_parameter(self) -> aws.ssm.Parameter:
        """
        Create SSM parameter for application configuration.
        
        Returns:
            SSM Parameter resource
        """
        param_name = f"/{self.config.project_name}/{self.config.environment_suffix}/app-config"
        resource_name = self.config.get_resource_name('param-app-config')
        
        app_config = {
            'environment': self.config.environment,
            'environment_suffix': self.config.environment_suffix,
            'region': self.config.primary_region,
            'log_level': 'INFO'
        }
        
        parameter = aws.ssm.Parameter(
            resource_name,
            name=param_name,
            type='String',
            value=json.dumps(app_config),
            description='Application configuration parameters',
            tags=self.config.get_tags_for_resource('SSMParameter', Name=param_name),
            opts=ResourceOptions(parent=self.parent)
        )
        
        return parameter
    
    def _create_environment_parameter(self) -> aws.ssm.Parameter:
        """
        Create SSM parameter for environment information.
        
        Returns:
            SSM Parameter resource
        """
        param_name = f"/{self.config.project_name}/{self.config.environment_suffix}/environment"
        resource_name = self.config.get_resource_name('param-environment')
        
        parameter = aws.ssm.Parameter(
            resource_name,
            name=param_name,
            type='String',
            value=self.config.environment_suffix,
            description='Environment suffix for this deployment',
            tags=self.config.get_tags_for_resource('SSMParameter', Name=param_name),
            opts=ResourceOptions(parent=self.parent)
        )
        
        return parameter
    
    def _create_app_secret(self) -> aws.secretsmanager.Secret:
        """
        Create Secrets Manager secret for sensitive application data.
        Includes region in name for uniqueness.
        
        Returns:
            Secret resource
        """
        secret_name = self.config.get_resource_name('secret-app', include_region=True)
        
        secret = aws.secretsmanager.Secret(
            secret_name,
            name=secret_name,
            description='Application secrets',
            recovery_window_in_days=0,  # Force immediate deletion (for dev purposes)
            tags=self.config.get_tags_for_resource('Secret', Name=secret_name),
            opts=ResourceOptions(parent=self.parent)
        )
        
        # Create a secret version with placeholder data
        secret_data = {
            'api_key': 'placeholder-will-be-rotated',
            'db_password': 'placeholder-will-be-rotated'
        }
        
        aws.secretsmanager.SecretVersion(
            f"{secret_name}-version",
            secret_id=secret.id,
            secret_string=json.dumps(secret_data),
            opts=ResourceOptions(parent=secret)
        )
        
        return secret
    
    def get_app_config_parameter_name(self) -> Output[str]:
        """Get application config parameter name."""
        return self.app_config_parameter.name
    
    def get_app_config_parameter_arn(self) -> Output[str]:
        """Get application config parameter ARN."""
        return self.app_config_parameter.arn
    
    def get_app_secret_arn(self) -> Output[str]:
        """Get application secret ARN."""
        if hasattr(self, 'app_secret'):
            return self.app_secret.arn
        return Output.from_input('')

