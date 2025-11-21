"""Pytest configuration and fixtures."""
import os
import pytest


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Set up test environment variables before any tests run."""
    # Set environment variables required by Lambda handler
    os.environ['ENVIRONMENT'] = 'test'
    os.environ['DYNAMODB_TABLE_NAME'] = 'test-table'
    os.environ['S3_BUCKET_NAME'] = 'test-bucket'
    os.environ['SSM_API_KEY_PARAM'] = '/test/api-key'
    os.environ['SSM_CONNECTION_STRING_PARAM'] = '/test/connection-string'
    os.environ['REGION'] = 'us-east-1'

    yield

    # Cleanup after tests
    for key in ['ENVIRONMENT', 'DYNAMODB_TABLE_NAME', 'S3_BUCKET_NAME',
                'SSM_API_KEY_PARAM', 'SSM_CONNECTION_STRING_PARAM', 'REGION']:
        os.environ.pop(key, None)
