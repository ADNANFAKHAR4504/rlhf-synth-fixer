#!/usr/bin/env python3
"""
CDK application entry point for the serverless infrastructure.

This module defines the core CDK application and instantiates the ServerlessStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""

import os

import aws_cdk as cdk
from aws_cdk import Tags
from constructs import Construct

# Assuming the ServerlessStack is defined in `lib/serverless_stack.py`
from lib.tap_stack import ServerlessStack


app = cdk.App()

# Get environment suffix from context (set by CI/CD pipeline) or default to 'dev'
environment_suffix = app.node.try_get_context("environmentSuffix") or "dev"
STACK_NAME = f"ServerlessStack-{environment_suffix}"

repository_name = os.getenv("REPOSITORY", "unknown")
commit_author = os.getenv("COMMIT_AUTHOR", "unknown")

# Apply tags to all stacks in this app
Tags.of(app).add("Environment", environment_suffix)
Tags.of(app).add("Repository", repository_name)
Tags.of(app).add("Author", commit_author)

# Initialize the stack with proper environment parameters
ServerlessStack(
    app,
    STACK_NAME,
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region=os.getenv("CDK_DEFAULT_REGION"),
    ),
)

app.synth()
