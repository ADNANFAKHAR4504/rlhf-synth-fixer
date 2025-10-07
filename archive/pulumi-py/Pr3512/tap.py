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

# Get environment suffix from config or fallback to 'dev'
environment_suffix = config.get('env') or 'dev'
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

# Export key stack outputs for integration testing
pulumi.export("environment_suffix", environment_suffix)
pulumi.export("metrics_table_name", stack.metrics_table.id)
pulumi.export("alert_config_table_name", stack.alert_config_table.id)
pulumi.export("metrics_bucket_name", stack.metrics_export_bucket.id)
pulumi.export("lambda_function_name", stack.metrics_processor.id)
pulumi.export("alert_topic_arn", stack.alert_topic.arn)
pulumi.export("api_gateway_id", stack.api.id)
pulumi.export("api_endpoint", pulumi.Output.concat(
    "https://", stack.api.id,
    ".execute-api.us-east-1.amazonaws.com/",
    stack.api_stage.stage_name
))
pulumi.export("aws_region", "us-east-1")  # Current region used in the stack
