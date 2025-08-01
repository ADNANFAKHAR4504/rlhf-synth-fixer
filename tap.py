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

# Export outputs at the top level
pulumi.export("inventory_api_url", stack.inventory_serverless.api_deployment.invoke_url)
pulumi.export("inventory_items_table_name", stack.inventory_serverless.inventory_items_table.name)
pulumi.export("inventory_items_table_arn", stack.inventory_serverless.inventory_items_table.arn)
pulumi.export("inventory_audit_table_name", stack.inventory_serverless.inventory_audit_table.name)
pulumi.export("inventory_audit_table_arn", stack.inventory_serverless.inventory_audit_table.arn)
pulumi.export("inventory_lambda_function_name", stack.inventory_serverless.inventory_api_lambda.name)
pulumi.export("inventory_lambda_function_arn", stack.inventory_serverless.inventory_api_lambda.arn)
pulumi.export("inventory_sns_topic_arn", stack.inventory_serverless.inventory_alerts_topic.arn)
pulumi.export("inventory_api_gateway_arn", stack.inventory_serverless.inventory_api.arn)
pulumi.export("inventory_lambda_role_arn", stack.inventory_serverless.lambda_role.arn)
pulumi.export("environment", environment_suffix)
