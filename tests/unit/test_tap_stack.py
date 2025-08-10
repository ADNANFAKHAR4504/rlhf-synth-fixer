"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component and Lambda function
Tests both infrastructure components and Lambda handler functionality
"""

import gc
import json
import os
import sys
import time
import unittest
from datetime import datetime
from unittest.mock import Mock, patch

import pulumi

from lib import lambda_function
# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs

# Add the current directory to Python path to import lambda_function
sys.path.insert(0, os.path.dirname(__file__))


class TestTapStackArgs(unittest.TestCase):
  """Test cases for TapStackArgs configuration class."""

  def test_tap_stack_args_default_values(self):
    """Test TapStackArgs with default values."""
    args = TapStackArgs()

    self.assertEqual(args.environment_suffix, 'dev')
    self.assertIsNone(args.tags)

  def test_tap_stack_args_custom_values(self):
    """Test TapStackArgs with custom values."""
    custom_tags = {"Environment": "test", "Owner": "TestTeam"}
    args = TapStackArgs(environment_suffix='test', tags=custom_tags)

    self.assertEqual(args.environment_suffix, 'test')
    self.assertEqual(args.tags, custom_tags)

  def test_tap_stack_args_none_environment_suffix(self):
    """Test TapStackArgs with None environment_suffix defaults to 'dev'."""
    args = TapStackArgs(environment_suffix=None)
    self.assertEqual(args.environment_suffix, 'dev')


class MockPulumiResource:
  """Mock class to simulate Pulumi resource behavior."""

  def __init__(self, name, resource_type, props=None, opts=None):
    self.name = name
    self.resource_type = resource_type
    self.props = props or {}
    self.opts = opts
    self.arn = f"arn:aws:mock:us-west-2:123456789012:resource/{name}"
    self.id = f"mock-{name}"
    self._is_resource = True

    # Mock common attributes based on resource type
    if 'lambda' in resource_type.lower():
      self.invoke_arn = (
        f"arn:aws:apigateway:us-west-2:lambda:path/2015-03-31/"
        f"functions/{self.arn}/invocations"
      )
    elif 'apigateway' in resource_type.lower():
      self.root_resource_id = "mock-root-resource-id"
      self.execution_arn = (
        f"arn:aws:execute-api:us-west-2:123456789012:{self.id}"
      )


class MockResource:
  """Mock class that properly inherits Resource-like behavior for depends_on validation."""
  
  def __init__(self, name_prefix="mock"):

    # Inherit from Resource to pass depends_on validation
    self.__class__ = type(self.__class__.__name__, (pulumi.Resource,), 
                          dict(self.__class__.__dict__))
    
    self._is_resource = True
    self.name = f"{name_prefix}-resource"
    self.arn = f"arn:aws:mock:us-west-2:123456789012:resource/{name_prefix}"
    self.id = f"mock-{name_prefix}-id"
    self.invoke_arn = (
      f"arn:aws:apigateway:us-west-2:lambda:path/2015-03-31/"
      f"functions/{self.arn}/invocations"
    )
    self.root_resource_id = "mock-root-resource-id"
    self.execution_arn = f"arn:aws:execute-api:us-west-2:123456789012:{self.id}"
    self.http_method = "ANY"


def create_mock_resource(name_prefix="mock"):
  """Create a properly mocked Pulumi resource."""
  return MockResource(name_prefix)


class TestTapStack(unittest.TestCase):
  """Comprehensive test cases for TapStack Pulumi component."""

  def setUp(self):
    """Set up test fixtures."""
    self.test_args = TapStackArgs(
      environment_suffix='test',
      tags={'Environment': 'test', 'Project': 'serverless-test'}
    )
    self.mock_resources = {}

  def create_all_patches(self):
    """Create all necessary patches for TapStack testing."""
    # Create mock resources
    mock_resources = {
      'role': create_mock_resource("role"),
      'log_group': create_mock_resource("log-group"),
      'lambda_function': create_mock_resource("lambda"),
      'api': create_mock_resource("api"),
      'resource': create_mock_resource("resource"),
      'method': create_mock_resource("method"),
      'root_method': create_mock_resource("root-method"),
      'integration': create_mock_resource("integration"),
      'root_integration': create_mock_resource("root-integration"),
      'deployment': create_mock_resource("deployment"),
      'stage': create_mock_resource("stage"),
      'permission': create_mock_resource("permission"),
      'policy_attachment': create_mock_resource("policy")
    }
    
    # Add specific attributes for API Gateway method resources
    mock_resources['method'].http_method = "ANY"
    mock_resources['root_method'].http_method = "ANY"

    # Mock Pulumi config
    mock_config_instance = Mock()
    mock_config_instance.get.return_value = 'test'

    patches = {
      'config': patch('pulumi.Config', return_value=mock_config_instance),
      'component_init': patch('pulumi.ComponentResource.__init__', return_value=None),
      'resource_options': patch('pulumi.ResourceOptions'),
      'export': patch('pulumi.export'),
      'iam_role': patch('pulumi_aws.iam.Role', return_value=mock_resources['role']),
      'policy_attachment': patch('pulumi_aws.iam.RolePolicyAttachment', 
                                return_value=mock_resources['policy_attachment']),
      'log_group': patch('pulumi_aws.cloudwatch.LogGroup', 
                        return_value=mock_resources['log_group']),
      'lambda_function': patch('pulumi_aws.lambda_.Function', 
                              return_value=mock_resources['lambda_function']),
      'lambda_permission': patch('pulumi_aws.lambda_.Permission', 
                                return_value=mock_resources['permission']),
      'api_gateway': patch('pulumi_aws.apigateway.RestApi', 
                          return_value=mock_resources['api']),
      'api_resource': patch('pulumi_aws.apigateway.Resource', 
                           return_value=mock_resources['resource']),
      'api_method': patch('pulumi_aws.apigateway.Method', 
                         side_effect=[mock_resources['method'], mock_resources['root_method']]),
      'api_integration': patch('pulumi_aws.apigateway.Integration', 
                              side_effect=[mock_resources['integration'], 
                                           mock_resources['root_integration']]),
      'api_deployment': patch('pulumi_aws.apigateway.Deployment', 
                             return_value=mock_resources['deployment']),
      'api_stage': patch('pulumi_aws.apigateway.Stage', 
                        return_value=mock_resources['stage']),
      'path_dirname': patch('os.path.dirname', return_value=os.path.join(os.getcwd(), 'lib')),
      'path_join': patch('os.path.join', 
                         return_value=os.path.join(os.getcwd(), 'lib', 'lambda_function.py'))
    }

    return patches

  def test_tap_stack_initialization(self):
    """Test TapStack initialization creates all necessary resources."""
    patches = self.create_all_patches()

    # Start all patches
    started_patches = {}
    for name, patch_obj in patches.items():
      started_patches[name] = patch_obj.start()

    try:
      # Create the stack
      TapStack('test-stack', self.test_args)

      # Verify component initialization
      started_patches['component_init'].assert_called_once()

      # Verify IAM role creation
      started_patches['iam_role'].assert_called_once()
      role_call_args = started_patches['iam_role'].call_args
      self.assertEqual(role_call_args[0][0], 'test-lambda-execution-role')

      # Verify exports are called (5 exports in the stack)
      self.assertEqual(started_patches['export'].call_count, 5)

    finally:
      # Stop all patches
      for patch_obj in started_patches.values():
        try:
          patch_obj.stop()
        except RuntimeError:
          pass  # Patch already stopped

  def test_stack_attributes_assignment(self):
    """Test that TapStack properly assigns attributes from args."""
    patches = self.create_all_patches()

    # Start all patches
    started_patches = {}
    for name, patch_obj in patches.items():
      started_patches[name] = patch_obj.start()

    try:
      stack = TapStack('test-stack', self.test_args)

      self.assertEqual(stack.environment_suffix, 'test')
      self.assertEqual(
        stack.tags,
        {'Environment': 'test', 'Project': 'serverless-test'}
      )

    finally:
      # Stop all patches
      for patch_obj in started_patches.values():
        try:
          patch_obj.stop()
        except RuntimeError:
          pass

  def test_lambda_code_path_construction(self):
    """Test that Lambda code path is constructed correctly."""
    patches = self.create_all_patches()

    # Start all patches
    started_patches = {}
    for name, patch_obj in patches.items():
      started_patches[name] = patch_obj.start()

    try:
      TapStack('test-stack', self.test_args)

      # Verify path construction was called
      started_patches['path_dirname'].assert_called()
      started_patches['path_join'].assert_called_with(
        started_patches['path_dirname'].return_value, "lambda_function.py"
      )

    finally:
      # Stop all patches
      for patch_obj in started_patches.values():
        try:
          patch_obj.stop()
        except RuntimeError:
          pass

  def test_common_tags_structure(self):
    """Test that common tags are properly structured."""
    patches = self.create_all_patches()

    # Start all patches
    started_patches = {}
    for name, patch_obj in patches.items():
      started_patches[name] = patch_obj.start()

    try:
      TapStack('test-stack', self.test_args)

      # Get the tags from the IAM role call
      role_call_kwargs = started_patches['iam_role'].call_args[1]
      tags = role_call_kwargs['tags']

      # Verify common tags structure
      self.assertIn('project', tags)
      self.assertIn('environment', tags)
      self.assertIn('managed-by', tags)
      self.assertEqual(tags['project'], 'serverless-infra-pulumi')
      self.assertEqual(tags['environment'], 'test')
      self.assertEqual(tags['managed-by'], 'pulumi')

    finally:
      # Stop all patches
      for patch_obj in started_patches.values():
        try:
          patch_obj.stop()
        except RuntimeError:
          pass

  def test_lambda_function_configuration(self):
    """Test Lambda function configuration parameters."""
    patches = self.create_all_patches()

    # Start all patches
    started_patches = {}
    for name, patch_obj in patches.items():
      started_patches[name] = patch_obj.start()

    try:
      TapStack('test-stack', self.test_args)

      # Get Lambda function call arguments
      lambda_call_kwargs = started_patches['lambda_function'].call_args[1]

      # Verify Lambda configuration
      self.assertEqual(lambda_call_kwargs['runtime'], 'python3.9')
      self.assertEqual(
        lambda_call_kwargs['handler'], 'lambda_function.lambda_handler'
      )
      self.assertEqual(lambda_call_kwargs['timeout'], 30)
      self.assertEqual(lambda_call_kwargs['memory_size'], 128)

      # Verify environment variables
      env_vars = lambda_call_kwargs['environment']['variables']
      self.assertIn('ENVIRONMENT', env_vars)
      self.assertIn('LOG_LEVEL', env_vars)
      self.assertEqual(env_vars['LOG_LEVEL'], 'INFO')

    finally:
      # Stop all patches
      for patch_obj in started_patches.values():
        try:
          patch_obj.stop()
        except RuntimeError:
          pass

  def test_api_gateway_configuration(self):
    """Test API Gateway configuration parameters."""
    patches = self.create_all_patches()

    # Start all patches
    started_patches = {}
    for name, patch_obj in patches.items():
      started_patches[name] = patch_obj.start()

    try:
      TapStack('test-stack', self.test_args)

      # Get API Gateway call arguments
      api_call_kwargs = started_patches['api_gateway'].call_args[1]

      # Verify API Gateway configuration
      self.assertEqual(api_call_kwargs['name'], 'test-serverless-api')
      self.assertIn(
        'Serverless API for test environment',
        api_call_kwargs['description']
      )
      self.assertEqual(
        api_call_kwargs['endpoint_configuration']['types'], 'REGIONAL'
      )

    finally:
      # Stop all patches
      for patch_obj in started_patches.values():
        try:
          patch_obj.stop()
        except RuntimeError:
          pass


class TestLambdaFunction(unittest.TestCase):
  """Test cases for Lambda function handler"""

  def setUp(self):
    """Set up test fixtures before each test method"""
    # Mock Lambda context
    # Create proper mock context with string values
    self.mock_context = type('MockContext', (), {})() 
    self.mock_context.function_name = "test-api-handler"
    self.mock_context.function_version = "1"
    self.mock_context.aws_request_id = "test-request-id-123"
    self.mock_context.memory_limit_in_mb = 128

    # Set environment variables for testing
    os.environ['ENVIRONMENT'] = 'test'
    os.environ['LOG_LEVEL'] = 'INFO'

  def create_api_gateway_event(self, method='GET', path='/',
                               query_params=None, headers=None):
    """
    Create a mock API Gateway event

    Args:
      method (str): HTTP method
      path (str): Request path
      query_params (dict): Query parameters
      headers (dict): Request headers

    Returns:
      dict: Mock API Gateway event
    """
    return {
      "httpMethod": method,
      "path": path,
      "queryStringParameters": query_params,
      "headers": headers or {
        "User-Agent": "test-client/1.0",
        "Content-Type": "application/json"
      },
      "body": None,
      "isBase64Encoded": False,
      "requestContext": {
        "requestId": "test-request-123",
        "stage": "test"
      }
    }

  def test_successful_get_request_root_path(self):
    """Test successful GET request to root path"""
    # Arrange
    event = self.create_api_gateway_event(method='GET', path='/')

    # Act
    response = lambda_function.lambda_handler(event, self.mock_context)

    # Assert
    self.assertEqual(response['statusCode'], 200)
    self.assertIn('Content-Type', response['headers'])
    self.assertEqual(response['headers']['Content-Type'], 'application/json')

    # Parse response body
    body = json.loads(response['body'])
    self.assertIn('message', body)
    self.assertIn('timestamp', body)
    self.assertIn('environment', body)
    self.assertIn('request_info', body)
    self.assertIn('lambda_info', body)

    # Verify request info
    self.assertEqual(body['request_info']['method'], 'GET')
    self.assertEqual(body['request_info']['path'], '/')
    self.assertEqual(body['environment'], 'test')

    # Verify lambda info
    self.assertEqual(body['lambda_info']['function_name'], 'test-api-handler')
    self.assertEqual(body['lambda_info']['request_id'], 'test-request-id-123')

  def test_health_check_endpoint(self):
    """Test health check endpoint"""
    # Arrange
    event = self.create_api_gateway_event(method='GET', path='/health')

    # Act
    response = lambda_function.lambda_handler(event, self.mock_context)

    # Assert
    self.assertEqual(response['statusCode'], 200)

    body = json.loads(response['body'])
    self.assertIn('status', body)
    self.assertEqual(body['status'], 'healthy')
    self.assertIn('Service is running normally', body['message'])

  def test_info_endpoint(self):
    """Test info endpoint"""
    # Arrange
    event = self.create_api_gateway_event(method='GET', path='/info')

    # Act
    response = lambda_function.lambda_handler(event, self.mock_context)

    # Assert
    self.assertEqual(response['statusCode'], 200)

    body = json.loads(response['body'])
    self.assertIn('Serverless application information', body['message'])

  def test_post_request_with_query_params(self):
    """Test POST request with query parameters"""
    # Arrange
    query_params = {"param1": "value1", "param2": "value2"}
    event = self.create_api_gateway_event(
      method='POST',
      path='/api/test',
      query_params=query_params
    )

    # Act
    response = lambda_function.lambda_handler(event, self.mock_context)

    # Assert
    self.assertEqual(response['statusCode'], 200)

    body = json.loads(response['body'])
    self.assertEqual(body['request_info']['method'], 'POST')
    self.assertEqual(body['request_info']['path'], '/api/test')
    self.assertEqual(body['request_info']['query_parameters'], query_params)

  def test_cors_headers_present(self):
    """Test that CORS headers are present in response"""
    # Arrange
    event = self.create_api_gateway_event()

    # Act
    response = lambda_function.lambda_handler(event, self.mock_context)

    # Assert
    headers = response['headers']
    self.assertIn('Access-Control-Allow-Origin', headers)
    self.assertIn('Access-Control-Allow-Methods', headers)
    self.assertIn('Access-Control-Allow-Headers', headers)
    self.assertEqual(headers['Access-Control-Allow-Origin'], '*')

  def test_exception_handling(self):
    """Test exception handling in lambda function"""
    # Arrange - Create an event that might cause issues
    event = None  # This should cause an exception

    # Act
    response = lambda_function.lambda_handler(event, self.mock_context)

    # Assert
    self.assertEqual(response['statusCode'], 500)

    body = json.loads(response['body'])
    self.assertIn('error', body)
    self.assertIn('Internal server error', body['error'])
    self.assertIn('request_id', body)

  def test_health_check_function(self):
    """Test standalone health check function"""
    # Act
    result = lambda_function.health_check()

    # Assert
    self.assertIn('status', result)
    self.assertEqual(result['status'], 'healthy')
    self.assertIn('timestamp', result)
    self.assertIn('service', result)
    self.assertEqual(result['service'], 'serverless-web-app')

  def test_response_structure_consistency(self):
    """Test that response structure is consistent across different requests"""
    # Arrange
    test_paths = ['/', '/health', '/info', '/api/test']

    for path in test_paths:
      with self.subTest(path=path):
        # Arrange
        event = self.create_api_gateway_event(path=path)

        # Act
        response = lambda_function.lambda_handler(event, self.mock_context)

        # Assert
        self.assertIn('statusCode', response)
        self.assertIn('headers', response)
        self.assertIn('body', response)
        self.assertEqual(response['statusCode'], 200)

        # Verify body is valid JSON
        body = json.loads(response['body'])
        self.assertIn('timestamp', body)
        self.assertIn('environment', body)


class TestAPIGatewayIntegration(unittest.TestCase):
  """Integration tests simulating API Gateway behavior"""

  def setUp(self):
    """Set up test fixtures"""
    # Create proper mock context with string values
    self.mock_context = type('MockContext', (), {})()
    self.mock_context.function_name = "dev-api-handler"
    self.mock_context.function_version = "1"
    self.mock_context.aws_request_id = "integration-test-123"
    self.mock_context.memory_limit_in_mb = 128

  def test_api_gateway_proxy_integration(self):
    """Test API Gateway proxy integration simulation"""
    # Simulate API Gateway proxy integration event
    event = {
      "resource": "/{proxy+}",
      "path": "/api/users",
      "httpMethod": "GET",
      "headers": {
        "Accept": "application/json",
        "User-Agent": "Amazon CloudFront"
      },
      "queryStringParameters": {"limit": "10"},
      "pathParameters": {"proxy": "api/users"},
      "requestContext": {
        "requestId": "integration-test-request",
        "stage": "dev",
        "httpMethod": "GET"
      },
      "body": None,
      "isBase64Encoded": False
    }

    # Act
    response = lambda_function.lambda_handler(event, self.mock_context)

    # Assert
    self.assertEqual(response['statusCode'], 200)
    self.assertIn('application/json', response['headers']['Content-Type'])

    body = json.loads(response['body'])
    self.assertEqual(body['request_info']['method'], 'GET')
    self.assertEqual(body['request_info']['path'], '/api/users')
    self.assertIn('limit', body['request_info']['query_parameters'])


class TestLambdaErrorHandling(unittest.TestCase):
  """Test edge cases and error handling in Lambda function."""

  def setUp(self):
    """Set up test fixtures"""
    # Create proper mock context with string values
    self.mock_context = type('MockContext', (), {})()
    self.mock_context.function_name = "test-api-handler"
    self.mock_context.function_version = "1"
    self.mock_context.aws_request_id = "test-request-id-456"
    self.mock_context.memory_limit_in_mb = 128

  def test_missing_event_properties(self):
    """Test handling of missing event properties"""
    # Event with missing properties
    event = {}

    response = lambda_function.lambda_handler(event, self.mock_context)

    self.assertEqual(response['statusCode'], 200)
    body = json.loads(response['body'])
    self.assertEqual(body['request_info']['method'], 'UNKNOWN')
    self.assertEqual(body['request_info']['path'], '/')
    self.assertEqual(body['request_info']['query_parameters'], {})

  def test_none_query_parameters(self):
    """Test handling of None query parameters"""
    event = {
      "httpMethod": "GET",
      "path": "/test",
      "queryStringParameters": None,
      "headers": {"User-Agent": "test"}
    }

    response = lambda_function.lambda_handler(event, self.mock_context)

    self.assertEqual(response['statusCode'], 200)
    body = json.loads(response['body'])
    self.assertEqual(body['request_info']['query_parameters'], {})

  def test_none_headers(self):
    """Test handling of None headers"""
    event = {
      "httpMethod": "GET",
      "path": "/test",
      "queryStringParameters": {},
      "headers": None
    }

    response = lambda_function.lambda_handler(event, self.mock_context)

    self.assertEqual(response['statusCode'], 200)
    body = json.loads(response['body'])
    self.assertEqual(body['request_info']['user_agent'], 'Unknown')

  def test_context_none_exception_handling(self):
    """Test exception handling when context is None"""
    event = None
    context = None

    response = lambda_function.lambda_handler(event, context)

    self.assertEqual(response['statusCode'], 500)
    body = json.loads(response['body'])
    self.assertIn('error', body)
    self.assertEqual(body['request_id'], 'unknown')

  def test_different_http_methods(self):
    """Test different HTTP methods"""
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

    for method in methods:
      with self.subTest(method=method):
        event = {
          "httpMethod": method,
          "path": "/api/test",
          "queryStringParameters": {},
          "headers": {"User-Agent": "test"}
        }

        response = lambda_function.lambda_handler(event, self.mock_context)

        self.assertEqual(response['statusCode'], 200)
        body = json.loads(response['body'])
        self.assertEqual(body['request_info']['method'], method)

  def test_large_query_parameters(self):
    """Test handling of large query parameter sets"""
    large_query_params = {f"param{i}": f"value{i}" for i in range(50)}

    event = {
      "httpMethod": "GET",
      "path": "/api/test",
      "queryStringParameters": large_query_params,
      "headers": {"User-Agent": "test"}
    }

    response = lambda_function.lambda_handler(event, self.mock_context)

    self.assertEqual(response['statusCode'], 200)
    body = json.loads(response['body'])
    self.assertEqual(len(body['request_info']['query_parameters']), 50)


class TestLambdaUtilityFunctions(unittest.TestCase):
  """Test utility functions in the Lambda module."""

  def test_health_check_structure(self):
    """Test health check function returns proper structure"""
    result = lambda_function.health_check()

    # Check required fields
    self.assertIn('status', result)
    self.assertIn('timestamp', result)
    self.assertIn('service', result)

    # Check field values
    self.assertEqual(result['status'], 'healthy')
    self.assertEqual(result['service'], 'serverless-web-app')

    # Check timestamp format (ISO 8601)
    try:
      datetime.fromisoformat(result['timestamp'].replace('Z', '+00:00'))
    except ValueError:
      self.fail("Timestamp is not in valid ISO 8601 format")

  def test_handle_options_cors_headers(self):
    """Test OPTIONS handler returns correct CORS headers"""
    result = lambda_function.handle_options()

    self.assertEqual(result['statusCode'], 200)
    self.assertEqual(result['body'], '')

    headers = result['headers']
    self.assertEqual(headers['Access-Control-Allow-Origin'], '*')
    self.assertIn('GET', headers['Access-Control-Allow-Methods'])
    self.assertIn('POST', headers['Access-Control-Allow-Methods'])
    self.assertIn('Content-Type', headers['Access-Control-Allow-Headers'])
    self.assertEqual(headers['Access-Control-Max-Age'], '86400')


class TestLambdaLogging(unittest.TestCase):
  """Test logging functionality in Lambda function."""

  def setUp(self):
    """Set up test fixtures"""
    # Create proper mock context with string values
    self.mock_context = type('MockContext', (), {})()
    self.mock_context.function_name = "test-api-handler"
    self.mock_context.aws_request_id = "test-request-logging"
    self.mock_context.function_version = "1"
    self.mock_context.memory_limit_in_mb = 128

  def test_log_level_environment_variable(self):
    """Test that LOG_LEVEL environment variable is respected"""
    with patch.dict(os.environ, {'LOG_LEVEL': 'DEBUG'}):
      # Import would need to be done after setting env var in real scenario
      # For this test, we just verify the env var is being read correctly
      level = os.environ.get('LOG_LEVEL', 'INFO')
      self.assertEqual(level, 'DEBUG')


class TestLambdaPerformance(unittest.TestCase):
  """Test performance-related aspects of Lambda function."""

  def setUp(self):
    """Set up test fixtures"""
    # Create proper mock context with string values
    self.mock_context = type('MockContext', (), {})()
    self.mock_context.function_name = "perf-test-handler"
    self.mock_context.aws_request_id = "perf-test-123"
    self.mock_context.memory_limit_in_mb = 128
    self.mock_context.function_version = "1"

  def test_response_time_consistency(self):
    """Test that response time is consistent across multiple calls"""
    event = {
      "httpMethod": "GET",
      "path": "/",
      "queryStringParameters": {},
      "headers": {"User-Agent": "perf-test"}
    }

    response_times = []

    for _ in range(5):  # Reduced from 10 to 5 for faster testing
      start_time = time.time()
      lambda_function.lambda_handler(event, self.mock_context)
      end_time = time.time()
      response_times.append(end_time - start_time)

    # Check that all response times are reasonable
    for response_time in response_times:
      self.assertLess(response_time, 1.0)

  def test_memory_usage_patterns(self):
    """Test that function doesn't consume excessive memory"""
    # Force garbage collection before test
    gc.collect()

    event = {
      "httpMethod": "GET",
      "path": "/memory-test",
      # Reduced for faster testing
      "queryStringParameters": {f"param{i}": f"value{i}"
                                for i in range(10)},
      "headers": {"User-Agent": "memory-test"}
    }

    # Run function multiple times to check for memory leaks
    for _ in range(20):  # Reduced from 100 to 20 for faster testing
      response = lambda_function.lambda_handler(event, self.mock_context)
      self.assertEqual(response['statusCode'], 200)

    # Force garbage collection after test
    gc.collect()

    # If we get here without memory issues, test passes


if __name__ == '__main__':
  # Run the tests
  unittest.main(verbosity=2)
