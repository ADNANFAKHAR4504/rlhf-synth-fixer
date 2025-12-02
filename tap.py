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

# Export stack outputs for integration tests
# Only export config_recorder_name if it was created
if stack.config_stack.config_recorder:
    pulumi.export('config_recorder_name', stack.config_stack.config_recorder.name)
else:
    pulumi.export('config_recorder_name', 'default')  # Use existing default recorder name
pulumi.export('dynamodb_table_name', stack.monitoring_stack.dynamodb_table.name)
pulumi.export('sns_topic_arn', stack.monitoring_stack.sns_topic.arn)
pulumi.export('reports_bucket_name', stack.monitoring_stack.reports_bucket.id)
pulumi.export('config_bucket_name', stack.monitoring_stack.config_bucket.id)
pulumi.export('ec2_tag_lambda_name', stack.compliance_stack.ec2_tag_lambda.name)
pulumi.export('s3_encryption_lambda_name', stack.compliance_stack.s3_encryption_lambda.name)
pulumi.export('rds_backup_lambda_name', stack.compliance_stack.rds_backup_lambda.name)
pulumi.export('report_aggregator_lambda_name', stack.compliance_stack.report_aggregator_lambda.name)
