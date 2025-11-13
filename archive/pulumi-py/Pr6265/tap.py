#!/usr/bin/env python3
"""
Pulumi application entry point for multi-region disaster recovery trading platform.

This module defines the core Pulumi stack and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources across multiple regions.

The stack created by this module implements a complete DR solution with:
- Route 53 DNS failover
- Aurora Global Database
- Multi-region Lambda functions
- DynamoDB global tables
- S3 cross-region replication
- API Gateway in both regions
- CloudWatch monitoring and alarms
- Automated failover orchestration
- SNS alerting
- CloudWatch Synthetics canaries
"""

import os
import sys

import pulumi
from pulumi import Config

# Add lib directory to Python path
lib_path = os.path.join(os.path.dirname(__file__), 'lib')
sys.path.insert(0, lib_path)

from tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from CI, config or fallback to 'dev'
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX') or config.get('env') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

# Get repository metadata from environment
repository_name = os.getenv('REPOSITORY', 'iac-test-automations')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create default tags for all resources
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
    'Project': 'MultiRegionDR',
    'ManagedBy': 'Pulumi',
}

# Get region configuration (optional)
primary_region = config.get('primary_region') or 'us-east-1'
secondary_region = config.get('secondary_region') or 'us-east-2'

# Get optional domain name for custom API Gateway domains
domain_name = config.get('domain_name')

# Create the main stack
stack = TapStack(
    name="trading-platform",
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        tags=default_tags,
        primary_region=primary_region,
        secondary_region=secondary_region,
        domain_name=domain_name
    ),
)

# Export stack outputs for integration tests and operational use
pulumi.export('environment_suffix', environment_suffix)
pulumi.export('primary_region', primary_region)
pulumi.export('secondary_region', secondary_region)
