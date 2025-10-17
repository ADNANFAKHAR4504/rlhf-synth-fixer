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
from pulumi import Config, ResourceOptions
from lib.tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from config or fallback to 'dev'
environment_suffix = config.get('env') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
}

stack = TapStack(
    name="pulumi-infra",
    args=TapStackArgs(environment_suffix=environment_suffix),
)

# Export stack outputs to make them available for integration tests
pulumi.export('vpc_id', stack.vpc.id)
pulumi.export('vpc_cidr', stack.vpc.cidr_block)
pulumi.export('public_subnet_ids', pulumi.Output.all(stack.public_subnet_1.id, stack.public_subnet_2.id))
pulumi.export('private_subnet_ids', pulumi.Output.all(stack.private_subnet_1.id, stack.private_subnet_2.id))
pulumi.export('kinesis_stream_name', stack.kinesis_stream.name)
pulumi.export('kinesis_stream_arn', stack.kinesis_stream.arn)
pulumi.export('aurora_cluster_id', stack.aurora_cluster.id)
pulumi.export('aurora_cluster_endpoint', stack.aurora_cluster.endpoint)
pulumi.export('aurora_cluster_reader_endpoint', stack.aurora_cluster.reader_endpoint)
pulumi.export('redis_cluster_id', stack.redis_cluster.id)
pulumi.export('redis_primary_endpoint', stack.redis_cluster.primary_endpoint_address)
pulumi.export('redis_reader_endpoint', stack.redis_cluster.reader_endpoint_address)
pulumi.export('secrets_manager_secret_arn', stack.db_password.arn)
pulumi.export('kinesis_kms_key_id', stack.kinesis_kms_key.id)
pulumi.export('rds_kms_key_id', stack.rds_kms_key.id)
pulumi.export('secrets_kms_key_id', stack.secrets_kms_key.id)
pulumi.export('rds_security_group_id', stack.rds_security_group.id)
pulumi.export('elasticache_security_group_id', stack.elasticache_security_group.id)
