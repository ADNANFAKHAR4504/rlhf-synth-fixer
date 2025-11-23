#!/usr/bin/env python
from cdktf import App
from lib.tap_stack import TapStack

app = App()
TapStack(app, "tap", environment_suffix="prod")
app.synth()
