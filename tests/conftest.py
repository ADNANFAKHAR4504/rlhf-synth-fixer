"""Pytest configuration and fixtures for TapStack tests."""
import json
import os

import pytest


@pytest.fixture(scope="session")
def aws_region():
    """Returns the AWS region for tests."""
    return os.environ.get("AWS_REGION", "us-east-1")


@pytest.fixture(scope="session")
def environment_suffix():
    """Returns the environment suffix for resource naming."""
    return os.environ.get("ENVIRONMENT_SUFFIX", "dev")


@pytest.fixture(scope="session")
def deployment_outputs():
    """Load deployment outputs from CFN outputs file."""
    outputs_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "cfn-outputs",
        "flat-outputs.json"
    )
    if os.path.exists(outputs_path):
        with open(outputs_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line("markers", "unit: mark test as a unit test")
    config.addinivalue_line("markers", "integration: mark test as an integration test")
    config.addinivalue_line("markers", "live: mark test as requiring live AWS resources")
