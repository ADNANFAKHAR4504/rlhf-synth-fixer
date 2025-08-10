"""
test_tap_stack.py

Comprehensive unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import Mock, patch

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


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


def create_mock_resource(name_prefix="mock"):
  """Create a properly mocked Pulumi resource."""
  # Create a mock that inherits from a base class to satisfy isinstance checks
  class MockResource:
    def __init__(self):
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

  return MockResource()


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
      'integration': create_mock_resource("integration"),
      'deployment': create_mock_resource("deployment"),
      'stage': create_mock_resource("stage"),
      'permission': create_mock_resource("permission"),
      'policy_attachment': create_mock_resource("policy")
    }

    # Mock Pulumi config
    mock_config_instance = Mock()
    mock_config_instance.get.return_value = 'test'

    patches = {
      'config': patch('pulumi.Config', return_value=mock_config_instance),
      'component_init': patch('pulumi.ComponentResource.__init__', return_value=None),
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
                         return_value=mock_resources['method']),
      'api_integration': patch('pulumi_aws.apigateway.Integration', 
                              return_value=mock_resources['integration']),
      'api_deployment': patch('pulumi_aws.apigateway.Deployment', 
                             return_value=mock_resources['deployment']),
      'api_stage': patch('pulumi_aws.apigateway.Stage', 
                        return_value=mock_resources['stage']),
      'path_dirname': patch('os.path.dirname', return_value='/mock/lib/path'),
      'path_join': patch('os.path.join', return_value='/mock/lib/path/lambda_function.py')
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


if __name__ == '__main__':
  unittest.main()
