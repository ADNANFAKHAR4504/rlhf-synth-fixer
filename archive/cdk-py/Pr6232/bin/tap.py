#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack


app = cdk.App()

# Get environment suffix from context or use default
environment_suffix = app.node.try_get_context("environmentSuffix") or "dev"

# Get AWS account and region from environment variables or use defaults
env = cdk.Environment(
    account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
    region=os.environ.get("CDK_DEFAULT_REGION", "ap-southeast-2"),
)

TapStack(
    app,
    f"TapStack{environment_suffix}",
    environment_suffix=environment_suffix,
    env=env,
    description=f"Flask API ECS Fargate infrastructure with ALB and Aurora PostgreSQL ({environment_suffix})",
)

app.synth()
