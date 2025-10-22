"""
__main__.py

Entry point for Pulumi stack deployment.
"""

import os
import pulumi
from lib.tap_stack import TapStack, TapStackArgs

# Get environment suffix from environment variable or use default
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'synth7196603919')

# Configure AWS region
pulumi_config = pulumi.Config()
aws_region = 'eu-central-1'

# Create tags
tags = {
    'Environment': environment_suffix,
    'ManagedBy': 'Pulumi',
    'Project': 'IoTSensorDataProcessing'
}

# Create the TapStack
args = TapStackArgs(
    environment_suffix=environment_suffix,
    tags=tags
)

stack = TapStack(f"TapStack{environment_suffix}", args)

# Export stack outputs
pulumi.export('VpcId', stack.vpc.id)
pulumi.export('KinesisStreamName', stack.kinesis_stream.name)
pulumi.export('KinesisStreamArn', stack.kinesis_stream.arn)
pulumi.export('RedisEndpoint', stack.redis_cache.endpoints.apply(
    lambda endpoints: endpoints[0]['address'] if endpoints else ''
))
pulumi.export('RedisPort', stack.redis_cache.endpoints.apply(
    lambda endpoints: endpoints[0]['port'] if endpoints else 6379
))
pulumi.export('RdsEndpoint', stack.rds_instance.endpoint)
pulumi.export('RdsAddress', stack.rds_instance.address)
pulumi.export('RdsPort', stack.rds_instance.port)
pulumi.export('DbSecretArn', stack.db_password.arn)
pulumi.export('RedisSecretArn', stack.redis_secret.arn)
