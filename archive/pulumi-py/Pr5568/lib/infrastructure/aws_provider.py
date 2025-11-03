"""
AWS Provider management module.

This module manages the AWS Pulumi provider instance to ensure consistency
across all resources and avoid provider drift in CI/CD pipelines.
"""

from typing import Optional

import pulumi
import pulumi_aws as aws

from .config import ServerlessConfig


class AWSProviderManager:
    """
    Manages AWS Pulumi provider instances.
    
    Ensures consistent provider usage across all resources to avoid
    drift in CI/CD pipelines.
    """
    
    def __init__(self, config: ServerlessConfig):
        """
        Initialize the AWS provider manager.
        
        Args:
            config: ServerlessConfig instance
        """
        self.config = config
        self._provider: Optional[aws.Provider] = None
    
    def get_provider(self) -> Optional[aws.Provider]:
        """
        Get or create the AWS provider instance.
        
        Returns:
            AWS Provider instance or None for default provider
        """
        if self._provider is None:
            assume_role_arn = self.config.environment_suffix
            
            if assume_role_arn and assume_role_arn.startswith('arn:aws:iam::'):
                self._provider = aws.Provider(
                    'aws-provider',
                    region=self.config.primary_region,
                    assume_role=aws.ProviderAssumeRoleArgs(
                        role_arn=assume_role_arn
                    )
                )
            else:
                return None
        
        return self._provider
    
    def get_resource_options(self) -> pulumi.ResourceOptions:
        """
        Get ResourceOptions with the provider attached.
        
        Returns:
            ResourceOptions with provider or empty options
        """
        provider = self.get_provider()
        if provider:
            return pulumi.ResourceOptions(provider=provider)
        return pulumi.ResourceOptions()

