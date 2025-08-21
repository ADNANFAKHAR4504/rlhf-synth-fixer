#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()

# Get environment suffix for stack naming
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

# Deploy the stack to us-west-2 region  
TapStack(
    app, f"TapStack{environment_suffix}",
    env=cdk.Environment(
        region="us-west-2"
    ),
    description="Secure, high-availability web application infrastructure"
)

app.synth()
