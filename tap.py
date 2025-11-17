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

# Export outputs at module level
pulumi.export("vpc_id", stack.vpc_id)
pulumi.export("alb_dns_name", stack.alb_dns_name)
pulumi.export("alb_arn", stack.alb_arn)
pulumi.export("rds_endpoint", stack.rds_endpoint)
pulumi.export("rds_address", stack.rds_address)
pulumi.export("data_bucket_arn", stack.data_bucket_arn)
pulumi.export("data_bucket_name", stack.data_bucket_name)
pulumi.export("logs_bucket_arn", stack.logs_bucket_arn)
pulumi.export("logs_bucket_name", stack.logs_bucket_name)
