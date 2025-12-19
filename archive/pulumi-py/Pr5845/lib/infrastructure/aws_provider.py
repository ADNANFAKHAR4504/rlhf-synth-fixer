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
    drift in CI/CD pipelines by using a single provider instance.
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
            return None
        
        return self._provider
    
    def get_resource_options(self, depends_on: list = None) -> pulumi.ResourceOptions:
        """
        Get ResourceOptions with the provider attached.
        
        Args:
            depends_on: Optional list of resources this resource depends on
            
        Returns:
            ResourceOptions with provider or empty options
        """
        provider = self.get_provider()
        if provider:
            return pulumi.ResourceOptions(provider=provider, depends_on=depends_on or [])
        return pulumi.ResourceOptions(depends_on=depends_on or [])

