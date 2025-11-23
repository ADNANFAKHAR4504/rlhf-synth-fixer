#!/usr/bin/env python3
"""
Pulumi application entry point for HIPAA-compliant Healthcare Data Processing infrastructure.

This module defines the core Pulumi stack and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os
import pulumi
from pulumi import Config
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

# Create the main stack
stack = TapStack(
    name="healthcare-infra",
    args=TapStackArgs(environment_suffix=environment_suffix),
)

# Export stack outputs
pulumi.export("vpc_id", stack.vpc.id)
pulumi.export("ecs_cluster_arn", stack.ecs_cluster.arn)
pulumi.export("ecs_cluster_name", stack.ecs_cluster.name)
pulumi.export("alb_dns_name", stack.alb.dns_name)
pulumi.export("alb_arn", stack.alb.arn)
pulumi.export("aurora_endpoint", stack.aurora_cluster.endpoint)
pulumi.export("aurora_cluster_arn", stack.aurora_cluster.arn)
pulumi.export("ecr_repository_url", stack.ecr_repository.repository_url)
pulumi.export("ecr_repository_name", stack.ecr_repository.name)
pulumi.export("kms_key_id", stack.kms_key.id)
pulumi.export("kms_key_arn", stack.kms_key.arn)
pulumi.export("log_group_name", stack.log_group.name)
pulumi.export("db_secret_arn", stack.db_password_secret.arn)
pulumi.export("environment_suffix", environment_suffix)
