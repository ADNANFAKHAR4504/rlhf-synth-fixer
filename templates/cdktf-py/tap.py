#!/usr/bin/env python
from cdktf import App
from tap_stack import TapStack
import os

# -----------------------------------------------------------------------------
# Get environment variables or use defaults
# -----------------------------------------------------------------------------
ENVIRONMENT_SUFFIX = os.getenv("ENVIRONMENT_SUFFIX", "dev")
TF_STATE_BUCKET = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
TF_STATE_REGION = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
REPOSITORY_NAME = os.getenv("REPOSITORY", "unknown")
COMMIT_AUTHOR = os.getenv("COMMIT_AUTHOR", "unknown")

# Calculate the stack name
STACK_NAME = f"TapStack{ENVIRONMENT_SUFFIX}"

# Default tags for AWS resources
DEFAULT_TAGS = {
    "Environment": ENVIRONMENT_SUFFIX,
    "Repository": REPOSITORY_NAME,
    "Author": COMMIT_AUTHOR,
}

app = App()

# -----------------------------------------------------------------------------
# Instantiate the main stack with dynamic configuration
# -----------------------------------------------------------------------------
TapStack(
    app,
    STACK_NAME,
    environment_suffix=ENVIRONMENT_SUFFIX,
    state_bucket=TF_STATE_BUCKET,
    state_bucket_region=TF_STATE_REGION,
    aws_region=AWS_REGION,
    default_tags=DEFAULT_TAGS,
)

app.synth()

# -----------------------------------------------------------------------------
# Helpful tips:
# - To change the state file location, set TF_STATE_KEY before running synth/deploy.
# - For multiple environments, use different TF_STATE_KEYs (e.g., per PR or branch).
# - For local testing, you can hardcode or export these variables.
# -----------------------------------------------------------------------------