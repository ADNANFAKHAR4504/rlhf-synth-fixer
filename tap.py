#!/usr/bin/env python
"""Blue-Green Deployment Infrastructure Entry Point"""
from cdktf import App
from lib.tap_stack import TapStack
import os

app = App()
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
TapStack(app, f"TapStack{environment_suffix}")
app.synth()
