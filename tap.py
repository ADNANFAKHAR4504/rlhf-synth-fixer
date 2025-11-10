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

# Export outputs from the stack
pulumi.export('vpc_id', stack.vpc_stack.vpc_id)
pulumi.export('alb_dns_name', stack.load_balancer_stack.alb_dns_name)
pulumi.export('alb_zone_id', stack.load_balancer_stack.alb_zone_id)
pulumi.export('rds_endpoint', stack.database_stack.db_endpoint)
pulumi.export('rds_port', stack.database_stack.db_port)
pulumi.export('static_assets_bucket', stack.storage_stack.static_assets_bucket_name)
pulumi.export('sns_topic_arn', stack.monitoring_stack.sns_topic_arn)
