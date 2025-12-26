"""
Pulumi main entry point for multi-region serverless infrastructure.
This file instantiates the TapStack component which orchestrates all infrastructure deployment.
"""

import pulumi
from lib.tap_stack import TapStack, TapStackArgs

# Configuration
config = pulumi.Config()
environment_suffix = config.get("environment") or "prod"

# Define regions for deployment
# LOCALSTACK FIX: Simplified to single region for LocalStack compatibility
regions = ["us-east-1"]

# Common tags for all resources
tags = {
    "Project": "PulumiOptimization",
    "Environment": environment_suffix,
    "Application": "multi-env",
    "ManagedBy": "Pulumi"
}

# Create the main stack
stack_args = TapStackArgs(
    environment_suffix=environment_suffix,
    regions=regions,
    tags=tags
)

# Instantiate the TapStack component
tap_stack = TapStack("tap-stack", stack_args)

# Export key outputs
pulumi.export("environment", environment_suffix)
pulumi.export("regions", regions)
pulumi.export("vpc_ids", {
    region: tap_stack.networking[region].vpc.id
    for region in regions
})
pulumi.export("lambda_functions", {
    region: tap_stack.serverless[region].lambda_function.name
    for region in regions
})
