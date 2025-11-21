#!/usr/bin/env python3
import os

import aws_cdk as cdk

from lib.tap_stack import TapStack

app = cdk.App()

# Get environment suffix from context
environment_suffix = app.node.try_get_context("environmentSuffix") or os.getenv("ENVIRONMENT_SUFFIX", "dev")

# Create the stack
TapStack(
    app,
    f"TapStack-{environment_suffix}",
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region=os.getenv("CDK_DEFAULT_REGION", "us-east-1")
    )
)

app.synth()
