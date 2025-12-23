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

repository_name = os.getenv('REPOSITORY', 'iac-test-automations')
commit_author = os.getenv('COMMIT_AUTHOR', 'platform-team')
pr_number = os.getenv('PR_NUMBER', 'local')
team = os.getenv('TEAM', 'synth-2')
created_at = datetime.now(timezone.utc).isoformat()

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
    'PRNumber': pr_number,
    'Team': team,
    "CreatedAt": created_at,
    'Project': 'ProjectX',
    'Security': 'High'
}

# Configure AWS provider with default tags
provider = aws.Provider('aws',
    region=os.getenv('AWS_REGION', 'us-east-1'),
    default_tags=aws.ProviderDefaultTagsArgs(
        tags=default_tags
    )
)

# Create the stack with multi-region support
regions = ['us-east-1', 'us-west-2']

stack = TapStack(
    name="secure-infrastructure",
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        regions=regions,
        tags={
            **default_tags,
            "CostCenter": "platform",
            "Compliance": "SOC2"
        }
    ),
    opts=ResourceOptions(provider=provider)
)

# Export stack outputs for each region
for region in regions:
    pulumi.export(f"{region.replace('-', '_')}_vpc_id", stack.regional_networks[region].vpc_id)
    pulumi.export(f"{region.replace('-', '_')}_public_subnet_ids", stack.regional_networks[region].public_subnet_ids)
    pulumi.export(f"{region.replace('-', '_')}_private_subnet_ids", stack.regional_networks[region].private_subnet_ids)
    pulumi.export(f"{region.replace('-', '_')}_database_subnet_ids", stack.regional_networks[region].database_subnet_ids)
    pulumi.export(f"{region.replace('-', '_')}_web_security_group_id", stack.regional_networks[region].web_security_group_id)
    pulumi.export(f"{region.replace('-', '_')}_app_security_group_id", stack.regional_networks[region].app_security_group_id)
    pulumi.export(f"{region.replace('-', '_')}_database_security_group_id", stack.regional_networks[region].database_security_group_id)

# Export identity and access management resources
pulumi.export("kms_key_arn", stack.identity_access.kms_key.arn)
pulumi.export("kms_key_id", stack.identity_access.kms_key.id)
pulumi.export("ec2_instance_role_arn", stack.identity_access.ec2_instance_role.arn)
pulumi.export("lambda_execution_role_arn", stack.identity_access.lambda_execution_role.arn)

# Export monitoring resources
pulumi.export("sns_topic_arn", stack.monitoring.sns_topic.arn)
pulumi.export("security_log_group_name", stack.monitoring.security_log_group.name)

# Export data protection resources for each region
for region in regions:
    if hasattr(stack, 'data_protection') and region in stack.data_protection:
        pulumi.export(f"{region.replace('-', '_')}_secure_s3_bucket", stack.data_protection[region].secure_s3_bucket.bucket)
        pulumi.export(f"{region.replace('-', '_')}_secure_s3_bucket_arn", stack.data_protection[region].secure_s3_bucket.arn)
