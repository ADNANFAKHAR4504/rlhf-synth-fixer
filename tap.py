#!/usr/bin/env python3
"""Pulumi program for multi-AZ data processing infrastructure."""

import pulumi
from lib.tap_stack import TapStack

# Create the stack
stack = TapStack("tap-stack")

# Export stack outputs
pulumi.export("vpc_id", stack.vpc.id)
pulumi.export("kinesis_stream_name", stack.kinesis_stream.name)
pulumi.export("redis_endpoint", stack.redis_cluster.cache_nodes[0]["address"])
pulumi.export("rds_endpoint", stack.rds_instance.endpoint)
pulumi.export("rds_secret_arn", stack.db_secret.arn)
