"""
conftest.py

Shared pytest configuration and fixtures for all tests.
"""

import json
import os
from unittest.mock import Mock, patch

import pytest


@pytest.fixture
def mock_aws_credentials():
  """Mock AWS credentials for testing."""
  with patch.dict(os.environ, {
      'AWS_ACCESS_KEY_ID': 'testing',
      'AWS_SECRET_ACCESS_KEY': 'testing',
      'AWS_SECURITY_TOKEN': 'testing',
      'AWS_SESSION_TOKEN': 'testing',
      'AWS_DEFAULT_REGION': 'us-east-1'
  }):
    yield


@pytest.fixture
def sample_lambda_event():
  """Sample Lambda event for testing."""
  return {
    'httpMethod': 'GET',
    'path': '/',
    'headers': {
      'Content-Type': 'application/json',
      'User-Agent': 'pytest'
    },
    'queryStringParameters': None,
    'pathParameters': None,
    'body': None,
    'isBase64Encoded': False,
    'requestContext': {
      'requestId': 'test-request-id',
      'stage': 'test',
      'resourcePath': '/',
      'httpMethod': 'GET',
      'identity': {
        'sourceIp': '127.0.0.1'
      }
    }
  }


@pytest.fixture
def sample_lambda_context():
  """Sample Lambda context for testing."""
  context = Mock()
  context.function_name = 'test-function'
  context.function_version = '$LATEST'
  context.invoked_function_arn = 'arn:aws:lambda:us-east-1:123456789012:function:test-function'
  context.memory_limit_in_mb = '512'
  context.remaining_time_in_millis = lambda: 30000
  context.log_group_name = '/aws/lambda/test-function'
  context.log_stream_name = '2024/01/01/[$LATEST]test-stream'
  context.aws_request_id = 'test-request-id'
  return context


@pytest.fixture
def sample_tap_stack_args():
  """Sample TapStackArgs for testing."""
  try:
    from lib.tap_stack import TapStackArgs  # pylint: disable=import-outside-toplevel
    return TapStackArgs(
      environment_suffix="test",
      region="us-east-1",
      tags={"TestTag": "TestValue"}
    )
  except ImportError:
    # Return None if Pulumi dependencies aren't available
    return None


@pytest.fixture
def mock_pulumi_output():
  """Mock Pulumi Output for testing."""
  mock_output = Mock()
  mock_output.apply = Mock(return_value=Mock())
  mock_output.concat = Mock(return_value=Mock())
  return mock_output


@pytest.fixture
def sample_deployment_outputs():
  """Sample deployment outputs for integration testing."""
  return {
    'api_gateway_url': 'https://test-api-id.execute-api.us-east-1.amazonaws.com/test',
    'lambda_function_name': 'tap-api-handler-test',
    'lambda_function_arn': 'arn:aws:lambda:us-east-1:123456789012:function:tap-api-handler-test',
    'api_gateway_id': 'test-api-id',
    'cloudwatch_log_group': '/aws/lambda/tap-api-handler-test',
    'environment_suffix': 'test',
    'lambda_role_arn': 'arn:aws:iam::123456789012:role/lambda-execution-role-test',
    'region': 'us-east-1',
    'memory_size': 512,
    'timeout': 60,
    'runtime': 'python3.12'
  }


@pytest.fixture
def temp_outputs_file(tmp_path):
  """Create temporary outputs file for integration testing."""
  sample_outputs = {
    'api_gateway_url': 'https://test-api-id.execute-api.us-east-1.amazonaws.com/test',
    'lambda_function_name': 'tap-api-handler-test',
    'lambda_function_arn': 'arn:aws:lambda:us-east-1:123456789012:function:tap-api-handler-test',
    'api_gateway_id': 'test-api-id',
    'cloudwatch_log_group': '/aws/lambda/tap-api-handler-test',
    'environment_suffix': 'test',
    'lambda_role_arn': 'arn:aws:iam::123456789012:role/lambda-execution-role-test',
    'region': 'us-east-1',
    'memory_size': 512,
    'timeout': 60,
    'runtime': 'python3.12'
  }
  
  outputs_dir = tmp_path / "cfn-outputs"
  outputs_dir.mkdir()

  outputs_file = outputs_dir / "flat-outputs.json"
  outputs_file.write_text(json.dumps(sample_outputs))

  # Patch the file path in tests
  with patch('os.path.exists') as mock_exists:
    mock_exists.return_value = True
    with patch('builtins.open', create=True) as mock_open:
      mock_open.return_value.__enter__.return_value.read.return_value = json.dumps(sample_outputs)
      yield str(outputs_file)


# Pytest collection hooks
def pytest_configure(config):
  """Configure pytest with custom markers."""
  config.addinivalue_line("markers", "slow: mark test as slow")
