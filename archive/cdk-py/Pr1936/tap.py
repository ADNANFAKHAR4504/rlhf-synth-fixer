#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()

# Get environment suffix from CDK context or environment variable
environment_suffix = app.node.try_get_context('environmentSuffix') or os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

# Deploy the stack to us-east-1 region  
TapStack(
    app, f"TapStack{environment_suffix}-new",
    env=cdk.Environment(
        account="718240086340",
        region="us-east-1"
    ),
    description="Secure, high-availability web application infrastructure"
)

app.synth()
