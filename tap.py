#!/usr/bin/env python
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import TapStack

# Get environment suffix from environment or use default
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")

# Calculate the stack name
stack_name = f"tap-{environment_suffix}"

app = App()

# Create the TapStack with environment suffix
TapStack(
    app,
    stack_name,
    environment_suffix=environment_suffix
)

# Synthesize the app to generate the Terraform configuration
app.synth()
