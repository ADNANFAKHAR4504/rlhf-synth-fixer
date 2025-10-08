#!/usr/bin/env python3
"""
Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core Pulumi stack and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os
import sys

import pulumi

# Add the lib directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'lib'))

from tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = pulumi.Config()

# Get environment suffix from config or fallback to 'dev'
environment_suffix = config.get('env') or 'dev'
aws_region = config.get('aws_region') or os.getenv('AWS_REGION', 'us-east-1')

# Create default tags
default_tags = {
    'Project': os.getenv('PROJECT_NAME', 'serverless-app'),
    'Environment': environment_suffix,
    'Region': aws_region,
    'ManagedBy': 'Pulumi',
    'CreatedBy': 'InfrastructureAsCode'
}

# Create stack arguments
stack_args = TapStackArgs(
    environment_suffix=environment_suffix,
    tags=default_tags,
    aws_region=aws_region
)

# Create the main stack
stack = TapStack(
    name="pulumi-infra",
    args=stack_args
)

# Export key outputs for integration testing
pulumi.export("environment_suffix", environment_suffix)
pulumi.export("aws_region", aws_region)
pulumi.export("project_name", os.getenv('PROJECT_NAME', 'serverless-app'))

# Export infrastructure outputs
pulumi.export("api_gateway_invoke_url", stack.api_gateway_stack.get_outputs()["api_gateway_invoke_url"])
pulumi.export("s3_bucket_name", stack.s3_stack.get_outputs()["s3_bucket_name"])
pulumi.export("dynamodb_table_name", stack.dynamodb_stack.get_outputs()["main_table_name"])
pulumi.export("lambda_function_name", stack.lambda_stack.get_outputs()["main_lambda_function_name"])
