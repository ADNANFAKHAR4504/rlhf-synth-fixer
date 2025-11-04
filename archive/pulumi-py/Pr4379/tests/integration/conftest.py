"""
IoT Manufacturing Platform Integration Test Configuration.

Provides pytest fixtures and configuration for integration testing of the 
TapStack IoT platform infrastructure.
"""

import json
import os
from typing import Any, Dict
from unittest.mock import patch

import boto3
import pytest


@pytest.fixture(scope="session")
def aws_region():
    """AWS region for testing."""
    return os.getenv('AWS_REGION', 'us-east-1')


@pytest.fixture(scope="session") 
def deployment_outputs():
    """Load deployment outputs from flat file."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    outputs_path = os.path.join(base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json')
    
    if os.path.exists(outputs_path):
        try:
            with open(outputs_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if content:
                    return json.loads(content)
        except (json.JSONDecodeError, IOError):
            pass
    
    return {}


@pytest.fixture(scope="session")
def aws_session(aws_region):
    """AWS session for integration tests."""
    return boto3.Session(region_name=aws_region)


@pytest.fixture(scope="session")
def aws_clients(aws_session):
    """Dictionary of AWS service clients."""
    return {
        'ec2': aws_session.client('ec2'),
        'ecs': aws_session.client('ecs'),
        'kinesis': aws_session.client('kinesis'),
        'elasticache': aws_session.client('elasticache'),
        'rds': aws_session.client('rds'),
        'efs': aws_session.client('efs'),
        'apigateway': aws_session.client('apigatewayv2'),
        'secretsmanager': aws_session.client('secretsmanager'),
        'kms': aws_session.client('kms'),
        'cloudwatch': aws_session.client('logs'),
        'sts': aws_session.client('sts')
    }


@pytest.fixture(scope="session")
def validate_aws_credentials(aws_clients):
    """Validate that AWS credentials are properly configured."""
    try:
        identity = aws_clients['sts'].get_caller_identity()
        return identity
    except Exception as e:
        pytest.skip(f"AWS credentials not available: {e}")


@pytest.fixture(scope="function")
def mock_aws_environment():
    """Mock AWS environment for testing without real AWS resources.
    
    Note: This fixture is provided for completeness but should generally not be used
    in integration tests, which should test against real AWS resources.
    """
    # Import moto mocks only when needed to avoid import errors
    try:
        from moto import (
            mock_ec2, mock_ecs, mock_kinesis, mock_elasticache,
            mock_rds, mock_efs, mock_apigatewayv2, mock_secretsmanager,
            mock_kms, mock_logs
        )
        with mock_ec2(), mock_ecs(), mock_kinesis(), mock_elasticache(), \
             mock_rds(), mock_efs(), mock_apigatewayv2(), mock_secretsmanager(), \
             mock_kms(), mock_logs():
            yield
    except ImportError as e:
        pytest.skip(f"Moto mocking not available: {e}")
        yield


@pytest.fixture(scope="session")
def sample_iot_data():
    """Sample IoT device data for testing data flow."""
    return {
        "deviceId": "iot-device-001",
        "timestamp": 1640995200,  # 2022-01-01 00:00:00 UTC
        "temperature": 23.5,
        "humidity": 65.2,
        "pressure": 1013.25,
        "location": {
            "latitude": 40.7128,
            "longitude": -74.0060
        },
        "status": "online",
        "batteryLevel": 85.0,
        "firmwareVersion": "1.2.3"
    }


@pytest.fixture(scope="session")
def manufacturing_test_data():
    """Sample manufacturing process data for testing."""
    return {
        "processId": "manufacturing-line-001",
        "timestamp": 1640995200,
        "machineId": "press-001",
        "operatorId": "op-123",
        "productionBatch": "batch-2022-001",
        "metrics": {
            "cycleTime": 45.2,
            "temperature": 180.5,
            "pressure": 150.0,
            "qualityScore": 98.5
        },
        "alarms": [],
        "status": "running"
    }


@pytest.fixture
def test_kinesis_records(sample_iot_data, manufacturing_test_data):
    """Test records for Kinesis stream testing."""
    return [
        {
            "Data": json.dumps(sample_iot_data),
            "PartitionKey": sample_iot_data["deviceId"]
        },
        {
            "Data": json.dumps(manufacturing_test_data), 
            "PartitionKey": manufacturing_test_data["processId"]
        }
    ]


@pytest.fixture
def integration_test_config():
    """Configuration for integration tests."""
    return {
        "test_timeout": 30,
        "retry_attempts": 3,
        "retry_delay": 2,
        "expected_shard_count": 4,
        "expected_retention_hours": 24,
        "expected_min_subnets": 4,
        "expected_min_availability_zones": 2,
        "log_retention_days": 30,
        "backup_retention_days": 7
    }


# Skip markers for different test categories
pytestmark = [
    pytest.mark.integration,
    pytest.mark.slow
]


def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "slow: marks tests as slow running"
    )
    config.addinivalue_line(
        "markers", "aws: marks tests that require AWS credentials"
    )
    config.addinivalue_line(
        "markers", "network: marks tests that require network connectivity"
    )


def pytest_collection_modifyitems(config, items):
    """Modify test collection to handle integration test requirements."""
    for item in items:
        # Add integration marker to all tests in integration directory
        if "integration" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
        
        # Add aws marker to tests that use AWS clients
        if any(fixture in item.fixturenames for fixture in ['aws_clients', 'aws_session']):
            item.add_marker(pytest.mark.aws)
        
        # Add network marker to tests that make network requests  
        if any(keyword in item.name.lower() for keyword in ['connectivity', 'endpoint', 'url']):
            item.add_marker(pytest.mark.network)


# Environment variable setup for testing
@pytest.fixture(autouse=True, scope="session")
def setup_test_environment():
    """Setup environment variables for integration testing."""
    test_env = {
        'AWS_DEFAULT_REGION': 'us-east-1',
        'AWS_REGION': 'us-east-1',
        'ENVIRONMENT_SUFFIX': 'test'
    }
    
    with patch.dict(os.environ, test_env):
        yield