#!/usr/bin/env python3
import os
import sys

# Add parent directory to path to import lib module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import aws_cdk as cdk
from lib.tap_stack import DisasterRecoveryStack, Route53FailoverStack


app = cdk.App()

# Get environment suffix from context or use default
environment_suffix = app.node.try_get_context("environmentSuffix") or "prod"
alert_email = app.node.try_get_context("alertEmail") or "alerts@example.com"
domain_name = app.node.try_get_context("domainName") or "example.com"

# Primary Region Stack (us-east-1)
primary_stack = DisasterRecoveryStack(
    app,
    f"TapStack{environment_suffix}",
    environment_suffix=environment_suffix,
    is_primary=True,
    primary_region="us-east-1",
    dr_region="us-east-2",
    alert_email=alert_email,
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region="us-east-1",
    ),
    description=f"Primary region disaster recovery stack for payment processing ({environment_suffix})",
)

app.synth()
