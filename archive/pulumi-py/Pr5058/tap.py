"""
Pulumi program entry point for serverless infrastructure.

This is the main entry point that Pulumi executes to deploy
the serverless infrastructure.
"""

import os
import sys

import pulumi

# Add lib directory to Python path for imports
lib_path = os.path.join(os.path.dirname(__file__), 'lib')
sys.path.insert(0, lib_path)

# Now import from the lib directory
from infrastructure.config import initialize_config
from tap_stack import TapStack

# Initialize configuration from environment variables
config = initialize_config()

# Log environment information
pulumi.log.info(f"Resolved environment suffix: {config.environment_suffix}")
pulumi.log.info(f"Deploying to region: {config.primary_region}")
pulumi.log.info(f"Project name: {config.project_name}")

# Create the main stack
stack = TapStack(
    name="serverless-infra",
    config=config
)

# Outputs are automatically exported by TapStack
pulumi.log.info("Infrastructure deployment complete")
