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
from pulumi import Config

from lib.tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from config or fallback to 'dev'
environment_suffix = config.get('env') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

# Get metadata from environment variables or use defaults
repository_name = os.getenv('REPOSITORY', 'iac-test-automations')
commit_author = os.getenv('COMMIT_AUTHOR', 'claude-code')

# Create default tags for all resources
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
    'ManagedBy': 'Pulumi',
}

# Create the stack with configuration
stack = TapStack(
    name="tap-stack",
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        tags=default_tags,
    ),
)

# Export stack outputs for easy reference
pulumi.export("vpc_id", stack.vpc.id)
pulumi.export("kinesis_stream_name", stack.kinesis_stream.name)
pulumi.export("redis_primary_endpoint", stack.redis_cluster.configuration_endpoint_address)
pulumi.export("redis_port", stack.redis_cluster.port)
pulumi.export("rds_endpoint", stack.rds_instance.endpoint)
pulumi.export("rds_address", stack.rds_instance.address)
pulumi.export("rds_port", stack.rds_instance.port)
pulumi.export("rds_db_name", stack.rds_instance.db_name)
pulumi.export("rds_secret_arn", stack.db_secret.arn)

# Export subnet information
pulumi.export("public_subnet_ids", [subnet.id for subnet in stack.public_subnets])
pulumi.export("private_subnet_ids", [subnet.id for subnet in stack.private_subnets])

# Export security group IDs
pulumi.export("redis_security_group_id", stack.redis_sg.id)
pulumi.export("rds_security_group_id", stack.rds_sg.id)

# Export CloudWatch alarm ARNs
pulumi.export("rds_cpu_alarm_arn", stack.rds_cpu_alarm.arn)
pulumi.export("redis_cpu_alarm_arn", stack.redis_cpu_alarm.arn)
pulumi.export("kinesis_records_alarm_arn", stack.kinesis_records_alarm.arn)
