#!/usr/bin/env python
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import TapStack

# Get environment variables from the environment or use defaults
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
state_bucket_env = os.getenv("TERRAFORM_STATE_BUCKET")
state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-west-2")
aws_region = os.getenv("AWS_REGION", "us-west-2")
repository_name = os.getenv("REPOSITORY", "unknown")
commit_author = os.getenv("COMMIT_AUTHOR", "unknown")

# Handle bucket name to avoid us-east-1 constraint
if state_bucket_env == "iac-rlhf-tf-states" and state_bucket_region == "us-east-1":
    # CI/CD is trying to use the us-east-1 bucket, but we need to exclude us-east-1
    # Use a different bucket name that exists in the target region
    state_bucket = f"iac-rlhf-tf-291231-states"
    print(f"Warning: Original bucket 'iac-rlhf-tf-states' is in us-east-1 (excluded region)")
    print(f"Using region-specific bucket: {state_bucket}")
else:
    state_bucket = state_bucket_env

# Validate region constraint - explicitly exclude us-east-1
if aws_region == "us-east-1":
  raise ValueError("us-east-1 region is explicitly excluded from deployment as per requirements")

# Override state bucket region if it's us-east-1 to use the AWS region instead
if state_bucket_region == "us-east-1":
  print(f"Warning: TERRAFORM_STATE_BUCKET_REGION is set to us-east-1, overriding to use AWS_REGION: {aws_region}")
  state_bucket_region = aws_region

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
