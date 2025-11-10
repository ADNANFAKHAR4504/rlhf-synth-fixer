#!/usr/bin/env python3
"""
CDK application entry point for VPC Endpoints Infrastructure.
"""

import os
import sys

# Add parent directory to path so we can import lib
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import re
import aws_cdk as cdk
from lib.tap_stack import TapStack, TapStackProps


app = cdk.App()

# Get environment suffix from context or environment variable
environment_suffix = (
    app.node.try_get_context('environmentSuffix')
    or os.environ.get('ENVIRONMENT_SUFFIX')
    or 'dev'
)

# If the context value comes from an unexpanded shell expression like
# '${ENVIRONMENT_SUFFIX:-dev}' (common when running on some shells),
# fall back to the safe default. Also sanitize any characters that are
# not allowed in CDK stack names.
if isinstance(environment_suffix, str) and ('${' in environment_suffix or '$' in environment_suffix):
    environment_suffix = 'dev'

# Replace any character other than letters, numbers or hyphen with hyphen
environment_suffix = re.sub(r'[^A-Za-z0-9-]', '-', str(environment_suffix))

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
    description=f"VPC Endpoints Infrastructure with private AWS service connectivity - {environment_suffix}"
)

app.synth()
