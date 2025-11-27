#!/usr/bin/env python3
"""
CDK application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core CDK application and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).

Multi-region deployment is supported for disaster recovery and high availability.
"""
import os
from datetime import datetime, timezone

import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

# Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'

# Get AWS account
account = os.getenv('CDK_DEFAULT_ACCOUNT')

# Define regions for multi-region deployment
primary_region = os.getenv('CDK_DEFAULT_REGION') or 'us-east-1'
secondary_region = os.getenv('CDK_SECONDARY_REGION') or 'us-west-2'

# Metadata for tagging
repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')
pr_number = os.getenv('PR_NUMBER', 'unknown')
team = os.getenv('TEAM', 'unknown')
created_at = datetime.now(timezone.utc).isoformat()

# Apply global tags to all stacks in this app
Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)
Tags.of(app).add('PRNumber', pr_number)
Tags.of(app).add('Team', team)
Tags.of(app).add('CreatedAt', created_at)

# Create Primary Region Stack (us-east-1 or CDK_DEFAULT_REGION)
primary_stack_name = f"TapStack{environment_suffix}Primary"
primary_props = TapStackProps(
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=account,
        region=primary_region
    )
)

primary_stack = TapStack(app, primary_stack_name, props=primary_props)
Tags.of(primary_stack).add('Region', 'Primary')
Tags.of(primary_stack).add('RegionName', primary_region)

# Create Secondary Region Stack (us-west-2 or CDK_SECONDARY_REGION)
secondary_stack_name = f"TapStack{environment_suffix}Secondary"
secondary_props = TapStackProps(
    environment_suffix=f"{environment_suffix}-secondary",
    env=cdk.Environment(
        account=account,
        region=secondary_region
    )
)

secondary_stack = TapStack(app, secondary_stack_name, props=secondary_props)
Tags.of(secondary_stack).add('Region', 'Secondary')
Tags.of(secondary_stack).add('RegionName', secondary_region)

app.synth()
