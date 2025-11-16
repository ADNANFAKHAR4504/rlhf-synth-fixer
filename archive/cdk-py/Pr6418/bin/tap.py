#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack, TapStackProps


app = cdk.App()

# Get environment suffix from context or use default
environment_suffix = app.node.try_get_context("environmentSuffix") or "dev"

# Create the main stack
TapStack(
    app,
    f"TapStack-{environment_suffix}",
    props=TapStackProps(environment_suffix=environment_suffix),
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region=os.getenv("CDK_DEFAULT_REGION", "ap-southeast-1"),
    ),
    description=f"EKS Payment Processing Platform - {environment_suffix}",
)

app.synth()
