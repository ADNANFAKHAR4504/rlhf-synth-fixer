"""
AWS Provider Manager for consistent provider usage across all resources.

This module ensures all resources use the same provider instance to avoid
drift in CI/CD pipelines.
"""

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

from .config import ObservabilityConfig


class AWSProviderManager:
    """
    Manages a single, consistent AWS Pulumi provider instance.
    
    This ensures all resources are deployed to the correct region with default tags
    and avoids creating new providers on each build.
    """
    
    def __init__(self, config: ObservabilityConfig):
        """
        Initialize the AWS Provider Manager.
        
        Args:
            config: Observability configuration
        """
        self.config = config
        self.provider = self._create_provider()
    
    def _create_provider(self) -> aws.Provider:
        """
        Create a single AWS provider instance with default tags.
        
        Returns:
            AWS Provider instance
        """
        return aws.Provider(
            'aws-provider',
            region=self.config.primary_region,
            default_tags=aws.ProviderDefaultTagsArgs(
                tags=self.config.get_common_tags()
            )
        )
    
    def get_provider(self) -> aws.Provider:
        """
        Get the AWS provider instance.
        
        Returns:
            AWS Provider instance
        """
        return self.provider
    
    def get_resource_options(
        self,
        depends_on=None,
        parent=None,
        delete_before_replace: bool = None
    ) -> ResourceOptions:
        """
        Get resource options with the consistent provider.
        
        Args:
            depends_on: Resources this resource depends on
            parent: Parent resource
            delete_before_replace: Whether to delete before replacing
            
        Returns:
            ResourceOptions with provider configured
        """
        opts = ResourceOptions(
            provider=self.provider,
            depends_on=depends_on if depends_on else None,
            parent=parent
        )
        
        if delete_before_replace is not None:
            opts.delete_before_replace = delete_before_replace
        
        return opts

