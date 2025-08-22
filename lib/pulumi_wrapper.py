#!/usr/bin/env python3
"""
Pulumi wrapper script to handle deployment commands with proper environment setup.

This script provides a workaround for Pulumi deployment issues by ensuring
proper environment variable configuration for CI/CD compatibility.
"""
import os
import sys
import subprocess


def ensure_pulumi_config():
    """Ensure PULUMI_CONFIG_PASSPHRASE is properly set for CI/CD compatibility."""
    if not os.environ.get('PULUMI_CONFIG_PASSPHRASE'):
        os.environ['PULUMI_CONFIG_PASSPHRASE'] = ''


def create_stack():
    """Create or select Pulumi stack with proper configuration."""
    ensure_pulumi_config()
    
    org = os.environ.get('PULUMI_ORG', 'organization')
    env_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
    stack_name = f"{org}/TapStack/TapStack{env_suffix}"
    
    cmd = ['pulumi', 'stack', 'select', stack_name, '--create']
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(f"✅ Stack selected/created successfully: {stack_name}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to create/select stack: {e}")
        print(f"stdout: {e.stdout}")
        print(f"stderr: {e.stderr}")
        return False


def deploy_stack():
    """Deploy Pulumi stack with proper configuration."""
    ensure_pulumi_config()
    
    org = os.environ.get('PULUMI_ORG', 'organization')
    env_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
    stack_name = f"{org}/TapStack/TapStack{env_suffix}"
    
    cmd = ['pulumi', 'up', '--yes', '--refresh', '--stack', stack_name]
    
    try:
        result = subprocess.run(cmd, check=True)
        print("✅ Stack deployed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to deploy stack: {e}")
        return False


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pulumi_wrapper.py [create-stack|deploy]")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "create-stack":
        success = create_stack()
    elif command == "deploy":
        success = deploy_stack()
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
    
    sys.exit(0 if success else 1)