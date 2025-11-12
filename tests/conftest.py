"""
Pytest configuration for unit tests
"""
import pytest
from unittest.mock import Mock, patch
import os


@pytest.fixture(scope="session", autouse=True)
def mock_aws_region():
    """Mock AWS region for boto3"""
    with patch.dict(os.environ, {'AWS_DEFAULT_REGION': 'us-east-1'}):
        yield


@pytest.fixture
def mock_backend_setup():
    """Mock the setup_backend_infrastructure method to avoid real AWS calls during tests"""
    with patch('lib.tap_stack.TapStack.setup_backend_infrastructure', return_value=None):
        yield


@pytest.fixture
def mock_lambda_bundle():
    """Mock the bundle_lambda_code method to avoid creating actual zip files during tests"""
    # Return tuple: (zip_path, source_hash)
    with patch('lib.tap_stack.TapStack.bundle_lambda_code', return_value=('lambda_function.zip', 'mockhash123')):
        yield


@pytest.fixture
def mock_boto3():
    """Mock boto3 clients for Lambda tests"""
    with patch('boto3.client') as mock_client, \
         patch('boto3.resource') as mock_resource:

        # Setup mocks
        mock_s3_client = Mock()
        mock_dynamodb_resource = Mock()

        mock_client.return_value = mock_s3_client
        mock_resource.return_value = mock_dynamodb_resource

        yield {
            's3': mock_s3_client,
            'dynamodb': mock_dynamodb_resource,
            'boto_client': mock_client,
            'boto_resource': mock_resource
        }
