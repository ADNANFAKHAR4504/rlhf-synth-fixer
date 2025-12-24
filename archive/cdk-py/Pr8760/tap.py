#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

# Get environment suffix from context or environment variable
environment_suffix = app.node.try_get_context('environmentSuffix') or os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

# Create the stack
TapStack(
    app,
    f"TapStack-{environment_suffix}",
    props=TapStackProps(environment_suffix=environment_suffix),
    env=cdk.Environment(
        account=os.environ.get('CDK_DEFAULT_ACCOUNT', '000000000000'),
        region=os.environ.get('CDK_DEFAULT_REGION', 'us-west-2')
    )
)

app.synth()
