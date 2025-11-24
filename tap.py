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
from lib.replica_stack import ReplicaStack, ReplicaStackProps

app = cdk.App()

# Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'
PRIMARY_STACK_NAME = f"TapStack{environment_suffix}"
REPLICA_STACK_NAME = f"TapStackReplica{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')
pr_number = os.getenv('PR_NUMBER', 'unknown')
team = os.getenv('TEAM', 'unknown')
created_at = datetime.now(timezone.utc).isoformat()

account = os.getenv('CDK_DEFAULT_ACCOUNT')
primary_region = os.getenv('CDK_DEFAULT_REGION') or 'us-east-1'
replica_region = 'eu-west-1'

# Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)
Tags.of(app).add('PRNumber', pr_number)
Tags.of(app).add('Team', team)
Tags.of(app).add('CreatedAt', created_at)

# Create primary stack in us-east-1
primary_props = TapStackProps(
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=account,
        region=primary_region
    )
)

primary_stack = TapStack(app, PRIMARY_STACK_NAME, props=primary_props)

# Create replica stack in eu-west-1
# Get the primary database ARN for replica creation
primary_db_arn = f"arn:aws:rds:{primary_region}:{account}:db:primary-db-{environment_suffix}"

replica_props = ReplicaStackProps(
    environment_suffix=environment_suffix,
    source_db_arn=primary_db_arn
)

replica_stack = ReplicaStack(
    app,
    REPLICA_STACK_NAME,
    props=replica_props,
    env=cdk.Environment(
        account=account,
        region=replica_region
    )
)

# Ensure replica is created after primary
replica_stack.add_dependency(primary_stack)

app.synth()
