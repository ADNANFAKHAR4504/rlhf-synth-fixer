#!/usr/bin/env python
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import TapStack

# Get environment variables or use defaults
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
workspace = os.getenv("TERRAFORM_WORKSPACE", "dev")

app = App()

# Deploy infrastructure across three regions with non-overlapping CIDR blocks
regions_config = [
    {"region": "us-east-1", "cidr": "10.0.0.0/16"},
    {"region": "us-east-2", "cidr": "10.1.0.0/16"},
    {"region": "eu-west-1", "cidr": "10.2.0.0/16"}
]

for config in regions_config:
    region = config["region"]
    cidr_block = config["cidr"]

    # Create regional stack with workspace-based environment suffix
    TapStack(
        app,
        f"tap-stack-{region}",
        region=region,
        cidr_block=cidr_block,
        environment_suffix=f"{workspace}-{region}"
    )

# Synthesize the app to generate Terraform configuration
app.synth()
