#!/usr/bin/env python3
"""
Main entry point for Pulumi TAP infrastructure stack.
"""

import os
import pulumi
import pulumi_aws as aws
from lib.tap_stack import TapStack, TapStackArgs

# Get configuration
config = pulumi.Config()
environment = pulumi.get_stack()

# Detect LocalStack environment
is_localstack = (
    "localhost" in os.environ.get("AWS_ENDPOINT_URL", "")
    or "4566" in os.environ.get("AWS_ENDPOINT_URL", "")
)

# Configure AWS Provider for LocalStack if needed
if is_localstack:
    endpoint = os.environ.get("AWS_ENDPOINT_URL", "http://localhost:4566")
    localstack_provider = aws.Provider(
        "localstack",
        region="us-east-1",
        skip_credentials_validation=True,
        skip_metadata_api_check=True,
        skip_requesting_account_id=True,
        s3_use_path_style=True,
        endpoints=[
            aws.ProviderEndpointArgs(
                s3=endpoint,
                ec2=endpoint,
                cloudwatch=endpoint,
                iam=endpoint,
                sts=endpoint,
                cloudwatchlogs=endpoint,
            )
        ],
    )

# Configure stack arguments
stack_args = TapStackArgs(
    environment_suffix=environment,
    vpc_cidr="10.0.0.0/16",
    availability_zones=["us-east-1a", "us-east-1b"],
    enable_flow_logs=True,
    enable_cross_region_replication=not is_localstack,  # Disable for LocalStack
    backup_region="us-west-2",
    allowed_cidr="10.0.0.0/8",
    tags={
        "Project": "TAP-Infrastructure",
        "ManagedBy": "Pulumi",
        "LocalStack": str(is_localstack),
    }
)

# Create the stack
stack = TapStack("tap-stack", stack_args)

# Export stack outputs
pulumi.export("vpc_id", stack.vpc_id)
pulumi.export("public_subnet_ids", stack.public_subnet_ids)
pulumi.export("private_subnet_ids", stack.private_subnet_ids)
pulumi.export("security_group_ids", stack.security_group_ids)
pulumi.export("s3_bucket_names", stack.s3_bucket_names)
pulumi.export("cloudwatch_log_groups", stack.cloudwatch_log_groups)
