"""
Configuration module for serverless S3-triggered Lambda infrastructure.
Handles environment variables, region enforcement, and deployment settings.
"""

import re
from typing import Any, Dict

import pulumi
import pulumi_aws as aws


def normalize_s3_bucket_name(name: str) -> str:
    """
    Normalize S3 bucket name to comply with AWS naming rules.
    
    AWS S3 bucket naming rules:
    - Must be 3-63 characters long
    - Can only contain lowercase letters, numbers, dots, and hyphens
    - Must start and end with a letter or number
    - Cannot contain consecutive dots
    - Cannot look like an IP address
    """
    # Convert to lowercase
    normalized = name.lower()
    
    # Replace invalid characters with hyphens
    normalized = re.sub(r'[^a-z0-9.-]', '-', normalized)
    
    # Remove consecutive dots and hyphens
    normalized = re.sub(r'\.{2,}', '.', normalized)
    normalized = re.sub(r'-{2,}', '-', normalized)
    
    # Remove leading/trailing dots and hyphens
    normalized = normalized.strip('.-')
    
    # Handle empty string case first
    if not normalized:
        normalized = 'bucket'
    
    # Ensure it starts and ends with alphanumeric
    if normalized and not normalized[0].isalnum():
        normalized = 'a' + normalized
    if normalized and not normalized[-1].isalnum():
        normalized = normalized + 'a'
    
    # Handle IP-like addresses by adding prefix/suffix
    if re.match(r'^\d{1,3}(\.\d{1,3}){3}$', normalized):
        normalized = 'a-' + normalized + '-a'
    
    # Ensure minimum length
    if len(normalized) < 3:
        normalized = normalized + '-bucket'
    
    # Ensure maximum length
    if len(normalized) > 63:
        normalized = normalized[:63]
        # Ensure it ends with alphanumeric
        while normalized and not normalized[-1].isalnum():
            normalized = normalized[:-1]
    
    return normalized


def validate_s3_bucket_name(name: str) -> bool:
    """
    Validate S3 bucket name against AWS naming rules.
    
    Returns True if valid, False otherwise.
    """
    if not name or len(name) < 3 or len(name) > 63:
        return False
    
    # Must start and end with alphanumeric
    if not name[0].isalnum() or not name[-1].isalnum():
        return False
    
    # Can only contain lowercase letters, numbers, dots, and hyphens
    if not re.match(r'^[a-z0-9.-]+$', name):
        return False
    
    # Cannot contain consecutive dots
    if '..' in name:
        return False
    
    # Cannot look like an IP address
    if re.match(r'^\d{1,3}(\.\d{1,3}){3}$', name):
        return False
    
    return True


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
        # Normalize environment suffix to ensure valid bucket names
        normalized_env = normalize_s3_bucket_name(self.environment_suffix)
        
        # Get region short name for uniqueness
        region_short = self.region.replace("-", "")  # us-east-1 -> useast1
        
        # Generate bucket names with region and normalized environment suffix
        # This ensures uniqueness within the region
        input_bucket_base = self.config.get("input_bucket_name") or f"clean-s3-lambda-input-{region_short}-{normalized_env}"
        output_bucket_base = self.config.get("output_bucket_name") or f"clean-s3-lambda-output-{region_short}-{normalized_env}"
        
        # Normalize the complete bucket names
        self.input_bucket_name = normalize_s3_bucket_name(input_bucket_base)
        self.output_bucket_name = normalize_s3_bucket_name(output_bucket_base)
        
        # Validate the final bucket names
        if not validate_s3_bucket_name(self.input_bucket_name):
            raise ValueError(f"Invalid input bucket name: {self.input_bucket_name}")
        if not validate_s3_bucket_name(self.output_bucket_name):
            raise ValueError(f"Invalid output bucket name: {self.output_bucket_name}")
        
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
        
        # Validate S3 bucket names (already validated in __init__, but double-check)
        if not validate_s3_bucket_name(self.input_bucket_name):
            raise ValueError(f"Input bucket name validation failed: {self.input_bucket_name}")
        if not validate_s3_bucket_name(self.output_bucket_name):
            raise ValueError(f"Output bucket name validation failed: {self.output_bucket_name}")
        
        return True
