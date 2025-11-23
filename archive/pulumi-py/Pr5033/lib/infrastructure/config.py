"""
Configuration module for the serverless file processing solution.

This module centralizes all configuration including environment variables,
region settings, naming conventions, and resource parameters.
"""

import os
import re
from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class ServerlessConfig:
    """Centralized configuration for serverless infrastructure."""
    
    # Environment and naming
    environment: str
    environment_suffix: str
    project_name: str
    
    # Region
    primary_region: str
    
    # Lambda configuration
    lambda_runtime: str
    lambda_timeout: int
    lambda_memory_size: int
    lambda_max_retries: int
    
    # S3 configuration
    enable_versioning: bool
    lifecycle_transition_days: int
    
    # CloudWatch configuration
    log_retention_days: int
    error_rate_threshold: float
    alarm_evaluation_periods: int
    
    # SNS configuration
    enable_notifications: bool
    
    # API Gateway configuration
    api_throttle_burst_limit: int
    api_throttle_rate_limit: float
    
    def __init__(self):
        """Initialize configuration from environment variables."""
        # Environment and naming
        self.environment = os.getenv('ENVIRONMENT', 'Production')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'prod')
        self.project_name = os.getenv('PROJECT_NAME', 'serverless')
        
        # Region - enforced via provider
        self.primary_region = os.getenv('PRIMARY_REGION', 'us-east-1')
        
        # Lambda configuration
        self.lambda_runtime = os.getenv('LAMBDA_RUNTIME', 'python3.11')
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '180'))  # 3 minutes
        self.lambda_memory_size = int(os.getenv('LAMBDA_MEMORY_SIZE', '128'))  # Free tier
        self.lambda_max_retries = int(os.getenv('LAMBDA_MAX_RETRIES', '2'))
        
        # S3 configuration
        self.enable_versioning = os.getenv('ENABLE_VERSIONING', 'true').lower() == 'true'
        self.lifecycle_transition_days = int(os.getenv('LIFECYCLE_TRANSITION_DAYS', '30'))
        
        # CloudWatch configuration
        self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '7'))
        self.error_rate_threshold = float(os.getenv('ERROR_RATE_THRESHOLD', '5.0'))  # 5%
        self.alarm_evaluation_periods = int(os.getenv('ALARM_EVALUATION_PERIODS', '2'))
        
        # SNS configuration
        self.enable_notifications = os.getenv('ENABLE_NOTIFICATIONS', 'true').lower() == 'true'
        
        # API Gateway configuration
        self.api_throttle_burst_limit = int(os.getenv('API_THROTTLE_BURST_LIMIT', '100'))
        self.api_throttle_rate_limit = float(os.getenv('API_THROTTLE_RATE_LIMIT', '50'))
    
    def normalize_name(self, name: str) -> str:
        """
        Normalize name for case-sensitive resources like S3 buckets.
        
        Args:
            name: The name to normalize
            
        Returns:
            Normalized name in lowercase with valid characters
        """
        # Convert to lowercase and replace invalid characters
        normalized = re.sub(r'[^a-z0-9-]', '-', name.lower())
        # Remove consecutive dashes and trim
        normalized = re.sub(r'-+', '-', normalized).strip('-')
        return normalized
    
    def get_resource_name(self, resource_type: str, suffix: Optional[str] = None) -> str:
        """
        Generate consistent resource names with environment suffix and region.
        
        Args:
            resource_type: Type of resource (e.g., 'lambda', 's3', 'iam-role')
            suffix: Optional additional suffix
            
        Returns:
            Formatted resource name
        """
        # Normalize region name (e.g., us-east-1 -> useast1)
        region_short = self.primary_region.replace('-', '')
        
        parts = [self.project_name, resource_type, region_short, self.environment_suffix]
        
        if suffix:
            parts.append(suffix)
        
        return '-'.join(parts)
    
    def get_s3_bucket_name(self, bucket_type: str) -> str:
        """
        Generate S3 bucket name (normalized for case sensitivity).
        
        Args:
            bucket_type: Type of bucket (e.g., 'files', 'logs')
            
        Returns:
            Normalized S3 bucket name
        """
        name = self.get_resource_name('s3', bucket_type)
        return self.normalize_name(name)
    
    def get_common_tags(self) -> Dict[str, str]:
        """
        Get common tags for all resources.
        
        Returns:
            Dictionary of common tags
        """
        return {
            'Project': self.project_name,
            'Environment': self.environment,
            'EnvironmentSuffix': self.environment_suffix,
            'ManagedBy': 'Pulumi'
        }

