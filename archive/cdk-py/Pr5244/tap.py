#!/usr/bin/env python3
"""CDK app entry point for medical imaging infrastructure."""
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack


app = cdk.App()

# Get environment suffix from context or environment variable
environment_suffix = app.node.try_get_context("environmentSuffix")
if not environment_suffix:
    environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")

# Create the stack
TapStack(
    app,
    f"TapStack-{environment_suffix}",
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region=os.getenv("AWS_REGION"),
    ),
    description=f"HIPAA-compliant medical imaging pipeline infrastructure ({environment_suffix})",
)

app.synth()
