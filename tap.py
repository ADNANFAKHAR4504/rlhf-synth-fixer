#!/usr/bin/env python
import sys
import os
from datetime import datetime, timezone
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.stacks.primary_stack import PrimaryStack
from lib.stacks.secondary_stack import SecondaryStack
from lib.stacks.global_stack import GlobalStack

# Get environment variables from the environment or use defaults
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "prod-dr")
state_bucket = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
aws_region = os.getenv("AWS_REGION", "us-east-1")
repository_name = os.getenv("REPOSITORY", "healthcare-dr-infrastructure")
commit_author = os.getenv("COMMIT_AUTHOR", "unknown")
pr_number = os.getenv("PR_NUMBER", "unknown")
team = os.getenv("TEAM", "healthcare")
created_at = datetime.now(timezone.utc).isoformat()

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

# Primary region stack (us-east-1)
primary_stack = PrimaryStack(
    app,
    "healthcare-dr-primary",
    region="us-east-1",
    environment_suffix=environment_suffix,
    state_bucket=state_bucket,
    state_bucket_region=state_bucket_region,
    default_tags=default_tags
)

# Secondary region stack (us-west-2)
secondary_stack = SecondaryStack(
    app,
    "healthcare-dr-secondary",
    region="us-west-2",
    environment_suffix=environment_suffix,
    primary_bucket_arn=primary_stack.medical_docs_bucket_arn,
    primary_kms_key_arn=primary_stack.kms_key_arn,
    state_bucket=state_bucket,
    state_bucket_region=state_bucket_region,
    default_tags=default_tags
)

# Global resources (Route53, DynamoDB global tables)
global_stack = GlobalStack(
    app,
    "healthcare-dr-global",
    environment_suffix=environment_suffix,
    primary_endpoint=primary_stack.api_endpoint,
    secondary_endpoint=secondary_stack.api_endpoint,
    primary_region="us-east-1",
    secondary_region="us-west-2",
    state_bucket=state_bucket,
    state_bucket_region=state_bucket_region,
    default_tags=default_tags
)

# Synthesize the app to generate the Terraform configuration
app.synth()
