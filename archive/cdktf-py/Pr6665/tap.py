#!/usr/bin/env python
"""CDKTF application entry point for multi-environment infrastructure."""
import sys
import os
from datetime import datetime, timezone
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import TapStack

# Get environment variables from the environment or use defaults
environment = os.getenv("ENVIRONMENT", "dev")
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "demo")
state_bucket = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
aws_region = os.getenv("AWS_REGION", "us-east-1")
repository_name = os.getenv("REPOSITORY", "iac-test-automations")
commit_author = os.getenv("COMMIT_AUTHOR", "cdktf")
pr_number = os.getenv("PR_NUMBER", "synth-3f7b5l")
team = os.getenv("TEAM", "synth-2")
created_at = datetime.now(timezone.utc).isoformat()

# Calculate the stack name
stack_name = f"tap-{environment}-{environment_suffix}"

# default_tags is structured in adherence to the AwsProvider default_tags interface
default_tags = {
    "tags": {
        "Environment": environment,
        "EnvironmentSuffix": environment_suffix,
        "Repository": repository_name,
        "Author": commit_author,
        "PRNumber": pr_number,
        "Team": team,
        "CreatedAt": created_at,
    }
}

app = App()

# Create the TapStack with the calculated properties
TapStack(
    app,
    stack_name,
    environment=environment,
    environment_suffix=environment_suffix,
    state_bucket=state_bucket,
    state_bucket_region=state_bucket_region,
    aws_region=aws_region,
    default_tags=default_tags,
)

# Synthesize the app to generate the Terraform configuration
app.synth()
