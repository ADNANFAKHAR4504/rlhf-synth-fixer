"""
utils.py

Test utilities and helper functions.
"""

import json
from typing import Dict, Any, Optional
from unittest.mock import Mock, patch


class MockPulumiResource:
  """Mock Pulumi resource for testing."""

  def __init__(self, name: str, resource_type: str, **kwargs):
    self.name = name
    self.resource_type = resource_type
    self.arn = f"arn:aws:{resource_type}:us-east-1:123456789012:{resource_type}/{name}"
    self.id = f"{name}-id"

    # Set any additional attributes
    for key, value in kwargs.items():
      setattr(self, key, value)


class MockPulumiStack:
  """Mock Pulumi stack for testing stack creation."""

  def __init__(self):
    self.resources = {}
    self.outputs = {}

  def add_resource(self, name: str, resource_type: str, **kwargs):
    """Add a mock resource to the stack."""
    resource = MockPulumiResource(name, resource_type, **kwargs)
    self.resources[name] = resource
    return resource

  def register_outputs(self, outputs: Dict[str, Any]):
    """Register stack outputs."""
    self.outputs.update(outputs)


class TestDataFactory:
  """Factory for creating test data."""

  @staticmethod
  def create_lambda_event(
      method: str = "GET",
      path: str = "/",
      body: Optional[str] = None,
      headers: Optional[Dict[str, str]] = None,
      query_params: Optional[Dict[str, str]] = None
  ) -> Dict[str, Any]:
    """Create a Lambda event for testing."""
    return {
      'httpMethod': method,
      'path': path,
      'headers': headers or {},
      'queryStringParameters': query_params,
      'pathParameters': None,
      'body': body,
      'isBase64Encoded': False,
      'requestContext': {
        'requestId': 'test-request-id',
        'stage': 'test',
        'resourcePath': path,
        'httpMethod': method,
        'identity': {'sourceIp': '127.0.0.1'}
      }
    }

  @staticmethod
  def create_api_response(
      status_code: int = 200,
      body: Optional[Dict[str, Any]] = None,
      headers: Optional[Dict[str, str]] = None
  ) -> Dict[str, Any]:
    """Create an API response for testing."""
    return {
      'statusCode': status_code,
      'headers': headers or {'Content-Type': 'application/json'},
      'body': json.dumps(body or {})
    }

  @staticmethod
  def create_cloudwatch_alarm_response(
      alarm_name: str,
      threshold: float,
      comparison_operator: str = "GreaterThanThreshold"
  ) -> Dict[str, Any]:
    """Create a CloudWatch alarm response for testing."""
    return {
      'MetricAlarms': [{
        'AlarmName': alarm_name,
        'AlarmDescription': f'Test alarm {alarm_name}',
        'ActionsEnabled': True,
        'MetricName': 'Errors',
        'Namespace': 'AWS/Lambda',
        'Threshold': threshold,
        'ComparisonOperator': comparison_operator,
        'EvaluationPeriods': 2,
        'Period': 300,
        'Statistic': 'Sum',
        'AlarmArn': f'arn:aws:cloudwatch:us-east-1:123456789012:alarm:{alarm_name}'
      }]
    }


def assert_lambda_response(response: Dict[str, Any], expected_status: int = 200):
  """Assert Lambda response structure and status."""
  assert 'statusCode' in response
  assert 'headers' in response
  assert 'body' in response
  assert response['statusCode'] == expected_status
  assert response['headers']['Content-Type'] == 'application/json'

  # Ensure body is valid JSON
  body = json.loads(response['body'])
  return body


def assert_cors_headers(headers: Dict[str, str]):
  """Assert CORS headers are present."""
  assert 'Access-Control-Allow-Origin' in headers
  assert 'Access-Control-Allow-Methods' in headers
  assert 'Access-Control-Allow-Headers' in headers


def create_mock_lambda_function(function_name: str, runtime: str = "python3.12") -> Dict[str, Any]:
  """Create a mock Lambda function configuration."""
  return {
    'FunctionName': function_name,
    'FunctionArn': f'arn:aws:lambda:us-east-1:123456789012:function:{function_name}',
    'Runtime': runtime,
    'Role': f'arn:aws:iam::123456789012:role/{function_name}-role',
    'Handler': 'handler.lambda_handler',
    'CodeSize': 1024,
    'Description': f'Test function {function_name}',
    'Timeout': 60,
    'MemorySize': 512,
    'LastModified': '2024-01-01T00:00:00.000+0000',
    'CodeSha256': 'test-sha256',
    'Version': '$LATEST',
    'Environment': {
      'Variables': {
        'ENVIRONMENT': 'test',
        'LOG_LEVEL': 'INFO',
        'REGION': 'us-east-1',
        'FUNCTION_NAME': function_name
      }
    },
    'TracingConfig': {'Mode': 'PassThrough'},
    'RevisionId': 'test-revision-id',
    'State': 'Active',
    'LastUpdateStatus': 'Successful'
  }


def create_mock_api_gateway(api_id: str, api_name: str) -> Dict[str, Any]:
  """Create a mock API Gateway configuration."""
  return {
    'id': api_id,
    'name': api_name,
    'description': f'Test API {api_name}',
    'createdDate': '2024-01-01T00:00:00Z',
    'version': 'v1',
    'warnings': [],
    'binaryMediaTypes': ['*/*'],
    'minimumCompressionSize': 1024,
    'apiKeySource': 'HEADER',
    'endpointConfiguration': {
      'types': ['REGIONAL']
    },
    'policy': None,
    'tags': {}
  }


def create_mock_log_group(log_group_name: str, retention_days: int = 14) -> Dict[str, Any]:
  """Create a mock CloudWatch log group."""
  return {
    'logGroupName': log_group_name,
    'creationTime': 1640995200000,  # 2022-01-01
    'retentionInDays': retention_days,
    'metricFilterCount': 0,
    'arn': f'arn:aws:logs:us-east-1:123456789012:log-group:{log_group_name}',
    'storedBytes': 0
  }


def patch_pulumi_imports():
  """Context manager to patch Pulumi imports for testing."""
  patches = [
    patch('pulumi.ComponentResource'),
    patch('pulumi.ResourceOptions'),
    patch('pulumi.Output'),
    patch('pulumi.AssetArchive'),
    patch('pulumi.FileArchive'),
  ]

  return patches


class PulumiTestContext:
  """Context manager for Pulumi testing."""

  def __init__(self):
    self.patches = []
    self.mock_stack = MockPulumiStack()

  def __enter__(self):
    # Mock Pulumi classes
    self.patches = [
      patch('pulumi.ComponentResource.__init__', return_value=None),
      patch('pulumi.Output.concat', return_value=Mock()),
      patch('pulumi.Output.all', return_value=Mock()),
      patch('pulumi.AssetArchive', return_value=Mock()),
      patch('pulumi.FileArchive', return_value=Mock()),
    ]

    for p in self.patches:
      p.start()

    return self.mock_stack

  def __exit__(self, exc_type, exc_val, exc_tb):
    for p in self.patches:
      p.stop()
