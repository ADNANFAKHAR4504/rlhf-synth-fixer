#!/usr/bin/env python3
"""Main entry point for Fraud Detection Infrastructure deployment."""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import FraudDetectionStack

# Get environment variables from the environment or use defaults
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
state_bucket = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
aws_region = os.getenv("AWS_REGION", "us-east-1")
repository_name = os.getenv("REPOSITORY", "unknown")
commit_author = os.getenv("COMMIT_AUTHOR", "unknown")
# DynamoDB locking is optional - only enable if table exists
use_dynamodb_lock = os.getenv("USE_DYNAMODB_LOCK", "false").lower() == "true"

# Calculate the stack name
stack_name = f"FraudDetectionStack{environment_suffix}"

# Create app
app = App()

# Create the FraudDetectionStack
FraudDetectionStack(
    app,
    stack_name,
    environment_suffix=environment_suffix,
    state_bucket=state_bucket,
    state_bucket_region=state_bucket_region,
    aws_region=aws_region,
    use_dynamodb_lock=use_dynamodb_lock
)

# Synthesize the app to generate the Terraform configuration
app.synth()
