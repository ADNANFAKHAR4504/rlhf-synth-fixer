"""
AWS Provider management module.

This module manages a consistent AWS provider instance to prevent drift
and ensure all resources use the same provider configuration.
"""

import pulumi_aws as aws
from infrastructure.config import InfraConfig


class AWSProviderManager:
    """
    Manages a consistent AWS provider instance.
    
    This ensures all resources use the same provider configuration,
    preventing drift in CI/CD pipelines caused by multiple provider instances.
    """
    
    def __init__(self, config: InfraConfig):
        """
        Initialize the AWS provider manager.
        
        Args:
            config: Infrastructure configuration
        """
        self.config = config
        self._provider = None
    
    def get_provider(self) -> aws.Provider:
        """
        Get or create the AWS provider instance.
        
        Returns:
            AWS provider instance
        """
        if self._provider is None:
            # Create a single consistent provider without random suffixes
            provider_name = f"aws-provider-{self.config.environment_suffix}"
            
            self._provider = aws.Provider(
                provider_name,
                region=self.config.primary_region,
                default_tags=aws.ProviderDefaultTagsArgs(
                    tags=self.config.get_common_tags()
                )
            )
        
        return self._provider
