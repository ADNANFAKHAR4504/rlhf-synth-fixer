#!/usr/bin/env python
from cdktf import App
from lib.tap_stack import TradingPlatformStack
import os

app = App()

# Get environment suffix from Terraform workspace or environment variable
environment_suffix = os.getenv("TF_WORKSPACE", os.getenv("ENVIRONMENT_SUFFIX", "dev"))

# Define regions to deploy
regions = ["us-east-1", "us-east-2", "us-west-2"]

# Create a stack for each region
for region in regions:
    stack_id = f"trading-platform-{region.replace('-', '')}-{environment_suffix}"
    TradingPlatformStack(
        app,
        stack_id,
        region=region,
        environment_suffix=environment_suffix
    )

app.synth()
