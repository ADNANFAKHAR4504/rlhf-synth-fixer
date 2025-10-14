#!/usr/bin/env python3
"""
CDK application entry point for FedRAMP-compliant monitoring infrastructure.
"""

import os
import sys

# Add parent directory to path so we can import lib
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import aws_cdk as cdk
from lib.tap_stack import TapStack, TapStackProps


app = cdk.App()

# Get environment suffix from context or environment variable
environment_suffix = (
    app.node.try_get_context('environmentSuffix')
    or os.environ.get('ENVIRONMENT_SUFFIX')
    or 'dev'
)

# Get AWS region from environment or lib/AWS_REGION file
region = os.environ.get('AWS_REGION')
if not region:
    try:
        with open('lib/AWS_REGION', 'r', encoding='utf-8') as f:
            region = f.read().strip()
    except FileNotFoundError:
        region = 'us-east-1'

# Create the main stack
TapStack(
    app,
    f"TapStack{environment_suffix}",
    props=TapStackProps(environment_suffix=environment_suffix),
    env=cdk.Environment(
        account=os.environ.get('CDK_DEFAULT_ACCOUNT'),
        region=region
    ),
    description=f"FedRAMP-compliant monitoring infrastructure - {environment_suffix}"
)

app.synth()
