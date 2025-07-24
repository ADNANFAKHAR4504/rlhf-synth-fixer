#!/usr/bin/env python
from cdktf import App, S3Backend
from tap_stack import TapStack
import os

# -----------------------------------------------------------------------------
# Required variables for CI/CD and local development
# These can be set as environment variables or replaced directly in code.
# -----------------------------------------------------------------------------
# Example usage in CI/CD:
#   export TF_STATE_BUCKET=iac-rlhf-tf-states
#   export TF_STATE_KEY=iac-tfstate-pr48/state.json
#   export TF_STATE_REGION=us-east-1

TF_STATE_BUCKET = os.getenv("TF_STATE_BUCKET", "iac-rlhf-tf-states")
TF_STATE_KEY = os.getenv("TF_STATE_KEY", "iac-tfstate-pr48/state.json")  # Update per PR/task
TF_STATE_REGION = os.getenv("TF_STATE_REGION", "us-east-1")

app = App()

# -----------------------------------------------------------------------------
# Configure the S3 remote backend for Terraform state
# In CI/CD, these values should be injected via environment variables.
# -----------------------------------------------------------------------------
backend = S3Backend(
    app,
    bucket=TF_STATE_BUCKET,
    key=TF_STATE_KEY,
    region=TF_STATE_REGION,
    encrypt=True,
)

# Use escape hatch to set use_lockfile to true
backend.add_override("use_lockfile", True)

# -----------------------------------------------------------------------------
# Instantiate the main stack
# -----------------------------------------------------------------------------
TapStack(app, "cdktf-py")

app.synth()

# -----------------------------------------------------------------------------
# Helpful tips:
# - To change the state file location, set TF_STATE_KEY before running synth/deploy.
# - For multiple environments, use different TF_STATE_KEYs (e.g., per PR or branch).
# - For local testing, you can hardcode or export these variables.
# -----------------------------------------------------------------------------