"""
Main entry point for Pulumi stack.

This file instantiates the TapStack and triggers infrastructure deployment.
"""

import os
import sys

# Add lib directory to Python path so Pulumi can find it
lib_path = os.path.join(os.path.dirname(__file__), 'lib')
if lib_path not in sys.path:
    sys.path.insert(0, lib_path)

# Now import from the lib directory
from tap_stack import TapStack, TapStackArgs

# Get environment suffix from environment variable
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')

# Get email endpoint from Pulumi config or environment
email_endpoint = os.getenv('ALERT_EMAIL', 'devops@example.com')

# Create TapStack
stack_args = TapStackArgs(
    environment_suffix=environment_suffix,
    email_endpoint=email_endpoint,
    use_default_vpc=False  # Create new VPC with all resources
)

# Instantiate the stack
tap_stack = TapStack(
    name='ha-webapp-stack',
    args=stack_args
)

