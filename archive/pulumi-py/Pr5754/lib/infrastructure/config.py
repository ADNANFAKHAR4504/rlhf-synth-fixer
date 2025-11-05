"""
Configuration module for the CI/CD pipeline infrastructure.

This module centralizes all configuration including environment variables,
region settings, and naming conventions. It uses ENVIRONMENT_SUFFIX for
consistent naming across all resources.
"""

import os
import re
from typing import Dict, List


class CICDPipelineConfig:
    """Centralized configuration for the CI/CD pipeline infrastructure."""
    
    def __init__(self):
        """Initialize configuration from environment variables."""
        self.environment = os.getenv('ENVIRONMENT', 'dev')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'test')
        self.project_name = 'cicd-pipeline'
        
        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')
        self.secondary_region = os.getenv('SECONDARY_REGION', 'us-west-2')
        self.normalized_region = self._normalize_region(self.primary_region)
        self.normalized_primary_region = self.normalized_region
        self.normalized_secondary_region = self._normalize_region(self.secondary_region)
        
        self.account_id = os.getenv('AWS_ACCOUNT_ID', '123456789012')
        self.notification_email = os.getenv('NOTIFICATION_EMAIL', '')
        
        self.lambda_runtime = 'python3.11'
        self.lambda_timeout = 300
        self.lambda_memory_size = 256
        
        self.codebuild_compute_type = 'BUILD_GENERAL1_SMALL'
        self.codebuild_image = 'aws/codebuild/standard:7.0'
        
        self.log_retention_days = 7
        
        self.kms_key_rotation_enabled = True
        
        self.team = 'DevOps Team'
        self.cost_center = 'Engineering'
        self.owner = 'DevOps Team'
        
        self.deployment_regions: List[str] = [self.primary_region, self.secondary_region]
    
    def _normalize_region(self, region: str) -> str:
        """
        Normalize region name for resource naming.
        
        Example: us-east-1 -> useast1
        """
        return region.replace('-', '')
    
    def normalize_name(self, name: str) -> str:
        """
        Normalize name for case-sensitive resources.
        
        Converts to lowercase and replaces invalid characters with hyphens.
        """
        normalized = re.sub(r'[^a-z0-9-]', '-', name.lower())
        normalized = re.sub(r'-+', '-', normalized).strip('-')
        return normalized
    
    def get_resource_name(self, resource_type: str, include_region: bool = True) -> str:
        """
        Generate consistent resource names with environment suffix and normalized region.
        
        Args:
            resource_type: Type of the resource
            include_region: Whether to include region in the name (default: True)
        
        Returns:
            Formatted resource name with region, environment, and environment suffix
        """
        base_name = f"{self.project_name}-{resource_type}"
        
        if include_region:
            base_name = f"{base_name}-{self.normalized_primary_region}"
        
        base_name = f"{base_name}-{self.environment}-{self.environment_suffix}"
        
        return base_name
    
    def get_normalized_resource_name(self, resource_type: str, include_region: bool = True) -> str:
        """
        Generate normalized resource names for case-sensitive resources.
        
        This is specifically for resources like S3 buckets that require lowercase names.
        """
        name = self.get_resource_name(resource_type, include_region)
        return self.normalize_name(name)
    
    def get_common_tags(self) -> Dict[str, str]:
        """Get common tags for all resources."""
        return {
            'Project': self.project_name,
            'Environment': self.environment,
            'EnvironmentSuffix': self.environment_suffix,
            'Team': self.team,
            'CostCenter': self.cost_center,
            'Owner': self.owner,
            'ManagedBy': 'Pulumi',
            'Region': self.normalized_primary_region
        }
