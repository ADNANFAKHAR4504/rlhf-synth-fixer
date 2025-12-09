#!/usr/bin/env python3
"""
CDKTF Application Entry Point for Zero Trust Security Framework

This file is the main entry point for synthesizing the CDKTF application.
"""
import os
import sys

# Add the project root to the Python path to enable imports from lib/
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from cdktf import App
from lib.tap_stack import TapStack


def main():
    """Main function to create and synthesize the CDKTF application"""
    app = App()

    # Get environment configuration from environment variables
    environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
    aws_region = os.getenv("AWS_REGION", "us-east-1")
    state_bucket = os.getenv("TERRAFORM_STATE_BUCKET", f"cdktf-state-{aws_region}")
    state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", aws_region)

    # Default tags for all resources
    default_tags = {
        "ManagedBy": "CDKTF",
        "Environment": environment_suffix,
        "Project": "ZeroTrust",
    }

    # Create the main stack
    TapStack(
        app,
        f"TapStack{environment_suffix}",
        environment_suffix=environment_suffix,
        state_bucket=state_bucket,
        state_bucket_region=state_bucket_region,
        aws_region=aws_region,
        default_tags=default_tags,
    )

    app.synth()


if __name__ == "__main__":
    main()
