#!/usr/bin/env python3
"""
CDK Application Entry Point for TapStack
Serverless webhook processing system for Stripe, PayPal, and Square
"""
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack, TapStackProps


app = cdk.App()

# Get environment suffix from context or environment variable
environment_suffix = (
    app.node.try_get_context('environmentSuffix')
    or os.environ.get('ENVIRONMENT_SUFFIX')
    or 'dev'
)

# Create TapStack
TapStack(
    app,
    f"TapStack{environment_suffix}",
    props=TapStackProps(environment_suffix=environment_suffix),
    env=cdk.Environment(
        account=os.environ.get('CDK_DEFAULT_ACCOUNT'),
        region=os.environ.get('CDK_DEFAULT_REGION', 'us-east-1'),
    ),
    description=f"Serverless webhook processing system - {environment_suffix}",
)

app.synth()
