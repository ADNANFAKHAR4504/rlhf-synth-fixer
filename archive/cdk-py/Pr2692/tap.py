#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()

# Get environment details
env = cdk.Environment(
    account=os.getenv('CDK_DEFAULT_ACCOUNT'),
    region=os.getenv('CDK_DEFAULT_REGION', 'us-east-1')
)

# Create the main stack
TapStack(
    app,
    "TapSecureStack",
    env=env,
    description="Secure web application infrastructure with WAF, VPC, ALB, RDS, and Lambda"
)

app.synth()