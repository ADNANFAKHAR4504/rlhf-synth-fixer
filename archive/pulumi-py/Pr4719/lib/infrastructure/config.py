"""
Configuration module for the serverless backend architecture.

This module centralizes all configuration including environment variables,
region settings, and naming conventions. It uses ENVIRONMENT_SUFFIX for
consistent naming across all resources.
"""

import os
import re
from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class ServerlessConfig:
    """Centralized configuration for the serverless backend."""
    
    # Environment and naming
    environment: str
    environment_suffix: str
    project_name: str
    
    # Primary region (architecture is single-region but regionally agnostic)
    primary_region: str
    
    # Lambda configuration
    lambda_runtime: str
    lambda_timeout: int
    lambda_memory_size: int
    
    # API Gateway configuration
    api_stages: List[str]
    cors_allow_origins: List[str]
    api_throttle_rate_limit: int
    api_throttle_burst_limit: int
    
    # S3 configuration
    s3_encryption_algorithm: str
    enable_s3_versioning: bool
    
    # SSM Parameter Store
    ssm_parameter_prefix: str
    
    # CloudWatch configuration
    log_retention_days: int
    alarm_evaluation_periods: int
    
    def __init__(self):
        """Initialize configuration from environment variables."""
        # Environment and naming
        self.environment = os.getenv('ENVIRONMENT', 'dev')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr1234')
        self.project_name = os.getenv('PROJECT_NAME', 'serverless-backend')
        
        # Region
        self.primary_region = os.getenv('PRIMARY_REGION', 'us-east-1')
        
        # Lambda configuration
        self.lambda_runtime = os.getenv('LAMBDA_RUNTIME', 'python3.11')
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '30'))
        self.lambda_memory_size = int(os.getenv('LAMBDA_MEMORY_SIZE', '256'))
        
        # API Gateway configuration
        stages_str = os.getenv('API_STAGES', 'dev,test,prod')
        self.api_stages = [s.strip() for s in stages_str.split(',')]
        cors_origins = os.getenv('CORS_ALLOW_ORIGINS', 'https://example.com')
        self.cors_allow_origins = [o.strip() for o in cors_origins.split(',')]
        self.api_throttle_rate_limit = int(os.getenv('API_THROTTLE_RATE_LIMIT', '100'))
        self.api_throttle_burst_limit = int(os.getenv('API_THROTTLE_BURST_LIMIT', '200'))
        
        # S3 configuration
        self.s3_encryption_algorithm = os.getenv('S3_ENCRYPTION_ALGORITHM', 'AES256')
        self.enable_s3_versioning = os.getenv('ENABLE_S3_VERSIONING', 'true').lower() == 'true'
        
        # SSM Parameter Store
        self.ssm_parameter_prefix = os.getenv('SSM_PARAMETER_PREFIX', f'/{self.environment}/{self.environment_suffix}')
        
        # CloudWatch configuration
        self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '30'))
        self.alarm_evaluation_periods = int(os.getenv('ALARM_EVALUATION_PERIODS', '2'))
    
    def normalize_name(self, name: str) -> str:
        """
        Normalize name for case-sensitive resources like S3 buckets.
        
        Converts to lowercase and replaces invalid characters with hyphens.
        """
        # Convert to lowercase and replace invalid characters
        normalized = re.sub(r'[^a-z0-9-]', '-', name.lower())
        # Remove consecutive dashes and trim
        normalized = re.sub(r'-+', '-', normalized).strip('-')
        return normalized
    
    def get_resource_name(self, resource_type: str, region: Optional[str] = None, include_region: bool = False) -> str:
        """
        Generate consistent resource names with environment suffix.
        
        Args:
            resource_type: Type of the resource (e.g., 'api', 'lambda', 's3-static')
            region: Optional region code for region-specific resources
            include_region: Whether to include region in the name
        
        Returns:
            Formatted resource name with environment suffix
        """
        base_name = f"{self.project_name}-{resource_type}"
        
        if include_region and region:
            base_name = f"{base_name}-{region}"
        
        # Add environment and environment_suffix
        base_name = f"{base_name}-{self.environment}-{self.environment_suffix}"
        
        return base_name
    
    def get_normalized_resource_name(self, resource_type: str, region: Optional[str] = None, include_region: bool = False) -> str:
        """
        Generate normalized resource names for case-sensitive resources.
        
        This is specifically for resources like S3 buckets that require lowercase names.
        """
        name = self.get_resource_name(resource_type, region, include_region)
        return self.normalize_name(name)
    
    def get_common_tags(self) -> Dict[str, str]:
        """Get common tags for all resources."""
        return {
            'Project': self.project_name,
            'Environment': self.environment,
            'EnvironmentSuffix': self.environment_suffix,
            'ManagedBy': 'Pulumi',
            'Region': self.primary_region
        }
    
    def get_ssm_parameter_name(self, parameter_name: str) -> str:
        """
        Get full SSM parameter name with prefix.
        
        Args:
            parameter_name: Base parameter name
            
        Returns:
            Full parameter path
        """
        return f"{self.ssm_parameter_prefix}/{parameter_name}"


