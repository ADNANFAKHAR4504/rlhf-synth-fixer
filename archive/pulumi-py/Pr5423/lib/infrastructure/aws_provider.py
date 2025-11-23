"""
AWS Provider module for consistent provider usage.

This module creates a single AWS provider instance to avoid drift in CI/CD pipelines.
The provider is created once and reused across all resources to prevent the
'resource already exists' errors on consecutive deployments.
"""

import os
from typing import Optional

import pulumi_aws as aws

from .config import MultiEnvConfig


class AWSProviderManager:
    """
    Manages a consistent AWS provider instance.
    
    Ensures all resources use the same provider without random suffixes,
    preventing drift in CI/CD pipelines and multi-region deployments.
    """
    
    def __init__(self, config: MultiEnvConfig):
        """
        Initialize the AWS provider manager.
        
        Args:
            config: MultiEnvConfig instance
        """
        self.config = config
        self._provider = None
    
    def get_provider(self) -> Optional[aws.Provider]:
        """
        Get or create the AWS provider instance.
        
        Creates a provider with assume role support for cross-account deployments.
        Uses default tags to ensure all resources are properly tagged.
        
        Returns:
            AWS Provider instance or None if using default provider
        """
        if self._provider is None:
            role_arn = os.getenv(f"{self.config.environment.upper()}_ROLE_ARN")
            
            if role_arn:
                self._provider = aws.Provider(
                    'aws-provider',
                    region=self.config.primary_region,
                    assume_role=aws.ProviderAssumeRoleArgs(
                        role_arn=role_arn,
                        session_name=f"pulumi-{self.config.environment}-deployment"
                    ),
                    default_tags=aws.ProviderDefaultTagsArgs(
                        tags=self.config.get_common_tags()
                    )
                )
            else:
                self._provider = aws.Provider(
                    'aws-provider',
                    region=self.config.primary_region,
                    default_tags=aws.ProviderDefaultTagsArgs(
                        tags=self.config.get_common_tags()
                    )
                )
        
        return self._provider

