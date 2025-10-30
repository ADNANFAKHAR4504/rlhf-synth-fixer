#!/usr/bin/env python3
"""
Pulumi application entry point for the multi-environment infrastructure.

This module defines the core Pulumi stack and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (dev, staging, prod).
"""
import os
import sys

import pulumi
from pulumi import Config

lib_path = os.path.join(os.path.dirname(__file__), 'lib')
sys.path.insert(0, lib_path)

from tap_stack import TapStack, TapStackArgs

config = Config()

environment_suffix = config.get('env') or os.getenv('ENVIRONMENT_SUFFIX', 'pr1234')
STACK_NAME = f"MultiEnv-{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

default_tags = {
    'Environment': os.getenv('ENVIRONMENT', 'dev'),
    'Repository': repository_name,
    'Author': commit_author,
}

stack = TapStack(
    name="multi-env-stack",
    args=TapStackArgs(environment_suffix=environment_suffix, tags=default_tags),
)
