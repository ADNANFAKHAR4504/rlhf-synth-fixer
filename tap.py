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

# Get environment suffix from environment variable first, then config, then fallback
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

# Export outputs from the stack
pulumi.export("upload_bucket", stack.image_optimization.upload_bucket.id)
pulumi.export("webp_bucket", stack.image_optimization.webp_bucket.id)
pulumi.export("jpeg_bucket", stack.image_optimization.jpeg_bucket.id)
pulumi.export("png_bucket", stack.image_optimization.png_bucket.id)
pulumi.export("cloudfront_distribution", stack.image_optimization.distribution.domain_name)
pulumi.export("cloudfront_distribution_id", stack.image_optimization.distribution.id)
pulumi.export("dynamodb_table", stack.image_optimization.metadata_table.name)
pulumi.export("lambda_function", stack.image_optimization.processor_function.name)
pulumi.export("lambda_function_arn", stack.image_optimization.processor_function.arn)
