#!/usr/bin/env python3

"""
Entry point for CDKTF application that synthesizes the serverless infrastructure stack.
This file initializes the CDK app and instantiates our main stack.
"""

import os
from cdktf import App
from lib.tap_stack import TapStack

def main():
  """
  Main function that creates the CDKTF app and synthesizes the stack.
  """
  # Initialize the CDKTF application
  app = App()

  # Get environment suffix from env var or use default
  environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")

  # Create our main serverless infrastructure stack
  # Deploy to us-west-2 region as specified in requirements
  TapStack(
    app,
    "tap-serverless-stack",
    aws_region="us-west-2",
    environment_suffix=environment_suffix,
    state_bucket_region="us-east-1",
    state_bucket="iac-rlhf-tf-states",
    default_tags={
      "Project": "TAP",
      "Environment": environment_suffix,
      "ManagedBy": "CDKTF"
    }
  )

  # Synthesize the Terraform configuration
  app.synth()

if __name__ == "__main__":
  main()
