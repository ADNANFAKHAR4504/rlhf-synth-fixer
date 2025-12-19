"""
Secrets and parameter management module.

This module manages AWS Secrets Manager and SSM Parameter Store
for secure configuration storage.
"""

from typing import Dict, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import MigrationConfig


class SecretsStack:
    """
    Manages secrets and parameters for the migration solution.
    
    Supports both AWS Secrets Manager and SSM Parameter Store
    for secure configuration management.
    """
    
    def __init__(self, config: MigrationConfig, provider_manager: AWSProviderManager):
        """
        Initialize secrets stack.
        
        Args:
            config: Migration configuration
            provider_manager: AWS provider manager
        """
        self.config = config
        self.provider_manager = provider_manager
        self.secrets: Dict[str, Dict[str, aws.secretsmanager.Secret]] = {}
        self.parameters: Dict[str, Dict[str, aws.ssm.Parameter]] = {}
        
        # Create secrets/parameters for all regions
        self._create_configuration_storage()
    
    def _create_configuration_storage(self):
        """Create secrets or parameters based on configuration."""
        for region in self.config.all_regions:
            if self.config.use_secrets_manager:
                self._create_secrets(region)
            else:
                self._create_parameters(region)
    
    def _create_secrets(self, region: str):
        """
        Create Secrets Manager secrets for a region.
        
        Args:
            region: AWS region
        """
        provider = self.provider_manager.get_provider(region)
        self.secrets[region] = {}
        
        # Deployment configuration secret
        secret_name = self.config.get_resource_name('deployment-config', region)
        secret = aws.secretsmanager.Secret(
            secret_name,
            name=secret_name,
            description=f"Deployment configuration for {region}",
            recovery_window_in_days=7,
            tags=self.config.get_region_tags(region),
            opts=ResourceOptions(provider=provider)
        )
        
        # Create secret version with initial configuration
        aws.secretsmanager.SecretVersion(
            f"{secret_name}-version",
            secret_id=secret.id,
            secret_string=pulumi.Output.json_dumps({
                "region": region,
                "environment": self.config.environment,
                "log_level": "INFO",
                "enable_validation": self.config.enable_validation
            }),
            opts=ResourceOptions(provider=provider, parent=secret)
        )
        
        self.secrets[region]['deployment-config'] = secret
        
        # Migration parameters secret
        params_secret_name = self.config.get_resource_name('migration-params', region)
        params_secret = aws.secretsmanager.Secret(
            params_secret_name,
            name=params_secret_name,
            description=f"Migration parameters for {region}",
            recovery_window_in_days=7,
            tags=self.config.get_region_tags(region),
            opts=ResourceOptions(provider=provider)
        )
        
        aws.secretsmanager.SecretVersion(
            f"{params_secret_name}-version",
            secret_id=params_secret.id,
            secret_string=pulumi.Output.json_dumps({
                "timeout": self.config.validation_timeout,
                "auto_rollback": self.config.enable_auto_rollback,
                "notification_enabled": self.config.enable_notifications
            }),
            opts=ResourceOptions(provider=provider, parent=params_secret)
        )
        
        self.secrets[region]['migration-params'] = params_secret
    
    def _create_parameters(self, region: str):
        """
        Create SSM parameters for a region.
        
        Args:
            region: AWS region
        """
        provider = self.provider_manager.get_provider(region)
        self.parameters[region] = {}
        
        # Deployment configuration parameter
        param_name = f"/{self.config.project_name}/{self.config.stack_name}/{region}/deployment-config"
        param = aws.ssm.Parameter(
            self.config.get_resource_name('deployment-config-param', region),
            name=param_name,
            type="String",
            tier=self.config.parameter_tier,
            value=pulumi.Output.json_dumps({
                "region": region,
                "environment": self.config.environment,
                "log_level": "INFO",
                "enable_validation": self.config.enable_validation
            }),
            description=f"Deployment configuration for {region}",
            tags=self.config.get_region_tags(region),
            opts=ResourceOptions(provider=provider)
        )
        
        self.parameters[region]['deployment-config'] = param
        
        # Migration parameters
        migration_param_name = f"/{self.config.project_name}/{self.config.stack_name}/{region}/migration-params"
        migration_param = aws.ssm.Parameter(
            self.config.get_resource_name('migration-params-param', region),
            name=migration_param_name,
            type="String",
            tier=self.config.parameter_tier,
            value=pulumi.Output.json_dumps({
                "timeout": self.config.validation_timeout,
                "auto_rollback": self.config.enable_auto_rollback,
                "notification_enabled": self.config.enable_notifications
            }),
            description=f"Migration parameters for {region}",
            tags=self.config.get_region_tags(region),
            opts=ResourceOptions(provider=provider)
        )
        
        self.parameters[region]['migration-params'] = migration_param
        
        # Environment-specific configuration
        env_param_name = f"/{self.config.project_name}/{self.config.stack_name}/{region}/environment"
        env_param = aws.ssm.Parameter(
            self.config.get_resource_name('environment-param', region),
            name=env_param_name,
            type="String",
            tier=self.config.parameter_tier,
            value=self.config.environment,
            description=f"Environment identifier for {region}",
            tags=self.config.get_region_tags(region),
            opts=ResourceOptions(provider=provider)
        )
        
        self.parameters[region]['environment'] = env_param
    
    def get_secret_arn(self, region: str, secret_key: str) -> Output[str]:
        """
        Get ARN of a Secrets Manager secret.
        
        Args:
            region: AWS region
            secret_key: Secret key identifier
            
        Returns:
            Secret ARN as Output
        """
        if region in self.secrets and secret_key in self.secrets[region]:
            return self.secrets[region][secret_key].arn
        raise ValueError(f"Secret {secret_key} not found in region {region}")
    
    def get_secret_name(self, region: str, secret_key: str) -> Output[str]:
        """
        Get name of a Secrets Manager secret.
        
        Args:
            region: AWS region
            secret_key: Secret key identifier
            
        Returns:
            Secret name as Output
        """
        if region in self.secrets and secret_key in self.secrets[region]:
            return self.secrets[region][secret_key].name
        raise ValueError(f"Secret {secret_key} not found in region {region}")
    
    def get_parameter_arn(self, region: str, param_key: str) -> Output[str]:
        """
        Get ARN of an SSM parameter.
        
        Args:
            region: AWS region
            param_key: Parameter key identifier
            
        Returns:
            Parameter ARN as Output
        """
        if region in self.parameters and param_key in self.parameters[region]:
            return self.parameters[region][param_key].arn
        raise ValueError(f"Parameter {param_key} not found in region {region}")
    
    def get_parameter_name(self, region: str, param_key: str) -> Output[str]:
        """
        Get name of an SSM parameter.
        
        Args:
            region: AWS region
            param_key: Parameter key identifier
            
        Returns:
            Parameter name as Output
        """
        if region in self.parameters and param_key in self.parameters[region]:
            return self.parameters[region][param_key].name
        raise ValueError(f"Parameter {param_key} not found in region {region}")
    
    def get_all_secret_arns(self, region: str) -> list:
        """
        Get all secret ARNs for a region.
        
        Args:
            region: AWS region
            
        Returns:
            List of secret ARNs
        """
        if region not in self.secrets:
            return []
        return [secret.arn for secret in self.secrets[region].values()]
    
    def get_all_parameter_arns(self, region: str) -> list:
        """
        Get all parameter ARNs for a region.
        
        Args:
            region: AWS region
            
        Returns:
            List of parameter ARNs
        """
        if region not in self.parameters:
            return []
        return [param.arn for param in self.parameters[region].values()]

