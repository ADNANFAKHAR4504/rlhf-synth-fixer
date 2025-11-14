#!/usr/bin/env python
"""Entry point for CDKTF application."""

import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App  # pylint: disable=wrong-import-position
from lib.main import PaymentProcessingStack  # pylint: disable=wrong-import-position

# Get environment suffix from environment variable or use default
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")

# Create CDKTF app
app = App()

# Create the payment processing stack
PaymentProcessingStack(app, f"TapStack{environment_suffix}", environment_suffix=environment_suffix)

# Synthesize the app
app.synth()
