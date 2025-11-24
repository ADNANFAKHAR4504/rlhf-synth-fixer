#!/usr/bin/env python
from cdktf import App
from lib.tap_stack import TapStack
import os

app = App()

# Get environment suffix from environment variable or use default
environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")

TapStack(app, "tap", environment_suffix=environment_suffix)

app.synth()
