#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()

# Get environment variables for account and region
account = os.getenv('CDK_DEFAULT_ACCOUNT')
region = os.getenv('CDK_DEFAULT_REGION')

TapStack(
    app, 
    "TapUploadStack",
    env=cdk.Environment(account=account, region=region),
    description="Secure serverless file upload infrastructure"
)

app.synth()