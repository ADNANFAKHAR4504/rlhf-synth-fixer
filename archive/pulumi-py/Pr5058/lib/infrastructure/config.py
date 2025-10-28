"""
Centralized configuration management for serverless infrastructure.

This module provides configuration management with:
- Environment variable integration
- Resource naming conventions
- Region normalization
- Common tagging
- Validation support
"""

import os
from dataclasses import dataclass
from typing import Dict


@dataclass
class ServerlessConfig:
    """
    Centralized configuration for serverless infrastructure.
    
    All configuration values are sourced from environment variables
    with sensible defaults to support idempotent deployments.
    """
    
    # Core configuration
    project_name: str
    environment_suffix: str
    primary_region: str
    environment: str
    
    # DynamoDB configuration
    dynamodb_billing_mode: str
    dynamodb_read_capacity: int
    dynamodb_write_capacity: int
    enable_dynamodb_streams: bool
    
    # Lambda configuration
    lambda_runtime: str
    lambda_timeout: int
    lambda_memory_size: int
    lambda_max_retry_attempts: int
    
    # S3 configuration
    s3_versioning_enabled: bool
    s3_lifecycle_days: int
    
    # Monitoring configuration
    enable_monitoring: bool
    alarm_evaluation_periods: int
    error_rate_threshold: float
    
    # Derived properties
    region_short: str
    
    def __post_init__(self):
        """Normalize region name after initialization."""
        self.region_short = self.normalize_region(self.primary_region)
    
    @staticmethod
    def normalize_region(region: str) -> str:
        """
        Normalize AWS region name for use in resource naming.
        
        Examples:
            us-east-1 -> useast1
            us-west-2 -> uswest2
            eu-west-1 -> euwest1
        
        Args:
            region: AWS region name
            
        Returns:
            Normalized region string without hyphens
        """
        return region.replace("-", "")
    
    @staticmethod
    def normalize_name(name: str) -> str:
        """
        Normalize resource names to be lowercase and hyphen-separated.
        
        This is especially important for S3 bucket names which are
        case-sensitive and have strict naming requirements.
        
        Args:
            name: Resource name to normalize
            
        Returns:
            Normalized name in lowercase with hyphens
        """
        return name.lower().replace("_", "-")
    
    def get_resource_name(self, resource_type: str) -> str:
        """
        Generate consistent resource names following the pattern:
        {project}-{resource_type}-{region_short}-{environment_suffix}
        
        Args:
            resource_type: Type of resource (e.g., 'lambda', 'dynamodb', 'api')
            
        Returns:
            Formatted resource name
        """
        return f"{self.project_name}-{resource_type}-{self.region_short}-{self.environment_suffix}"
    
    def get_dynamodb_table_name(self, table_type: str) -> str:
        """
        Generate DynamoDB table names.
        
        Args:
            table_type: Type of table (e.g., 'items', 'users')
            
        Returns:
            Formatted table name
        """
        return self.get_resource_name(f"table-{table_type}")
    
    def get_s3_bucket_name(self, bucket_type: str) -> str:
        """
        Generate S3 bucket names with proper normalization.
        
        S3 bucket names must be lowercase and globally unique.
        
        Args:
            bucket_type: Type of bucket (e.g., 'files', 'data')
            
        Returns:
            Normalized bucket name in lowercase
        """
        base_name = f"{self.project_name}-{bucket_type}-{self.region_short}-{self.environment_suffix}"
        return self.normalize_name(base_name)
    
    def get_lambda_function_name(self, function_type: str) -> str:
        """
        Generate Lambda function names.
        
        Args:
            function_type: Type of function (e.g., 'api-handler', 'processor')
            
        Returns:
            Formatted function name
        """
        return self.get_resource_name(function_type)
    
    def get_common_tags(self) -> Dict[str, str]:
        """
        Get common tags to apply to all resources.
        
        Returns:
            Dictionary of common resource tags
        """
        return {
            "Environment": self.environment,
            "Project": self.project_name,
            "ManagedBy": "Pulumi",
            "Region": self.primary_region,
            "EnvironmentSuffix": self.environment_suffix,
        }


def initialize_config() -> ServerlessConfig:
    """
    Initialize configuration from environment variables.
    
    This function reads all configuration from environment variables
    to support different deployment environments without code changes.
    
    Returns:
        ServerlessConfig instance with all configuration loaded
    """
    return ServerlessConfig(
        # Core configuration
        project_name=os.getenv("PROJECT_NAME", "serverless-app"),
        environment_suffix=os.getenv("ENVIRONMENT_SUFFIX", "prod"),
        primary_region=os.getenv("PRIMARY_REGION", os.getenv("AWS_REGION", "us-east-1")),
        environment=os.getenv("ENVIRONMENT", "Production"),
        
        # DynamoDB configuration
        dynamodb_billing_mode=os.getenv("DYNAMODB_BILLING_MODE", "PAY_PER_REQUEST"),
        dynamodb_read_capacity=int(os.getenv("DYNAMODB_READ_CAPACITY", "5")),
        dynamodb_write_capacity=int(os.getenv("DYNAMODB_WRITE_CAPACITY", "5")),
        enable_dynamodb_streams=os.getenv("ENABLE_DYNAMODB_STREAMS", "true").lower() == "true",
        
        # Lambda configuration
        lambda_runtime=os.getenv("LAMBDA_RUNTIME", "python3.11"),
        lambda_timeout=int(os.getenv("LAMBDA_TIMEOUT", "180")),
        lambda_memory_size=int(os.getenv("LAMBDA_MEMORY_SIZE", "256")),
        lambda_max_retry_attempts=int(os.getenv("LAMBDA_MAX_RETRY_ATTEMPTS", "2")),
        
        # S3 configuration
        s3_versioning_enabled=os.getenv("S3_VERSIONING_ENABLED", "true").lower() == "true",
        s3_lifecycle_days=int(os.getenv("S3_LIFECYCLE_DAYS", "30")),
        
        # Monitoring configuration
        enable_monitoring=os.getenv("ENABLE_MONITORING", "true").lower() == "true",
        alarm_evaluation_periods=int(os.getenv("ALARM_EVALUATION_PERIODS", "2")),
        error_rate_threshold=float(os.getenv("ERROR_RATE_THRESHOLD", "5.0")),
        
        # region_short will be set in __post_init__
        region_short="",
    )

