"""
Configuration module for the serverless infrastructure.

This module provides centralized configuration management with environment variable
support, region flexibility, and proper naming conventions.
"""

import os
from typing import Any, Dict, Optional

import pulumi
from pulumi import Config


class InfrastructureConfig:
    """
    Centralized configuration for the serverless infrastructure.
    
    Handles environment variables, region configuration, and naming conventions.
    """
    
    def __init__(self):
        """Initialize configuration with environment variables and Pulumi config."""
        # Pulumi configuration
        self.pulumi_config = Config()
        
        # Environment variables
        self.environment = os.getenv('ENVIRONMENT', 'dev')
        self.aws_region = os.getenv('AWS_REGION', 'us-west-2')
        self.project_name = os.getenv('PROJECT_NAME', 'serverless-app')
        
        # IP restrictions from environment variables
        # Default allows all IPs (0.0.0.0/0) for testing and integration tests
        # Can be overridden with specific IPs via ALLOWED_IPS environment variable
        # This is recommended for flexibility in testing and integration tests
        default_ips = os.getenv('ALLOWED_IPS', '0.0.0.0/0')
        self.allowed_ips = [ip.strip() for ip in default_ips.split(',')]
        
        # Default tags
        self.tags = {
            'Project': 'ServerlessApp',
            'Environment': self.environment,
            'ManagedBy': 'Pulumi'
        }
        
        # Feature flags
        self.enable_xray_tracing = self.pulumi_config.get_bool('enable_xray_tracing') or True
        self.enable_encryption = self.pulumi_config.get_bool('enable_encryption') or True
        self.enable_high_availability = self.pulumi_config.get_bool('enable_high_availability') or True
        self.enable_cloudwatch_alarms = self.pulumi_config.get_bool('enable_cloudwatch_alarms') or True
        
        # Lambda configuration
        self.lambda_runtime = 'python3.11'
        self.lambda_timeout = 30
        self.lambda_memory_size = 128
        
        # DynamoDB configuration
        self.dynamodb_billing_mode = 'PAY_PER_REQUEST'
        
        # CloudWatch configuration
        self.log_retention_days = 14
        self.alarm_threshold = 10
        self.alarm_period = 300  # 5 minutes
        
        # S3 configuration
        self.s3_versioning_enabled = True
        
        # API Gateway configuration
        self.api_stage_name = 'v1'
        
        # Step Functions configuration
        self.step_function_timeout = 300  # 5 minutes
    
    def get_resource_name(self, resource_type: str, suffix: str = '') -> str:
        """
        Generate a standardized resource name.
        
        Args:
            resource_type: Type of resource (e.g., 'lambda', 'dynamodb')
            suffix: Optional suffix for the resource name
            
        Returns:
            Normalized resource name
        """
        base_name = f"{self.project_name}-{resource_type}"
        if suffix:
            base_name = f"{base_name}-{suffix}"
        return self._normalize_name(f"{base_name}-{self.environment}")
    
    def get_parameter_name(self, parameter_name: str) -> str:
        """
        Generate a standardized parameter name.
        
        Args:
            parameter_name: Name of the parameter
            
        Returns:
            Normalized parameter name
        """
        return self._normalize_name(f"{self.project_name}-{parameter_name}-{self.environment}")
    
    def get_secret_value(self, secret_name: str, default_value: str = '') -> str:
        """
        Get a secret value from Pulumi config or environment variables.
        
        Args:
            secret_name: Name of the secret
            default_value: Default value if not found
            
        Returns:
            Secret value or default
        """
        # Try Pulumi config first
        try:
            return self.pulumi_config.get(secret_name) or default_value
        except:
            # Fall back to environment variable
            return os.getenv(secret_name.upper(), default_value)
    
    def _normalize_name(self, name: str) -> str:
        """
        Normalize resource names for AWS compatibility.
        
        Args:
            name: The name to normalize
            
        Returns:
            Normalized name suitable for AWS resources
        """
        return name.lower().replace('_', '-').replace(' ', '-')
    
    def get_lambda_config(self) -> Dict[str, Any]:
        """Get Lambda function configuration."""
        return {
            'runtime': self.lambda_runtime,
            'timeout': self.lambda_timeout,
            'memory_size': self.lambda_memory_size,
            'environment': {
                'ENVIRONMENT': self.environment,
                'REGION': self.aws_region,
                'PROJECT_NAME': self.project_name
            }
        }
    
    def get_api_gateway_config(self) -> Dict[str, Any]:
        """Get API Gateway configuration."""
        return {
            'stage_name': self.api_stage_name,
            'allowed_ips': self.allowed_ips
        }
    
    def get_dynamodb_config(self) -> Dict[str, Any]:
        """Get DynamoDB configuration."""
        return {
            'billing_mode': self.dynamodb_billing_mode,
            'encryption_enabled': self.enable_encryption
        }
    
    def get_s3_config(self) -> Dict[str, Any]:
        """Get S3 configuration."""
        return {
            'versioning_enabled': self.s3_versioning_enabled,
            'encryption_enabled': self.enable_encryption
        }
    
    def get_cloudwatch_config(self) -> Dict[str, Any]:
        """Get CloudWatch configuration."""
        return {
            'log_retention_days': self.log_retention_days,
            'alarm_threshold': self.alarm_threshold,
            'alarm_period': self.alarm_period
        }
    
    def get_cross_region_config(self) -> Dict[str, Any]:
        """Get cross-region configuration."""
        return {
            'primary_region': self.aws_region,
            'backup_regions': ['us-east-1', 'us-west-1']
        }
