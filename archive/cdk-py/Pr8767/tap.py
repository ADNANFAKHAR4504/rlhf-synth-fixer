#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

# Get environment suffix from context or default to 'dev'
environment_suffix = app.node.try_get_context("environmentSuffix")

# Create stack props
props = TapStackProps(environment_suffix=environment_suffix) if environment_suffix else None

# Instantiate the stack
TapStack(
    app,
    "TapStack",
    props=props,
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region=os.getenv("CDK_DEFAULT_REGION", "us-east-1")
    ),
    description="Serverless backend infrastructure for processing data files"
)

app.synth()
