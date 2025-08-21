#!/usr/bin/env python3
"""
Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
This module defines the core Pulumi stack and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.
The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os
import sys
import subprocess
import time
import pulumi
from pulumi import Config, ResourceOptions
from lib.tap_stack import TapStack, TapStackArgs

def handle_stack_locks():
    """Handle any existing stack locks before deployment."""
    try:
        # Try to cancel any existing locks
        result = subprocess.run(
            ['pulumi', 'cancel', '--yes'],
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode == 0:
            print("✅ Successfully canceled existing locks")
        else:
            print("ℹ️ No locks to cancel or cancel operation not needed")
    except subprocess.TimeoutExpired:
        print("⚠️ Lock cancellation timed out, proceeding anyway")
    except Exception as e:
        print(f"⚠️ Error during lock cancellation: {e}, proceeding anyway")

def ensure_stack_ready():
    """Ensure the stack is ready for operations by handling locks and refreshing state."""
    try:
        # Handle any existing locks
        handle_stack_locks()
        
        # Small delay to ensure lock is fully released
        time.sleep(2)
        
        # Try to refresh the stack state
        result = subprocess.run(
            ['pulumi', 'refresh', '--yes', '--skip-preview'],
            capture_output=True,
            text=True,
            timeout=60
        )
        if result.returncode == 0:
            print("✅ Stack state refreshed successfully")
        else:
            print("ℹ️ Stack refresh completed with warnings (continuing)")
            
    except Exception as e:
        print(f"⚠️ Error during stack preparation: {e}, proceeding with deployment")

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from config or environment variable or fallback to 'dev'
environment_suffix = (
    config.get('env') or 
    os.getenv('ENVIRONMENT_SUFFIX') or 
    'dev'
)

STACK_NAME = f"TapStack{environment_suffix}"
repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
}

# Ensure stack is ready before creating resources
if __name__ == "__main__":
    # Only run stack preparation if we're actually deploying
    if len(sys.argv) > 1 and sys.argv[1] in ['up', 'deploy']:
        ensure_stack_ready()

# Create the stack
stack = TapStack(
    name="pulumi-infra",
    args=TapStackArgs(environment_suffix=environment_suffix),
)