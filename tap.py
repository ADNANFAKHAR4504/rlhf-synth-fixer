#!/usr/bin/env python3
"""
CDK application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core CDK application and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os

import aws_cdk as cdk
from aws_cdk import Tags

from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

# Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)

# Create a TapStackProps object to pass environment_suffix
# Configure environment based on available AWS credentials and region settings

# Check for region configuration in lib/AWS_REGION file (for region-specific deployments)
region = None
aws_region_file = os.path.join('lib', 'AWS_REGION')
if os.path.exists(aws_region_file):
    with open(aws_region_file, 'r', encoding='utf-8') as f:
        region = f.read().strip()

# Fallback to environment variables or default
if not region:
    region = os.getenv('CDK_DEFAULT_REGION') or os.getenv('AWS_DEFAULT_REGION') or 'us-east-1'

# For CI/CD environments, let CDK resolve account from AWS credentials
# For local development with explicit credentials, use environment variables
account = os.getenv('CDK_DEFAULT_ACCOUNT')
env_config = None
if account and account.strip():
    env_config = cdk.Environment(account=account, region=region)

props = TapStackProps(
    environment_suffix=environment_suffix,
    env=env_config
)

# Initialize the stack with proper parameters
TapStack(app, STACK_NAME, props=props)

app.synth()
