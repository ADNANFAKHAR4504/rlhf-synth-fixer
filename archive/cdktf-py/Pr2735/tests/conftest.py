"""Pytest configuration and fixtures for CDKTF tests."""

import pytest
from cdktf import App


@pytest.fixture(scope="function")
def app():
    """Create a new CDKTF App for each test."""
    return App()


@pytest.fixture(scope="function")
def default_stack_props():
    """Default stack properties for testing."""
    return {
        "environment_suffix": "test",
        "aws_region": "us-east-1",
        "state_bucket": "test-tf-state-bucket",
        "state_bucket_region": "us-east-1",
        "default_tags": {
            "tags": {
                "Environment": "Production",
                "Department": "IT",
                "Repository": "test-repo",
                "Author": "test-author"
            }
        }
    }


@pytest.fixture(scope="session")
def aws_region():
    """AWS region for testing."""
    return "us-east-1"


@pytest.fixture(scope="session")
def environment_suffix():
    """Environment suffix for testing."""
    return "test"
