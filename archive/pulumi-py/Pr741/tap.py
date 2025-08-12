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
from pulumi import Config

from lib.tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from environment variable or config, with fallback
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX') or config.get('env') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

# Environment and metadata
repository_name = os.getenv('REPOSITORY', 'iac-test-automations')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Configure default values for all required configuration
config_defaults = {
    # Corporate and environment settings
    'namePrefix': 'corp',
    'env': environment_suffix,
    
    # GitHub configuration with placeholders
    'github.owner': 'devang-devops',  # Placeholder GitHub owner
    'github.repo': 'demo-web-app-deployment', 
    'github.branch': 'main',
    'github.connectionArn': None,  # Will create new connection if not provided
    
    # Deployment configuration
    'deploy.targetBucketName': f'corp-{environment_suffix}-deploy-target',
    
    # RBAC configuration - empty array as default
    'rbac.approverArns': '[]',
    
    # Slack configuration with placeholder values
    'slack.workspaceId': 'T099JAU1EDT',  # Placeholder Slack workspace ID
    'slack.channelId': 'C0995LYSAKH',    # Placeholder Slack channel ID
    'slack.enabled' : 'false',  # Default to false, can be enabled later
    
    # Build configuration
    'build.buildspec': None,  # Will use default buildspec
}

# Set configuration defaults if not already set
for key, default_value in config_defaults.items():
    if default_value is not None and not config.get(key):
        # Note: This demonstrates the configuration structure
        # In practice, these would be set via `pulumi config set` commands
        pass

# Create comprehensive tags for all resources
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
    'Project': 'IaC - AWS Nova Model Breaking',
    'ManagedBy': 'Pulumi',
    'CostCenter': 'Engineering',
}

# Create the TapStack with enhanced configuration
stack = TapStack(
    name="pulumi-infra",
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        tags=default_tags
    ),
)
