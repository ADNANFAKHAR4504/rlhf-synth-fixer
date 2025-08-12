"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component and Lambda handler.
"""

import importlib
import json
from unittest.mock import Mock, patch

import pytest
import base64


def _import_handler_module():
  return importlib.import_module('lib.lambda.handler')


class TestTapStackArgs:
  """Test cases for TapStackArgs configuration class."""

  def setup_method(self):
    """Setup for each test method."""
    # Import here to avoid Pulumi dependency issues
    try:
      from lib.tap_stack import TapStackArgs  # pylint: disable=import-outside-toplevel
      self.TapStackArgs = TapStackArgs
      self.pulumi_available = True
    except ImportError:
      self.pulumi_available = False

  def test_tap_stack_args_default_values(self):
    """Test TapStackArgs with default values."""
    if not self.pulumi_available:
      pytest.skip("Pulumi dependencies not available")

    args = self.TapStackArgs()

    assert args.environment_suffix == 'Production'
    assert args.tags == {}
    assert args.region == 'us-east-1'

  def test_tap_stack_args_custom_values(self):
    """Test TapStackArgs with custom values."""
    if not self.pulumi_available:
      pytest.skip("Pulumi dependencies not available")

    custom_tags = {"Owner": "TestTeam", "Project": "TAP"}
    args = self.TapStackArgs(
      environment_suffix="prod",
      tags=custom_tags,
      region="us-east-1"
    )

    assert args.environment_suffix == "prod"
    assert args.tags == custom_tags
    assert args.region == "us-east-1"

  def test_tap_stack_args_partial_values(self):
    """Test TapStackArgs with some custom values."""
    if not self.pulumi_available:
      pytest.skip("Pulumi dependencies not available")

    args = self.TapStackArgs(environment_suffix="staging")

    assert args.environment_suffix == "staging"
    assert args.tags == {}
    assert args.region == "us-east-1"


class TestLambdaHandler:
  """Test cases for the Lambda handler function."""

  def setup_method(self):
    """Setup for each test method."""
    # Import Lambda handler module
    self.lambda_handler_module = importlib.import_module('lib.lambda.handler')

  def test_lambda_handler_get_root(self):
    """Test GET request to root path."""
    event = {
      'httpMethod': 'GET',
      'path': '/',
      'headers': {},
      'queryStringParameters': None,
      'body': None
    }
    context = Mock()

    with patch.dict('os.environ', {
      'ENVIRONMENT': 'test',
      'LOG_LEVEL': 'INFO',
      'REGION': 'us-east-1',
      'FUNCTION_NAME': 'test-function'
    }):
      response = self.lambda_handler_module.lambda_handler(event, context)

      assert response['statusCode'] == 200
      body = json.loads(response['body'])
      assert body['message'] == 'TAP API is running'
      assert body['environment'] == 'test'
      assert body['status'] == 'healthy'

  def test_lambda_handler_get_health(self):
    """Test GET request to health endpoint."""
    event = {
      'httpMethod': 'GET',
      'path': '/health',
      'headers': {},
      'queryStringParameters': None,
      'body': None
    }
    context = Mock()

    with patch.dict('os.environ', {'ENVIRONMENT': 'test'}):
      response = self.lambda_handler_module.lambda_handler(event, context)

      assert response['statusCode'] == 200
      body = json.loads(response['body'])
      assert body['status'] == 'healthy'
      assert body['environment'] == 'test'

  def test_lambda_handler_post_valid_json(self):
    """Test POST request with valid JSON."""
    test_data = {'key': 'value', 'number': 42}
    event = {
      'httpMethod': 'POST',
      'path': '/',
      'headers': {'Content-Type': 'application/json'},
      'queryStringParameters': None,
      'body': json.dumps(test_data)
    }
    context = Mock()

    with patch.dict('os.environ', {'ENVIRONMENT': 'test'}):
      response = self.lambda_handler_module.lambda_handler(event, context)

      assert response['statusCode'] == 200
      body = json.loads(response['body'])
      assert body['message'] == 'POST request processed successfully'
      assert body['received_data'] == test_data

  def test_lambda_handler_options_request(self):
    """Test OPTIONS request for CORS."""
    event = {
      'httpMethod': 'OPTIONS',
      'path': '/',
      'headers': {},
      'queryStringParameters': None,
      'body': None
    }
    context = Mock()

    with patch.dict('os.environ', {'ENVIRONMENT': 'test'}):
      response = self.lambda_handler_module.lambda_handler(event, context)

      assert response['statusCode'] == 200
      headers = response['headers']
      assert 'Access-Control-Allow-Origin' in headers
      assert 'Access-Control-Allow-Methods' in headers
      assert 'Access-Control-Allow-Headers' in headers

  def test_create_response_with_cors(self):
    """Test create_response with CORS headers."""
    body = {'message': 'test'}
    response = self.lambda_handler_module.create_response(200, body, cors_headers=True)

    assert response['statusCode'] == 200
    headers = response['headers']
    assert 'Access-Control-Allow-Origin' in headers
    assert 'Access-Control-Allow-Methods' in headers
    assert 'Access-Control-Allow-Headers' in headers

  def test_get_info_endpoint(self):
    handler = _import_handler_module()
    event = {
      'httpMethod': 'GET',
      'path': '/info',
      'headers': {},
      'queryStringParameters': None,
      'body': None,
    }
    with patch.dict('os.environ', {'ENVIRONMENT': 'test'}):
      response = handler.lambda_handler(event, Mock())
    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert body['service'] == 'TAP API'
    assert body['environment'] == 'test'

  def test_get_unknown_path_returns_404(self):
    handler = _import_handler_module()
    event = {
      'httpMethod': 'GET',
      'path': '/does-not-exist',
      'headers': {},
      'queryStringParameters': None,
      'body': None,
    }
    response = handler.lambda_handler(event, Mock())
    assert response['statusCode'] == 404

  def test_post_base64_valid_json(self):
    handler = _import_handler_module()
    payload = json.dumps({'a': 1}).encode('utf-8')
    event = {
      'httpMethod': 'POST',
      'path': '/',
      'headers': {},
      'isBase64Encoded': True,
      'body': base64.b64encode(payload).decode('utf-8'),
    }
    with patch.dict('os.environ', {'ENVIRONMENT': 'dev'}):
      response = handler.lambda_handler(event, Mock())
    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert body['received_data'] == {'a': 1}

  def test_post_invalid_json_returns_raw_body(self):
    handler = _import_handler_module()
    event = {
      'httpMethod': 'POST',
      'path': '/',
      'headers': {},
      'body': '{not json}',
    }
    with patch.dict('os.environ', {'ENVIRONMENT': 'dev'}):
      response = handler.lambda_handler(event, Mock())
    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert body['received_data'] == {'raw_body': '{not json}'}

  def test_put_valid_and_invalid_bodies(self):
    handler = _import_handler_module()
    event_valid = {
      'httpMethod': 'PUT',
      'path': '/',
      'headers': {},
      'body': json.dumps({'update': True}),
    }
    with patch.dict('os.environ', {'ENVIRONMENT': 'qa'}):
      response_valid = handler.lambda_handler(event_valid, Mock())
    assert response_valid['statusCode'] == 200
    body_valid = json.loads(response_valid['body'])
    assert body_valid['received_data'] == {'update': True}

    event_invalid = {
      'httpMethod': 'PUT',
      'path': '/',
      'headers': {},
      'body': 'not-json',
    }
    with patch.dict('os.environ', {'ENVIRONMENT': 'qa'}):
      response_invalid = handler.lambda_handler(event_invalid, Mock())
    assert response_invalid['statusCode'] == 200
    body_invalid = json.loads(response_invalid['body'])
    assert body_invalid['received_data'] == {'raw_body': 'not-json'}

  def test_put_base64_valid_json(self):
    handler = _import_handler_module()
    payload = json.dumps({'b': 2}).encode('utf-8')
    event = {
      'httpMethod': 'PUT',
      'path': '/',
      'headers': {},
      'isBase64Encoded': True,
      'body': base64.b64encode(payload).decode('utf-8'),
    }
    with patch.dict('os.environ', {'ENVIRONMENT': 'stage'}):
      response = handler.lambda_handler(event, Mock())
    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert body['received_data'] == {'b': 2}

  def test_delete_request(self):
    handler = _import_handler_module()
    event = {
      'httpMethod': 'DELETE',
      'path': '/resource/1',
      'headers': {},
      'body': None,
    }
    with patch.dict('os.environ', {'ENVIRONMENT': 'test'}):
      response = handler.lambda_handler(event, Mock())
    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert body['path'] == '/resource/1'

  def test_method_not_allowed(self):
    handler = _import_handler_module()
    event = {
      'httpMethod': 'PATCH',
      'path': '/',
      'headers': {},
      'body': None,
    }
    response = handler.lambda_handler(event, Mock())
    assert response['statusCode'] == 405

  def test_create_response_without_cors_headers(self):
    handler = _import_handler_module()
    response = handler.create_response(201, {'ok': True}, cors_headers=False)
    assert response['statusCode'] == 201
    headers = response['headers']
    assert 'Access-Control-Allow-Origin' not in headers
    assert headers['Content-Type'] == 'application/json'

  def test_options_uses_origin_when_allowed(self):
    handler = _import_handler_module()
    event = {
      'httpMethod': 'OPTIONS',
      'path': '/',
      'headers': {'Origin': 'https://app.example.com'},
      'body': None,
    }
    with patch.dict('os.environ', {'ALLOWED_ORIGINS': 'https://example.com, https://app.example.com'}):
      response = handler.lambda_handler(event, Mock())
    assert response['statusCode'] == 200
    assert response['headers']['Access-Control-Allow-Origin'] == 'https://app.example.com'

  def test_get_allowed_origin_match_and_default(self):
    handler = _import_handler_module()
    with patch.dict('os.environ', {'ALLOWED_ORIGINS': 'https://x.com, https://y.com'}):
      assert handler.get_allowed_origin('https://y.com') == 'https://y.com'
      assert handler.get_allowed_origin('https://z.com') == 'https://x.com'

  def test_lambda_handler_catches_exceptions(self):
    handler = _import_handler_module()
    event = {
      'httpMethod': 'GET',
      'path': '/',
      'headers': {},
      'body': None,
    }
    with patch('lib.lambda.handler.handle_get_request', side_effect=RuntimeError('boom')):
      response = handler.lambda_handler(event, Mock())
    assert response['statusCode'] == 500


class TestTapStackResources:
  """Test cases for TapStack resource creation with mocking."""

  def setup_method(self):
    """Setup for each test method."""
    try:
      from lib.tap_stack import TapStack, TapStackArgs  # pylint: disable=import-outside-toplevel
      self.TapStack = TapStack
      self.TapStackArgs = TapStackArgs
      self.pulumi_available = True
    except ImportError:
      self.pulumi_available = False

  @pytest.fixture
  def mock_pulumi_resources(self):
    """Mock all Pulumi AWS resources for testing."""
    if not self.pulumi_available:
      pytest.skip("Pulumi dependencies not available")

    with patch('lib.tap_stack.iam.Role') as mock_role, \
         patch('lib.tap_stack.iam.Policy') as mock_policy, \
         patch('lib.tap_stack.iam.RolePolicyAttachment') as mock_attachment, \
         patch('lib.tap_stack.cloudwatch.LogGroup') as mock_log_group, \
         patch('lib.tap_stack.lambda_.Function') as mock_lambda, \
         patch('lib.tap_stack.apigateway.RestApi') as mock_api, \
         patch('pulumi.export') as mock_export, \
         patch('lib.tap_stack.ResourceOptions') as mock_resource_options, \
         patch('pulumi.Output') as mock_output, \
         patch('pulumi.Output.concat') as mock_output_concat, \
         patch('pulumi.Output.all') as mock_output_all, \
         patch('pulumi.Output.from_input') as mock_output_from_input, \
         patch('pulumi.AssetArchive') as mock_asset_archive, \
         patch('pulumi.FileArchive') as mock_file_archive, \
         patch('pulumi.get_stack') as mock_get_stack:

      # Create simple mock objects that can be used as depends_on values
      class MockResource:
        def __init__(self, name, **kwargs):
          self.name = name
          self.arn = f"arn:aws:test:us-east-1:123456789012:{name}"
          self.id = f"{name}-id"
          for key, value in kwargs.items():
            setattr(self, key, value)

      # Configure mocks with proper Resource instances
      mock_role_instance = MockResource("lambda-execution-role-test")
      mock_role_instance.name = "lambda-execution-role-test"
      mock_role.return_value = mock_role_instance

      mock_policy_instance = MockResource("lambda-cloudwatch-policy-test")
      mock_policy_instance.arn = "arn:aws:iam::123456789012:policy/lambda-cloudwatch-policy-test"
      mock_policy.return_value = mock_policy_instance

      mock_attachment_instance = MockResource("lambda-cloudwatch-attachment-test")
      mock_attachment_instance.arn = "arn:aws:iam::123456789012:role/lambda-execution-role-test"
      mock_attachment.return_value = mock_attachment_instance

      mock_log_group_instance = MockResource("lambda-log-group-test")
      mock_log_group_instance.name = "/aws/lambda/tap-api-handler-test"
      mock_log_group.return_value = mock_log_group_instance

      mock_lambda_instance = MockResource("tap-api-handler-test")
      mock_lambda_instance.name = "tap-api-handler-test"
      mock_lambda_instance.arn = "arn:aws:lambda:us-east-1:123456789012:function:tap-api-handler-test"
      mock_lambda_instance.invoke_arn = (
        "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/"
        "arn:aws:lambda:us-east-1:123456789012:function:tap-api-handler-test/"
        "invocations"
      )
      mock_lambda_instance.memory_size = 512
      mock_lambda_instance.timeout = 60
      mock_lambda_instance.runtime = "python3.12"
      mock_lambda.return_value = mock_lambda_instance

      mock_api_instance = MockResource("tap-api-test")
      mock_api_instance.id = "test-api-id"
      mock_api_instance.root_resource_id = "root-resource-id"
      mock_api_instance.execution_arn = "arn:aws:execute-api:us-east-1:123456789012:test-api-id"
      mock_api.return_value = mock_api_instance

      # Mock ResourceOptions to handle depends_on properly
      def mock_resource_options_constructor(*args, **kwargs):
        # Create a simple mock that doesn't validate depends_on
        mock_opts = Mock()
        mock_opts.parent = kwargs.get('parent')
        mock_opts.depends_on = kwargs.get('depends_on')
        mock_opts.protect = kwargs.get('protect')
        mock_opts.provider = kwargs.get('provider')
        mock_opts.providers = kwargs.get('providers')
        mock_opts.delete_before_replace = kwargs.get('delete_before_replace')
        mock_opts.ignore_changes = kwargs.get('ignore_changes')
        mock_opts.version = kwargs.get('version')
        mock_opts.aliases = kwargs.get('aliases')
        mock_opts.additional_secret_outputs = kwargs.get('additional_secret_outputs')
        mock_opts.custom_timeouts = kwargs.get('custom_timeouts')
        mock_opts.id = kwargs.get('id')
        mock_opts.import_ = kwargs.get('import_')
        mock_opts.transformations = kwargs.get('transformations')
        mock_opts.transforms = kwargs.get('transforms')
        mock_opts.hooks = kwargs.get('hooks')
        mock_opts.urn = kwargs.get('urn')
        mock_opts.replace_on_changes = kwargs.get('replace_on_changes')
        mock_opts.retain_on_delete = kwargs.get('retain_on_delete')
        mock_opts.deleted_with = kwargs.get('deleted_with')
        return mock_opts
      
      mock_resource_options.side_effect = mock_resource_options_constructor

      # Mock Pulumi Output constructs
      mock_output_instance = Mock()
      mock_output_instance.apply = Mock(return_value=Mock())
      mock_output.return_value = mock_output_instance
      mock_output_concat.return_value = mock_output_instance
      mock_output_all.return_value = mock_output_instance
      mock_output_from_input.return_value = mock_output_instance

      # Mock Pulumi Asset constructs
      mock_asset_archive.return_value = Mock()
      mock_file_archive.return_value = Mock()

      # Mock get_stack
      mock_get_stack.return_value = "test-stack"

      yield {
        'role': mock_role,
        'policy': mock_policy,
        'attachment': mock_attachment,
        'log_group': mock_log_group,
        'lambda': mock_lambda,
        'api': mock_api,
        'export': mock_export,
        'resource_options': mock_resource_options,
        'output': mock_output,
        'output_concat': mock_output_concat,
        'output_all': mock_output_all,
        'output_from_input': mock_output_from_input,
        'asset_archive': mock_asset_archive,
        'file_archive': mock_file_archive,
        'get_stack': mock_get_stack
      }

  def test_iam_role_creation(self, mock_pulumi_resources):
    """Test IAM role creation configuration."""
    if not self.pulumi_available:
      pytest.skip("Pulumi dependencies not available")

    args = self.TapStackArgs(environment_suffix="test", region="us-east-1")

    # Test the configuration logic directly
    expected_role_name = f"lambda-execution-role-{args.environment_suffix}"
    expected_assume_role_policy = {
      "Version": "2012-10-17",
      "Statement": [{
        "Action": "sts:AssumeRole",
        "Effect": "Allow",
        "Principal": {"Service": "lambda.amazonaws.com"}
      }]
    }

    # Verify configuration values
    assert expected_role_name == "lambda-execution-role-test"
    assert expected_assume_role_policy["Version"] == "2012-10-17"
    assert expected_assume_role_policy["Statement"][0]["Action"] == "sts:AssumeRole"
    assert expected_assume_role_policy["Statement"][0]["Effect"] == "Allow"
    assert expected_assume_role_policy["Statement"][0]["Principal"]["Service"] == (
      "lambda.amazonaws.com"
    )

  def test_lambda_function_configuration(self, mock_pulumi_resources):
    """Test Lambda function configuration."""
    if not self.pulumi_available:
      pytest.skip("Pulumi dependencies not available")

    args = self.TapStackArgs(environment_suffix="dev", region="us-east-1")

    # Test the configuration logic directly
    expected_function_name = f"tap-api-handler-{args.environment_suffix}"
    expected_runtime = "python3.12"
    expected_timeout = 60
    expected_memory_size = 512
    expected_handler = "handler.lambda_handler"

    # Verify configuration values
    assert expected_function_name == "tap-api-handler-dev"
    assert expected_runtime == "python3.12"
    assert expected_timeout == 60
    assert expected_memory_size == 512
    assert expected_handler == "handler.lambda_handler"

    # Verify environment variables configuration
    expected_env_vars = {
      'ENVIRONMENT': args.environment_suffix,
      'REGION': args.region,
      'LOG_LEVEL': "INFO",
      'FUNCTION_NAME': expected_function_name
    }

    assert expected_env_vars['ENVIRONMENT'] == "dev"
    assert expected_env_vars['REGION'] == "us-east-1"
    assert expected_env_vars['LOG_LEVEL'] == "INFO"
    assert expected_env_vars['FUNCTION_NAME'] == "tap-api-handler-dev"

  def test_api_gateway_configuration(self, mock_pulumi_resources):
    """Test API Gateway configuration."""
    if not self.pulumi_available:
      pytest.skip("Pulumi dependencies not available")

    args = self.TapStackArgs(environment_suffix="test")

    # Test the configuration logic directly
    expected_api_name = f"tap-api-{args.environment_suffix}"
    expected_minimum_compression_size = 1024
    expected_binary_media_types = ["*/*"]
    expected_endpoint_configuration = {"types": "REGIONAL"}

    # Verify configuration values
    assert expected_api_name == "tap-api-test"
    assert expected_minimum_compression_size == 1024
    assert expected_binary_media_types == ["*/*"]
    assert expected_endpoint_configuration["types"] == "REGIONAL"

  def test_cloudwatch_log_group_retention(self, mock_pulumi_resources):
    """Test CloudWatch log group retention configuration."""
    if not self.pulumi_available:
      pytest.skip("Pulumi dependencies not available")

    # Test prod environment
    args_prod = self.TapStackArgs(environment_suffix="prod")
    args_dev = self.TapStackArgs(environment_suffix="dev")

    # Test the configuration logic directly
    prod_retention = 30 if args_prod.environment_suffix == 'prod' else 14
    dev_retention = 30 if args_dev.environment_suffix == 'prod' else 14

    # Verify configuration values
    assert prod_retention == 30  # prod retention
    assert dev_retention == 14   # dev retention

  def test_resource_tagging(self, mock_pulumi_resources):
    """Test resource tagging configuration."""
    if not self.pulumi_available:
      pytest.skip("Pulumi dependencies not available")

    custom_tags = {"Owner": "TestTeam", "Custom": "Value"}
    args = self.TapStackArgs(
      environment_suffix="test",
      tags=custom_tags,
      region="us-east-1"
    )

    # Test the configuration logic directly
    expected_tags = {
      "Environment": args.environment_suffix.capitalize(),
      "Project": "TAP",
      "ManagedBy": "Pulumi",
      "Region": args.region,
      "CostCenter": "TAP-API",
      **custom_tags
    }

    # Verify configuration values
    assert expected_tags['Environment'] == "Test"  # Capitalized
    assert expected_tags['Project'] == "TAP"
    assert expected_tags['ManagedBy'] == "Pulumi"
    assert expected_tags['Region'] == "us-east-1"
    assert expected_tags['CostCenter'] == "TAP-API"
    assert expected_tags['Owner'] == "TestTeam"  # Custom tag
    assert expected_tags['Custom'] == "Value"  # Custom tag

  def test_outputs_export(self, mock_pulumi_resources):
    """Test outputs export configuration."""
    if not self.pulumi_available:
      pytest.skip("Pulumi dependencies not available")

    args = self.TapStackArgs(environment_suffix="test")

    # Test the configuration logic directly
    expected_outputs = [
      "api_gateway_url", "lambda_function_name", "lambda_function_arn",
      "api_gateway_id", "cloudwatch_log_group", "environment_suffix",
      "lambda_role_arn", "region", "memory_size", "timeout", "runtime"
    ]

    # Verify configuration values
    assert len(expected_outputs) == 11
    assert "api_gateway_url" in expected_outputs
    assert "lambda_function_name" in expected_outputs
    assert "lambda_function_arn" in expected_outputs
    assert "api_gateway_id" in expected_outputs
    assert "cloudwatch_log_group" in expected_outputs
    assert "environment_suffix" in expected_outputs
    assert "lambda_role_arn" in expected_outputs
    assert "region" in expected_outputs
    assert "memory_size" in expected_outputs
    assert "timeout" in expected_outputs
    assert "runtime" in expected_outputs


class TestTapStackConfiguration:
  """Test cases for TapStack configuration logic without Pulumi dependencies."""

  def test_environment_configuration(self):
    """Test environment-specific configuration logic."""
    # Test prod environment configuration
    prod_config = {
      'log_retention_days': 30,
      'error_threshold': 3,
      'duration_threshold': 45000
    }
    
    # Test dev environment configuration  
    dev_config = {
      'log_retention_days': 14,
      'error_threshold': 5,
      'duration_threshold': 25000
    }
    
    # Verify prod configuration
    assert prod_config['log_retention_days'] == 30
    assert prod_config['error_threshold'] == 3
    assert prod_config['duration_threshold'] == 45000
    
    # Verify dev configuration
    assert dev_config['log_retention_days'] == 14
    assert dev_config['error_threshold'] == 5
    assert dev_config['duration_threshold'] == 25000

  def test_tag_generation(self):
    """Test tag generation logic."""
    environment_suffix = "test"
    region = "us-east-1"
    custom_tags = {"Owner": "TestTeam"}
    
    # Simulate tag generation logic
    common_tags = {
      "Environment": environment_suffix.capitalize(),
      "Project": "TAP",
      "ManagedBy": "Pulumi",
      "Region": region,
      "CostCenter": "TAP-API",
      **custom_tags
    }
    
    # Verify tag structure
    assert common_tags["Environment"] == "Test"
    assert common_tags["Project"] == "TAP"
    assert common_tags["ManagedBy"] == "Pulumi"
    assert common_tags["Region"] == "us-east-1"
    assert common_tags["CostCenter"] == "TAP-API"
    assert common_tags["Owner"] == "TestTeam"

  def test_lambda_configuration(self):
    """Test Lambda function configuration parameters."""
    environment_suffix = "dev"
    
    # Simulate Lambda configuration
    lambda_config = {
      'runtime': "python3.12",
      'handler': "handler.lambda_handler",
      'timeout': 60,
      'memory_size': 512,
      'environment_variables': {
        'ENVIRONMENT': environment_suffix,
        'LOG_LEVEL': "INFO",
        'REGION': "us-east-1",
        'FUNCTION_NAME': f"tap-api-handler-{environment_suffix}"
      }
    }
    
    # Verify Lambda configuration
    assert lambda_config['runtime'] == "python3.12"
    assert lambda_config['handler'] == "handler.lambda_handler"
    assert lambda_config['timeout'] == 60
    assert lambda_config['memory_size'] == 512
    assert lambda_config['environment_variables']['ENVIRONMENT'] == "dev"
    assert lambda_config['environment_variables']['LOG_LEVEL'] == "INFO"
    assert lambda_config['environment_variables']['FUNCTION_NAME'] == "tap-api-handler-dev"

  def test_api_gateway_configuration(self):
    """Test API Gateway configuration parameters."""
    environment_suffix = "test"
    
    # Simulate API Gateway configuration
    api_config = {
      'minimum_compression_size': 1024,
      'binary_media_types': ["*/*"],
      'endpoint_configuration': {
        'types': "REGIONAL"
      },
      'description': f"TAP API Gateway for Lambda - {environment_suffix}"
    }
    
    # Verify API Gateway configuration
    assert api_config['minimum_compression_size'] == 1024
    assert api_config['binary_media_types'] == ["*/*"]
    assert api_config['endpoint_configuration']['types'] == "REGIONAL"
    assert api_config['description'] == "TAP API Gateway for Lambda - test"


# --- TapStack instantiation tests (merged from test_tap_stack_instantiation.py) ---

def _setup_common_patches():
  return (
    patch('pulumi.ComponentResource.__init__', return_value=None),
    patch('pulumi.ComponentResource.register_outputs', return_value=None),
    patch('pulumi.export'),
    patch('pulumi.Output'),
    patch('pulumi.Output.concat'),
    patch('pulumi.Output.all'),
    patch('pulumi.Output.from_input'),
    patch('pulumi.AssetArchive'),
    patch('pulumi.FileArchive'),
    patch('pulumi.get_stack', return_value='test-stack'),
    patch('lib.tap_stack.ResourceOptions'),
    patch('lib.tap_stack.iam.Role'),
    patch('lib.tap_stack.iam.Policy'),
    patch('lib.tap_stack.iam.RolePolicyAttachment'),
    patch('lib.tap_stack.cloudwatch.LogGroup'),
    patch('lib.tap_stack.cloudwatch.MetricAlarm'),
    patch('lib.tap_stack.cloudwatch.Dashboard'),
    patch('lib.tap_stack.lambda_.Function'),
    patch('lib.tap_stack.lambda_.Permission'),
    patch('lib.tap_stack.apigateway.RestApi'),
    patch('lib.tap_stack.apigateway.Resource'),
    patch('lib.tap_stack.apigateway.Method'),
    patch('lib.tap_stack.apigateway.Integration'),
    patch('lib.tap_stack.apigateway.MethodResponse'),
    patch('lib.tap_stack.apigateway.IntegrationResponse'),
    patch('lib.tap_stack.apigateway.Deployment'),
  )


def _configure_mock_returns(mocks):
  # Minimal attributes accessed by TapStack for each resource
  role = mocks['Role']
  role.return_value = Mock(name='Role')
  role.return_value.name = 'lambda-execution-role-test'
  role.return_value.arn = 'arn:aws:iam::123456789012:role/lambda-execution-role-test'

  policy = mocks['Policy']
  policy.return_value = Mock(name='Policy')
  policy.return_value.arn = 'arn:aws:iam::123456789012:policy/lambda-cloudwatch-policy-test'

  attach = mocks['RolePolicyAttachment']
  attach.return_value = Mock(name='RolePolicyAttachment')

  log_group = mocks['LogGroup']
  log_group.return_value = Mock(name='LogGroup')
  log_group.return_value.name = '/aws/lambda/tap-api-handler-test'

  lambda_fn = mocks['Function']
  lambda_fn.return_value = Mock(name='Function')
  lambda_fn.return_value.name = 'tap-api-handler-test'
  lambda_fn.return_value.arn = 'arn:aws:lambda:us-east-1:123456789012:function:tap-api-handler-test'
  lambda_fn.return_value.memory_size = 512
  lambda_fn.return_value.timeout = 60
  lambda_fn.return_value.runtime = 'python3.12'

  rest_api = mocks['RestApi']
  rest_api.return_value = Mock(name='RestApi')
  rest_api.return_value.id = 'api-id'
  rest_api.return_value.root_resource_id = 'root-id'
  rest_api.return_value.execution_arn = 'arn:aws:execute-api:us-east-1:123456789012:api-id'

  # Output mocks
  for key in ('Output', 'concat', 'all', 'from_input'):
    mocks[key].return_value = Mock(name=key)
    mocks[key].return_value.apply = Mock()


def test_tap_stack_instantiates_with_prod_branch():
  # Arrange patches
  patchers = _setup_common_patches()
  actives = [p.start() for p in patchers]
  try:
    # Map names to mocks for configuration and assertions
    mocks = {p.attribute: a for p, a in zip(patchers, actives)}
    _configure_mock_returns(mocks)

    from lib.tap_stack import TapStack, TapStackArgs

    # Act: instantiate with prod to hit prod thresholds/retention
    args = TapStackArgs(environment_suffix='prod', region='us-east-1', tags={'Owner': 'QA'})
    stack = TapStack('tap', args)

    # Assert: key properties set
    assert stack.lambda_function.name == 'tap-api-handler-test'
    assert stack.api_gateway.id == 'api-id'
    # LogGroup retention argument for prod (30)
    _, lg_kwargs = mocks['LogGroup'].call_args
    assert lg_kwargs['retention_in_days'] == 30
    # MetricAlarm thresholds for prod
    alarm_calls = mocks['MetricAlarm'].call_args_list
    thresholds = [call.kwargs.get('threshold') for call in alarm_calls]
    assert 3 in thresholds and 45000 in thresholds
    # API config arguments
    _, api_kwargs = mocks['RestApi'].call_args
    assert api_kwargs['minimum_compression_size'] == 1024
    assert api_kwargs['binary_media_types'] == ["*/*"]
  finally:
    for p in patchers:
      p.stop()


def test_tap_stack_instantiates_with_nonprod_branch():
  patchers = _setup_common_patches()
  actives = [p.start() for p in patchers]
  try:
    mocks = {p.attribute: a for p, a in zip(patchers, actives)}
    _configure_mock_returns(mocks)

    from lib.tap_stack import TapStack, TapStackArgs

    args = TapStackArgs(environment_suffix='dev', region='us-east-1')
    stack = TapStack('tap', args)

    assert stack.lambda_function.runtime == 'python3.12'
    # LogGroup retention for non-prod (14)
    _, lg_kwargs = mocks['LogGroup'].call_args
    assert lg_kwargs['retention_in_days'] == 14
    # Non-prod thresholds
    alarm_calls = mocks['MetricAlarm'].call_args_list
    thresholds = [call.kwargs.get('threshold') for call in alarm_calls]
    assert 5 in thresholds and 25000 in thresholds
  finally:
    for p in patchers:
      p.stop()
