#!/usr/bin/env python3
"""
Pulumi application entry point for the Product Catalog API infrastructure.

This module imports and executes the ECS Fargate deployment stack.
"""
import os
from datetime import datetime, timezone
import pulumi
import pulumi_aws as aws
from pulumi import Config, ResourceOptions

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from environment variables, fallback to 'dev'
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')
pr_number = os.getenv('PR_NUMBER', 'unknown')
team = os.getenv('TEAM', 'unknown')
created_at = datetime.now(timezone.utc).isoformat()

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
    'PRNumber': pr_number,
    'Team': team,
    "CreatedAt": created_at,
}

# Configure AWS provider with default tags
provider = aws.Provider('aws',
    region=os.getenv('AWS_REGION', 'us-east-1'),
    default_tags=aws.ProviderDefaultTagsArgs(
        tags=default_tags
    )
)

# Import the stack implementation
# The actual resources are created in lib/tap_stack.py
import lib.tap_stack
