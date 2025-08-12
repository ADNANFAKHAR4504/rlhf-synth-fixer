#!/usr/bin/env python
"""
Main application file for TAP infrastructure deployment.

This file creates and synthesizes the CDKTF application with the TapStack
containing AWS infrastructure including VPC, subnets, NAT Gateway, EC2 instances,
and security groups with S3 backend for remote state management.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App, S3Backend
from lib.tap_stack import TapStack

# Get environment variables from the environment or use defaults
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
state_bucket = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
aws_region = os.getenv("AWS_REGION", "us-east-1")
repository_name = os.getenv("REPOSITORY", "unknown")
commit_author = os.getenv("COMMIT_AUTHOR", "unknown")

# Calculate the stack name
stack_name = f"TapStack{environment_suffix}"

# default_tags is structured in adherence to the AwsProvider default_tags interface
default_tags = {
  "tags": {
    "Environment": environment_suffix,
    "Repository": repository_name,
    "Author": commit_author,
  }
}

app = App()

# Create the TapStack with the calculated properties
stack = TapStack(
  app,
  stack_name,
  environment_suffix=environment_suffix,
  aws_region=aws_region,
  default_tags=default_tags,
)

# Configure S3 backend for remote state management
S3Backend(
  stack,
  bucket=state_bucket,
  key=f"tap-infrastructure/{environment_suffix}/terraform.tfstate",
  region=state_bucket_region,
  dynamodb_table="terraform-state-lock",
  encrypt=True
)

# Synthesize the app to generate the Terraform configuration
app.synth()