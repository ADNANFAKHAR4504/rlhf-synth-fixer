"""
AWS Provider module for the serverless payment processing system.

This module manages the AWS Pulumi provider instance, ensuring consistent
usage across all resources without random suffixes.
"""

from typing import Optional

import pulumi_aws as aws

from .config import PaymentProcessingConfig


class AWSProviderManager:
    """
    Manages the AWS Pulumi provider instance.
    
    Ensures consistent provider usage without random suffixes to avoid
    creating new providers on each build, which causes drift in CI/CD pipelines.
    """
    
    def __init__(self, config: PaymentProcessingConfig, cross_account_role_arn: Optional[str] = None):
        """
        Initialize the AWS provider manager.
        
        Args:
            config: PaymentProcessingConfig instance
            cross_account_role_arn: Optional cross-account role ARN for assume role
        """
        self.config = config
        self.cross_account_role_arn = cross_account_role_arn
        self._provider: Optional[aws.Provider] = None
    
    def get_provider(self) -> Optional[aws.Provider]:
        """
        Get the AWS provider instance.
        
        Returns None if no custom provider is needed (uses default provider).
        Creates a consistent provider instance if cross-account role is specified.
        """
        if self.cross_account_role_arn and not self._provider:
            self._provider = aws.Provider(
                'payment-processing-provider',
                region=self.config.primary_region,
                assume_role=aws.ProviderAssumeRoleArgs(
                    role_arn=self.cross_account_role_arn
                )
            )
        
        return self._provider
    
    def get_resource_options(self) -> dict:
        """
        Get resource options with the provider.
        
        Returns:
            Dictionary with provider option if custom provider exists
        """
        provider = self.get_provider()
        if provider:
            return {'provider': provider}
        return {}


