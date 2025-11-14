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
import sys

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

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

# Example member account IDs - replace with actual AWS account IDs
# Minimum of 3 accounts required for cross-account observability
member_accounts = [
    '123456789012',  # Member Account 1
    '234567890123',  # Member Account 2
    '345678901234',  # Member Account 3
]

# JIRA configuration - use AWS Secrets Manager in production
jira_url = os.getenv('JIRA_URL', 'https://example.atlassian.net')
jira_api_token = os.getenv('JIRA_API_TOKEN', '')
alert_email = os.getenv('ALERT_EMAIL', 'ops@example.com')

stack = TapStack(
    name="tapstack",
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        member_account_ids=member_accounts,
        alert_email=alert_email,
        jira_url=jira_url,
        jira_api_token=jira_api_token,
        tags=default_tags
    ),
)
