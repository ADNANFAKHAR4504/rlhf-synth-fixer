#!/usr/bin/env python3
"""CDK Application entry point for production VPC infrastructure."""

import aws_cdk as cdk
from lib.tap_stack import TapStack, TapStackProps


app = cdk.App()

# Get environment suffix from context or default to 'dev'
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'

# Create main stack with VPC infrastructure
props = TapStackProps(environment_suffix=environment_suffix)

TapStack(
    app,
    f"PaymentVpcStack-{environment_suffix}",
    props=props,
    env=cdk.Environment(
        account=app.node.try_get_context("account"),
        region=app.node.try_get_context("region") or "us-east-1",
    ),
    description=f"Production VPC infrastructure for payment processing (env: {environment_suffix})",
)

app.synth()
