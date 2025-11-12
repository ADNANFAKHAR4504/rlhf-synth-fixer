#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()

environment_suffix = app.node.try_get_context("environment_suffix") or os.environ.get("ENVIRONMENT_SUFFIX", "dev")

TapStack(
    app,
    f"TapStack-{environment_suffix}",
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region='ap-southeast-1'
    ),
)

app.synth()
