"""
AWS Provider management module.

This module manages a singleton AWS provider instance to ensure consistent
provider usage across all resources and avoid drift in CI/CD pipelines.
"""

from typing import Optional

import pulumi_aws as aws
from infrastructure.config import ServerlessConfig
from pulumi import ResourceOptions


class AWSProviderManager:
    """
    Manages AWS provider instances with singleton pattern.
    
    Ensures consistent provider usage across all resources to avoid
    creating new providers on each build, which causes drift.
    """
    
    _instance: Optional['AWSProviderManager'] = None
    
    def __init__(self, config: ServerlessConfig):
        """
        Initialize AWS Provider Manager.
        
        Args:
            config: ServerlessConfig instance
        """
        self.config = config
        self._provider: Optional[aws.Provider] = None
        self.provider_name = f"{config.project_name}-{config.environment_suffix}-provider"
    
    def get_provider(self) -> Optional[aws.Provider]:
        """
        Get or create the AWS provider instance.
        
        Returns:
            AWS Provider instance if role_arn is configured, None otherwise
        """
        if self._provider is None and self.config.role_arn:
            # Create provider with assume role for cross-account deployment
            self._provider = aws.Provider(
                self.provider_name,
                region=self.config.primary_region,
                assume_role=aws.ProviderAssumeRoleArgs(
                    role_arn=self.config.role_arn,
                    session_name=f"pulumi-{self.config.environment}-deployment"
                ),
                default_tags=aws.ProviderDefaultTagsArgs(
                    tags=self.config.get_common_tags()
                )
            )
        elif self._provider is None:
            # Create provider without assume role
            self._provider = aws.Provider(
                self.provider_name,
                region=self.config.primary_region,
                default_tags=aws.ProviderDefaultTagsArgs(
                    tags=self.config.get_common_tags()
                )
            )
        
        return self._provider
    
    def get_resource_options(self) -> Optional[ResourceOptions]:
        """
        Get ResourceOptions with the provider.
        
        Returns:
            ResourceOptions with provider if configured, None otherwise
        """
        provider = self.get_provider()
        if provider:
            return ResourceOptions(provider=provider)
        return None

