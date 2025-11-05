#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.payment_stack import PaymentProcessingStack

app = cdk.App()

# Get environment suffix from context or environment variable
environment_suffix = app.node.try_get_context("environmentSuffix") or os.environ.get("ENVIRONMENT_SUFFIX", "dev")

# Deploy to us-east-1
env = cdk.Environment(
    account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
    region="us-east-1"
)

# Create the main payment processing stack
payment_stack = PaymentProcessingStack(
    app,
    f"PaymentProcessingStack-{environment_suffix}",
    environment_suffix=environment_suffix,
    env=env,
    description="Payment Processing System - Production Migration Infrastructure"
)

# Add global tags
cdk.Tags.of(app).add("Environment", "production")
cdk.Tags.of(app).add("Team", "platform-engineering")
cdk.Tags.of(app).add("CostCenter", "fintech-payments")
cdk.Tags.of(app).add("ManagedBy", "CDK")

app.synth()
