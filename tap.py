#!/usr/bin/env python3
"""tap.py
CDK application entrypoint for the TAP project.
This file instantiates the CDK app and the TapStack.
"""

import os
import aws_cdk as cdk
from lib.tap_stack import TapStack, TapStackProps

# Initialize CDK app
app = cdk.App()

# Determine environment
env = cdk.Environment(
    account=os.environ.get('CDK_DEFAULT_ACCOUNT', '000000000000'),
    region=os.environ.get('CDK_DEFAULT_REGION', 'us-east-1')
)

# Create the main stack
TapStack(
    app,
    "TapStack",
    props=TapStackProps(environment_suffix='dev'),
    env=env,
    description="TAP Lambda Stack with SSM Parameter Store integration"
)

# Synthesize the app
app.synth()
