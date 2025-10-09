"""
Configuration management for the serverless application.

This module handles environment variables, region configuration, and naming conventions
to ensure the application can easily switch regions and maintain consistent naming.
"""

import os
from typing import Dict, Optional

import pulumi


class InfrastructureConfig:
    """
    Configuration class for the serverless infrastructure.
    
    Handles environment variables, region configuration, and naming conventions
    to support easy region switching and consistent resource naming.
    """
    
    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize configuration with environment variables and defaults.
        
        Args:
            config: Optional configuration dictionary to override defaults
        """
        self.config = config or {}
        
        # Environment and region configuration
        self.environment = os.getenv('ENVIRONMENT', 'dev')
        self.aws_region = os.getenv('AWS_REGION', 'us-east-1')
        self.project_name = os.getenv('PROJECT_NAME', 'serverless-app')
        
        # Naming conventions with environment support
        self.name_prefix = f"{self.project_name}-{self.environment}"
        self.tags = {
            'Environment': self.environment,
            'Project': self.project_name,
            'ManagedBy': 'Pulumi'
        }
        
        # Lambda configuration
        self.lambda_runtime = 'python3.8'
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '30'))
        self.lambda_memory = int(os.getenv('LAMBDA_MEMORY', '128'))
        
        # API Gateway configuration
        self.api_stage = os.getenv('API_STAGE', 'prod')
        
        # S3 configuration
        self.s3_log_retention_days = int(os.getenv('S3_LOG_RETENTION_DAYS', '90'))
        
        # CloudWatch configuration
        self.cloudwatch_log_retention_days = int(os.getenv('CLOUDWATCH_LOG_RETENTION_DAYS', '14'))
        
        # High availability configuration
        self.enable_high_availability = os.getenv('ENABLE_HA', 'true').lower() == 'true'
        
    def get_resource_name(self, resource_type: str, suffix: str = '') -> str:
        """
        Generate consistent resource names with environment prefix.
        
        Args:
            resource_type: Type of resource (e.g., 'lambda', 'api', 'bucket')
            suffix: Optional suffix for the resource
            
        Returns:
            Formatted resource name
        """
        name = f"{self.name_prefix}-{resource_type}"
        if suffix:
            name = f"{name}-{suffix}"
        return name
    
    def get_config_value(self, key: str, default: str = '') -> str:
        """
        Get configuration value with fallback to environment variables.
        
        Args:
            key: Configuration key
            default: Default value if not found
            
        Returns:
            Configuration value
        """
        return self.config.get(key, os.getenv(key.upper(), default))
    
    def get_int_config(self, key: str, default: int = 0) -> int:
        """
        Get integer configuration value.
        
        Args:
            key: Configuration key
            default: Default integer value
            
        Returns:
            Integer configuration value
        """
        try:
            return int(self.get_config_value(key, str(default)))
        except ValueError:
            return default
    
    def get_bool_config(self, key: str, default: bool = False) -> bool:
        """
        Get boolean configuration value.
        
        Args:
            key: Configuration key
            default: Default boolean value
            
        Returns:
            Boolean configuration value
        """
        value = self.get_config_value(key, str(default)).lower()
        return value in ('true', '1', 'yes', 'on')
    
    def normalize_name(self, name: str) -> str:
        """
        Normalize resource names for AWS compatibility.
        
        Args:
            name: Resource name to normalize
            
        Returns:
            Normalized name suitable for AWS resources
        """
        # Convert to lowercase and replace invalid characters
        normalized = name.lower().replace('_', '-').replace(' ', '-')
        
        # Remove consecutive dashes
        while '--' in normalized:
            normalized = normalized.replace('--', '-')
        
        # Remove leading/trailing dashes
        normalized = normalized.strip('-')
        
        return normalized
