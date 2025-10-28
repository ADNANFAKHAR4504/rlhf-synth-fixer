"""
AWS Provider management for consistent resource deployment.

This module ensures all resources are deployed to the correct region
with consistent tagging by using a single provider instance.
"""

import pulumi_aws as aws

from .config import ServerlessConfig


def get_aws_provider(config: ServerlessConfig) -> aws.Provider:
    """
    Create and return a consistent AWS provider instance.
    
    This ensures all resources are deployed to the specified region
    and have consistent default tags applied.
    
    The provider name is deterministic (no random suffixes) to avoid
    creating new providers on each build, which would cause drift in CI/CD.
    
    Args:
        config: ServerlessConfig instance with region and tagging info
        
    Returns:
        AWS Provider instance configured for the target region
    """
    return aws.Provider(
        resource_name=f"aws-provider-{config.region_short}-{config.environment_suffix}",
        region=config.primary_region,
        default_tags=aws.ProviderDefaultTagsArgs(
            tags=config.get_common_tags()
        )
    )

