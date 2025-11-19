#!/usr/bin/env python
"""
Main entry point for CDKTF Python multi-environment infrastructure.
Supports workspace-based environment separation (dev, staging, prod).
"""
import sys
import os
from datetime import datetime, timezone
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import TapStack

# Get environment variables from the environment or use defaults
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
state_bucket = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
aws_region = os.getenv("AWS_REGION", "us-east-1")
repository_name = os.getenv("REPOSITORY", "unknown")
commit_author = os.getenv("COMMIT_AUTHOR", "unknown")
pr_number = os.getenv("PR_NUMBER", "unknown")
team = os.getenv("TEAM", "synth-2")
created_at = datetime.now(timezone.utc).isoformat()

# Determine workspace (environment) from ENVIRONMENT_SUFFIX
# This maps to Terraform workspaces: dev, staging, prod
workspace = environment_suffix.split('-')[0] if '-' in environment_suffix else environment_suffix

# Validate workspace
valid_workspaces = ['dev', 'staging', 'prod']
if workspace not in valid_workspaces:
    print(f"Warning: workspace '{workspace}' not in {valid_workspaces}, defaulting to 'dev'")
    workspace = 'dev'

# Calculate the stack name
stack_name = f"TapStack{environment_suffix}"

# default_tags is structured in adherence to the AwsProvider default_tags interface
default_tags = {
    "tags": {
        "Environment": environment_suffix,
        "Workspace": workspace,
        "Repository": repository_name,
        "Author": commit_author,
        "PRNumber": pr_number,
        "Team": team,
        "CreatedAt": created_at,
    }
}

app = App()

# Create the TapStack with workspace-based configuration
TapStack(
    app,
    stack_name,
    environment_suffix=environment_suffix,
    workspace=workspace,
    state_bucket=state_bucket,
    state_bucket_region=state_bucket_region,
    aws_region=aws_region,
    default_tags=default_tags,
)

# Synthesize the app to generate the Terraform configuration
app.synth()
