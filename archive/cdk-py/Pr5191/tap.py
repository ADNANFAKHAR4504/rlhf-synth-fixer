#!/usr/bin/env python3
"""
CDK App entry point for E-Commerce Product Catalog Infrastructure

This module instantiates the TapStack for product catalog infrastructure deployment.
It handles environment-specific configuration and tagging for AWS resources.
"""
import os
import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

# Get environment suffix from context or environment variable
environment_suffix = app.node.try_get_context('environmentSuffix') or os.getenv('ENVIRONMENT_SUFFIX', 'dev')
STACK_NAME = f"TapStack-{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'iac-test-automations')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Apply tags to all stacks
Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)
Tags.of(app).add('Project', 'ProductCatalog')

# Create stack props
props = TapStackProps(
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region=os.getenv('CDK_DEFAULT_REGION', 'us-east-1')
    )
)

# Initialize the stack
TapStack(app, STACK_NAME, props=props)

app.synth()
