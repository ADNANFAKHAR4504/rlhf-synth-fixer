#!/usr/bin/env python3
"""
Pulumi application entry point for the Manufacturing IoT Platform infrastructure.

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

# Get environment suffix from ENVIRONMENT_SUFFIX env var, config, or fallback to 'dev'
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

# Export stack outputs
pulumi.export("vpc_id", stack.vpc.id)
pulumi.export("ecs_cluster_arn", stack.ecs_cluster.arn)
pulumi.export("kinesis_stream_name", stack.kinesis_stream.name)
pulumi.export("kinesis_stream_arn", stack.kinesis_stream.arn)
pulumi.export("redis_endpoint", stack.redis_cluster.primary_endpoint_address)
pulumi.export("aurora_endpoint", stack.aurora_cluster.endpoint)
pulumi.export("aurora_cluster_arn", stack.aurora_cluster.arn)
pulumi.export("efs_id", stack.efs_filesystem.id)
pulumi.export("api_gateway_url", stack.api_gateway.api_endpoint)
pulumi.export("api_gateway_id", stack.api_gateway.id)
pulumi.export("secret_arn", stack.db_credentials_secret.arn)
pulumi.export("kms_key_id", stack.kms_key.id)
pulumi.export("kms_key_arn", stack.kms_key.arn)
pulumi.export("environment_suffix", environment_suffix)
