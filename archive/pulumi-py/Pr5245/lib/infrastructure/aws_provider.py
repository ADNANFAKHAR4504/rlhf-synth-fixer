"""
AWS Provider module for consistent provider usage.

This module creates a single AWS provider instance to avoid drift in CI/CD pipelines.
"""

import pulumi_aws as aws

from .config import TransactionPipelineConfig


class AWSProviderManager:
    """
    Manages a consistent AWS provider instance.
    
    Ensures all resources use the same provider without random suffixes,
    preventing drift in CI/CD pipelines.
    """
    
    def __init__(self, config: TransactionPipelineConfig):
        """
        Initialize the AWS provider manager.
        
        Args:
            config: TransactionPipelineConfig instance
        """
        self.config = config
        self._provider = None
    
    def get_provider(self) -> aws.Provider:
        """
        Get or create the AWS provider instance.
        
        Returns:
            AWS Provider instance
        """
        if self._provider is None:
            self._provider = aws.Provider(
                'aws-provider',
                region=self.config.primary_region,
                default_tags=aws.ProviderDefaultTagsArgs(
                    tags=self.config.get_common_tags()
                )
            )
        return self._provider

