#!/usr/bin/env python3
"""
Pulumi application entry point for multi-environment infrastructure.

This module instantiates the TapStack with configuration from the active
Pulumi stack (dev, staging, or production).
"""
import os
from datetime import datetime, timezone
import pulumi
import pulumi_aws as aws
from pulumi import Config, ResourceOptions
from lib.tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from config or environment variable
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX') or config.get('environment_suffix') or 'dev'

# Get environment-specific configuration
lambda_memory_mb = config.get_int('lambda_memory_mb') or 512
log_retention_days = config.get_int('log_retention_days') or 7
enable_versioning = config.get_bool('enable_versioning') or False

# Deployment metadata
repository_name = os.getenv('REPOSITORY', 'tap-infrastructure')
commit_author = os.getenv('COMMIT_AUTHOR', 'system')
pr_number = os.getenv('PR_NUMBER', 'local')
team = os.getenv('TEAM', 'platform')
created_at = datetime.now(timezone.utc).isoformat()

# Default tags for all resources
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
    'PRNumber': pr_number,
    'Team': team,
    'CreatedAt': created_at,
}

# Configure AWS provider with default tags
provider = aws.Provider(
    'aws',
    region=os.getenv('AWS_REGION', 'us-east-1'),
    default_tags=aws.ProviderDefaultTagsArgs(
        tags=default_tags
    )
)

# Create the infrastructure stack
stack = TapStack(
    name=f'tap-stack-{environment_suffix}',
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        lambda_memory_mb=lambda_memory_mb,
        log_retention_days=log_retention_days,
        enable_versioning=enable_versioning,
        tags=default_tags
    ),
    opts=ResourceOptions(provider=provider)
)

# Export stack outputs
pulumi.export('environment', environment_suffix)
pulumi.export('bucket_name', stack.bucket.id)
pulumi.export('lambda_function_name', stack.lambda_function.name)
pulumi.export('lambda_function_arn', stack.lambda_function.arn)
pulumi.export('log_group_name', stack.log_group.name)
