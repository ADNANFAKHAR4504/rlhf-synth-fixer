#!/usr/bin/env python
"""Entry point for CDKTF VPC Infrastructure deployment."""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import TapStack

# Get environment suffix from environment variable or use default
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "test-12345")

app = App()

# Create the TapStack with environment suffix
TapStack(app, "tap", environment_suffix=environment_suffix)

# Synthesize the app to generate the Terraform configuration
app.synth()