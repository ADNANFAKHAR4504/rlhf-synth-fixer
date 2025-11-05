"""
AWS Provider management module.

This module manages AWS providers with consistent configuration
and enforces region deployment without random suffixes.
"""

import pulumi_aws as aws
from pulumi import ResourceOptions

from .config import ServerlessConfig


class AWSProviderManager:
    """
    Manages AWS provider for the primary region.
    
    Ensures consistent provider usage across all infrastructure components
    without random suffixes or timestamps.
    """
    
    def __init__(self, config: ServerlessConfig):
        """
        Initialize the AWS provider manager.
        
        Args:
            config: Serverless configuration instance
        """
        self.config = config
        self.provider = self._create_provider()
    
    def _create_provider(self) -> aws.Provider:
        """Create AWS provider for the primary region."""
        provider_name = f"aws-{self.config.primary_region}-{self.config.environment_suffix}"
        
        return aws.Provider(
            provider_name,
            region=self.config.primary_region,
            default_tags=aws.ProviderDefaultTagsArgs(
                tags=self.config.get_common_tags()
            ),
            opts=ResourceOptions(
                retain_on_delete=False
            )
        )
    
    def get_provider(self) -> aws.Provider:
        """
        Get the AWS provider for the primary region.
        
        Returns:
            AWS Provider instance
        """
        return self.provider

