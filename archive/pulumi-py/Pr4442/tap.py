#!/usr/bin/env python3
"""
Pulumi application entry point for the Web Application infrastructure.

This module defines the core Pulumi stack and instantiates the WebAppStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os
import sys

import pulumi

# Add lib to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'lib'))

from tap_stack import WebAppStack

# Initialize the web application stack
webapp_stack = WebAppStack()
