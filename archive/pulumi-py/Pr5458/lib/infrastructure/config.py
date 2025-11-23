"""
Configuration module for the serverless infrastructure.

This module centralizes all configuration including environment variables,
region settings, and naming conventions. It uses ENVIRONMENT_SUFFIX for
consistent naming across all resources.
"""

import os
import re
from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class ServerlessConfig:
    """Centralized configuration for the serverless infrastructure."""
    
    environment: str
    environment_suffix: str
    project_name: str
    
    primary_region: str
    normalized_region: str
    
    # Lambda configuration (from model failures)
    lambda_runtime: str
    lambda_timeout: int  # 5 minutes = 300 seconds
    lambda_memory_size: int  # 3GB = 3072 MB
    lambda_max_retries: int  # 2 retries
    
    # Lambda concurrency (from model failures)
    processing_lambda_concurrency: int  # 100
    
    # API Gateway throttling (from model failures)
    api_throttle_rate_limit: int  # 1000 RPS
    api_throttle_burst_limit: int  # 2000
    
    # CloudWatch configuration (from model failures)
    log_retention_days: int  # 7 days
    alarm_error_rate_threshold: float  # >1% error rate
    
    # S3 configuration (from model failures)
    s3_incoming_prefix: str  # incoming/
    s3_file_suffix: str  # .csv
    s3_lifecycle_delete_days: int  # 30 days for processed files
    
    # DynamoDB configuration (from model failures)
    dynamodb_partition_key: str  # symbol
    dynamodb_sort_key: str  # timestamp
    enable_contributor_insights: bool
    
    # X-Ray tracing
    enable_xray_tracing: bool
    
    # Tags
    team: str
    cost_center: str
    
    # Cross-account/region deployment
    role_arn: Optional[str]
    
    def __init__(self):
        """Initialize configuration from environment variables."""
        self.environment = os.getenv('ENVIRONMENT', 'prod')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr1234')
        self.project_name = os.getenv('PROJECT_NAME', 'serverless')
        
        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')
        self.normalized_region = self._normalize_region(self.primary_region)
        
        # Lambda configuration - Fixed from model failures
        self.lambda_runtime = os.getenv('LAMBDA_RUNTIME', 'python3.11')
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '300'))  # 5 minutes
        self.lambda_memory_size = int(os.getenv('LAMBDA_MEMORY_SIZE', '3008'))  # 3008 MB (AWS max)
        self.lambda_max_retries = int(os.getenv('LAMBDA_MAX_RETRIES', '2'))
        
        # Lambda concurrency - Fixed from model failures
        self.processing_lambda_concurrency = int(
            os.getenv('PROCESSING_LAMBDA_CONCURRENCY', '100')
        )
        
        # API Gateway throttling - Fixed from model failures
        self.api_throttle_rate_limit = int(os.getenv('API_THROTTLE_RATE_LIMIT', '1000'))
        self.api_throttle_burst_limit = int(os.getenv('API_THROTTLE_BURST_LIMIT', '2000'))
        
        # CloudWatch configuration - Fixed from model failures
        self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '7'))
        self.alarm_error_rate_threshold = float(
            os.getenv('ALARM_ERROR_RATE_THRESHOLD', '0.01')  # 1%
        )
        
        # S3 configuration - Fixed from model failures
        self.s3_incoming_prefix = os.getenv('S3_INCOMING_PREFIX', 'incoming/')
        self.s3_file_suffix = os.getenv('S3_FILE_SUFFIX', '.csv')
        self.s3_lifecycle_delete_days = int(os.getenv('S3_LIFECYCLE_DELETE_DAYS', '30'))
        
        # DynamoDB configuration - Fixed from model failures
        self.dynamodb_partition_key = os.getenv('DYNAMODB_PARTITION_KEY', 'symbol')
        self.dynamodb_sort_key = os.getenv('DYNAMODB_SORT_KEY', 'timestamp')
        self.enable_contributor_insights = (
            os.getenv('ENABLE_CONTRIBUTOR_INSIGHTS', 'true').lower() == 'true'
        )
        
        # X-Ray tracing
        self.enable_xray_tracing = (
            os.getenv('ENABLE_XRAY_TRACING', 'true').lower() == 'true'
        )
        
        # Tags
        self.team = os.getenv('TEAM', 'serverless-team')
        self.cost_center = os.getenv('COST_CENTER', 'eng-001')
        
        # Cross-account/region deployment
        self.role_arn = os.getenv('ASSUME_ROLE_ARN')
    
    def _normalize_region(self, region: str) -> str:
        """
        Normalize region name for resource naming.
        
        Example: us-east-1 -> useast1
        """
        return region.replace('-', '')
    
    def normalize_name(self, name: str) -> str:
        """
        Normalize name for case-sensitive resources (e.g., S3 buckets).
        
        Converts to lowercase and replaces invalid characters with hyphens.
        """
        normalized = re.sub(r'[^a-z0-9-]', '-', name.lower())
        normalized = re.sub(r'-+', '-', normalized).strip('-')
        return normalized
    
    def get_resource_name(self, resource_type: str, include_region: bool = True) -> str:
        """
        Generate consistent resource names with environment suffix and normalized region.
        
        Args:
            resource_type: Type of resource (e.g., 'data', 'processing-lambda')
            include_region: Whether to include normalized region in name
            
        Returns:
            Formatted resource name
        """
        parts = [self.project_name, resource_type]
        
        if include_region:
            parts.append(self.normalized_region)
        
        parts.extend([self.environment, self.environment_suffix])
        
        return '-'.join(parts)
    
    def get_normalized_resource_name(self, resource_type: str, include_region: bool = True) -> str:
        """
        Generate normalized resource names for case-sensitive resources.
        
        Args:
            resource_type: Type of resource
            include_region: Whether to include normalized region
            
        Returns:
            Normalized resource name (lowercase, no invalid chars)
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
            'Project': self.project_name,
            'ManagedBy': 'Pulumi',
            'Team': self.team,
            'CostCenter': self.cost_center,
            'EnvironmentSuffix': self.environment_suffix,
            'Region': self.normalized_region
        }

