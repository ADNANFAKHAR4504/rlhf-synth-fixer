#!/usr/bin/env python3
"""
Main Pulumi program entry point for TapStack.
"""

import pulumi
from lib.tap_stack import TapStack, TapStackArgs

# Get configuration
config = pulumi.Config()

# Get or use default environment suffix
environment_suffix = config.get("environment_suffix") or "dev"

# Create TapStack
stack = TapStack(
    "tap-stack",
    TapStackArgs(
        environment_suffix=environment_suffix,
        source_region=config.get("source_region"),
        target_region=config.get("target_region"),
        migration_mode=config.get("migration_mode") or "blue_green",
        enable_monitoring=config.get_bool("enable_monitoring") or True,
        enable_cross_region_replication=config.get_bool("enable_cross_region_replication") or True,
    )
)

# Export key outputs
pulumi.export("api_gateway_url", stack.api_gateway.url if hasattr(stack, 'api_gateway') else None)
pulumi.export("primary_bucket_name", stack.primary_bucket.bucket if hasattr(stack, 'primary_bucket') else None)
pulumi.export("dynamodb_table_name", stack.dynamodb_table.name if hasattr(stack, 'dynamodb_table') else None)
pulumi.export("lambda_function_name", stack.lambda_function.name if hasattr(stack, 'lambda_function') else None)
pulumi.export("environment", environment_suffix)
