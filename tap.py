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

# Determine environment suffix for LocalStack compatibility
env_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'localstack')

# Determine environment
env = cdk.Environment(
    account=os.environ.get('CDK_DEFAULT_ACCOUNT', '000000000000'),
    region=os.environ.get('CDK_DEFAULT_REGION', 'us-east-1')
)

# Create the main stack with environment suffix in the name
TapStack(
    app,
    f"TapStack-{env_suffix}",
    props=TapStackProps(environment_suffix=env_suffix),
    env=env,
    description="TAP Lambda Stack with SSM Parameter Store integration"
)

# Synthesize the app
app.synth()
