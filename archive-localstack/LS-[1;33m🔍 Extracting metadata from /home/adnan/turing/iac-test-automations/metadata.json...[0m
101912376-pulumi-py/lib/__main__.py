"""
Pulumi wrapper for TapStack deployment
This file acts as the entry point when lib/ is set as main in Pulumi.yaml
"""

import os
import sys
from datetime import datetime, timezone

# Add parent directory to path so we can import the tap module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pulumi
import pulumi_aws as aws
from pulumi import Config, ResourceOptions

from tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Set default config values if not already set
# This handles the case where config values aren't set via pulumi config set
def get_config_or_env(key: str, env_var: str, default: str = None):
    """Get config value from Pulumi config or environment variable"""
    try:
        return config.require(key)
    except:
        return os.getenv(env_var, default)

# Get environment suffix from environment variables, fallback to 'dev'
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')
pr_number = os.getenv('PR_NUMBER', 'unknown')
team = os.getenv('TEAM', 'unknown')
created_at = datetime.now(timezone.utc).isoformat()

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
    'PRNumber': pr_number,
    'Team': team,
    "CreatedAt": created_at,
}

# Configure AWS provider with default tags
provider = aws.Provider('aws',
    region=os.getenv('AWS_REGION', 'us-east-1'),
    default_tags=aws.ProviderDefaultTagsArgs(
        tags=default_tags
    )
)

# Get DB password from environment or use default
db_password = os.getenv('TF_VAR_db_password', 'TempPassword123!')

# Set secret ARN for DB password (for environment variable)
os.environ['SECRET_ARN'] = 'arn:aws:secretsmanager:us-east-1:123456789012:secret:tap-db-password-XXXXXX'

# Create the stack with the necessary arguments
stack_args = TapStackArgs(
    environment_suffix=environment_suffix,
    tags=default_tags
)

# Instantiate the TapStack
stack = TapStack(
    STACK_NAME,
    args=stack_args,
    opts=ResourceOptions(providers=[provider])
)

# Export stack outputs matching what the tap.py file would export
pulumi.export('vpc_id', stack.vpc.id)
pulumi.export('primary_subnet_ids', [subnet.id for subnet in stack.primary_subnets])
pulumi.export('secondary_subnet_ids', [subnet.id for subnet in stack.secondary_subnets])
pulumi.export('primary_cluster_endpoint', stack.primary_cluster.endpoint)
pulumi.export('primary_cluster_reader_endpoint', stack.primary_cluster.reader_endpoint)
pulumi.export('secondary_cluster_endpoint', stack.secondary_cluster.endpoint)
pulumi.export('secondary_cluster_reader_endpoint', stack.secondary_cluster.reader_endpoint)
pulumi.export('health_check_id', stack.health_check.id)
pulumi.export('health_check_status', stack.health_check_status)
pulumi.export('created_at', created_at)
pulumi.export('environment', environment_suffix)
pulumi.export('global_cluster_id', stack.global_cluster.id)
