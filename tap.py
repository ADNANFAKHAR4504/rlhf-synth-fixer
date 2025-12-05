#!/usr/bin/env python3
"""Main entry point for the CI/CD Pipeline infrastructure."""

import os
import pulumi
from lib.tap_stack import create_infrastructure


def get_env(key: str, fallback: str = "") -> str:
    """Get environment variable with fallback."""
    return os.environ.get(key, fallback)


# Get environment suffix from environment variable
environment_suffix = get_env("ENVIRONMENT_SUFFIX", "dev")

# Create the infrastructure
stack = create_infrastructure(environment_suffix)

# Export stack outputs
pulumi.export("pipeline_name", stack.pipeline.name)
pulumi.export("artifacts_bucket", stack.artifacts_bucket.bucket)
pulumi.export("ecr_repository_url", stack.ecr_repository.repository_url)
pulumi.export("sns_topic_arn", stack.sns_topic.arn)
pulumi.export("kms_key_id", stack.kms_key.id)
