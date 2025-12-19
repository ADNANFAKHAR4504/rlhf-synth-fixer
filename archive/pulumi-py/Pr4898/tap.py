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
environment_suffix = config.get('env') or os.getenv('ENVIRONMENT_SUFFIX') or 'dev'
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
    args=TapStackArgs(environment_suffix=environment_suffix, tags=default_tags),
)

# Export stack outputs for integration tests
pulumi.export("vpc_id", stack.vpc_id)
pulumi.export("kinesis_stream_name", stack.kinesis_stream_name)
pulumi.export("kinesis_stream_arn", stack.kinesis_stream_arn)
pulumi.export("ecs_cluster_name", stack.ecs_cluster_name)
pulumi.export("ecs_cluster_arn", stack.ecs_cluster_arn)
pulumi.export("rds_endpoint", stack.rds_endpoint)
pulumi.export("elasticache_endpoint", stack.elasticache_endpoint)
pulumi.export("efs_id", stack.efs_id)
pulumi.export("efs_arn", stack.efs_arn)
pulumi.export("api_endpoint", stack.api_endpoint)
pulumi.export("alb_dns", stack.alb_dns)
pulumi.export("kms_key_id", stack.kms_key_id)
pulumi.export("cloudtrail_name", stack.cloudtrail_name)
