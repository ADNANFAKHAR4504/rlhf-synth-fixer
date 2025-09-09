#!/usr/bin/env python3
import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()

# Get context values or use defaults
env_suffix = app.node.try_get_context("environmentSuffix") or "dev"
project_name = app.node.try_get_context("project") or "tap-serverless"

TapStack(
    app, 
    f"{project_name}-{env_suffix}",
    env=cdk.Environment(
        account=app.node.try_get_context("account"),
        region="us-east-1"
    ),
    project_name=project_name,
    environment_suffix=env_suffix
)

app.synth()