#!/usr/bin/env python3
import os
from cdktf import App
from lib.tap_stack import TapStack

app = App()
environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
TapStack(app, f"TapStack{environment_suffix}", environment_suffix=environment_suffix)
app.synth()
