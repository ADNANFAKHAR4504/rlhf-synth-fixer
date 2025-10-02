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
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pulumi
from pulumi import Config, ResourceOptions
from lib.tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from environment variable or use task ID
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', f'synth{os.getenv("TASK_ID", "32168794")}')
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
    'Project': 'inventory-processing',
    'ManagedBy': 'Pulumi'
}

# Create the stack with proper arguments
stack = TapStack(
    name="tap-inventory-stack",
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        tags=default_tags
    ),
)

# Export outputs
pulumi.export('environment_suffix', environment_suffix)
pulumi.export('bucket_name', stack.inventory_bucket.id)
pulumi.export('table_name', stack.inventory_table.name)
pulumi.export('processor_function', stack.inventory_processor.name)
pulumi.export('summary_function', stack.summary_processor.name)
pulumi.export('dlq_url', stack.dlq.url)
pulumi.export('dashboard_url', pulumi.Output.concat(
    "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=",
    stack.dashboard.dashboard_name
))
