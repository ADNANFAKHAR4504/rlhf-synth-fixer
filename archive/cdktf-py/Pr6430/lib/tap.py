#!/usr/bin/env python
"""
Production EKS Cluster Deployment - CDKTF Entry Point

This is the main entry point for the CDKTF application that creates
a production-ready Amazon EKS cluster infrastructure.

Platform: CDKTF
Language: Python
Region: us-east-1
"""

import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

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
