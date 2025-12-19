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
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        tags=default_tags
    ),
    opts=ResourceOptions(provider=provider)
)

# Export stack outputs for the financial transaction processing pipeline
pulumi.export('transaction_queue_url', stack.transaction_queue.url)
pulumi.export('priority_queue_url', stack.priority_queue.url)
pulumi.export('dead_letter_queue_url', stack.dead_letter_queue.url)
pulumi.export('processing_table_name', stack.processing_table.name)
pulumi.export('fraud_table_name', stack.fraud_table.name)
pulumi.export('reports_bucket_name', stack.reports_bucket.bucket)
pulumi.export('transaction_processor_function_name', stack.transaction_processor.name)
pulumi.export('priority_processor_function_name', stack.priority_processor.name)
pulumi.export('fraud_detection_state_machine_arn', stack.fraud_detection_state_machine.arn)
pulumi.export('sns_alerts_topic_arn', stack.sns_alerts_topic.arn)
pulumi.export('fraud_alerts_topic_arn', stack.fraud_alerts_topic.arn)
pulumi.export('kms_key_id', stack.kms_key.key_id)
pulumi.export('event_bus_name', stack.event_bus.name)
