#!/usr/bin/env python
import sys
import os
from datetime import datetime, timezone
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import TapStack

# Get environment variables from the environment or use defaults
base_environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
github_run_number = os.getenv("GITHUB_RUN_NUMBER", "")
github_run_id = os.getenv("GITHUB_RUN_ID", "")

# Create unique environment suffix by appending GitHub run number
# This ensures each CI run creates unique resource names, avoiding conflicts
if github_run_number:
    environment_suffix = f"{base_environment_suffix}-run{github_run_number}"
elif github_run_id:
    # Fallback to run ID if run number not available (truncated for name length)
    environment_suffix = f"{base_environment_suffix}-{github_run_id[-8:]}"
else:
    environment_suffix = base_environment_suffix

state_bucket = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
aws_region = os.getenv("AWS_REGION", "us-east-1")
repository_name = os.getenv("REPOSITORY", "unknown")
commit_author = os.getenv("COMMIT_AUTHOR", "unknown")
pr_number = os.getenv("PR_NUMBER", "unknown")
team = os.getenv("TEAM", "unknown")
created_at = datetime.now(timezone.utc).isoformat()

# Calculate the stack name
stack_name = f"TapStack{environment_suffix}"

# default_tags is structured in adherence to the AwsProvider default_tags interface
default_tags = {
    "tags": {
        "Environment": environment_suffix,
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
    environment_suffix=environment_suffix,
    state_bucket=state_bucket,
    state_bucket_region=state_bucket_region,
    aws_region=aws_region,
    default_tags=default_tags,
)

# Synthesize the app to generate the Terraform configuration
app.synth()