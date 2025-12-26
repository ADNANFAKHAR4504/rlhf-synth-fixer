#!/usr/bin/env python3
"""
Main entry point for TAP Stack Pulumi program.

This file instantiates the TapStack and configures the deployment.
"""

import os
import pulumi
from lib.tap_stack import TapStack, TapStackArgs

# Get configuration
config = pulumi.Config()
environment_suffix = config.get("environmentSuffix") or os.getenv("ENVIRONMENT_SUFFIX", "dev")

# Create stack arguments
args = TapStackArgs(environment_suffix=environment_suffix)

# Instantiate the stack
stack = TapStack("tap-stack", args)

# Export outputs
pulumi.export("vpc_ids", stack.vpcs)
pulumi.export("dynamodb_tables", {region: table.name for region, table in stack.dynamodb_tables.items()})
pulumi.export("regions", args.regions)
