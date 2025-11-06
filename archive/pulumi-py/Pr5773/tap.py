"""
Pulumi program entry point for database migration infrastructure.
"""

import pulumi
from lib.tap_stack import TapStack

# Get configuration
config = pulumi.Config()
environment_suffix = config.get("environment_suffix") or "prod"

# Create the stack
stack = TapStack(environment_suffix=environment_suffix)
