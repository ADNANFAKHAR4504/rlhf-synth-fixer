#!/usr/bin/env python
"""Main CDKTF application entry point."""

import os
from cdktf import App
from lib.tap_stack import TapStack


def main():
    """Initialize and synthesize CDKTF application."""
    app = App()

    # Get environment configuration
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
    aws_region = os.environ.get('AWS_REGION', 'us-east-1')
    state_bucket = os.environ.get('TERRAFORM_STATE_BUCKET', 'iac-rlhf-tf-states')
    state_bucket_region = os.environ.get('TERRAFORM_STATE_BUCKET_REGION', 'us-east-1')

    # Default tags for all resources
    default_tags = {
        'Environment': environment_suffix,
        'Owner': 'DevOps',
        'CostCenter': 'Engineering',
        'ManagedBy': 'CDKTF',
        'Project': 'ComplianceValidator'
    }

    # Create TAP stack
    TapStack(
        app,
        f"TapStack{environment_suffix}",
        environment_suffix=environment_suffix,
        aws_region=aws_region,
        state_bucket=state_bucket,
        state_bucket_region=state_bucket_region,
        default_tags=default_tags
    )

    app.synth()


if __name__ == '__main__':
    main()
