#!/usr/bin/env python
"""Main entry point for CDKTF Python TAP infrastructure."""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App

from lib.tap_stack import TapStack


def main():
  """Main function to create and synthesize the CDKTF app."""
  # Get environment variables from the environment or use defaults
  environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
  state_bucket = os.getenv("TERRAFORM_STATE_BUCKET")
  state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION")
  aws_region = os.getenv("AWS_REGION")

  # Calculate the stack name
  stack_name = f"TapStack{environment_suffix}"

  app = App()

  # Create the TapStack with the calculated properties
  TapStack(
    app,
    stack_name,
    environment_suffix=environment_suffix,
    state_bucket=state_bucket,
    state_bucket_region=state_bucket_region,
    aws_region=aws_region,
  )

  # Synthesize the app to generate the Terraform configuration
  app.synth()


if __name__ == "__main__":
  main()