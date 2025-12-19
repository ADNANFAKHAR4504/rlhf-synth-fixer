#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack


app = cdk.App()

# Get environment suffix from context or environment variable
environment_suffix = app.node.try_get_context("environmentSuffix") or os.environ.get(
    "ENVIRONMENT_SUFFIX", "dev"
)

# Get log retention from context
log_retention_days = int(
    app.node.try_get_context("logRetentionDays") or os.environ.get("LOG_RETENTION_DAYS", "7")
)

# Primary region stack (us-east-1)
primary_stack = TapStack(
    app,
    f"TapStack{environment_suffix}-Primary",
    environment_suffix=environment_suffix,
    primary_region="us-east-1",
    secondary_region="us-west-2",
    log_retention_days=log_retention_days,
    env=cdk.Environment(
        account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
        region="us-east-1",
    ),
    description="Multi-region DR trading platform - Primary region (us-east-1)",
)

# Secondary region stack (us-west-2)
secondary_stack = TapStack(
    app,
    f"TapStack{environment_suffix}-Secondary",
    environment_suffix=environment_suffix,
    primary_region="us-east-1",
    secondary_region="us-west-2",
    log_retention_days=log_retention_days,
    env=cdk.Environment(
        account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
        region="us-west-2",
    ),
    description="Multi-region DR trading platform - Secondary region (us-west-2)",
)

# Add dependency: secondary should deploy after primary for Aurora Global DB
secondary_stack.add_dependency(primary_stack)

app.synth()
