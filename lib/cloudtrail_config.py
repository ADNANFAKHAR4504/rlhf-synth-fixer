"""
cloudtrail_config.py

This module contains configuration settings for CloudTrail deployment,
including handling of maximum trails limits per region.
"""

import os
from typing import List

# Configuration for handling CloudTrail maximum limits
# AWS allows maximum 5 trails per region per account
MAX_TRAILS_PER_REGION = 5

# Regions where CloudTrail creation should be skipped due to maximum limits
# This can be configured via environment variables or Pulumi config
DEFAULT_SKIP_CLOUDTRAIL_REGIONS = ["us-east-1"]  # Default to skip us-east-1

def get_skip_cloudtrail_regions() -> List[str]:
    """
    Get the list of regions where CloudTrail creation should be skipped.
    
    Returns:
        List of region names where CloudTrail creation should be skipped
    """
    # Check environment variable first
    env_skip_regions = os.getenv("SKIP_CLOUDTRAIL_REGIONS")
    if env_skip_regions:
        return [region.strip() for region in env_skip_regions.split(",")]
    
    # Return default regions
    return DEFAULT_SKIP_CLOUDTRAIL_REGIONS

def should_skip_cloudtrail_creation(region: str) -> bool:
    """
    Check if CloudTrail creation should be skipped for a given region.
    
    Args:
        region: AWS region name
        
    Returns:
        True if CloudTrail creation should be skipped, False otherwise
    """
    skip_regions = get_skip_cloudtrail_regions()
    return region in skip_regions

def get_cloudtrail_name(project_name: str, environment: str, region: str, suffix: str = None) -> str:
    """
    Generate a unique CloudTrail name to avoid conflicts.
    
    Args:
        project_name: Name of the project
        environment: Environment name
        region: AWS region
        suffix: Optional suffix to make the name unique
        
    Returns:
        Unique CloudTrail name
    """
    base_name = f"{project_name}-{environment}-trail-{region}"
    if suffix:
        return f"{base_name}-{suffix}"
    return base_name
