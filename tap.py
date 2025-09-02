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
import sys
import pulumi
from pulumi import Config, ResourceOptions

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from lib.tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from config or fallback to 'dev'
environment_suffix = config.get('env') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
}

# Create the TapStack component
tap_stack = TapStack(
    name="pulumi-infra",
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        tags=default_tags
    ),
)

# Export the outputs from TapStack so they appear in stack outputs
pulumi.export("kms_key_arn", tap_stack.kms_key.arn)
pulumi.export("kms_key_id", tap_stack.kms_key.key_id)
pulumi.export("logs_bucket_name", tap_stack.logs_bucket.bucket)
pulumi.export("data_bucket_name", tap_stack.data_bucket.bucket)
pulumi.export("data_bucket_arn", tap_stack.data_bucket.arn)
pulumi.export("bucket_policy_id", tap_stack.bucket_policy.id)
pulumi.export("access_error_alarm_arn", tap_stack.access_error_alarm.arn)
