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
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pulumi
from pulumi import Config, ResourceOptions
from lib.tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from config or environment variable
import os
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', config.get('env') or 'dev')
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

# Export stack outputs at the Pulumi program level
# These outputs will be visible when running `pulumi stack output`
pulumi.export("api_endpoint", stack.api_endpoint)
pulumi.export("table_name", stack.table_name) 
pulumi.export("lambda_function_name", stack.lambda_function_name)
pulumi.export("dlq_url", stack.dlq_url)
pulumi.export("dashboard_url", stack.dashboard_url)

# Additional useful exports
pulumi.export("environment", environment_suffix)
pulumi.export("stack_name", STACK_NAME)
