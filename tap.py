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

# Get environment suffix from CDK context or use 'dev' as default
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

# Gather additional metadata from environment variables (useful for tagging)
repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Apply tags to all stacks in the app
Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)

# Create a TapStackProps object that includes environment and suffix
props = TapStackProps(
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region=os.getenv('CDK_DEFAULT_REGION') or 'us-west-2'  # fallback for local use
    )
)

# Instantiate the TapStack, which includes nested ComputeStack
TapStack(app, STACK_NAME, props=props)

# Synthesize the app
app.synth()
