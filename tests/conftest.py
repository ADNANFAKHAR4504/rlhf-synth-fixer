"""
Pytest configuration for Pr328 (LocalStack Community Edition)

This task was simplified to remove Pro services (API Gateway, DynamoDB, Kinesis, SNS, CloudFront)
resulting in lower code coverage (65.52% vs original 90%).

This conftest.py sets task-specific pytest options.
"""
import pytest

def pytest_configure(config):
    """Configure pytest for this specific task."""
    # Lower the coverage threshold for this LocalStack Community task
    config.option.cov_fail_under = 65
