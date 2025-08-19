#!/usr/bin/env python3
"""
CDK application entry point for the TAP (Test Automation Platform) infrastructure.

- Targets us-east-1 per security task spec.
- Applies mandatory tags (Environment=Production, Owner=DevOps).
- Instantiates TapStack; resources are composed inside TapStack (nested stacks).
"""
import os

import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

# Prefer 'prod' to align with the security task context
environment_suffix = app.node.try_get_context('environmentSuffix') or 'prod'
STACK_NAME = f"TapStack{environment_suffix}"

# Mandatory tags across the app (role + any taggable resources)
Tags.of(app).add('Environment', 'Production')
Tags.of(app).add('Owner', 'DevOps')

# Optional CI metadata tags
repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)

# Stack props, pinned to us-east-1 per specification
props = TapStackProps(
  environment_suffix=environment_suffix,
  env=cdk.Environment(
    account=os.getenv('CDK_DEFAULT_ACCOUNT'),
    region='us-east-1',
  ),
)

# Initialize the stack
TapStack(app, STACK_NAME, props=props)

app.synth()
