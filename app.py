#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()

# Get environment suffix from context or use default
environment_suffix = app.node.try_get_context("environmentSuffix") or "dev-001"

# Environment configuration
env = cdk.Environment(
    account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
    region=os.environ.get("CDK_DEFAULT_REGION", "us-east-1"),
)

# Create single TapStack containing all resources
TapStack(
    app,
    f"TapStack{environment_suffix}",
    environment_suffix=environment_suffix,
    env=env,
    description=f"Payment processing migration infrastructure - {environment_suffix}",
)

app.synth()
