"""
AWS Provider configuration for multi-region deployment.

This module provides stable AWS provider instances for consistent
deployments across regions without provider drift.
"""

import os
import sys
from typing import Dict, Optional

import pulumi
from pulumi_aws import Provider

# Add infrastructure directory to Python path
infrastructure_path = os.path.dirname(__file__)
if infrastructure_path not in sys.path:
    sys.path.insert(0, infrastructure_path)

from config import PipelineConfig


class AWSProviderManager:
    """Manages AWS providers for multi-region deployment."""
    
    def __init__(self, config: PipelineConfig):
        self.config = config
        self._providers: Dict[str, Provider] = {}
        self._create_providers()
    
    def _create_providers(self):
        """Create stable provider instances for each region."""
        for region in self.config.regions:
            provider_name = f"aws-provider-{region}-stable"
            
            self._providers[region] = Provider(
                provider_name,
                region=region,
                # Use stable configuration to prevent provider drift
                default_tags={
                    "tags": self.config.get_region_tags(region)
                }
            )
    
    def get_provider(self, region: str) -> Provider:
        """Get provider for specific region."""
        if region not in self._providers:
            raise ValueError(f"No provider configured for region: {region}")
        return self._providers[region]
    
    def get_primary_provider(self) -> Provider:
        """Get provider for primary region."""
        return self.get_provider(self.config.primary_region)
    
    def get_secondary_provider(self) -> Provider:
        """Get provider for secondary region."""
        return self.get_provider(self.config.secondary_region)
    
    def get_all_providers(self) -> Dict[str, Provider]:
        """Get all providers."""
        return self._providers.copy()
