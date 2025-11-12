"""
Pulumi program entry point for DR infrastructure
"""
import os
from lib.tap_stack import TapStack

# Get environment suffix from environment variable
environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "synthr7u57r")

# Create the stack
stack = TapStack(environment_suffix)
