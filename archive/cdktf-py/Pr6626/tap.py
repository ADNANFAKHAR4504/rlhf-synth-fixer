#!/usr/bin/env python
from cdktf import App
from lib.tap_stack import TradingPlatformStack
import os

app = App()

# Get environment suffix
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX") or os.getenv("TF_WORKSPACE") or "dev"

# AWS environment configuration
region = os.getenv("AWS_REGION") or "us-east-1"

# Repository metadata
repository_name = os.getenv("REPOSITORY", "unknown")
commit_author = os.getenv("COMMIT_AUTHOR", "unknown")

# Main stack
TradingPlatformStack(
    app,
    f"TapStack{environment_suffix}",
    region=region,
    environment_suffix=environment_suffix
)

app.synth()
