#!/usr/bin/env python3
"""
Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core Pulumi stack and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import pulumi
from lib.tap_stack import TapStack

# Get configuration
config = pulumi.Config()
environment_suffix = config.get("environmentSuffix") or "dev"

# Create the IoT monitoring stack
stack = TapStack(environment_suffix)
