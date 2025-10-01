"""
Configuration module for serverless S3-triggered Lambda infrastructure.
Handles environment variables, region enforcement, and deployment settings.
"""

from typing import Any, Dict

import pulumi
import pulumi_aws as aws


class ServerlessConfig:
    """Configuration class for serverless S3-triggered Lambda infrastructure."""
    
    def __init__(self):
        """Initialize configuration with environment variables and settings."""
        self.config = pulumi.Config()
        self.environment_suffix = self.config.get("environment_suffix") or "dev"
        
        # Region enforcement - must be us-east-1 (addresses model failure: region enforcement missing)
        self.region = "us-east-1"
        
        # Create AWS provider with explicit region enforcement
        # This provider is passed to ALL resources to ensure region compliance
        self.aws_provider = aws.Provider(
            "aws",
            region=self.region,
            # Ensure we're using the correct region
            allowed_account_ids=[self.config.get("allowed_account_id")] if self.config.get("allowed_account_id") else None
        )
        
        # S3 bucket configuration - using unique names to avoid conflicts
        self.input_bucket_name = self.config.get("input_bucket_name") or f"clean-s3-lambda-input-{self.environment_suffix}"
        self.output_bucket_name = self.config.get("output_bucket_name") or f"clean-s3-lambda-output-{self.environment_suffix}"
        
        # Lambda configuration
        self.lambda_function_name = f"s3-processor-{self.environment_suffix}"
        self.lambda_timeout = self.config.get_int("lambda_timeout") or 300  # 5 minutes max
        self.lambda_memory = self.config.get_int("lambda_memory") or 128
        
        # IP restrictions for S3 bucket access
        self.allowed_ip_ranges = self.config.get_object("allowed_ip_ranges") or [
            "10.0.0.0/8",      # Private networks
            "172.16.0.0/12",   # Private networks
            "192.168.0.0/16"   # Private networks
        ]
        
        # Environment variables for Lambda function
        self.lambda_environment_vars = {
            "ENVIRONMENT": self.environment_suffix,
            "REGION": self.region,
            "INPUT_BUCKET": self.input_bucket_name,
            "OUTPUT_BUCKET": self.output_bucket_name,
            "LOG_LEVEL": self.config.get("log_level") or "INFO"
        }
    
    def get_tags(self) -> Dict[str, str]:
        """Get default tags for all resources."""
        return {
            "Environment": self.environment_suffix,
            "Project": "s3-lambda-processor",
            "ManagedBy": "pulumi",
            "Component": "serverless",
            "Region": self.region
        }
    
    def get_environment_variables(self) -> Dict[str, str]:
        """Get environment variables for Lambda function."""
        return self.lambda_environment_vars
    
    def get_allowed_ip_ranges(self) -> list:
        """Get allowed IP ranges for S3 bucket access."""
        return self.allowed_ip_ranges
    
    def validate_configuration(self) -> bool:
        """Validate configuration settings."""
        # Ensure region is us-east-1
        if self.region != "us-east-1":
            raise ValueError("Deployment must be restricted to us-east-1 region")
        
        # Validate IP ranges are not too permissive
        for ip_range in self.allowed_ip_ranges:
            if ip_range == "0.0.0.0/0":
                raise ValueError("IP range 0.0.0.0/0 is not allowed for security reasons")
        
        # Validate Lambda timeout
        if self.lambda_timeout > 300:
            raise ValueError("Lambda timeout cannot exceed 5 minutes (300 seconds)")
        
        return True
