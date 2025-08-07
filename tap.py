#!/usr/bin/env python3
"""
Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.

This module serves as the entry point for the Pulumi program. It imports the main
infrastructure defined in lib.tap_stack which contains all the AWS resources
for the CI/CD pipeline infrastructure.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os
from pulumi import Config

# Import the tap_stack module which contains all infrastructure definitions
import lib.tap_stack  # noqa: F401 - imported for side effects (resource creation)

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from config or fallback to 'dev'
environment_suffix = config.get('env') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# The infrastructure is already defined and exported in lib.tap_stack
# No additional instantiation needed since lib.tap_stack creates resources directly
print(f"Pulumi stack initialized with environment suffix: {environment_suffix}")
print(f"Repository: {repository_name}, Author: {commit_author}")
