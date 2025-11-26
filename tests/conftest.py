"""Pytest configuration and fixtures for infrastructure tests."""

import pytest
import json
import os
from cdktf import Testing


@pytest.fixture(scope="session")
def environment_suffix():
    """Return the environment suffix for testing."""
    return os.getenv("ENVIRONMENT_SUFFIX", "test")


@pytest.fixture(scope="session")
def aws_region():
    """Return the AWS region for testing."""
    return os.getenv("AWS_REGION", "us-east-1")


@pytest.fixture
def stack_config(environment_suffix, aws_region):
    """Return stack configuration for testing."""
    return {
        "environment_suffix": environment_suffix,
        "aws_region": aws_region,
        "state_bucket": "test-state-bucket",
        "state_bucket_region": aws_region,
        "default_tags": {
            "tags": {
                "Environment": environment_suffix,
                "Repository": "test-repo",
                "Team": "test-team"
            }
        }
    }


@pytest.fixture
def microservices():
    """Return list of microservices."""
    return ["api-service", "auth-service", "notification-service"]
