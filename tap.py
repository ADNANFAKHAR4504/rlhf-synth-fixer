#!/usr/bin/env python3

"""
CDK application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core CDK application and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.
"""

import os

import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack, TapStackProps


app = cdk.App()

# Get environment suffix from context or use 'dev' as default
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'
stack_name = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Apply tags globally
Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)

# Stack environment (account/region)
stack_env = cdk.Environment(
  account=os.getenv('CDK_DEFAULT_ACCOUNT'),
  region=os.getenv('CDK_DEFAULT_REGION')
)

# Define props
props = TapStackProps(
  environment_suffix=environment_suffix,
  env=stack_env
)

# Instantiate the TapStack
TapStack(app, stack_name, props=props)

# Synthesize the app
app.synth()
