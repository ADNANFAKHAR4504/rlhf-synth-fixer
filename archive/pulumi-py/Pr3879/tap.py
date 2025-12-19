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

# Get environment suffix from ENV var or Pulumi config, fallback to 'dev'
# Prefer CI-provided ENVIRONMENT_SUFFIX when available to align with deploy scripts.
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

# Export outputs
pulumi.export('api_url', stack.api_stage.invoke_url.apply(lambda url: f"{url}/translate"))
pulumi.export('dynamodb_table_name', stack.translation_cache_table.name)
pulumi.export('s3_bucket_name', stack.documents_bucket.bucket)
pulumi.export('sqs_queue_url', stack.batch_queue.url)
pulumi.export('lambda_function_name', stack.translation_lambda.name)
pulumi.export('appsync_api_url', stack.appsync_api.uris.apply(lambda u: u.get('GRAPHQL', '')))
pulumi.export('appsync_api_key', stack.appsync_api_key.key)
