"""
AWS Provider management for multi-region deployments.

This module creates consistent AWS providers without random suffixes
to prevent drift in CI/CD pipelines.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class AWSProviderManager:
    """
    Manages AWS providers for multi-region deployments.
    
    Uses consistent naming without random suffixes to prevent
    provider drift issues in CI/CD.
    """
    
    def __init__(self, primary_region: str, secondary_regions: list = None):
        """
        Initialize AWS provider manager.
        
        Args:
            primary_region: Primary AWS region
            secondary_regions: List of secondary AWS regions
        """
        self.primary_region = primary_region
        self.secondary_regions = secondary_regions or []
        self.providers: Dict[str, aws.Provider] = {}
        
        self._create_providers()
    
    def _create_providers(self):
        """Create AWS providers for all regions."""
        # Create primary provider
        self.providers[self.primary_region] = aws.Provider(
            f"aws-provider-{self.primary_region}",
            region=self.primary_region,
            opts=ResourceOptions(
                # No random suffix - consistent naming
                aliases=[pulumi.Alias(name=f"aws-{self.primary_region}")]
            )
        )
        
        # Create secondary providers
        for region in self.secondary_regions:
            self.providers[region] = aws.Provider(
                f"aws-provider-{region}",
                region=region,
                opts=ResourceOptions(
                    aliases=[pulumi.Alias(name=f"aws-{region}")]
                )
            )
    
    def get_provider(self, region: str) -> aws.Provider:
        """
        Get AWS provider for a specific region.
        
        Args:
            region: AWS region
            
        Returns:
            AWS Provider for the region
        """
        if region not in self.providers:
            raise ValueError(f"Provider for region {region} not initialized")
        return self.providers[region]
    
    def get_primary_provider(self) -> aws.Provider:
        """
        Get primary AWS provider.
        
        Returns:
            Primary AWS Provider
        """
        return self.providers[self.primary_region]

