#!/usr/bin/env python3
"""
Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core Pulumi stack and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os
from datetime import datetime, timezone
import pulumi
import pulumi_aws as aws
from pulumi import Config, ResourceOptions
from lib.tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from environment variables, fallback to 'dev'
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')
pr_number = os.getenv('PR_NUMBER', 'unknown')
team = os.getenv('TEAM', 'unknown')
created_at = datetime.now(timezone.utc).isoformat()


# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
    'PRNumber': pr_number,
    'Team': team,
    "CreatedAt": created_at,
}

# Configure AWS provider with default tags
provider = aws.Provider('aws',
    region=os.getenv('AWS_REGION', 'us-east-1'),
    default_tags=aws.ProviderDefaultTagsArgs(
        tags=default_tags
    )
)

# Define initial tenants
tenant_ids = [
    "tenant-001",
    "tenant-002",
    "tenant-003",
    "tenant-004",
    "tenant-005"
]

stack = TapStack(
    name="multi-tenant-saas",
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        tenant_ids=tenant_ids,
        vpc_cidr="10.0.0.0/16",
        tags={
            **default_tags,
            "CostCenter": "platform"
        }
    ),
    opts=ResourceOptions(provider=provider)
)

# Export stack outputs
pulumi.export("vpc_id", stack.vpc.id)
pulumi.export("api_id", stack.api.id)
pulumi.export("api_url", stack.api.id.apply(lambda api_id: f"https://{api_id}.execute-api.{os.getenv('AWS_REGION', 'us-east-1')}.amazonaws.com/prod"))

# Export tenant-specific resources
for tenant_id in tenant_ids:
    pulumi.export(f"{tenant_id}_subnet_ids", pulumi.Output.all(*[s.id for s in stack.tenant_subnets[tenant_id]]))
    pulumi.export(f"{tenant_id}_users_table", stack.dynamodb_tables[tenant_id]["users"].name)
    pulumi.export(f"{tenant_id}_data_table", stack.dynamodb_tables[tenant_id]["data"].name)
    pulumi.export(f"{tenant_id}_kms_key_id", stack.kms_keys[tenant_id].id)
    pulumi.export(f"{tenant_id}_lambda_function", stack.lambda_functions[tenant_id].name)
