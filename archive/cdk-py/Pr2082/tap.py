#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()

# Read the region from AWS_REGION file
region = "us-east-1"  # Default region
try:
    with open("lib/AWS_REGION", "r") as f:
        region = f.read().strip()
except FileNotFoundError:
    pass

# Get environment suffix from context or environment variable
environment_suffix = app.node.try_get_context('environmentSuffix') or os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

TapStack(app, f"TapStack{environment_suffix}",
    env=cdk.Environment(
        region=region
    )
)

app.synth()
