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

import pulumi
from pulumi import Config

# Add lib directory to Python path
lib_path = os.path.join(os.path.dirname(__file__), 'lib')
sys.path.insert(0, lib_path)

# Now import from the lib directory
from tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Priority: ENVIRONMENT_SUFFIX env var > Pulumi config 'env' > fallback to 'local'
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX') or config.get('env') or 'local'

# Log the environment suffix being used
pulumi.log.info(f"Deploying with environment suffix: {environment_suffix}")

# Create the TAP stack
stack = TapStack(
    name="tap-infrastructure",
    args=TapStackArgs(environment_suffix=environment_suffix),
)
