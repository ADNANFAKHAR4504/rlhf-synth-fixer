#!/usr/bin/env python
from cdktf import App, S3Backend
from tap_stack import TapStack

app = App()

# Configure the S3 remote backend for Terraform state
S3Backend(
    app,
    bucket="iac-rlhf-tf-states",
    key="iac-tfstate-pr48/state.json",  # Change pr48 to your desired state key per environment/task
    region="us-east-1",                 # Update to your bucket's region if different
    encrypt=True
)

TapStack(app, "cdktf-py")

app.synth()