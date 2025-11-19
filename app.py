#!/usr/bin/env python3
"""
CDK application entry point for Single-Region Payment Processing Infrastructure.
This application deploys a complete payment processing solution in us-east-1.
"""
import os
import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack

app = cdk.App()

# Get environment suffix from environment variable
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')

# AWS environment configuration
account = os.getenv('CDK_DEFAULT_ACCOUNT')
region = "us-east-1"

env = cdk.Environment(account=account, region=region)

# Repository metadata
repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Apply global tags
Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)
Tags.of(app).add('Project', 'PaymentProcessing')

# Main stack
main_stack = TapStack(
    app,
    f"TapStack{environment_suffix}",
    environment_suffix=environment_suffix,
    env=env
)

app.synth()
