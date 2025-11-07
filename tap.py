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
import pulumi
from pulumi import Config, ResourceOptions
from lib.tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from CI, config or fallback to 'dev'
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX') or config.get('env') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
}

stack = TapStack(
    name="TapStack",
    args=TapStackArgs(environment_suffix=environment_suffix),
)

# Export outputs for testing and integration
pulumi.export('vpc_id', stack.networking.vpc_id)
pulumi.export('public_subnet_ids', stack.networking.public_subnet_ids)
pulumi.export('private_subnet_ids', stack.networking.private_subnet_ids)
pulumi.export('db_endpoint', stack.database.db_endpoint)
pulumi.export('db_secret_arn', stack.database.db_secret_arn)
pulumi.export('s3_bucket_name', stack.storage.s3_bucket_name)
pulumi.export('dynamodb_table_name', stack.storage.dynamodb_table_name)
pulumi.export('lambda_function_arn', stack.compute.lambda_function_arn)
pulumi.export('lambda_function_name', stack.compute.lambda_function_name)
pulumi.export('api_endpoint', stack.api.api_endpoint)
pulumi.export('api_id', stack.api.api_id)
