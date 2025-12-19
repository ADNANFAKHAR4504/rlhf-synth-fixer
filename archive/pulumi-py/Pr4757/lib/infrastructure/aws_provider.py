"""
AWS Provider management module.

This module manages AWS providers for multi-region deployments with consistent
configuration and without random suffixes.
"""

from typing import Dict, Optional

import pulumi_aws as aws
from pulumi import ResourceOptions

from .config import MigrationConfig


class AWSProviderManager:
    """
    Manages AWS providers for multiple regions.
    
    Ensures consistent provider usage across all infrastructure components
    without random suffixes or timestamps.
    """
    
    def __init__(self, config: MigrationConfig):
        """
        Initialize the AWS provider manager.
        
        Args:
            config: Migration configuration instance
        """
        self.config = config
        self.providers: Dict[str, aws.Provider] = {}
        
        # Create providers for all regions
        self._create_providers()
    
    def _create_providers(self):
        """Create AWS providers for all configured regions."""
        for region in self.config.all_regions:
            provider_name = f"aws-{region}-{self.config.environment}-{self.config.environment_suffix}"
            
            self.providers[region] = aws.Provider(
                provider_name,
                region=region,
                default_tags=aws.ProviderDefaultTagsArgs(
                    tags=self.config.get_region_tags(region)
                ),
                opts=ResourceOptions(
                    # Ensure provider is not recreated on each deployment
                    retain_on_delete=False
                )
            )
    
    def get_provider(self, region: str) -> aws.Provider:
        """
        Get the AWS provider for a specific region.
        
        Args:
            region: AWS region code
            
        Returns:
            AWS Provider for the specified region
            
        Raises:
            ValueError: If provider for region doesn't exist
        """
        if region not in self.providers:
            raise ValueError(f"Provider for region {region} not found")
        return self.providers[region]
    
    def get_primary_provider(self) -> aws.Provider:
        """
        Get the primary region AWS provider.
        
        Returns:
            AWS Provider for the primary region
        """
        return self.get_provider(self.config.primary_region)

