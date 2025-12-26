#!/usr/bin/env python3
"""
tap.py - Main entry point for the TapStack Pulumi program

This file instantiates the TapStack and manages the Pulumi program lifecycle.
"""

import os
from lib.tap_stack import TapStack, TapStackArgs

# Get environment suffix from environment variable (used for resource naming)
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')

# Common tags for all resources
common_tags = {
    'Environment': environment_suffix,
    'Project': 'TapStack',
    'ManagedBy': 'Pulumi'
}

# Create the stack
args = TapStackArgs(
    environment_suffix=environment_suffix,
    tags=common_tags
)

# Instantiate the main stack
stack = TapStack('tap-stack', args)
