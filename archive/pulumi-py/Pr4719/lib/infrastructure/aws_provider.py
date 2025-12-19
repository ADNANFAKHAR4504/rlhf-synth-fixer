"""
AWS Provider management module.

This module provides consistent provider configuration across all regions
without random suffixes to prevent provider drift in CI/CD.
"""

from typing import Dict, Optional

import pulumi
import pulumi_aws as aws

from .config import ServerlessConfig


class AWSProviderManager:
    """
    Manages AWS providers for consistent resource creation.
    
    This ensures no random provider suffixes are created, preventing
    drift in CI/CD pipelines.
    """
    
    def __init__(self, config: ServerlessConfig):
        """
        Initialize the provider manager.
        
        Args:
            config: ServerlessConfig instance
        """
        self.config = config
        self._providers: Dict[str, aws.Provider] = {}
        
        # Create a provider for the primary region
        self._create_provider(config.primary_region)
    
    def _create_provider(self, region: str) -> aws.Provider:
        """
        Create an AWS provider for a specific region.
        
        Args:
            region: AWS region code
            
        Returns:
            AWS Provider instance
        """
        if region not in self._providers:
            # Use a consistent name without random suffixes
            provider_name = f"aws-{region}"
            
            self._providers[region] = aws.Provider(
                provider_name,
                region=region,
                default_tags=aws.ProviderDefaultTagsArgs(
                    tags=self.config.get_common_tags()
                )
            )
        
        return self._providers[region]
    
    def get_provider(self, region: Optional[str] = None) -> aws.Provider:
        """
        Get the AWS provider for a specific region.
        
        Args:
            region: AWS region code. If None, returns primary region provider.
            
        Returns:
            AWS Provider instance
        """
        region = region or self.config.primary_region
        
        if region not in self._providers:
            self._create_provider(region)
        
        return self._providers[region]
    
    def get_region(self, region: Optional[str] = None) -> str:
        """
        Get the region string.
        
        Args:
            region: AWS region code. If None, returns primary region.
            
        Returns:
            AWS region string
        """
        return region or self.config.primary_region


