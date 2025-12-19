#!/usr/bin/env python
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import TapStack

# Get environment variables from the environment or use defaults
# Use 'or' to handle empty strings as well as None
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX") or "dev"
state_bucket = os.getenv("TERRAFORM_STATE_BUCKET") or "iac-rlhf-tf-states"
state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION") or "us-east-1"
aws_region = os.getenv("AWS_REGION") or "us-east-1"
repository_name = os.getenv("REPOSITORY") or "unknown"
commit_author = os.getenv("COMMIT_AUTHOR") or "unknown"

# Calculate the stack name
stack_name = f"TapStack{environment_suffix}"

# default_tags is structured in adherence to the AwsProvider default_tags interface
default_tags = {
    "tags": {
        "Environment": environment_suffix,
        "Repository": repository_name,
        "Author": commit_author,
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