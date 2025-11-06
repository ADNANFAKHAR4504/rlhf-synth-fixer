"""
Configuration module for the serverless processor infrastructure.

This module centralizes all configuration including environment variables,
region settings, and naming conventions. It uses ENVIRONMENT_SUFFIX for
consistent naming across all resources.
"""

import os
import re
from dataclasses import dataclass
from typing import Dict


@dataclass
class ServerlessProcessorConfig:
    """Centralized configuration for the serverless processor infrastructure."""
    
    environment: str
    environment_suffix: str
    project_name: str
    
    primary_region: str
    normalized_region: str
    account_id: str
    
    lambda_runtime: str
    lambda_timeout: int
    lambda_memory_size: int
    
    api_stage_name: str
    api_throttle_rate_limit: int
    api_throttle_burst_limit: int
    
    s3_lifecycle_glacier_days: int
    s3_lifecycle_expiration_days: int
    s3_retain_on_delete: bool
    
    log_retention_days: int
    enable_xray_tracing: bool
    
    processing_config: Dict[str, any]
    
    team: str
    application: str
    cost_center: str
    
    def __init__(self):
        """Initialize configuration from environment variables."""
        self.environment = os.getenv('ENVIRONMENT', 'Production')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        self.project_name = os.getenv('PROJECT_NAME', 'serverless-processor')
        
        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')
        self.normalized_region = self._normalize_region(self.primary_region)
        self.account_id = ''
        
        self.lambda_runtime = os.getenv('LAMBDA_RUNTIME', 'python3.11')
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '15'))
        self.lambda_memory_size = int(os.getenv('LAMBDA_MEMORY_SIZE', '512'))
        
        self.api_stage_name = os.getenv('API_STAGE_NAME', 'prod')
        self.api_throttle_rate_limit = int(os.getenv('API_THROTTLE_RATE_LIMIT', '1000'))
        self.api_throttle_burst_limit = int(os.getenv('API_THROTTLE_BURST_LIMIT', '2000'))
        
        self.s3_lifecycle_glacier_days = int(os.getenv('S3_LIFECYCLE_GLACIER_DAYS', '90'))
        self.s3_lifecycle_expiration_days = int(os.getenv('S3_LIFECYCLE_EXPIRATION_DAYS', '365'))
        self.s3_retain_on_delete = os.getenv('S3_RETAIN_ON_DELETE', 'false').lower() == 'true'
        
        self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '7'))
        self.enable_xray_tracing = os.getenv('ENABLE_XRAY_TRACING', 'true').lower() == 'true'
        
        self.processing_config = {
            'max_size_mb': int(os.getenv('MAX_SIZE_MB', '10')),
            'allowed_content_types': os.getenv('ALLOWED_CONTENT_TYPES', 'application/json,text/plain').split(',')
        }
        
        self.team = os.getenv('TEAM', 'platform')
        self.application = os.getenv('APPLICATION', 'serverless-processor')
        self.cost_center = os.getenv('COST_CENTER', 'engineering-001')
    
    def _normalize_region(self, region: str) -> str:
        """
        Normalize AWS region by removing hyphens for use in resource names.
        
        Args:
            region: AWS region (e.g., 'us-east-1')
            
        Returns:
            Normalized region string (e.g., 'useast1')
        """
        return region.replace('-', '')
    
    def normalize_name(self, name: str) -> str:
        """
        Normalize resource name to be lowercase and alphanumeric.
        
        Args:
            name: Resource name to normalize
            
        Returns:
            Normalized name (lowercase, alphanumeric with hyphens)
        """
        normalized = re.sub(r'[^a-zA-Z0-9-]', '', name.lower())
        normalized = re.sub(r'-+', '-', normalized)
        return normalized.strip('-')
    
    def get_resource_name(self, resource_type: str, include_region: bool = True) -> str:
        """
        Generate a consistent resource name following the naming convention.
        
        Args:
            resource_type: Type of resource (e.g., 'processor-lambda', 'data-bucket')
            include_region: Whether to include region in the name
            
        Returns:
            Formatted resource name
        """
        base_name = f"{self.project_name}-{resource_type}"
        
        if include_region:
            base_name = f"{base_name}-{self.normalized_region}"
        
        base_name = f"{base_name}-{self.environment}-{self.environment_suffix}"
        
        return base_name
    
    def get_normalized_resource_name(self, resource_type: str, include_region: bool = True) -> str:
        """
        Generate a normalized resource name (lowercase, suitable for S3, etc.).
        
        Args:
            resource_type: Type of resource
            include_region: Whether to include region in the name
            
        Returns:
            Normalized resource name
        """
        name = self.get_resource_name(resource_type, include_region)
        return self.normalize_name(name)
    
    def get_common_tags(self) -> Dict[str, str]:
        """
        Get common tags to apply to all resources.
        
        Returns:
            Dictionary of common tags
        """
        return {
            'Environment': self.environment,
            'EnvironmentSuffix': self.environment_suffix,
            'Application': self.application,
            'CostCenter': self.cost_center,
            'Team': self.team,
            'ManagedBy': 'Pulumi',
            'Project': self.project_name
        }

