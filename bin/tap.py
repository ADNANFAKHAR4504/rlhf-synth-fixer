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
    f"PaymentDRPrimary-{environment_suffix}",
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

# DR Region Stack (us-east-2)
dr_stack = DisasterRecoveryStack(
    app,
    f"PaymentDRSecondary-{environment_suffix}",
    environment_suffix=environment_suffix,
    is_primary=False,
    primary_region="us-east-1",
    dr_region="us-east-2",
    alert_email=alert_email,
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region="us-east-2",
    ),
    description=f"DR region disaster recovery stack for payment processing ({environment_suffix})",
)

# Route53 Failover Stack (global)
# Note: This would be deployed after obtaining ALB DNS names from primary and DR stacks
# For the actual deployment, you would retrieve these values from stack outputs
route53_stack = Route53FailoverStack(
    app,
    f"PaymentRoute53-{environment_suffix}",
    environment_suffix=environment_suffix,
    primary_alb_dns="primary-alb-dns.us-east-1.elb.amazonaws.com",
    dr_alb_dns="dr-alb-dns.us-east-2.elb.amazonaws.com",
    domain_name=domain_name,
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region="us-east-1",  # Route53 is global but stack needs a region
    ),
    description=f"Route53 failover configuration for payment processing ({environment_suffix})",
)

route53_stack.add_dependency(primary_stack)
route53_stack.add_dependency(dr_stack)

app.synth()
