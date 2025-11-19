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
from datetime import datetime, timezone
import pulumi
import pulumi_aws as aws
from pulumi import Config, ResourceOptions
from lib.tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from environment variables, fallback to 'dev'
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
STACK_NAME = f"TapStack{environment_suffix}"

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

stack = TapStack(
    name="pulumi-infra",
    args=TapStackArgs(environment_suffix=environment_suffix),
    opts=ResourceOptions(provider=provider)
)

# Export stack outputs for Banking Portal Infrastructure
pulumi.export('cloudfront_distribution_url', stack.cloudfront_distribution.domain_name)
pulumi.export('alb_dns_name', stack.alb.dns_name)
pulumi.export('rds_endpoint', stack.rds_instance.endpoint)
pulumi.export('vpc_id', stack.vpc.id)
pulumi.export('static_assets_bucket', stack.static_assets_bucket.bucket)
pulumi.export('logs_bucket', stack.logs_bucket.bucket)
pulumi.export('cloudwatch_log_group_name', stack.cloudwatch_log_group.name)
pulumi.export('kms_key_id', stack.kms_key.key_id)
pulumi.export('auto_scaling_group_name', stack.auto_scaling_group.name)
pulumi.export('target_group_arn', stack.target_group.arn)
pulumi.export('sns_alert_topic_arn', stack.alert_topic.arn)
