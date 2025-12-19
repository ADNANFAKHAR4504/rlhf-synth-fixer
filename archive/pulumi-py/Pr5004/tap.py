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

# Export outputs for integration testing
pulumi.export('VPCId', stack.vpc.id)
pulumi.export('APIGatewayId', stack.api_gateway.id)
pulumi.export('APIGatewayEndpoint', stack.api_gateway.api_endpoint)
pulumi.export('KinesisStreamName', stack.kinesis_stream.name)
pulumi.export('KinesisStreamArn', stack.kinesis_stream.arn)
pulumi.export('RDSInstanceId', stack.rds_instance.id)
pulumi.export('RDSEndpoint', stack.rds_instance.endpoint)
pulumi.export('RedisClusterId', stack.redis_cluster.cluster_id)
pulumi.export('RedisEndpoint', stack.redis_cluster.cache_nodes.apply(
    lambda nodes: nodes[0]['address'] if isinstance(nodes[0], dict) else nodes[0].address
))
pulumi.export('KMSKeyId', stack.kms_key.id)
pulumi.export('KMSKeyArn', stack.kms_key.arn)
pulumi.export('SecretsManagerSecretArn', stack.db_secret.arn)
pulumi.export('SNSTopicArn', stack.alarm_topic.arn)
