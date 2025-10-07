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
# Add parent directory to path to import lib modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pulumi
from pulumi import Config, ResourceOptions
from lib.tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from config or environment variable or fallback to 'dev'
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

# Export outputs at stack level
pulumi.export("main_queue_url", stack.main_queue.url)
pulumi.export("main_queue_arn", stack.main_queue.arn)
pulumi.export("dlq_url", stack.dlq.url)
pulumi.export("dlq_arn", stack.dlq.arn)
pulumi.export("dynamodb_table_name", stack.event_log_table.name)
pulumi.export("lambda_function_name", stack.event_processor.name)
pulumi.export("lambda_function_arn", stack.event_processor.arn)
