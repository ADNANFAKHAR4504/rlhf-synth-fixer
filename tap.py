#!/usr/bin/env python3
import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()

# Deploy the stack to us-west-2 region
TapStack(app, "tap-infrastructure-stack",
    env=cdk.Environment(
        region="us-west-2"
    ),
    description="Secure, high-availability web application infrastructure"
)

app.synth()