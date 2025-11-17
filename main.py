#!/usr/bin/env python3
import os
from cdktf import App
from fraud_detection_stack import FraudDetectionStack

app = App()
# Get environment suffix from environment variable or default to "dev"
environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
FraudDetectionStack(app, "fraud-detection", environment_suffix=environment_suffix)
app.synth()
