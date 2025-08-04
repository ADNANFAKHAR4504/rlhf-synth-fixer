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

# Get environment suffix from config or environment variable, fallback to 'dev'
environment_suffix = config.get('env') or os.getenv('ENVIRONMENT_SUFFIX', 'dev')

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
    'Project': 'TapStack',
    'ManagedBy': 'pulumi'
}

stack = TapStack(
    name=f"TapStack-{environment_suffix}",
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        tags=default_tags
    ),
)

# Export key outputs
pulumi.export("vpcId", stack.vpc_id)
pulumi.export("publicSubnetIds", stack.public_subnet_ids)
pulumi.export("privateSubnetIds", stack.private_subnet_ids)
pulumi.export("bucketName", stack.bucket_name)
pulumi.export("lambdaName", stack.lambda_name)
pulumi.export("environment", environment_suffix)
