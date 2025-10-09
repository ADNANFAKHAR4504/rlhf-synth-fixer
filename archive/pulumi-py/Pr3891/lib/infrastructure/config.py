"""
Configuration module for the serverless infrastructure.

This module provides centralized configuration management with support for
environment variables, region flexibility, and consistent naming conventions.
"""

import hashlib
import os
from typing import Any, Dict, Optional

from pulumi import Config


class InfrastructureConfig:
    """
    Centralized configuration for the serverless infrastructure.
    
    Handles environment variables, region configuration, naming conventions,
    and provides consistent tagging across all resources.
    """
    
    def __init__(self, environment_suffix: Optional[str] = None):
        """
        Initialize configuration with environment-specific settings.
        
        Args:
            environment_suffix: Environment identifier (dev, staging, prod)
        """
        self.pulumi_config = Config()
        
        # Environment configuration
        self.environment_suffix = environment_suffix or os.getenv('ENVIRONMENT', 'dev')
        self.project_name = os.getenv('PROJECT_NAME', 'serverless-app')
        
        # AWS configuration
        self.aws_region = os.getenv('AWS_REGION', 'us-east-1')
        self.aws_account_id = os.getenv('AWS_ACCOUNT_ID', '')
        
        # Application configuration
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '30'))
        self.lambda_memory_size = int(os.getenv('LAMBDA_MEMORY_SIZE', '128'))
        self.dynamodb_billing_mode = os.getenv('DYNAMODB_BILLING_MODE', 'PAY_PER_REQUEST')
        
        # Security configuration
        self.enable_encryption = os.getenv('ENABLE_ENCRYPTION', 'true').lower() == 'true'
        self.enable_public_access = os.getenv('ENABLE_PUBLIC_ACCESS', 'false').lower() == 'true'
        
        # Monitoring configuration
        self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '14'))
        self.enable_detailed_monitoring = os.getenv('ENABLE_DETAILED_MONITORING', 'true').lower() == 'true'
        
        # Generate stable hash for consistent naming
        self._stable_hash = self._generate_stable_hash()
    
    def _generate_stable_hash(self) -> str:
        """Generate a stable hash for consistent resource naming."""
        hash_input = f"{self.project_name}-{self.environment_suffix}"
        return hashlib.md5(hash_input.encode()).hexdigest()[:8]
    
    def get_naming_convention(self, resource_type: str, resource_name: str = None) -> str:
        """
        Generate consistent naming convention for AWS resources.
        
        Args:
            resource_type: Type of AWS resource (lambda, api-gateway, etc.)
            resource_name: Specific name for the resource
            
        Returns:
            Formatted resource name following naming conventions
        """
        # Normalize resource type for case sensitivity
        resource_type = resource_type.lower().replace('_', '-')
        
        if resource_name:
            resource_name = resource_name.lower().replace('_', '-')
            return f"{self.project_name}-{resource_type}-{resource_name}-{self.environment_suffix}-{self._stable_hash}"
        else:
            return f"{self.project_name}-{resource_type}-{self.environment_suffix}-{self._stable_hash}"
    
    def get_tags(self, additional_tags: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        """
        Generate consistent tags for AWS resources.
        
        Args:
            additional_tags: Additional tags to include
            
        Returns:
            Dictionary of tags to apply to resources
        """
        base_tags = {
            'Project': self.project_name,
            'Environment': self.environment_suffix,
            'Region': self.aws_region,
            'ManagedBy': 'Pulumi',
            'CreatedBy': 'InfrastructureAsCode'
        }
        
        if additional_tags:
            base_tags.update(additional_tags)
        
        return base_tags
    
    def get_lambda_config(self, function_name: str) -> Dict[str, Any]:
        """
        Get Lambda function configuration.
        
        Args:
            function_name: Name of the Lambda function
            
        Returns:
            Dictionary with Lambda configuration
        """
        return {
            'function_name': self.get_naming_convention('lambda', function_name),
            'timeout': self.lambda_timeout,
            'memory_size': self.lambda_memory_size,
            'runtime': 'python3.9',
            'handler': 'lambda_function.lambda_handler',
            'tags': self.get_tags({
                'FunctionName': function_name,
                'Purpose': 'Serverless processing'
            })
        }
    
    def get_dynamodb_config(self, table_name: str) -> Dict[str, Any]:
        """
        Get DynamoDB table configuration.
        
        Args:
            table_name: Name of the DynamoDB table
            
        Returns:
            Dictionary with DynamoDB configuration
        """
        return {
            'table_name': self.get_naming_convention('dynamodb', table_name),
            'billing_mode': self.dynamodb_billing_mode,
            'tags': self.get_tags({
                'TableName': table_name,
                'Purpose': 'Data storage'
            })
        }
    
    def get_s3_config(self, bucket_name: str) -> Dict[str, Any]:
        """
        Get S3 bucket configuration.
        
        Args:
            bucket_name: Name of the S3 bucket
            
        Returns:
            Dictionary with S3 configuration
        """
        return {
            'bucket_name': self.get_naming_convention('s3', bucket_name),
            'enable_public_access': self.enable_public_access,
            'enable_encryption': self.enable_encryption,
            'tags': self.get_tags({
                'BucketName': bucket_name,
                'Purpose': 'Static asset storage'
            })
        }
    
    def get_api_gateway_config(self, api_name: str) -> Dict[str, Any]:
        """
        Get API Gateway configuration.
        
        Args:
            api_name: Name of the API Gateway
            
        Returns:
            Dictionary with API Gateway configuration
        """
        return {
            'api_name': self.get_naming_convention('api-gateway', api_name),
            'tags': self.get_tags({
                'ApiName': api_name,
                'Purpose': 'RESTful API endpoint'
            })
        }
    
    def get_cloudwatch_config(self, log_group_name: str) -> Dict[str, Any]:
        """
        Get CloudWatch log group configuration.
        
        Args:
            log_group_name: Name of the log group
            
        Returns:
            Dictionary with CloudWatch configuration
        """
        return {
            'log_group_name': self.get_naming_convention('log-group', log_group_name),
            'retention_days': self.log_retention_days,
            'tags': self.get_tags({
                'LogGroupName': log_group_name,
                'Purpose': 'Application logging'
            })
        }
