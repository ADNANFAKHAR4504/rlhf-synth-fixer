"""
Main entry point for the Pulumi program
"""

import pulumi
from tap_stack import TapStack, TapStackArgs

# Get configuration
config = pulumi.Config()
environment = config.get("environment") or "dev"

# Create stack arguments
stack_args = TapStackArgs(
    environment_suffix=environment,
    tags={
        "project": "serverless-infra-pulumi",
        "environment": environment,
        "managed-by": "pulumi"
    }
)

# Create the main stack
stack = TapStack(f"TapStack-{environment}", stack_args)
