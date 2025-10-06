"""
config.py

Configuration module for the serverless infrastructure.
Handles all configuration parameters and AWS provider setup with region restriction.
"""

import pulumi
import pulumi_aws as aws


class ServerlessConfig:
    """Configuration class for serverless infrastructure."""
    
    def __init__(self):
        self.config = pulumi.Config()
        
        # Get environment variables with fallbacks
        import os

        # Required parameters with environment variable fallbacks
        self.aws_region = self.config.get("aws_region") or os.getenv("AWS_REGION", "us-east-1")
        self.environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
        
        # Generate names using environment suffix
        # Ensure bucket name is lowercase and valid for S3
        stack_name = pulumi.get_stack()[:6].lower().replace('_', '-')
        # Add timestamp suffix to ensure uniqueness
        import time
        timestamp = str(int(time.time()))[-6:]  # Last 6 digits of timestamp
        self.s3_bucket_name = self.config.get("s3_bucket_name") or f"sa-{self.environment_suffix}-{stack_name}-{timestamp}"
        self.lambda_function_name = self.config.get("lambda_function_name") or f"serverless-app-{self.environment_suffix}"
        self.custom_domain_name = self.config.get("custom_domain_name") or f"api-{self.environment_suffix}.example.com"
        
        # Optional parameters with defaults
        self.lambda_timeout = self.config.get_int("lambda_timeout") or 180  # 3 minutes
        self.lambda_provisioned_concurrency = self.config.get_int("lambda_provisioned_concurrency") or 5
        self.lambda_memory_size = self.config.get_int("lambda_memory_size") or 256
        self.lambda_runtime = self.config.get("lambda_runtime") or "python3.9"
        self.lambda_handler = self.config.get("lambda_handler") or "app.handler"
        self.lambda_code_path = self.config.get("lambda_code_path") or "lib/infrastructure/lambda_code"
        
        # Certificate ARN for custom domain (optional)
        self.certificate_arn = self.config.get("certificate_arn")
        
        # Log retention in days
        self.log_retention_days = self.config.get_int("log_retention_days") or 30
        
        # Create AWS provider with strict region restriction
        self.aws_provider = aws.Provider(
            "aws",
            region=self.aws_region,
            # Ensure all resources are created in the specified region
            default_tags=aws.ProviderDefaultTagsArgs(
                tags={
                    "Environment": self.environment_suffix,
                    "Project": "serverless-infrastructure",
                    "ManagedBy": "pulumi"
                }
            )
        )
    
    def get_environment_variables(self):
        """Get environment variables for Lambda function."""
        return {
            "ENVIRONMENT": self.environment_suffix,
            "REGION": self.aws_region,
            "PARAMETER_PREFIX": f"/{self.lambda_function_name}",
            "S3_BUCKET_NAME": self.s3_bucket_name
        }
    
    def get_tags(self):
        """Get default tags for all resources."""
        return {
            "Environment": self.environment_suffix,
            "Project": "serverless-infrastructure",
            "ManagedBy": "pulumi",
            "Component": "serverless"
        }


# Global configuration instance
config = ServerlessConfig()
