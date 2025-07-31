#!/usr/bin/env python

import os
from pathlib import Path
from cdktf import App

# Import your custom stack (ensure lib/__init__.py exists and tap_stack.py defines TapStack)
from lib.tap_stack import TapStack

# Resolve environment variables with sensible defaults
ENVIRONMENT_SUFFIX = os.getenv("ENVIRONMENT_SUFFIX", "dev").lower()
TERRAFORM_STATE_BUCKET = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
TERRAFORM_STATE_BUCKET_REGION = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
REPOSITORY_NAME = os.getenv("REPOSITORY", "unknown")
COMMIT_AUTHOR = os.getenv("COMMIT_AUTHOR", "unknown")

# Construct stack name with sanitized suffix
STACK_NAME = f"TapStack{ENVIRONMENT_SUFFIX.capitalize()}"

# Define AWS default tags in a structure compatible with AwsProvider.default_tags
DEFAULT_TAGS = {
    "tags": {
        "Environment": ENVIRONMENT_SUFFIX,
        "Repository": REPOSITORY_NAME,
        "Author": COMMIT_AUTHOR,
    }
}

# Create the CDKTF application
app = App()

# Instantiate your custom stack
TapStack(
    scope=app,
    id=STACK_NAME,
    environment_suffix=ENVIRONMENT_SUFFIX,
    state_bucket=TERRAFORM_STATE_BUCKET,
    state_bucket_region=TERRAFORM_STATE_BUCKET_REGION,
    aws_region=AWS_REGION,
    default_tags=DEFAULT_TAGS,
)

# Generate Terraform JSON files
app.synth()
