"""
conftest.py

Common test configuration and fixtures for TapStack tests.
"""

import pytest
import os
import boto3
import pulumi
from unittest.mock import MagicMock

# Default test configuration
DEFAULT_TEST_CONFIG = {
    'environment_suffix': 'test',
    'region': 'us-east-1',
    'account_id': '123456789012'
}


@pytest.fixture(scope="session")
def aws_region():
    """Provide AWS region for tests."""
    return os.getenv('AWS_REGION', DEFAULT_TEST_CONFIG['region'])


@pytest.fixture(scope="session") 
def environment_suffix():
    """Provide environment suffix for tests."""
    return os.getenv('ENVIRONMENT_SUFFIX', DEFAULT_TEST_CONFIG['environment_suffix'])


@pytest.fixture(scope="session")
def test_config():
    """Provide complete test configuration."""
    return {
        'environment_suffix': os.getenv('ENVIRONMENT_SUFFIX', DEFAULT_TEST_CONFIG['environment_suffix']),
        'region': os.getenv('AWS_REGION', DEFAULT_TEST_CONFIG['region']),
        'account_id': DEFAULT_TEST_CONFIG['account_id'],
        'providers': ['stripe', 'paypal', 'square'],
        'payment_thresholds': ['small', 'medium', 'large', 'xlarge']
    }


@pytest.fixture(scope="function")
def aws_clients(aws_region):
    """Provide AWS service clients for tests."""
    return {
        'dynamodb': boto3.resource('dynamodb', region_name=aws_region),
        'sqs': boto3.client('sqs', region_name=aws_region),
        'lambda': boto3.client('lambda', region_name=aws_region),
        'events': boto3.client('events', region_name=aws_region),
        'cloudwatch': boto3.client('cloudwatch', region_name=aws_region),
        'sns': boto3.client('sns', region_name=aws_region),
        'apigateway': boto3.client('apigateway', region_name=aws_region)
    }


@pytest.fixture(scope="function") 
def mock_pulumi_outputs():
    """Provide mock Pulumi stack outputs for tests."""
    environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'test')
    region = os.getenv('AWS_REGION', 'us-east-1')
    
    return {
        'api_gateway_endpoint': f'https://api123.execute-api.{region}.amazonaws.com/prod',
        'api_key_id': 'test-api-key-id',
        'dynamodb_table_name': f'webhook-processing-{environment_suffix}',
        'eventbridge_bus_name': f'payment-events-{environment_suffix}',
        'sns_topic_arn': f'arn:aws:sns:{region}:123456789012:webhook-alerts-{environment_suffix}'
    }


@pytest.fixture(scope="function")
def test_webhook_payload():
    """Provide sample webhook payload for tests."""
    import time
    return {
        'id': f'test-webhook-{int(time.time())}',
        'type': 'payment.succeeded',
        'amount': 100,
        'currency': 'usd',
        'created': int(time.time()),
        'object': 'event'
    }


@pytest.fixture(scope="function", autouse=True)
def reset_environment():
    """Reset environment variables after each test."""
    original_env = dict(os.environ)
    yield
    os.environ.clear()
    os.environ.update(original_env)


class MockPulumiResource:
    """Mock Pulumi resource for testing."""
    
    def __init__(self, resource_type, name, **kwargs):
        self.resource_type = resource_type
        self.name = name
        self.id = f"{name}-{hash(name) % 10000}"
        self.arn = self._generate_arn()
        
        # Set additional attributes from kwargs
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    def _generate_arn(self):
        """Generate mock ARN for the resource."""
        region = os.getenv('AWS_REGION', 'us-east-1')
        account_id = '123456789012'
        
        arn_mappings = {
            'dynamodb': f'arn:aws:dynamodb:{region}:{account_id}:table/{self.name}',
            'sqs': f'arn:aws:sqs:{region}:{account_id}:{self.name}',
            'lambda': f'arn:aws:lambda:{region}:{account_id}:function:{self.name}',
            'sns': f'arn:aws:sns:{region}:{account_id}:{self.name}',
            'events': f'arn:aws:events:{region}:{account_id}:event-bus/{self.name}',
            'apigateway': f'arn:aws:apigateway:{region}::{self.resource_type.split("/")[1]}/{self.id}'
        }
        
        service = self.resource_type.split('/')[0].replace('aws:', '')
        return arn_mappings.get(service, f'arn:aws:{service}:{region}:{account_id}:{self.name}')


@pytest.fixture(scope="function")
def mock_resource_factory():
    """Factory for creating mock Pulumi resources."""
    return MockPulumiResource


def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests (may be slow)"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )
    config.addinivalue_line(
        "markers", "aws: marks tests that require AWS credentials"
    )


def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers automatically."""
    for item in items:
        # Add unit marker to unit tests
        if "unit" in str(item.fspath):
            item.add_marker(pytest.mark.unit)
        
        # Add integration marker to integration tests
        if "integration" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
            item.add_marker(pytest.mark.aws)


@pytest.fixture(scope="session")
def check_aws_credentials():
    """Check if AWS credentials are available for integration tests."""
    try:
        boto3.Session().get_credentials()
        return True
    except Exception:
        return False