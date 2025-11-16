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

# Primary Region Exports
pulumi.export('primary_vpc_id', stack.primary.vpc_id)
pulumi.export('primary_cluster_endpoint', stack.primary.aurora_cluster_endpoint)
pulumi.export('primary_cluster_arn', stack.primary.aurora_cluster_arn)
pulumi.export('primary_api_url', stack.primary.api_endpoint)
pulumi.export('primary_api_id', stack.primary.api.id)
pulumi.export('primary_bucket_name', stack.primary.bucket_name)
pulumi.export('primary_bucket_arn', stack.primary.bucket_arn)
pulumi.export('primary_lambda_arn', stack.primary.lambda_arn)
pulumi.export('primary_lambda_name', stack.primary.payment_lambda.name)
pulumi.export('primary_subnet_1_id', stack.primary.private_subnet_1.id)
pulumi.export('primary_subnet_2_id', stack.primary.private_subnet_2.id)
pulumi.export('primary_security_group_id', stack.primary.aurora_sg.id)
pulumi.export('primary_sns_topic_arn', stack.primary.sns_topic_arn)

# DR Region Exports
pulumi.export('dr_vpc_id', stack.dr.vpc_id)
pulumi.export('dr_cluster_endpoint', stack.dr.aurora_cluster_endpoint)
pulumi.export('dr_cluster_arn', stack.dr.aurora_cluster_arn)
pulumi.export('dr_api_url', stack.dr.api_endpoint)
pulumi.export('dr_api_id', stack.dr.api.id)
pulumi.export('dr_bucket_name', stack.dr.bucket_name)
pulumi.export('dr_lambda_arn', stack.dr.lambda_arn)
pulumi.export('dr_lambda_name', stack.dr.payment_lambda.name)
pulumi.export('dr_subnet_1_id', stack.dr.private_subnet_1.id)
pulumi.export('dr_subnet_2_id', stack.dr.private_subnet_2.id)
pulumi.export('dr_security_group_id', stack.dr.aurora_sg.id)
pulumi.export('dr_sns_topic_arn', stack.dr.sns_topic_arn)

# Global Resources Exports
pulumi.export('route53_zone_id', stack.global_resources.zone_id)
pulumi.export('route53_zone_name', stack.global_resources.zone.name)
pulumi.export('failover_domain', stack.global_resources.failover_domain)
pulumi.export('dynamodb_table_name', stack.global_resources.dynamodb_table_name)
pulumi.export('dynamodb_table_arn', stack.global_resources.dynamodb_table_primary.arn)
pulumi.export('sns_topic_primary_arn', stack.global_resources.sns_topic_primary_arn)
pulumi.export('sns_topic_dr_arn', stack.global_resources.sns_topic_dr_arn)
pulumi.export('cloudwatch_dashboard_name', stack.global_resources.dashboard.dashboard_name)

# Configuration Exports
pulumi.export('environment_suffix', environment_suffix)
pulumi.export('primary_region', 'us-east-1')
pulumi.export('dr_region', 'us-east-2')
pulumi.export('global_cluster_id', stack.primary.global_cluster.id)
