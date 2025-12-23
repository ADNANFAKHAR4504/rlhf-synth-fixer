#!/usr/bin/env python3
"""
CDK application entry point for the TAP infrastructure.

This module defines the core CDK application and instantiates the TapStack with appropriate
configuration based on the deployment environment.
"""
import os

import aws_cdk as cdk
from aws_cdk import Tags

from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

# Get environment suffix from context or use 'dev' as default
environment_suffix = app.node.try_get_context("environmentSuffix") or "dev"
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv("REPOSITORY", "unknown")
commit_author = os.getenv("COMMIT_AUTHOR", "unknown")

# Apply tags to all stacks
Tags.of(app).add("Environment", environment_suffix)
Tags.of(app).add("Repository", repository_name)
Tags.of(app).add("Author", commit_author)

# Check for region configuration
region = None
aws_region_file = os.path.join("lib", "AWS_REGION")
if os.path.exists(aws_region_file):
    with open(aws_region_file, "r", encoding="utf-8") as f:
        region = f.read().strip()

# Fallback to environment variables or default
if not region:
    region = (
        os.getenv("CDK_DEFAULT_REGION") or os.getenv("AWS_DEFAULT_REGION") or "us-east-1"
    )

# Environment configuration
account = os.getenv("CDK_DEFAULT_ACCOUNT")
env_config = None

if account and account.strip():
    env_config = cdk.Environment(account=account, region=region)
else:
    env_config = cdk.Environment(region=region)

props = TapStackProps(environment_suffix=environment_suffix, env=env_config)

# Initialize the stack
TapStack(app, STACK_NAME, props=props)

app.synth()
