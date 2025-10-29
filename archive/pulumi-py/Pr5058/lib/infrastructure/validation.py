"""
Configuration validation module for serverless infrastructure.

This module provides validation functions that can run without
requiring live AWS credentials, supporting offline validation
and dry-run scenarios.
"""

import re
from typing import List, Tuple

from .config import ServerlessConfig


class ValidationError(Exception):
    """Custom exception for validation errors."""
    pass


def validate_configuration(config: ServerlessConfig) -> Tuple[bool, List[str]]:
    """
    Validate configuration without requiring AWS credentials.
    
    This function performs offline validation of configuration values
    to catch errors before deployment. It does NOT make AWS API calls.
    
    Args:
        config: ServerlessConfig instance to validate
        
    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []
    
    # Validate project name
    if not config.project_name:
        errors.append("Project name cannot be empty")
    elif not re.match(r'^[a-z0-9-]+$', config.project_name):
        errors.append("Project name must contain only lowercase letters, numbers, and hyphens")
    
    # Validate environment suffix
    if not config.environment_suffix:
        errors.append("Environment suffix cannot be empty")
    elif not re.match(r'^[a-z0-9]+$', config.environment_suffix):
        errors.append("Environment suffix must contain only lowercase letters and numbers")
    
    # Validate region format
    if not config.primary_region:
        errors.append("Primary region cannot be empty")
    elif not re.match(r'^[a-z]{2}-[a-z]+-\d+$', config.primary_region):
        errors.append(f"Invalid region format: {config.primary_region}. Expected format: us-east-1")
    
    # Validate Lambda configuration
    if config.lambda_timeout < 1 or config.lambda_timeout > 900:
        errors.append(f"Lambda timeout must be between 1 and 900 seconds, got {config.lambda_timeout}")
    
    if config.lambda_memory_size < 128 or config.lambda_memory_size > 10240:
        errors.append(f"Lambda memory must be between 128 and 10240 MB, got {config.lambda_memory_size}")
    
    if config.lambda_memory_size % 64 != 0:
        errors.append(f"Lambda memory must be a multiple of 64 MB, got {config.lambda_memory_size}")
    
    if config.lambda_max_retry_attempts < 0 or config.lambda_max_retry_attempts > 2:
        errors.append(f"Lambda max retry attempts must be between 0 and 2, got {config.lambda_max_retry_attempts}")
    
    # Validate DynamoDB configuration
    if config.dynamodb_billing_mode not in ["PROVISIONED", "PAY_PER_REQUEST"]:
        errors.append(f"Invalid DynamoDB billing mode: {config.dynamodb_billing_mode}")
    
    if config.dynamodb_billing_mode == "PROVISIONED":
        if config.dynamodb_read_capacity < 1:
            errors.append(f"DynamoDB read capacity must be >= 1, got {config.dynamodb_read_capacity}")
        if config.dynamodb_write_capacity < 1:
            errors.append(f"DynamoDB write capacity must be >= 1, got {config.dynamodb_write_capacity}")
    
    # Validate S3 configuration
    if config.s3_lifecycle_days < 1:
        errors.append(f"S3 lifecycle days must be >= 1, got {config.s3_lifecycle_days}")
    
    # Validate monitoring configuration
    if config.alarm_evaluation_periods < 1:
        errors.append(f"Alarm evaluation periods must be >= 1, got {config.alarm_evaluation_periods}")
    
    if config.error_rate_threshold < 0 or config.error_rate_threshold > 100:
        errors.append(f"Error rate threshold must be between 0 and 100, got {config.error_rate_threshold}")
    
    # Validate Lambda runtime
    valid_runtimes = [
        "python3.8", "python3.9", "python3.10", "python3.11", "python3.12",
        "nodejs18.x", "nodejs20.x"
    ]
    if config.lambda_runtime not in valid_runtimes:
        errors.append(f"Invalid Lambda runtime: {config.lambda_runtime}. Valid runtimes: {', '.join(valid_runtimes)}")
    
    return (len(errors) == 0, errors)


def validate_resource_names(config: ServerlessConfig) -> Tuple[bool, List[str]]:
    """
    Validate that generated resource names meet AWS naming requirements.
    
    Args:
        config: ServerlessConfig instance
        
    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []
    
    # Validate S3 bucket name
    bucket_name = config.get_s3_bucket_name("files")
    if len(bucket_name) < 3 or len(bucket_name) > 63:
        errors.append(f"S3 bucket name length must be between 3 and 63 characters, got {len(bucket_name)}")
    
    if not re.match(r'^[a-z0-9][a-z0-9-]*[a-z0-9]$', bucket_name):
        errors.append(f"Invalid S3 bucket name format: {bucket_name}")
    
    if '..' in bucket_name or '.-' in bucket_name or '-.' in bucket_name:
        errors.append(f"S3 bucket name contains invalid character sequences: {bucket_name}")
    
    # Validate Lambda function name
    lambda_name = config.get_lambda_function_name("api-handler")
    if len(lambda_name) > 64:
        errors.append(f"Lambda function name exceeds 64 characters: {lambda_name}")
    
    if not re.match(r'^[a-zA-Z0-9-_]+$', lambda_name):
        errors.append(f"Invalid Lambda function name format: {lambda_name}")
    
    # Validate DynamoDB table name
    table_name = config.get_dynamodb_table_name("items")
    if len(table_name) < 3 or len(table_name) > 255:
        errors.append(f"DynamoDB table name length must be between 3 and 255 characters, got {len(table_name)}")
    
    if not re.match(r'^[a-zA-Z0-9_.-]+$', table_name):
        errors.append(f"Invalid DynamoDB table name format: {table_name}")
    
    return (len(errors) == 0, errors)


def run_all_validations(config: ServerlessConfig) -> None:
    """
    Run all validation checks and raise ValidationError if any fail.
    
    This function aggregates all validation errors and provides
    a comprehensive error message for troubleshooting.
    
    Args:
        config: ServerlessConfig instance to validate
        
    Raises:
        ValidationError: If any validation checks fail
    """
    all_errors = []
    
    # Run configuration validation
    config_valid, config_errors = validate_configuration(config)
    if not config_valid:
        all_errors.extend(config_errors)
    
    # Run resource name validation
    names_valid, name_errors = validate_resource_names(config)
    if not names_valid:
        all_errors.extend(name_errors)
    
    # If any errors, raise exception
    if all_errors:
        error_message = "Configuration validation failed:\n" + "\n".join(f"  - {error}" for error in all_errors)
        raise ValidationError(error_message)

