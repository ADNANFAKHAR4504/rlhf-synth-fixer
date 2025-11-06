#!/usr/bin/env python3
"""
Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core Pulumi stack and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
# Initialize Python environment first (must be before other imports)
try:
    from lib.python_env_init import initialize_python_environment
    initialize_python_environment()
except ImportError:
    # Fallback: manually add venv to path if environment initialization not available
    import os
    import subprocess
    import sys
    try:
        result = subprocess.run(
            ['pipenv', '--venv'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            venv_path = result.stdout.strip()
            site_packages = os.path.join(
                venv_path,
                'lib',
                f'python{sys.version_info.major}.{sys.version_info.minor}',
                'site-packages'
            )
            if os.path.exists(site_packages) and site_packages not in sys.path:
                sys.path.insert(0, site_packages)
    except Exception:
        pass

import os

import pulumi
from pulumi import Config

from lib.tap_stack import TapStack

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from CI, config or fallback to 'dev'
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX') or config.get('env') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
}

# Create the infrastructure stack
stack = TapStack(
    name="tapstack",
    environment_suffix=environment_suffix
)

# Export outputs
pulumi.export("alb_dns_name", stack.alb.dns_name)
pulumi.export("ecr_repository_url", stack.ecr_repository.repository_url)
pulumi.export("vpc_id", stack.vpc.id)
pulumi.export("ecs_cluster_name", stack.ecs_cluster.name)
pulumi.export("db_secret_arn", stack.db_secret.arn)
pulumi.export("rds_endpoint", stack.rds_instance.endpoint)
