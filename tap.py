#!/usr/bin/env python
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
team = os.getenv("TEAM", "unknown")
created_at = datetime.now(timezone.utc).isoformat()

# Set test password for synth/testing if not provided
# SECURITY: This is only for local synth/testing - actual deployments must set TF_VAR_db_password
# In CI/CD, deploy.sh always sets TF_VAR_db_password, so this fallback is never used in production
if "TF_VAR_db_password" not in os.environ:
    # Only allow test password in local development, not in CI/CD
    if os.getenv("CI") or os.getenv("GITHUB_ACTIONS") or os.getenv("GITLAB_CI"):
        raise ValueError(
            "TF_VAR_db_password must be set in CI/CD environments. "
            "Do not use test passwords in production pipelines."
        )
    os.environ["TF_VAR_db_password"] = "TestPasswordForSynth123!"
if "TF_VAR_db_username" not in os.environ:
    os.environ["TF_VAR_db_username"] = "dbadmin"

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
