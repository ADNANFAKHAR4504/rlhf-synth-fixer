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

# Get environment suffix from config or environment variable or fallback to 'dev'
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', config.get('env') or 'dev')
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

# Export stack outputs so they're available to CI/CD and external systems
pulumi.export('iot_endpoint', stack.iot.iot_endpoint)
pulumi.export('kinesis_stream_name', stack.storage.kinesis_stream.name)
pulumi.export('kinesis_stream_arn', stack.storage.kinesis_stream.arn)
pulumi.export('dynamodb_table_name', stack.storage.dynamodb_table.name)
pulumi.export('dynamodb_table_arn', stack.storage.dynamodb_table.arn)
pulumi.export('s3_bucket_name', stack.storage.s3_bucket.bucket)
pulumi.export('s3_bucket_arn', stack.storage.s3_bucket.arn)
pulumi.export('lambda_function_name', stack.compute.anomaly_lambda.name)
pulumi.export('lambda_function_arn', stack.compute.anomaly_lambda.arn)
pulumi.export('sns_topic_arn', stack.monitoring.sns_topic.arn)
pulumi.export('security_sns_topic_arn', stack.monitoring.security_sns_topic.arn)
pulumi.export('dashboard_name', stack.monitoring.dashboard.dashboard_name)
pulumi.export('thing_type_name', stack.iot.thing_type.name)
pulumi.export('device_policy_name', stack.iot.device_policy.name)
