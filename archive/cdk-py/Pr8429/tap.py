#!/usr/bin/env python3
"""CDK application entry point for TapStack infrastructure."""

import os
from aws_cdk import App, Environment
from lib.tap_stack import TapStack, TapStackProps


app = App()

# Get environment suffix from context or environment variable
environment_suffix = app.node.try_get_context("environmentSuffix") or os.environ.get("ENVIRONMENT_SUFFIX", "dev")

# Get AWS account and region from environment
account = (
    os.environ.get("CDK_DEFAULT_ACCOUNT")
    or os.environ.get("AWS_ACCOUNT_ID")
    or os.environ.get("CURRENT_ACCOUNT_ID")
)
region = (
    os.environ.get("CDK_DEFAULT_REGION")
    or os.environ.get("AWS_REGION", "us-east-1")
)

# Create stack properties
props = TapStackProps(
    environment_suffix=environment_suffix,
    env=Environment(account=account, region=region)
)

# Instantiate the stack
TapStack(app, f"TapStack-{environment_suffix}", props=props)

app.synth()
