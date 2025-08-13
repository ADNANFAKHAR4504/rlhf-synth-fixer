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
import pulumi_aws as aws
from pulumi import Config
from lib.tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Load all configuration as per lib/PROMPT.md
environment_suffix = config.get('env') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"
env = environment_suffix or 'dev'
region = config.get('region') or aws.get_region().name

tags = config.get_object('tags') or {
  'Environment': env,
  'ManagedBy': 'Pulumi',
}

logging_bucket_name = config.get('logging.bucketName') or f"tap-security-logs-{environment_suffix}"
ssh_allowed_cidrs = config.get_object('ssh.allowedCidrs') or ['10.0.0.0/8']
cloudtrail_kms_key_arn = config.get_secret('cloudtrail.kmsKeyArn')
cloudtrail_enable_data_events = config.get_bool('cloudtrail.enableDataEvents') or True
cloudtrail_create = config.get_bool('cloudtrail.create') or False
cloudtrail_name = config.get('cloudtrail.name')
nacl_subnet_ids = config.get_object('nacl.subnetIds') or []
lambda_kms_key_arn = config.get_secret('lambda.kmsKeyArn')
waf_rate_limit = config.get_int('waf.rateLimit') or 1000
guardduty_regions = config.get_object('guardduty.regions') or ['us-east-1', 'us-west-2', 'eu-west-1']
vpc_flow_log_vpc_ids = config.get_object('vpcFlowLogs.vpcIds') or []
vpc_flow_log_retention_days = config.get_int('vpcFlowLogs.logRetentionDays') or 90
iam_roles_to_validate = config.get_object('iam.roles') or []
rds_backup_retention_days = config.get_int('rds.backupRetentionDays') or 7
rds_multi_az_enabled = config.get_bool('rds.multiAzEnabled')
vpc_id = config.get('vpc.id')
rds_subnet_ids = config.get_object('rds.subnetIds') or []

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')
tags.update({'Repository': repository_name, 'Author': commit_author})

stack = TapStack(
  name="pulumi-infra",
  args=TapStackArgs(
    environment_suffix=environment_suffix,
    env=env,
    region=region,
    tags=tags,
    logging_bucket_name=logging_bucket_name,
    ssh_allowed_cidrs=ssh_allowed_cidrs,
    cloudtrail_kms_key_arn=cloudtrail_kms_key_arn,
    cloudtrail_enable_data_events=cloudtrail_enable_data_events if cloudtrail_enable_data_events is not None else True,
    cloudtrail_create=cloudtrail_create,
    cloudtrail_name=cloudtrail_name,
    nacl_subnet_ids=nacl_subnet_ids,
    lambda_kms_key_arn=lambda_kms_key_arn,
    waf_rate_limit=waf_rate_limit,
    guardduty_regions=guardduty_regions,
    vpc_flow_log_vpc_ids=vpc_flow_log_vpc_ids,
    vpc_flow_log_retention_days=vpc_flow_log_retention_days,
    iam_roles_to_validate=iam_roles_to_validate,
    rds_backup_retention_days=rds_backup_retention_days,
    rds_multi_az_enabled=rds_multi_az_enabled,
    vpc_id=vpc_id,
    rds_subnet_ids=rds_subnet_ids,
  ),
)
