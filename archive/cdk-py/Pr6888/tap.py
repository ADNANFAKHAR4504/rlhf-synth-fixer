#!/usr/bin/env python3
"""
Multi-region disaster recovery application entry point.
Deploys payment processing infrastructure to both us-east-1 and us-east-2.
"""
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack

# Get environment suffix from environment variable or use default
environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")

app = cdk.App()

# Create primary stack in us-east-1
primary_stack = TapStack(
    app,
    f"TapStack{environment_suffix}",
    environment_suffix=environment_suffix,
    is_primary=True,
    primary_region="us-east-1",
    secondary_region="us-east-2",
    env=cdk.Environment(
        account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
        region="us-east-1",
    ),
    description=f"Multi-region DR Payment Processing Stack - Primary ({environment_suffix})",
)

# Create secondary stack in us-east-2
secondary_stack = TapStack(
    app,
    f"TapStackSecondary{environment_suffix}",
    environment_suffix=environment_suffix,
    is_primary=False,
    primary_region="us-east-1",
    secondary_region="us-east-2",
    env=cdk.Environment(
        account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
        region="us-east-2",
    ),
    description=f"Multi-region DR Payment Processing Stack - Secondary ({environment_suffix})",
)

# Add stack tags
cdk.Tags.of(app).add("Project", "PaymentProcessing")
cdk.Tags.of(app).add("Environment", environment_suffix)
cdk.Tags.of(app).add("ManagedBy", "CDK")

app.synth()
