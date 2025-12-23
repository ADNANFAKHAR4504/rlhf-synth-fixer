#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack, TapStackProps


app = cdk.App()

# Get environment from CDK context or environment variables
environment_suffix = app.node.try_get_context("environmentSuffix") or os.environ.get("ENVIRONMENT_SUFFIX", "dev")

env = cdk.Environment(
    account=os.environ.get('CDK_DEFAULT_ACCOUNT'),
    region=os.environ.get('CDK_DEFAULT_REGION', 'us-east-1')
)

# Create the main stack
TapStack(app, f"TapStack{environment_suffix}", 
    props=TapStackProps(environment_suffix=environment_suffix),
    env=env
)

app.synth()