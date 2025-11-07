"""
AWS Provider Manager for consistent provider usage across all resources.

This module ensures that all resources use the same AWS provider instance,
preventing provider drift in CI/CD pipelines.
"""

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class AWSProviderManager:
    """
    Manages AWS provider instances for consistent resource provisioning.
    
    This class ensures that all resources use the same provider instance,
    which is critical for:
    - Preventing provider drift in CI/CD pipelines
    - Ensuring consistent region deployment
    - Avoiding random suffixes in provider names
    - Maintaining idempotent infrastructure
    """
    
    def __init__(self, config):
        """
        Initialize the AWS provider manager.
        
        Args:
            config: InfraConfig instance with region and environment settings
        """
        self.config = config
        
        # Create a single, consistent AWS provider for the specified region
        self.provider = aws.Provider(
            'aws-provider',
            region=config.primary_region,
            default_tags=aws.ProviderDefaultTagsArgs(
                tags=config.common_tags
            )
        )
    
    def get_provider(self) -> aws.Provider:
        """
        Get the AWS provider instance.
        
        Returns:
            AWS provider instance
        """
        return self.provider
    
    def get_resource_options(self, depends_on=None, parent=None) -> ResourceOptions:
        """
        Get ResourceOptions with the consistent provider.
        
        Args:
            depends_on: Optional list of resources this resource depends on
            parent: Optional parent resource
            
        Returns:
            ResourceOptions configured with the provider
        """
        opts = ResourceOptions(
            provider=self.provider
        )
        
        if depends_on:
            opts.depends_on = depends_on if isinstance(depends_on, list) else [depends_on]
        
        if parent:
            opts.parent = parent
        
        return opts

