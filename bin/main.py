#!/usr/bin/env python3
import os
import sys

# Add the project root to Python path for module imports
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from cdktf import App
from lib.tap_stack import TapStack

app = App()

environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")

TapStack(
    app,
    "trading-platform-failover",
    environment_suffix=environment_suffix,
    primary_region="us-east-1",
    secondary_region="us-east-2"
)

app.synth()
