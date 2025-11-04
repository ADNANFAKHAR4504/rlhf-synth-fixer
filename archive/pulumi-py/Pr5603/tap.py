#!/usr/bin/env python3
"""
Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.

This module imports the infrastructure stack which creates all AWS resources
based on the deployment environment configuration.
"""
import os

# Ensure environment suffix is available
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')

# Import the infrastructure stack (this executes the flat script)
import lib.tap_stack
