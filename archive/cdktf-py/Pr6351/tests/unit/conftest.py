"""Pytest configuration for unit tests only."""

import os
import pytest


@pytest.fixture(scope="session", autouse=True)
def mock_aws_credentials():
    """Mock AWS credentials for unit testing to avoid ProfileNotFound errors.
    
    This only affects unit tests. Integration tests use real AWS credentials
    from the CI/CD pipeline or environment.
    """
    # Set fake AWS credentials as environment variables
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"
    
    # Prevent boto3 from trying to load real AWS config for unit tests
    os.environ["AWS_CONFIG_FILE"] = "/dev/null"
    os.environ["AWS_SHARED_CREDENTIALS_FILE"] = "/dev/null"
    
    yield


@pytest.fixture(scope="function", autouse=True)
def reset_test_environment():
    """Reset environment variables before each unit test."""
    # Ensure test environment has required variables
    if "AWS_REGION" not in os.environ:
        os.environ["AWS_REGION"] = "us-east-1"
    if "ENVIRONMENT_SUFFIX" not in os.environ:
        os.environ["ENVIRONMENT_SUFFIX"] = "test"
    
    yield

