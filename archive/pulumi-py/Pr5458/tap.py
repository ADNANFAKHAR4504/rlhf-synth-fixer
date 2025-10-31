"""
Main Pulumi program entry point for the serverless infrastructure.

This file bootstraps the entire Pulumi deployment by instantiating the TapStack.
"""

import os
import sys

# Add lib directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'lib'))

from tap_stack import TapStack

# Create the main stack
stack = TapStack('serverless-stack')
