#!/usr/bin/env python3
"""
Pulumi Entry Point for TapStack

This is the main entry point for the Pulumi infrastructure.
It creates a serverless stack compatible with LocalStack Community Edition.
"""

import pulumi
from lib.tap_stack import TapStack, TapStackArgs

# Get the current stack name (e.g., 'dev', 'staging', 'prod')
stack_name = pulumi.get_stack()

# Create the infrastructure stack
stack = TapStack(
    "tap-stack",
    TapStackArgs(
        environment_suffix=stack_name,
        tags={
            "Project": "IaC-Nova-Test",
            "Owner": "LLM-Eval",
            "Environment": stack_name,
            "ManagedBy": "Pulumi",
        },
    ),
)

# Export stack outputs
pulumi.export("bucket_name", stack.storage_bucket.bucket)
pulumi.export("lambda_function_name", stack.lambda_function.name)
pulumi.export("lambda_function_arn", stack.lambda_function.arn)
