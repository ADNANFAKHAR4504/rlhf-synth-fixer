#!/usr/bin/env python

import os
from cdktf import App

# Import the custom stack
from lib.tap_stack import TapStack

# === Environment Configuration ===
ENVIRONMENT_SUFFIX = os.getenv("ENVIRONMENT_SUFFIX", "dev").lower()
TERRAFORM_STATE_BUCKET = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
TERRAFORM_STATE_BUCKET_REGION = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
REPOSITORY_NAME = os.getenv("REPOSITORY", "unknown")
COMMIT_AUTHOR = os.getenv("COMMIT_AUTHOR", "unknown")

# Construct a consistent, readable stack name
STACK_NAME = f"TapStack{ENVIRONMENT_SUFFIX.capitalize()}"

# Default AWS resource tags
DEFAULT_TAGS = {
    "tags": {
        "Environment": ENVIRONMENT_SUFFIX,
        "Repository": REPOSITORY_NAME,
        "Author": COMMIT_AUTHOR,
    }
}

# === CDKTF Application ===
app = App()

# Instantiate the custom stack
TapStack(
    app,
    "tap-stack",
    environment_suffix="dev",
    state_bucket="your-state-bucket",
    aws_region="us-east-1",
    vpc_cidr="10.0.0.0/16",
    public_subnet_cidrs=["10.0.1.0/24", "10.0.2.0/24"],
    project_name="tap"
)

# Synthesize the Terraform configuration
app.synth()
