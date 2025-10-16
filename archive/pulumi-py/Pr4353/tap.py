#!/usr/bin/env python3
"""
Pulumi application entry point for the EC2 failure recovery infrastructure.

This module defines the core Pulumi stack and instantiates the EC2RecoveryStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os
import sys

import pulumi
from pulumi import Config, ResourceOptions

sys.path.append(os.path.join(os.path.dirname(__file__), 'lib'))
from tap_stack import EC2RecoveryStack

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from config or fallback to 'dev'
environment_suffix = config.get('env') or 'dev'
STACK_NAME = f"EC2RecoveryStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
}

# Create the EC2 recovery stack
stack = EC2RecoveryStack()
