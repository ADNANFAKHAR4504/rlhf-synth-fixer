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

# Get environment suffix from CI, config or fallback to 'dev'
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX') or config.get('env') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
}

# Get configuration values from Pulumi config
vpc_id = config.require('vpcId')
private_subnet_ids = config.require_object('privateSubnetIds')
dms_subnet_ids = config.require_object('dmsSubnetIds')
source_db_host = config.require('sourceDbHost')
source_db_port = config.get_int('sourceDbPort') or 5432
source_db_name = config.get('sourceDbName') or 'postgres'
source_db_username = config.get('sourceDbUsername') or 'postgres'
source_db_password = config.require_secret('sourceDbPassword')
aurora_username = config.get('auroraUsername') or 'auroraMaster'
aurora_password = config.require_secret('auroraPassword')

stack = TapStack(
    name="pulumi-infra",
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        vpc_id=vpc_id,
        private_subnet_ids=private_subnet_ids,
        dms_subnet_ids=dms_subnet_ids,
        source_db_host=source_db_host,
        source_db_port=source_db_port,
        source_db_name=source_db_name,
        source_db_username=source_db_username,
        source_db_password=source_db_password,
        aurora_username=aurora_username,
        aurora_password=aurora_password,
        tags=default_tags,
    ),
)
