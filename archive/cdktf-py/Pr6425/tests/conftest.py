"""Pytest configuration and shared fixtures for TAP Stack tests"""
import os
import pytest


def pytest_addoption(parser):
    """Add custom command line options"""
    parser.addoption(
        "--environment",
        action="store",
        default="test",
        help="Environment suffix for integration tests (default: test)"
    )
    parser.addoption(
        "--aws-region",
        action="store",
        default="us-east-1",
        help="AWS region for integration tests (default: us-east-1)"
    )
    parser.addoption(
        "--skip-slow",
        action="store_true",
        default=False,
        help="Skip slow tests"
    )


def pytest_configure(config):
    """Configure custom markers"""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '--skip-slow')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )


def pytest_collection_modifyitems(config, items):
    """Modify test collection based on command line options"""
    if config.getoption("--skip-slow"):
        skip_slow = pytest.mark.skip(reason="Skipping slow tests (--skip-slow flag)")
        for item in items:
            if "slow" in item.keywords:
                item.add_marker(skip_slow)


@pytest.fixture(scope="session")
def test_environment():
    """Get test environment suffix"""
    return os.getenv("ENVIRONMENT_SUFFIX", "test")


@pytest.fixture(scope="session")
def test_aws_region():
    """Get test AWS region"""
    return os.getenv("AWS_REGION", "us-east-1")


@pytest.fixture(scope="session")
def test_config(test_environment, test_aws_region):
    """Get test configuration"""
    return {
        "environment_suffix": test_environment,
        "aws_region": test_aws_region,
        "state_bucket": os.getenv("TERRAFORM_STATE_BUCKET", "test-bucket"),
        "state_bucket_region": os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1"),
    }

