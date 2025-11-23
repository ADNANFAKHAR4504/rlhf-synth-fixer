#!/usr/bin/env python
import os
from cdktf import App
from stacks.observability_stack import ObservabilityStack

app = App()
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
ObservabilityStack(app, "observability-platform", environment_suffix=environment_suffix)
app.synth()
