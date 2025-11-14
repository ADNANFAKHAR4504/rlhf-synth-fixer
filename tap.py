#!/usr/bin/env python
"""
tap.py

Main entry point for TAP Pulumi infrastructure.
"""

import os
from lib.tap_stack import TapStack, TapStackArgs

# Get environment variables
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
repository_name = os.getenv("REPOSITORY", "unknown")
commit_author = os.getenv("COMMIT_AUTHOR", "unknown")

# Create custom tags
custom_tags = {
    "Repository": repository_name,
    "Author": commit_author,
}

# Create stack arguments
stack_args = TapStackArgs(
    environment_suffix=environment_suffix,
    tags=custom_tags
)

# Create the TAP stack
stack = TapStack(
    f'TapStack{environment_suffix}',
    stack_args
)

# Export all stack outputs
import pulumi

pulumi.export('primary_vpc_id', stack.primary.vpc_id)
pulumi.export('primary_cluster_endpoint', stack.primary.aurora_cluster_endpoint)
pulumi.export('primary_api_url', stack.primary.api_endpoint)
pulumi.export('primary_bucket_name', stack.primary.bucket_name)

pulumi.export('dr_vpc_id', stack.dr.vpc_id)
pulumi.export('dr_cluster_endpoint', stack.dr.aurora_cluster_endpoint)
pulumi.export('dr_api_url', stack.dr.api_endpoint)
pulumi.export('dr_bucket_name', stack.dr.bucket_name)

pulumi.export('route53_zone_id', stack.global_resources.zone_id)
pulumi.export('failover_domain', stack.global_resources.failover_domain)
pulumi.export('dynamodb_table_name', stack.global_resources.dynamodb_table_name)
pulumi.export('sns_topic_primary_arn', stack.global_resources.sns_topic_primary_arn)
pulumi.export('sns_topic_dr_arn', stack.global_resources.sns_topic_dr_arn)
