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

# Export stack outputs for integration testing
pulumi.export("vpc_id", stack.vpc.id)
pulumi.export("vpc_cidr", stack.vpc.cidr_block)
pulumi.export("internet_gateway_id", stack.igw.id)
pulumi.export("public_subnet_ids", [subnet.id for subnet in stack.public_subnets])
pulumi.export("private_subnet_ids", [subnet.id for subnet in stack.private_subnets])
pulumi.export("nat_gateway_ids", [nat.id for nat in stack.nat_gateways])
pulumi.export("security_group_id", stack.security_group.id)
pulumi.export("flow_log_id", stack.flow_log.id)
