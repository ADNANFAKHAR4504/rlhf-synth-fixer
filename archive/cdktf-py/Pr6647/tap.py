#!/usr/bin/env python
import os
import sys
from datetime import datetime, timezone

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App

from lib.stacks.payment_stack import PaymentMigrationStack

# Get environment variables from the environment or use defaults
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
migration_phase = os.getenv("MIGRATION_PHASE", "legacy")
state_bucket = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
state_bucket_key = os.getenv("TERRAFORM_STATE_BUCKET_KEY", environment_suffix)
aws_region = os.getenv("AWS_REGION", "us-east-1")
repository_name = os.getenv("REPOSITORY", "unknown")
commit_author = os.getenv("COMMIT_AUTHOR", "unknown")
pr_number = os.getenv("PR_NUMBER", "unknown")
team = os.getenv("TEAM", "unknown")
created_at = datetime.now(timezone.utc).isoformat()

# Calculate the stack name - use TapStack prefix as per reference implementations
stack_name = f"TapStack{environment_suffix}"

# default_tags is structured in adherence to the AwsProvider default_tags interface
default_tags = {
    "tags": {
        "Environment": environment_suffix,
        "MigrationPhase": migration_phase,
        "Repository": repository_name,
        "Author": commit_author,
        "PRNumber": pr_number,
        "Team": team,
        "CreatedAt": created_at,
    }
}

app = App()

# Pass state bucket configuration through environment variables
# These will be picked up by the stack
os.environ["STATE_BUCKET"] = state_bucket
os.environ["STATE_BUCKET_REGION"] = state_bucket_region
os.environ["STATE_BUCKET_KEY"] = state_bucket_key

# Create the PaymentMigrationStack with the calculated properties
PaymentMigrationStack(
    app,
    stack_name,
    environment_suffix=environment_suffix,
    migration_phase=migration_phase
)

# Synthesize the app to generate the Terraform configuration
app.synth()