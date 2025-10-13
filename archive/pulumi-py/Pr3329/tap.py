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
from pulumi import Config, ResourceOptions, export
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

# Instantiate the TapStack
stack = TapStack(
    name="TapStack",
    args=TapStackArgs(environment_suffix=environment_suffix),
)


# Export VPC and Networking outputs
export('vpc_id', stack.vpc.id)
export('vpc_cidr', stack.vpc.cidr_block)
export('public_subnet_a_id', stack.public_subnet_a.id)
export('public_subnet_b_id', stack.public_subnet_b.id)
export('private_subnet_a_id', stack.private_subnet_a.id)
export('private_subnet_b_id', stack.private_subnet_b.id)

# Export Load Balancer outputs
export('alb_arn', stack.alb.arn)
export('alb_dns_name', stack.alb.dns_name)
export('alb_zone_id', stack.alb.zone_id)
export('target_group_arn', stack.target_group.arn)

# Export Database outputs
export('aurora_cluster_id', stack.aurora_cluster.id)
export('aurora_cluster_endpoint', stack.aurora_cluster.endpoint)
export('aurora_reader_endpoint', stack.aurora_cluster.reader_endpoint)
export('aurora_cluster_arn', stack.aurora_cluster.arn)
export('aurora_database_name', stack.aurora_cluster.database_name)

# Export Redis Cache outputs
export('redis_premium_endpoint', stack.redis_premium_cluster.primary_endpoint_address)
export('redis_premium_id', stack.redis_premium_cluster.id)
export('redis_standard_endpoint', stack.redis_standard_cluster.primary_endpoint_address)
export('redis_standard_id', stack.redis_standard_cluster.id)

# Export Storage outputs
export('s3_bucket_name', stack.tenant_data_bucket.bucket)
export('s3_bucket_arn', stack.tenant_data_bucket.arn)
export('s3_bucket_domain', stack.tenant_data_bucket.bucket_regional_domain_name)

# Export CDN outputs
export('cloudfront_distribution_id', stack.cloudfront_distribution.id)
export('cloudfront_domain_name', stack.cloudfront_distribution.domain_name)
export('cloudfront_arn', stack.cloudfront_distribution.arn)

# Export DNS outputs
export('hosted_zone_id', stack.hosted_zone.zone_id)
export('hosted_zone_name', stack.hosted_zone.name)

# Export Cognito outputs
export('cognito_user_pool_id_tenant1', stack.cognito_user_pool_tenant1.id)
export('cognito_user_pool_arn_tenant1', stack.cognito_user_pool_tenant1.arn)
export('cognito_user_pool_client_id_tenant1', stack.cognito_user_pool_client_tenant1.id)
export('cognito_identity_pool_id', stack.cognito_identity_pool.id)

# Export DynamoDB outputs
export('tenant_registry_table_name', stack.tenant_registry_table.name)
export('tenant_registry_table_arn', stack.tenant_registry_table.arn)

# Export Lambda outputs
export('tenant_provisioning_lambda_arn', stack.tenant_provisioning_lambda.arn)
export('tenant_provisioning_lambda_name', stack.tenant_provisioning_lambda.name)

# Export EventBridge outputs
export('event_bus_name', stack.event_bus.name)
export('event_bus_arn', stack.event_bus.arn)

# Export Auto Scaling outputs
export('asg_name', stack.asg.name)
export('asg_arn', stack.asg.arn)
export('launch_template_id', stack.launch_template.id)

# Export Security Group outputs
export('alb_sg_id', stack.alb_sg.id)
export('app_sg_id', stack.app_sg.id)
export('aurora_sg_id', stack.aurora_sg.id)
export('redis_sg_id', stack.redis_sg.id)

# Export CloudWatch Log Group outputs
export('lambda_log_group_name', stack.lambda_log_group.name)
export('tenant1_log_group_name', stack.tenant1_log_group.name)
export('tenant1_audit_log_group_name', stack.tenant1_audit_log_group.name)

# Export IAM Role outputs
export('ec2_role_arn', stack.ec2_role.arn)
export('ec2_role_name', stack.ec2_role.name)
export('lambda_role_arn', stack.lambda_role.arn)
export('lambda_role_name', stack.lambda_role.name)
export('instance_profile_arn', stack.instance_profile.arn)

# Export SSM Parameter outputs
export('ssm_aurora_endpoint_name', stack.ssm_aurora_endpoint.name)
export('ssm_redis_premium_endpoint_name', stack.ssm_redis_premium_endpoint.name)
export('ssm_redis_standard_endpoint_name', stack.ssm_redis_standard_endpoint.name)
export('ssm_s3_bucket_name', stack.ssm_s3_bucket.name)

# Export configuration metadata
export('environment_suffix', environment_suffix)
export('region', stack.region)
export('stack_name', STACK_NAME)

# Export summary for integration tests
export('deployment_summary', {
    'environment': environment_suffix,
    'region': stack.region,
    'vpc_id': stack.vpc.id,
    'alb_dns': stack.alb.dns_name,
    'aurora_endpoint': stack.aurora_cluster.endpoint,
    'redis_premium_endpoint': stack.redis_premium_cluster.primary_endpoint_address,
    'redis_standard_endpoint': stack.redis_standard_cluster.primary_endpoint_address,
    's3_bucket': stack.tenant_data_bucket.bucket,
    'cloudfront_domain': stack.cloudfront_distribution.domain_name,
})
