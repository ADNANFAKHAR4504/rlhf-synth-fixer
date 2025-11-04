#!/usr/bin/env python
"""CDKTF Application Entry Point."""

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cdktf import App
from lib.tap_stack import TapStack

# Get configuration from environment
environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
aws_region = os.environ.get("AWS_REGION", "ap-southeast-1")
state_bucket = os.environ.get("STATE_BUCKET", "iac-rlhf-tf-states")
state_bucket_region = os.environ.get("STATE_BUCKET_REGION", "us-east-1")

# Default tags
default_tags = {
    "ManagedBy": "CDKTF",
    "Project": "TAP",
    "Repository": os.environ.get("REPOSITORY", "iac-test-automations")
}

# Create CDKTF app
app = App()

# Create stack
TapStack(
    app,
    f"TapStack{environment_suffix}",
    environment_suffix=environment_suffix,
    aws_region=aws_region,
    state_bucket=state_bucket,
    state_bucket_region=state_bucket_region,
    default_tags=default_tags
)

# Synthesize
app.synth()
