#!/usr/bin/env python
"""CDKTF Application Entry Point"""

from cdktf import App
from lib.tap_stack import TapStack

app = App()
TapStack(app, "vpc-peering-cross-account")
app.synth()
