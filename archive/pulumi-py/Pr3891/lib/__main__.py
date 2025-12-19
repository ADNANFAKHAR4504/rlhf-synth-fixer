"""
Main entry point for the serverless infrastructure Pulumi program.

This module initializes the Pulumi stack with proper configuration,
region settings, and environment variables.
"""

import hashlib
import os
from typing import Any, Dict

import pulumi
from tap_stack import TapStack, TapStackArgs


def main():
    """
    Main entry point for the Pulumi program.
    
    Initializes the serverless infrastructure stack with proper
    configuration and environment variables.
    """
    # Get configuration from environment variables
    environment_suffix = os.getenv('ENVIRONMENT', 'dev')
    aws_region = os.getenv('AWS_REGION', 'us-east-1')
    
    # Create default tags
    default_tags = {
        'Project': os.getenv('PROJECT_NAME', 'serverless-app'),
        'Environment': environment_suffix,
        'Region': aws_region,
        'ManagedBy': 'Pulumi',
        'CreatedBy': 'InfrastructureAsCode'
    }
    
    # Add unique stack name to avoid CI/CD state conflicts
    import time

    # Force unique stack name for CI/CD to avoid stale state
    timestamp = int(time.time())
    ci_cd_suffix = f"-ci-{timestamp}" if os.getenv('CI', 'false') == 'true' else ""
    unique_hash = hashlib.md5(f"serverless-app-{environment_suffix}-{timestamp}{ci_cd_suffix}".encode()).hexdigest()[:8]
    unique_stack_name = f"{environment_suffix}-{unique_hash}"
    
    # Create stack arguments
    stack_args = TapStackArgs(
        environment_suffix=environment_suffix,
        tags=default_tags,
        aws_region=aws_region
    )
    
    # Create the main stack
    stack = TapStack(
        name=unique_stack_name,
        args=stack_args
    )
    
    # Export key outputs for integration testing
    pulumi.export("environment_suffix", environment_suffix)
    pulumi.export("aws_region", aws_region)
    pulumi.export("project_name", os.getenv('PROJECT_NAME', 'serverless-app'))
    pulumi.export("stack_name", unique_stack_name)
    
    # Export infrastructure outputs
    pulumi.export("api_gateway_invoke_url", stack.api_gateway_stack.get_outputs()["api_gateway_invoke_url"])
    pulumi.export("s3_bucket_name", stack.s3_stack.get_outputs()["s3_bucket_name"])
    pulumi.export("dynamodb_table_name", stack.dynamodb_stack.get_outputs()["main_table_name"])
    pulumi.export("lambda_function_name", stack.lambda_stack.get_outputs()["main_lambda_function_name"])
    
    return stack


if __name__ == "__main__":
    main()
