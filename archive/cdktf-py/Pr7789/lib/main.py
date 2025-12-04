#!/usr/bin/env python
"""CDKTF Application Entry Point"""

import os
from cdktf import App
from lib.tap_stack import TapStack

app = App()

# Read environment suffix from environment variable or use default
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

TapStack(app, "vpc-peering-cross-account", environment_suffix=environment_suffix)
app.synth()
