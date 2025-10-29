"""
Configuration module for the serverless financial market data processing pipeline.

This module centralizes all configuration including environment variables,
region settings, and naming conventions. It uses ENVIRONMENT_SUFFIX for
consistent naming across all resources.
"""

import os
import re
from dataclasses import dataclass
from typing import Dict


@dataclass
class FinancialDataPipelineConfig:
    """Centralized configuration for the serverless financial data pipeline."""
    
    environment: str
    environment_suffix: str
    project_name: str
    
    primary_region: str
    normalized_region: str
    
    lambda_runtime: str
    lambda_timeout: int
    lambda_memory_size: int
    processing_lambda_concurrency: int
    
    api_throttle_rate_limit: int
    api_throttle_burst_limit: int
    
    dlq_max_receive_count: int
    
    log_retention_days: int
    enable_xray_tracing: bool
    
    s3_lifecycle_days: int
    dynamodb_billing_mode: str
    
    team: str
    cost_center: str
    
    def __init__(self):
        """Initialize configuration from environment variables."""
        self.environment = os.getenv('ENVIRONMENT', 'prod')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr1234')
        self.project_name = os.getenv('PROJECT_NAME', 'findata')
        
        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')
        self.normalized_region = self._normalize_region(self.primary_region)
        
        self.lambda_runtime = os.getenv('LAMBDA_RUNTIME', 'python3.12')
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '300'))
        self.lambda_memory_size = int(os.getenv('LAMBDA_MEMORY_SIZE', '3008'))
        self.processing_lambda_concurrency = int(os.getenv('PROCESSING_LAMBDA_CONCURRENCY', '50'))
        
        self.api_throttle_rate_limit = int(os.getenv('API_THROTTLE_RATE_LIMIT', '1000'))
        self.api_throttle_burst_limit = int(os.getenv('API_THROTTLE_BURST_LIMIT', '2000'))
        
        self.dlq_max_receive_count = int(os.getenv('DLQ_MAX_RECEIVE_COUNT', '2'))
        
        self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '7'))
        self.enable_xray_tracing = os.getenv('ENABLE_XRAY_TRACING', 'true').lower() == 'true'
        
        self.s3_lifecycle_days = int(os.getenv('S3_LIFECYCLE_DAYS', '30'))
        self.dynamodb_billing_mode = os.getenv('DYNAMODB_BILLING_MODE', 'PAY_PER_REQUEST')
        
        self.team = os.getenv('TEAM', 'data-engineering')
        self.cost_center = os.getenv('COST_CENTER', 'fintech-analytics')
    
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
            Formatted resource name with region and environment suffix
        """
        base_name = f"{self.project_name}-{resource_type}"
        
        if include_region:
            base_name = f"{base_name}-{self.normalized_region}"
        
        base_name = f"{base_name}-{self.environment_suffix}"
        
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
            'ManagedBy': 'Pulumi',
            'Region': self.normalized_region
        }

