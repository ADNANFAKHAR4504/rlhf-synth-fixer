#!/usr/bin/env python3
"""
__main__.py

Pulumi entry point for multi-region DR infrastructure.
"""

import os
import pulumi
from lib.tap_stack import TapStack, TapStackArgs

# Get environment suffix from Pulumi config or environment variable
config = pulumi.Config()
environment_suffix = config.get('environmentSuffix') or os.getenv('ENVIRONMENT_SUFFIX', 'dev')

# Get regions
primary_region = config.get('primaryRegion') or os.getenv('PRIMARY_REGION', 'us-east-1')
dr_region = config.get('drRegion') or os.getenv('DR_REGION', 'us-east-2')

# Default tags
default_tags = {
    'Environment': environment_suffix,
    'ManagedBy': 'Pulumi',
    'Project': 'DisasterRecovery'
}

# Create the multi-region DR stack
args = TapStackArgs(
    environment_suffix=environment_suffix,
    primary_region=primary_region,
    dr_region=dr_region,
    tags=default_tags
)

stack = TapStack(f'TapStack{environment_suffix}', args)

# Export stack outputs
pulumi.export('environment_suffix', stack.environment_suffix)
pulumi.export('primary_region', primary_region)
pulumi.export('dr_region', dr_region)
pulumi.export('primary_vpc_id', stack.primary.vpc_id)
pulumi.export('dr_vpc_id', stack.dr.vpc_id)
pulumi.export('primary_aurora_endpoint', stack.primary.aurora_cluster_endpoint)
pulumi.export('dr_aurora_endpoint', stack.dr.aurora_cluster_endpoint)
pulumi.export('primary_api_endpoint', stack.primary.api_endpoint)
pulumi.export('dr_api_endpoint', stack.dr.api_endpoint)
pulumi.export('primary_bucket_name', stack.primary.bucket_name)
pulumi.export('dr_bucket_name', stack.dr.bucket_name)
pulumi.export('dynamodb_table_name', stack.global_resources.dynamodb_table_name)
pulumi.export('route53_zone_id', stack.global_resources.hosted_zone_id)
pulumi.export('route53_fqdn', stack.global_resources.route53_fqdn)
pulumi.export('primary_lambda_function_name', stack.primary.lambda_function_name)
pulumi.export('dr_lambda_function_name', stack.dr.lambda_function_name)
