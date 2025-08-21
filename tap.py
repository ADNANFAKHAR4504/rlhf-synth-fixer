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
import subprocess
import time
import pulumi
from pulumi import Config, ResourceOptions
from lib.tap_stack import TapStack, TapStackArgs

# CRITICAL: Clean up Pulumi locks BEFORE any deployment operations
def cleanup_pulumi_locks():
    """
    Clean up any existing Pulumi locks before deployment starts.
    This must execute before any Pulumi operations to prevent lock errors.
    """
    max_retries = 3
    retry_delay = 5
    
    # Get environment suffix from environment variable or use default
    environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', os.getenv('PR_NUMBER', 'dev'))
    
    # Construct stack name - must match the actual stack naming convention
    # Based on error message, format is TapStackpr{number}
    if environment_suffix.isdigit():
        stack_name = f"TapStackpr{environment_suffix}"
    else:
        stack_name = f"TapStack{environment_suffix}"
    
    print(f"Checking for Pulumi locks on stack: {stack_name}")
    
    for attempt in range(max_retries):
        try:
            # First, try to check if there are any locks
            check_result = subprocess.run(
                ['pulumi', 'stack', '--stack', stack_name, '--show-name'],
                capture_output=True,
                text=True,
                timeout=10,
                env={**os.environ}
            )
            
            # Attempt to cancel any existing locks
            cancel_result = subprocess.run(
                ['pulumi', 'cancel', '--stack', stack_name, '--yes'],
                capture_output=True,
                text=True,
                timeout=30,
                env={**os.environ}
            )
            
            if cancel_result.returncode == 0:
                print(f"Successfully cleaned up locks for stack {stack_name}")
                return
            elif "no stack operations are currently running" in cancel_result.stderr.lower():
                print(f"No locks to clean for stack {stack_name}")
                return
            else:
                print(f"Lock cleanup attempt {attempt + 1}/{max_retries} - {cancel_result.stderr}")
                
        except subprocess.TimeoutExpired:
            print(f"Lock cleanup attempt {attempt + 1}/{max_retries} timed out")
        except FileNotFoundError:
            # Pulumi CLI not found, skip lock cleanup
            print("Pulumi CLI not found, skipping lock cleanup")
            return
        except Exception as e:
            print(f"Lock cleanup attempt {attempt + 1}/{max_retries} failed: {str(e)}")
        
        if attempt < max_retries - 1:
            print(f"Retrying lock cleanup in {retry_delay} seconds...")
            time.sleep(retry_delay)
    
    # If all retries failed, log a warning but continue
    print("Could not clean up Pulumi locks after all retries, proceeding anyway")

# Execute lock cleanup IMMEDIATELY before any Pulumi operations
cleanup_pulumi_locks()

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from config or fallback to 'dev'
environment_suffix = config.get('env') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
}

stack = TapStack(
    name="pulumi-infra",
    args=TapStackArgs(environment_suffix=environment_suffix),
)
