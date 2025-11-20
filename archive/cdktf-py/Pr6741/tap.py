#!/usr/bin/env python
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import TapStack

# Get environment variables or use defaults
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
region = os.getenv("AWS_REGION") or "us-east-1"

app = App()

# Create stack with environment suffix
TapStack(
    app,
    f"tap-stack-{region}",
    region=region,
    environment_suffix=environment_suffix
)

# Synthesize the app to generate Terraform configuration
app.synth()
