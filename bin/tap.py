#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.payment_stack import PaymentProcessingStack

app = cdk.App()

# Get environment suffix from context or use default
env_suffix = app.node.try_get_context("environmentSuffix") or "dev"
alert_email = app.node.try_get_context("alertEmail") or "ops@example.com"

PaymentProcessingStack(
    app,
    f"PaymentProcessingStack-{env_suffix}",
    environment_suffix=env_suffix,
    alert_email=alert_email,
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region=os.getenv('CDK_DEFAULT_REGION', 'us-east-1')
    ),
    description=f"Payment processing infrastructure for fintech migration - {env_suffix}"
)

app.synth()
