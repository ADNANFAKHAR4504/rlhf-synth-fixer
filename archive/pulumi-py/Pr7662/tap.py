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

# Export stack outputs explicitly for integration tests and cross-stack references
pulumi.export('bucket_name', stack.data_bucket.id)
pulumi.export('bucket_arn', stack.data_bucket.arn)
pulumi.export('table_name', stack.metadata_table.name)
pulumi.export('table_arn', stack.metadata_table.arn)
pulumi.export('topic_arn', stack.notification_topic.arn)
pulumi.export('queue_url', stack.task_queue.url)
pulumi.export('queue_arn', stack.task_queue.arn)
pulumi.export('dlq_url', stack.dlq.url)
pulumi.export('dlq_arn', stack.dlq.arn)
pulumi.export('function_arn', stack.processor_function.arn)
pulumi.export('function_name', stack.processor_function.name)
pulumi.export('lambda_role_arn', stack.lambda_role.arn)
