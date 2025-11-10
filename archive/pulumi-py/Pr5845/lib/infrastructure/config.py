"""
Configuration module for the multi-region serverless infrastructure.

This module centralizes all configuration including environment variables,
region settings, and naming conventions. It uses ENVIRONMENT_SUFFIX for
consistent naming across all resources.
"""

import os
import re
from dataclasses import dataclass
from typing import Dict, List


@dataclass
class ServerlessConfig:
    """Centralized configuration for the serverless infrastructure."""
    
    environment: str
    environment_suffix: str
    project_name: str
    
    primary_region: str
    secondary_region: str
    normalized_primary_region: str
    normalized_secondary_region: str
    
    lambda_runtime: str
    lambda_timeout: int
    lambda_memory_size: int
    lambda_max_retry_attempts: int
    
    api_throttle_rate_limit: int
    api_throttle_burst_limit: int
    api_stage_name: str
    
    dynamodb_partition_key: str
    dynamodb_sort_key: str
    dynamodb_billing_mode: str
    dynamodb_read_capacity: int
    dynamodb_write_capacity: int
    dynamodb_autoscaling_min_read: int
    dynamodb_autoscaling_max_read: int
    dynamodb_autoscaling_min_write: int
    dynamodb_autoscaling_max_write: int
    dynamodb_autoscaling_target_utilization: int
    
    s3_lifecycle_expiration_days: int
    s3_event_prefix: str
    s3_event_suffix: str
    s3_retain_on_delete: bool
    
    log_retention_days: int
    enable_xray_tracing: bool
    enable_contributor_insights: bool
    enable_point_in_time_recovery: bool
    
    dlq_max_receive_count: int
    
    team: str
    application: str
    cost_center: str
    
    def __init__(self):
        """Initialize configuration from environment variables."""
        self.environment = os.getenv('ENVIRONMENT', 'Production')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        self.project_name = 'ServApp'
        
        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')
        self.secondary_region = os.getenv('SECONDARY_REGION', 'us-west-2')
        self.normalized_primary_region = self._normalize_region(self.primary_region)
        self.normalized_secondary_region = self._normalize_region(self.secondary_region)
        
        self.lambda_runtime = os.getenv('LAMBDA_RUNTIME', 'python3.12')
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '15'))
        self.lambda_memory_size = int(os.getenv('LAMBDA_MEMORY_SIZE', '512'))
        self.lambda_max_retry_attempts = int(os.getenv('LAMBDA_MAX_RETRY_ATTEMPTS', '2'))
        
        self.api_throttle_rate_limit = int(os.getenv('API_THROTTLE_RATE_LIMIT', '1000'))
        self.api_throttle_burst_limit = int(os.getenv('API_THROTTLE_BURST_LIMIT', '2000'))
        self.api_stage_name = os.getenv('API_STAGE_NAME', 'prod')
        
        self.dynamodb_partition_key = 'symbol'
        self.dynamodb_sort_key = 'timestamp'
        self.dynamodb_billing_mode = os.getenv('DYNAMODB_BILLING_MODE', 'PROVISIONED')
        self.dynamodb_read_capacity = int(os.getenv('DYNAMODB_READ_CAPACITY', '5'))
        self.dynamodb_write_capacity = int(os.getenv('DYNAMODB_WRITE_CAPACITY', '5'))
        self.dynamodb_autoscaling_min_read = int(os.getenv('DYNAMODB_AUTOSCALING_MIN_READ', '1'))
        self.dynamodb_autoscaling_max_read = int(os.getenv('DYNAMODB_AUTOSCALING_MAX_READ', '10'))
        self.dynamodb_autoscaling_min_write = int(os.getenv('DYNAMODB_AUTOSCALING_MIN_WRITE', '1'))
        self.dynamodb_autoscaling_max_write = int(os.getenv('DYNAMODB_AUTOSCALING_MAX_WRITE', '10'))
        self.dynamodb_autoscaling_target_utilization = int(os.getenv('DYNAMODB_AUTOSCALING_TARGET_UTILIZATION', '70'))
        
        self.s3_lifecycle_expiration_days = int(os.getenv('S3_LIFECYCLE_EXPIRATION_DAYS', '30'))
        self.s3_event_prefix = os.getenv('S3_EVENT_PREFIX', 'uploads/')
        self.s3_event_suffix = os.getenv('S3_EVENT_SUFFIX', '.json')
        self.s3_retain_on_delete = os.getenv('S3_RETAIN_ON_DELETE', 'false').lower() == 'true'
        
        self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '7'))
        self.enable_xray_tracing = os.getenv('ENABLE_XRAY_TRACING', 'true').lower() == 'true'
        self.enable_contributor_insights = os.getenv('ENABLE_CONTRIBUTOR_INSIGHTS', 'true').lower() == 'true'
        self.enable_point_in_time_recovery = os.getenv('ENABLE_POINT_IN_TIME_RECOVERY', 'true').lower() == 'true'
        
        self.dlq_max_receive_count = int(os.getenv('DLQ_MAX_RECEIVE_COUNT', '2'))
        
        self.team = os.getenv('TEAM', 'platform')
        self.application = os.getenv('APPLICATION', 'serv-app')
        self.cost_center = os.getenv('COST_CENTER', 'eng-001')
    
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
            resource_type: Type of resource (e.g., 'lambda', 'dynamodb-table')
            include_region: Whether to include region in the name
            
        Returns:
            Formatted resource name
        """
        base_name = f"{self.project_name}-{resource_type}"
        
        if include_region:
            base_name = f"{base_name}-{self.normalized_primary_region}"
        
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
            'Region': self.primary_region,
            'Project': self.project_name,
            'Application': self.application,
            'CostCenter': self.cost_center,
            'Team': self.team,
            'ManagedBy': 'Pulumi'
        }
    
    def get_regions(self) -> List[str]:
        """
        Get list of all regions for multi-region deployment.
        
        Returns:
            List of AWS regions
        """
        return [self.primary_region, self.secondary_region]

