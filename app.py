#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack
from lib.route53_stack import Route53Stack
from lib.dms_prereq_stack import DmsPrerequisitesStack

app = cdk.App()

# Get environment suffix from context or use default
environment_suffix = app.node.try_get_context("environmentSuffix") or "dev-001"

# Environment configuration
env = cdk.Environment(
    account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
    region=os.environ.get("CDK_DEFAULT_REGION", "us-east-1"),
)

# Create DMS prerequisites stack (must be deployed first)
dms_prereq_stack = DmsPrerequisitesStack(
    app,
    f"TapStack{environment_suffix}DmsPrereq",
    env=env,
    description="DMS prerequisite IAM roles for payment processing migration",
)

# Create source stack
source_stack = TapStack(
    app,
    f"TapStack{environment_suffix}Source",
    environment_suffix=f"source-{environment_suffix}",
    env=env,
    description="Source environment for payment processing migration",
)

# Create target stack
target_stack = TapStack(
    app,
    f"TapStack{environment_suffix}Target",
    environment_suffix=f"target-{environment_suffix}",
    env=env,
    description="Target environment for payment processing migration",
)

# Create Route 53 stack for traffic management
route53_stack = Route53Stack(
    app,
    f"TapStack{environment_suffix}Route53",
    source_alb=source_stack.alb,
    target_alb=target_stack.alb,
    environment_suffix=environment_suffix,
    env=env,
    description="Route 53 weighted routing for migration",
)

# Add dependencies
source_stack.add_dependency(dms_prereq_stack)
target_stack.add_dependency(dms_prereq_stack)
route53_stack.add_dependency(source_stack)
route53_stack.add_dependency(target_stack)

app.synth()
