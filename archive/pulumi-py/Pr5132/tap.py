#!/usr/bin/env python3
"""
Pulumi program entry point for Healthcare Analytics Platform
Deploys infrastructure to eu-south-2 region
"""

import os
import pulumi
import pulumi_aws as aws
from pulumi import Config, ResourceOptions
from lib.tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from CI, config or fallback to 'dev'
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX') or config.get('env') or 'dev'
region = os.getenv('AWS_REGION')

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
    'Project': 'HealthTech-Analytics',
    'Region': region,
    'Compliance': 'Healthcare'
}

# Set provider for eu-south-2 region
provider = aws.Provider('provider', region=region)

# Create main stack
stack = TapStack(
    name='healthcare-analytics-platform',
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        region=region,
        tags=default_tags
    ),
    opts=ResourceOptions(provider=provider)
)

# Export outputs
pulumi.export('vpc_id', stack.vpc_stack.vpc_id)
pulumi.export('ecs_cluster_name', stack.ecs_stack.cluster_name)
pulumi.export('ecs_cluster_arn', stack.ecs_stack.cluster_arn)
pulumi.export('redis_endpoint', stack.redis_stack.redis_endpoint)
pulumi.export('redis_port', stack.redis_stack.redis_port)
pulumi.export('task_definition_arn', stack.ecs_stack.task_definition_arn)
pulumi.export('region', region)
