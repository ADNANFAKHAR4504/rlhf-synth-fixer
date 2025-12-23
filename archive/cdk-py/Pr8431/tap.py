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
from datetime import datetime, timezone

import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

# Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')
pr_number = os.getenv('PR_NUMBER', 'unknown')
team = os.getenv('TEAM', 'unknown')
created_at = datetime.now(timezone.utc).isoformat()

# Create the stack with custom props
stack = TapStack(
    app,
    STACK_NAME,
    props=TapStackProps(environment_suffix=environment_suffix),
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT', '000000000000'),
        region=os.getenv('CDK_DEFAULT_REGION', 'us-west-2')
    ),
    description=f"TAP Infrastructure Stack for {environment_suffix} environment"
)

# Add common tags to all resources in the stack
Tags.of(stack).add("Environment", environment_suffix)
Tags.of(stack).add("ManagedBy", "CDK")
Tags.of(stack).add("Repository", repository_name)
Tags.of(stack).add("CommitAuthor", commit_author)
Tags.of(stack).add("PRNumber", pr_number)
Tags.of(stack).add("Team", team)
Tags.of(stack).add("CreatedAt", created_at)

app.synth()
