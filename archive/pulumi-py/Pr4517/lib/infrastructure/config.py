"""
Configuration module for the serverless event processing pipeline.

This module centralizes all configuration including environment variables,
region settings, and naming conventions.
"""

import os
import re
from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class PipelineConfig:
    """Centralized configuration for the event processing pipeline."""
    
    # Environment and naming
    environment: str
    environment_suffix: str
    project_name: str
    app_name: str
    
    # Regions
    primary_region: str
    secondary_region: str
    regions: List[str]
    
    # Lambda configuration
    lambda_runtime: str
    lambda_timeout: int
    lambda_memory_size: int
    
    # DynamoDB configuration
    dynamodb_billing_mode: str
    dynamodb_read_capacity: int
    dynamodb_write_capacity: int
    
    # CloudWatch configuration
    log_retention_days: int
    alarm_evaluation_periods: int
    alarm_datapoints_to_alarm: int
    
    # SNS configuration
    sns_email_endpoint: Optional[str]
    
    def __init__(self):
        """Initialize configuration from environment variables."""
        # Environment and naming
        self.environment = os.getenv('ENVIRONMENT', 'dev')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr1234')
        self.project_name = os.getenv('PROJECT_NAME', 'trading')
        self.app_name = os.getenv('APP_NAME', 'events')
        
        # Regions
        self.primary_region = os.getenv('PRIMARY_REGION', 'us-east-1')
        self.secondary_region = os.getenv('SECONDARY_REGION', 'us-west-2')
        self.regions = [self.primary_region, self.secondary_region]
        
        # Lambda configuration
        self.lambda_runtime = os.getenv('LAMBDA_RUNTIME', 'python3.11')
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '300'))
        self.lambda_memory_size = int(os.getenv('LAMBDA_MEMORY_SIZE', '512'))
        
        # DynamoDB configuration
        self.dynamodb_billing_mode = os.getenv('DYNAMODB_BILLING_MODE', 'PAY_PER_REQUEST')
        self.dynamodb_read_capacity = int(os.getenv('DYNAMODB_READ_CAPACITY', '5'))
        self.dynamodb_write_capacity = int(os.getenv('DYNAMODB_WRITE_CAPACITY', '5'))
        
        # CloudWatch configuration
        self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '30'))
        self.alarm_evaluation_periods = int(os.getenv('ALARM_EVALUATION_PERIODS', '2'))
        self.alarm_datapoints_to_alarm = int(os.getenv('ALARM_DATAPOINTS_TO_ALARM', '2'))
        
        # SNS configuration
        self.sns_email_endpoint = os.getenv('SNS_EMAIL_ENDPOINT')
    
    def normalize_name(self, name: str) -> str:
        """Normalize name for case-sensitive resources like S3 buckets."""
        # Convert to lowercase and replace invalid characters
        normalized = re.sub(r'[^a-z0-9-]', '-', name.lower())
        # Remove consecutive dashes and trim
        normalized = re.sub(r'-+', '-', normalized).strip('-')
        return normalized
    
    def get_resource_name(self, resource_type: str, region: Optional[str] = None) -> str:
        """Generate consistent resource names."""
        base_name = f"{self.project_name}-{self.app_name}-{resource_type}"
        
        if region:
            base_name = f"{base_name}-{region}"
        
        base_name = f"{base_name}-{self.environment}-{self.environment_suffix}"
        
        return self.normalize_name(base_name)
    
    def get_common_tags(self) -> Dict[str, str]:
        """Get common tags for all resources."""
        return {
            'Project': self.project_name,
            'Application': self.app_name,
            'Environment': self.environment,
            'EnvironmentSuffix': self.environment_suffix,
            'ManagedBy': 'Pulumi',
            'CostCenter': 'TradingPlatform'
        }
    
    def get_region_tags(self, region: str) -> Dict[str, str]:
        """Get region-specific tags."""
        tags = self.get_common_tags()
        tags.update({
            'Region': region,
            'IsPrimary': str(region == self.primary_region)
        })
        return tags
