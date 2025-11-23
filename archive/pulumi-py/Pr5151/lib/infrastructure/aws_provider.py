"""
AWS Provider configuration module.

This module creates a consistent AWS provider instance without random suffixes
to avoid creating new providers on each build, which causes drift in CI/CD pipelines.
"""
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

from .config import InfraConfig


def create_aws_provider(config: InfraConfig, parent: pulumi.ComponentResource = None) -> aws.Provider:
    """
    Create a consistent AWS provider instance.
    
    This provider uses a deterministic name based on the environment suffix
    to ensure the same provider is reused across deployments, preventing drift.
    
    Args:
        config: Infrastructure configuration
        parent: Parent Pulumi component resource
        
    Returns:
        AWS Provider instance
    """
    provider_name = f"aws-provider-{config.region_normalized}-{config.environment_suffix}"
    
    opts = ResourceOptions(parent=parent) if parent else None
    
    provider = aws.Provider(
        provider_name,
        region=config.primary_region,
        default_tags=aws.ProviderDefaultTagsArgs(
            tags=config.get_common_tags()
        ),
        opts=opts
    )
    
    return provider

