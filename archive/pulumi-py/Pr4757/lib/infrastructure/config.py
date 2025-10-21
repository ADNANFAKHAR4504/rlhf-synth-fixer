"""
Configuration module for the AWS environment migration solution.

This module centralizes all configuration including environment variables,
region settings, naming conventions, and resource parameters.
"""

import os
import re
from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class MigrationConfig:
    """Centralized configuration for environment migration."""
    
    # Environment and naming
    environment: str
    environment_suffix: str
    project_name: str
    stack_name: str
    
    # Regions
    primary_region: str
    secondary_regions: List[str]
    all_regions: List[str]
    
    # Lambda configuration
    lambda_runtime: str
    lambda_timeout: int
    lambda_memory_size: int
    
    # S3 configuration
    enable_versioning: bool
    enable_replication: bool
    lifecycle_transition_days: int
    
    # SSM/Secrets Manager configuration
    use_secrets_manager: bool
    parameter_tier: str
    
    # CloudWatch configuration
    log_retention_days: int
    alarm_evaluation_periods: int
    error_threshold: int
    
    # SNS configuration
    notification_email: Optional[str]
    enable_notifications: bool
    
    # Validation and rollback
    enable_validation: bool
    enable_auto_rollback: bool
    validation_timeout: int
    
    def __init__(self):
        """Initialize configuration from environment variables."""
        # Environment and naming
        self.environment = os.getenv('ENVIRONMENT', 'dev')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr1234')
        self.project_name = os.getenv('PROJECT_NAME', 'migration')
        self.stack_name = os.getenv('STACK_NAME', 'infra')
        
        # Regions
        self.primary_region = os.getenv('PRIMARY_REGION', 'us-east-1')
        secondary_regions_str = os.getenv('SECONDARY_REGIONS', 'us-west-2')
        self.secondary_regions = [r.strip() for r in secondary_regions_str.split(',') if r.strip()]
        self.all_regions = [self.primary_region] + self.secondary_regions
        
        # Lambda configuration
        self.lambda_runtime = os.getenv('LAMBDA_RUNTIME', 'python3.11')
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '300'))
        self.lambda_memory_size = int(os.getenv('LAMBDA_MEMORY_SIZE', '512'))
        
        # S3 configuration
        self.enable_versioning = os.getenv('ENABLE_VERSIONING', 'true').lower() == 'true'
        self.enable_replication = os.getenv('ENABLE_REPLICATION', 'true').lower() == 'true'
        self.lifecycle_transition_days = int(os.getenv('LIFECYCLE_TRANSITION_DAYS', '90'))
        
        # SSM/Secrets Manager configuration
        self.use_secrets_manager = os.getenv('USE_SECRETS_MANAGER', 'false').lower() == 'true'
        self.parameter_tier = os.getenv('PARAMETER_TIER', 'Standard')
        
        # CloudWatch configuration
        self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '30'))
        self.alarm_evaluation_periods = int(os.getenv('ALARM_EVALUATION_PERIODS', '2'))
        self.error_threshold = int(os.getenv('ERROR_THRESHOLD', '5'))
        
        # SNS configuration
        self.notification_email = os.getenv('NOTIFICATION_EMAIL')
        self.enable_notifications = os.getenv('ENABLE_NOTIFICATIONS', 'true').lower() == 'true'
        
        # Validation and rollback
        self.enable_validation = os.getenv('ENABLE_VALIDATION', 'true').lower() == 'true'
        self.enable_auto_rollback = os.getenv('ENABLE_AUTO_ROLLBACK', 'true').lower() == 'true'
        self.validation_timeout = int(os.getenv('VALIDATION_TIMEOUT', '600'))
    
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
    
    def get_resource_name(self, resource_type: str, region: Optional[str] = None, suffix: Optional[str] = None) -> str:
        """
        Generate consistent resource names.
        
        Args:
            resource_type: Type of resource (e.g., 'lambda', 's3', 'iam-role')
            region: Optional region identifier
            suffix: Optional additional suffix
            
        Returns:
            Formatted resource name
        """
        parts = [self.project_name, self.stack_name, resource_type]
        
        if region:
            parts.append(region)
        
        parts.extend([self.environment, self.environment_suffix])
        
        if suffix:
            parts.append(suffix)
        
        base_name = '-'.join(parts)
        
        return self.normalize_name(base_name)
    
    def get_common_tags(self) -> Dict[str, str]:
        """
        Get common tags for all resources.
        
        Returns:
            Dictionary of common tags
        """
        return {
            'Project': self.project_name,
            'Stack': self.stack_name,
            'Environment': self.environment,
            'EnvironmentSuffix': self.environment_suffix,
            'ManagedBy': 'Pulumi',
            'Purpose': 'EnvironmentMigration'
        }
    
    def get_region_tags(self, region: str) -> Dict[str, str]:
        """
        Get region-specific tags.
        
        Args:
            region: AWS region
            
        Returns:
            Dictionary of tags including region information
        """
        tags = self.get_common_tags()
        tags.update({
            'Region': region,
            'IsPrimary': str(region == self.primary_region).lower()
        })
        return tags

