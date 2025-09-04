#!/usr/bin/env python3
import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()

# Get environment configuration
env = cdk.Environment(
    account=app.node.try_get_context("account") or "123456789012",  # Replace with your account ID
    region="us-east-1"
)

# Create the main stack
TapStack(
    app, 
    "TapStack",
    env=env,
    description="Secure and resilient AWS infrastructure with VPC, RDS, Lambda, and S3"
)

app.synth()