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
import pulumi
import pulumi_aws as aws
from pulumi import Config, ResourceOptions
from lib.tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from CI, config or fallback to 'dev'
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX') or config.get('env') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
}

# Get configuration values from Pulumi config with defaults
# If not provided, use default VPC and its subnets
vpc_id = config.get('vpc_id')
private_subnet_ids = config.get_object('private_subnet_ids')
dms_subnet_ids = config.get_object('dms_subnet_ids')

# Get default VPC if not configured
if not vpc_id:
    default_vpc = aws.ec2.get_vpc(default=True)
    vpc_id = default_vpc.id
    
    # Get subnets from default VPC if not configured
    if not private_subnet_ids or not dms_subnet_ids:
        default_subnets = aws.ec2.get_subnets(
            filters=[aws.ec2.GetSubnetsFilterArgs(
                name="vpc-id",
                values=[vpc_id]
            )]
        )
        subnet_ids = default_subnets.ids
        # Use all available subnets if not configured
        if not private_subnet_ids:
            private_subnet_ids = subnet_ids
        if not dms_subnet_ids:
            dms_subnet_ids = subnet_ids

source_db_host = config.get('source_db_host') or '10.0.1.100'
source_db_port = config.get_int('source_db_port') or 5432
source_db_name = config.get('source_db_name') or 'postgres'
source_db_username = config.get('source_db_username') or 'postgres'
source_db_password = config.get_secret('source_db_password') or 'SourceDbPassword123!'
aurora_username = config.get('aurora_username') or 'auroraMaster'
aurora_password = config.get_secret('aurora_password') or 'AuroraPassword123!'

stack = TapStack(
    name="pulumi-infra",
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        vpc_id=vpc_id,
        private_subnet_ids=private_subnet_ids,
        dms_subnet_ids=dms_subnet_ids,
        source_db_host=source_db_host,
        source_db_port=source_db_port,
        source_db_name=source_db_name,
        source_db_username=source_db_username,
        source_db_password=source_db_password,
        aurora_username=aurora_username,
        aurora_password=aurora_password,
        tags=default_tags,
    ),
)

# Export key outputs
pulumi.export('cluster_endpoint', stack.cluster_endpoint)
pulumi.export('reader_endpoint', stack.reader_endpoint)
pulumi.export('cluster_arn', stack.cluster_arn)
pulumi.export('dms_task_arn', stack.dms_task_arn)
pulumi.export('secret_arn', stack.secret_arn)
