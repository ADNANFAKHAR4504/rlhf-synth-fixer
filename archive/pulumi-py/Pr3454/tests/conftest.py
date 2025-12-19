"""
Pytest configuration for Pulumi stack unit tests.
"""

import pytest
import sys
import os

# Add lib directory to path for imports
lib_path = os.path.join(os.path.dirname(__file__), '..', '..', 'lib')
if lib_path not in sys.path:
    sys.path.insert(0, lib_path)

@pytest.fixture(autouse=True)
def setup_pulumi_mocks():
    """Auto-setup Pulumi mocks for all tests."""
    import unittest.mock
    
    # Mock common Pulumi functions
    with unittest.mock.patch('pulumi.get_stack', return_value='test-stack'), \
         unittest.mock.patch('pulumi.get_project', return_value='iot-tap-project'):
        yield

@pytest.fixture
def mock_aws_resources():
    """Fixture providing mocked AWS resources."""
    import unittest.mock
    
    mocks = {
        'dynamodb_table': unittest.mock.MagicMock(),
        'kinesis_stream': unittest.mock.MagicMock(),
        's3_bucket': unittest.mock.MagicMock(),
        'lambda_function': unittest.mock.MagicMock(),
        'iot_certificate': unittest.mock.MagicMock(),
        'sns_topic': unittest.mock.MagicMock(),
        'cloudwatch_alarm': unittest.mock.MagicMock()
    }
    
    return mocks

def pytest_configure(config):
    """Configure pytest markers."""
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "slow: marks tests as slow running"
    )