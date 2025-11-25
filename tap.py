#!/usr/bin/env python
"""
Multi-region payment processing infrastructure deployment
Deploys to us-east-1, eu-west-1, and ap-southeast-1
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import TapStack

# Get environment variables
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
state_bucket = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
repository_name = os.getenv("REPOSITORY", "unknown")
commit_author = os.getenv("COMMIT_AUTHOR", "unknown")

# Define regions for multi-region deployment
regions = ["us-east-1", "eu-west-1", "ap-southeast-1"]

# Default tags for all resources
default_tags = [{
    "tags": {
        "Environment": environment_suffix,
        "Repository": repository_name,
        "Author": commit_author,
        "CostCenter": "payment-processing"
    }
}]

app = App()

# Create stack for us-east-1 (primary region)
primary_region = "us-east-1"
stack_name = f"TapStack{environment_suffix}"

TapStack(
    app,
    stack_name,
    environment_suffix=environment_suffix,
    state_bucket=state_bucket,
    state_bucket_region=state_bucket_region,
    aws_region=primary_region,
    regions=regions,
    default_tags=default_tags,
)

# Synthesize the app
app.synth()
