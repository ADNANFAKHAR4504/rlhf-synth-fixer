#!/usr/bin/env python
import sys
import os
from datetime import datetime, timezone

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import TapStack

# Get environment variables
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
state_bucket = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
primary_region = os.getenv("PRIMARY_REGION", "us-east-1")
secondary_region = os.getenv("SECONDARY_REGION", "us-west-2")

# Create app
app = App()

# Stack name
stack_name = f"TapStack{environment_suffix}"

# Create the unified TapStack
TapStack(
    app,
    stack_name,
    environment_suffix=environment_suffix,
    state_bucket=state_bucket,
    state_bucket_region=state_bucket_region,
    primary_region=primary_region,
    secondary_region=secondary_region
)

# Synthesize
app.synth()
