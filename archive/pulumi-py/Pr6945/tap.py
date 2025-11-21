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
    name="pulumi-infra",
    args=TapStackArgs(environment_suffix=environment_suffix),
)

# Export key resource information
pulumi.export('lambda_function_name', stack.lambda_function.name)
pulumi.export('lambda_function_arn', stack.lambda_function.arn)
pulumi.export('dynamodb_table_name', stack.dynamodb_table.name)
pulumi.export('s3_bucket_name', stack.s3_bucket.bucket)
pulumi.export('s3_bucket_arn', stack.s3_bucket.arn)
pulumi.export('vpc_id', stack.vpc.id)
pulumi.export('log_group_name', stack.log_group.name)
pulumi.export('environment', STACK_NAME)
