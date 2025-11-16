#!/usr/bin/env python3
"""
Production EKS Cluster Deployment - CDKTF Entry Point

Platform: CDKTF
Language: Python
Region: us-east-1
"""

import sys
import os

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lib'))

from cdktf import App
from tap_stack import TapStack

# Get environment suffix from environment or use default
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")

# Create CDKTF App
app = App()

# Create the TapStack
TapStack(
    app,
    f"TapStack{environment_suffix}",
    environment_suffix=environment_suffix
)

# Synthesize the app to generate the Terraform configuration
app.synth()
