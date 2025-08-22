#!/usr/bin/env python3
"""
CDK application entry point for the web application infrastructure.

This module defines the core CDK application and instantiates the 
WebApplicationStack with appropriate configuration, handling environment-specific 
settings and tagging for AWS resources.
"""

import os

import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import WebApplicationStack

# Initialize the CDK application
app = cdk.App()

# Get environment suffix from context or use 'dev' as default
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'

# Define the stack name based on the environment
STACK_NAME = f"WebApplicationStack-{environment_suffix}"

# Optional: Get repository and author from environment variables for tagging
repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Apply tags to all resources in this app
Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)
Tags.of(app).add('Project', 'Web-Application')

# Instantiate the WebApplicationStack
WebApplicationStack(
  app,
  STACK_NAME,
  env=cdk.Environment(
    account=os.getenv('CDK_DEFAULT_ACCOUNT'),
    region=os.getenv('CDK_DEFAULT_REGION')
  )
)

# Synthesize the CloudFormation template
app.synth()
