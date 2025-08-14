#!/usr/bin/env python3
"""
Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core Pulumi stack and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.
"""

import os
import pulumi
from pulumi import Config
from lib.tap_stack import TapStack, TapStackArgs

# --------------------------------------------------------
# Load Pulumi configuration and environment variables
# --------------------------------------------------------
config = Config()

# Explicit environment fallback
environment_suffix = config.get('env')
if not environment_suffix:
    pulumi.log.info("No environment specified, defaulting to 'dev'")
    environment_suffix = 'dev'

# CI/CD metadata
repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Shared tags injected into all AWS resources
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
    'ManagedBy': 'Pulumi',
}

# --------------------------------------------------------
# Instantiate core infrastructure stack
# --------------------------------------------------------
stack = TapStack(
    name="pulumi-infra",
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        tags=default_tags
    ),
)

# Optionally register global outputs here (if needed)
# pulumi.export("stack_name", stack.__class__.__name__)
