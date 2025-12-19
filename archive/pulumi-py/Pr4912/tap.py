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

# Export stack outputs
pulumi.export('vpc_id', stack.vpc.id)
pulumi.export('kinesis_stream_name', stack.kinesis_stream.name)
pulumi.export('kinesis_stream_arn', stack.kinesis_stream.arn)
pulumi.export('ecs_cluster_name', stack.ecs_cluster.name)
pulumi.export('ecs_cluster_arn', stack.ecs_cluster.arn)
pulumi.export('ecs_service_name', stack.ecs_service.name)
pulumi.export('rds_endpoint', stack.rds_instance.endpoint)
pulumi.export('rds_address', stack.rds_instance.address)
pulumi.export('elasticache_endpoint', stack.elasticache_cluster.configuration_endpoint_address)
pulumi.export('efs_id', stack.efs.id)
pulumi.export('efs_dns_name', stack.efs.dns_name)
pulumi.export('api_gateway_url', pulumi.Output.concat(
    "https://", stack.api_gateway.id, ".execute-api.",
    stack.region, ".amazonaws.com/", stack.api_stage.stage_name
))
pulumi.export('db_secret_arn', stack.db_secret.arn)
pulumi.export('redis_secret_arn', stack.redis_secret.arn)
pulumi.export('kms_key_id', stack.kms_key.id)
pulumi.export('alarm_topic_arn', stack.alarm_topic.arn)
