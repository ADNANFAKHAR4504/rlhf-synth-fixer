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

# Optional KMS configuration (can be provided via cdk context or environment variables)
kms_key_arn = app.node.try_get_context('kmsKeyArn') or os.getenv('KMS_KEY_ARN')
ebs_kms_key = app.node.try_get_context('ebsKmsKeyArnOrAlias') or os.getenv('EBS_KMS_KEY_ARN_OR_ALIAS')

# Create a TapStackProps object to pass environment_suffix and optional KMS settings
props = TapStackProps(
    environment_suffix=environment_suffix,
    kms_key_arn=kms_key_arn if kms_key_arn else None,
    ebs_kms_key_arn_or_alias=ebs_kms_key if ebs_kms_key else None,
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region=os.getenv('CDK_DEFAULT_REGION')
    )
)

# Initialize the stack with proper parameters
TapStack(app, STACK_NAME, props=props)

app.synth()
