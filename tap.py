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

# Add lib directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'lib'))

from tap_stack import TapStack, TapStackArgs

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

# Create the TAP stack (this will bootstrap all infrastructure)
stack = TapStack(
    name="pulumi-infra",
    args=TapStackArgs(environment_suffix=environment_suffix),
)

# Export stack outputs for reference
pulumi.export("image_processing_outputs", pulumi.Output.all(
    stack.source_bucket.bucket,
    stack.dest_bucket.bucket,
    stack.processor_function.name,
    stack.log_group.name
).apply(lambda args: {
    "source_bucket": args[0],
    "dest_bucket": args[1],
    "lambda_function": args[2],
    "log_group": args[3],
    "upload_prefix": "uploads/",
    "instructions": "Upload images to the source bucket with prefix 'uploads/' to trigger processing"
}))
