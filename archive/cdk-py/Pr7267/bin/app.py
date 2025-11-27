#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()

# Get environment suffix from context or environment variable
environment_suffix = app.node.try_get_context("environmentSuffix") or os.environ.get("ENVIRONMENT_SUFFIX", "dev")

TapStack(
    app,
    f"TapStack{environment_suffix}",
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region="us-east-1"
    ),
    description="Single-region Multi-AZ disaster recovery infrastructure"
)

app.synth()
