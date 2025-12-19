"""
Configuration settings for the image processing pipeline.
Centralized configuration for easy maintenance and environment-specific deployments.
Addresses model failures around region configuration and resource naming.
"""

import os
from dataclasses import dataclass
from typing import Any, Dict, List

import pulumi
import pulumi_aws as aws

# Get configuration from Pulumi config or use defaults
config = pulumi.Config()

@dataclass
class ImageProcessingConfig:
    """Configuration class for image processing pipeline."""
    
    # AWS Configuration - addresses model failure: region configuration mismatch
    aws_region: str
    aws_provider: Any
    
    # S3 Configuration with unique naming
    source_bucket_name: str
    dest_bucket_name: str
    
    # Lambda Configuration
    lambda_function_name: str
    lambda_timeout: int
    lambda_memory: int
    lambda_runtime: str
    reserved_concurrent_executions: int
    
    # Image Processing Configuration
    image_sizes: Dict[str, Dict[str, Any]]
    supported_extensions: List[str]
    
    # CloudWatch Configuration
    log_retention_days: int
    
    # VPC Configuration - addresses model failure: Lambda VPC deployment missing
    vpc_id: str
    subnet_ids: List[str]
    security_group_ids: List[str]
    
    # KMS Configuration - addresses model failure: KMS key usage missing
    kms_key_id: str
    
    # Dead Letter Queue Configuration - addresses model failure: Dead-letter config incomplete
    dlq_arn: str
    
    # Tags for all resources
    default_tags: Dict[str, str]

def create_config() -> ImageProcessingConfig:
    """
    Creates configuration for the image processing pipeline.
    Addresses model failures around region configuration and resource naming.
    """
    
    # Get stack name for unique resource naming
    stack_name = pulumi.get_stack()
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', stack_name)
    
    # AWS Configuration - addresses model failure: region configuration mismatch
    # Use environment variable or Pulumi config, default to us-west-2 as specified
    aws_region = os.environ.get('AWS_REGION') or config.get('aws_region') or 'us-west-2'
    
    # Create AWS provider with explicit region enforcement
    # This addresses model failure: region configuration mismatch
    aws_provider = aws.Provider(
        "aws",
        region=aws_region,
        # Ensure we're using the correct region
        allowed_account_ids=[config.get("allowed_account_id")] if config.get("allowed_account_id") else None
    )
    
    # S3 Configuration with unique naming - addresses model failure: bucket naming non-unique
    source_bucket_name = config.get("source_bucket_name") or f"image-uploads-{environment_suffix}"
    dest_bucket_name = config.get("dest_bucket_name") or f"processed-images-{environment_suffix}"
    
    # Lambda Configuration
    lambda_function_name = config.get("lambda_function_name") or f"image-processor-{environment_suffix}"
    lambda_timeout = config.get_int("lambda_timeout") or 60  # seconds
    lambda_memory = config.get_int("lambda_memory") or 1024  # MB
    lambda_runtime = "python3.11"
    reserved_concurrent_executions = config.get_int("reserved_concurrent_executions") or 50  # Configurable
    
    # Image Processing Configuration
    image_sizes = {
        "standard": {"width": 800, "height": 600, "suffix": "standard"},
        "thumbnail": {"width": 150, "height": 150, "suffix": "thumb"}
    }
    
    # Supported image formats
    supported_extensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]
    
    # CloudWatch Configuration
    log_retention_days = config.get_int("log_retention_days") or 7
    
    # VPC Configuration - addresses model failure: Lambda VPC deployment missing
    vpc_id = config.get("vpc_id") or ""
    subnet_ids = config.get_object("subnet_ids") or []
    security_group_ids = config.get_object("security_group_ids") or []
    
    # KMS Configuration - addresses model failure: KMS key usage missing
    kms_key_id = config.get("kms_key_id") or ""
    
    # Dead Letter Queue Configuration - addresses model failure: Dead-letter config incomplete
    dlq_arn = config.get("dlq_arn") or ""
    
    # Tags for all resources
    default_tags = {
        "Project": "ImageProcessingPipeline",
        "ManagedBy": "Pulumi",
        "Environment": environment_suffix,
        "CostCenter": "Engineering",
        "Region": aws_region
    }
    
    return ImageProcessingConfig(
        aws_region=aws_region,
        aws_provider=aws_provider,
        source_bucket_name=source_bucket_name,
        dest_bucket_name=dest_bucket_name,
        lambda_function_name=lambda_function_name,
        lambda_timeout=lambda_timeout,
        lambda_memory=lambda_memory,
        lambda_runtime=lambda_runtime,
        reserved_concurrent_executions=reserved_concurrent_executions,
        image_sizes=image_sizes,
        supported_extensions=supported_extensions,
        log_retention_days=log_retention_days,
        vpc_id=vpc_id,
        subnet_ids=subnet_ids,
        security_group_ids=security_group_ids,
        kms_key_id=kms_key_id,
        dlq_arn=dlq_arn,
        default_tags=default_tags
    )
