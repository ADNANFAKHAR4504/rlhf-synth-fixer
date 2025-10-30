"""
AWS Provider module for consistent provider management.

This module ensures a single, stable AWS provider instance is used across
all resources to avoid drift in CI/CD pipelines.
"""

import pulumi_aws as aws
from pulumi import ResourceOptions

from .config import FinancialDataPipelineConfig


class AWSProviderManager:
    """
    Manages a consistent AWS provider instance.
    
    This ensures all resources use the same provider configuration
    and prevents drift caused by creating new providers on each build.
    """
    
    def __init__(self, config: FinancialDataPipelineConfig):
        """
        Initialize the AWS provider manager.
        
        Args:
            config: FinancialDataPipelineConfig instance
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
            provider_name = f"aws-provider-{self.config.environment_suffix}"
            
            self._provider = aws.Provider(
                provider_name,
                region=self.config.primary_region,
                default_tags=aws.ProviderDefaultTagsArgs(
                    tags=self.config.get_common_tags()
                )
            )
        
        return self._provider




