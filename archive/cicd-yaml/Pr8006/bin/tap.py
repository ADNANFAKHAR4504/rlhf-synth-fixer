#!/usr/bin/env python3
import os
import sys
import aws_cdk as cdk

# Fix Python path to find lib module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.tap_stack import TapStack

app = cdk.App()

# Get environment suffix from context (default to dev)
environment_suffix = app.node.try_get_context("environment_suffix") or "dev"

# Create the stack
TapStack(
    app,
    f"TapStack-{environment_suffix}",
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region=os.getenv("CDK_DEFAULT_REGION", "us-east-1"),
    ),
    description=f"CI/CD Pipeline Infrastructure Stack ({environment_suffix})",
)

app.synth()
