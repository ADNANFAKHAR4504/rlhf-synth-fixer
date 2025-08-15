"""test_tap_stack.py

Unit tests for the TapStack Pulumi component and Lambda function using proper Pulumi mocking.
Achieves 100% coverage on tap_stack.py through comprehensive infrastructure.
"""

import json
import os
import sys
import unittest
from unittest.mock import Mock, patch

import pulumi

from lib import lambda_function
from lib.tap_stack import TapStack, TapStackArgs

# Add the current directory to Python path to import lambda_function
sys.path.insert(0, os.path.dirname(__file__))


# Create a proper resource mock that passes isinstance checks
class MockResource(pulumi.Resource):
  """Mock resource that inherits from pulumi.Resource for proper validation."""
  
  def __init__(self, name, **attrs):  # pylint: disable=super-init-not-called
    # Initialize all attributes needed by tests in __init__ to avoid pylint warnings
    self.name = name
    self.arn = f"arn:aws:mock::{name}"
    self.id = f"{name}-id"
    self.invoke_arn = f"arn:aws:mock:invoke::{name}"
    self.root_resource_id = f"{name}-root-id"
    self.execution_arn = f"arn:aws:mock:execute::{name}"
    self.http_method = 'ANY'
    # Don't call super().__init__ to avoid Pulumi registration
    object.__setattr__(self, '_name', name)
    object.__setattr__(self, '_is_resource', True)
    # Override with any provided attributes
    for key, value in attrs.items():
      setattr(self, key, value)


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

  def test_tap_stack_args_none_tags(self):
    """Test TapStackArgs with None tags."""
    args = TapStackArgs(tags=None)
    self.assertIsNone(args.tags)

  def test_tap_stack_args_complex_tags(self):
    """Test TapStackArgs with complex tag structure."""
    complex_tags = {
      "Environment": "production",
      "Team": "infrastructure", 
      "CostCenter": "12345",
      "Project": "serverless-api",
      "Owner": "devops@company.com",
      "BackupRequired": "true"
    }
    args = TapStackArgs(environment_suffix='prod', tags=complex_tags)
    self.assertEqual(args.environment_suffix, 'prod')
    self.assertEqual(args.tags, complex_tags)
    self.assertEqual(len(args.tags), 6)

  def test_tap_stack_args_edge_cases(self):
    """Test TapStackArgs with various edge cases to ensure complete coverage."""
    # Test with empty string environment suffix (should default to 'dev')
    args1 = TapStackArgs(environment_suffix="")
    self.assertEqual(args1.environment_suffix, 'dev')
    
    # Test with whitespace environment suffix (should preserve whitespace)
    args2 = TapStackArgs(environment_suffix="   ")
    self.assertEqual(args2.environment_suffix, '   ')
    
    # Test with zero as environment suffix (should default to 'dev')
    args3 = TapStackArgs(environment_suffix=0)
    self.assertEqual(args3.environment_suffix, 'dev')
    
    # Test with empty dict as tags
    args4 = TapStackArgs(tags={})
    self.assertEqual(args4.tags, {})


class TestTapStackInfrastructure(unittest.TestCase):
  """Test cases for TapStack infrastructure components using proper Pulumi mocking."""

  def setUp(self):
    """Set up test fixtures."""
    self.test_args = TapStackArgs(
      environment_suffix='test',
      tags={'Environment': 'test', 'Project': 'serverless-test'}
    )

  def test_tap_stack_complete_initialization(self):
    """Test complete TapStack initialization with 100% code coverage using MockResource."""
    
    # Create comprehensive mocking for all Pulumi components using MockResource
    with patch('pulumi.ComponentResource.__init__', return_value=None), \
       patch('pulumi.Config') as mock_config_class, \
       patch('os.path.dirname') as mock_dirname, \
       patch('os.path.join') as mock_join, \
       patch('pulumi.export') as mock_export, \
       patch('pulumi_aws.iam.Role') as mock_iam_role, \
       patch('pulumi_aws.iam.RolePolicyAttachment') as mock_policy_attachment, \
       patch('pulumi_aws.cloudwatch.LogGroup') as mock_log_group, \
       patch('pulumi_aws.lambda_.Function') as mock_lambda_function, \
       patch('pulumi_aws.apigateway.RestApi') as mock_api_gateway, \
       patch('pulumi_aws.apigateway.Resource') as mock_api_resource, \
       patch('pulumi_aws.apigateway.Method') as mock_api_method, \
       patch('pulumi_aws.apigateway.Integration') as mock_api_integration, \
       patch('pulumi_aws.lambda_.Permission') as mock_lambda_permission, \
       patch('pulumi_aws.apigateway.Deployment') as mock_api_deployment, \
       patch('pulumi_aws.apigateway.Stage') as mock_api_stage, \
       patch('pulumi.Output.concat', return_value=Mock()):
      
      # Setup mocks with proper return values
      mock_config = Mock()
      mock_config.get.return_value = 'test'
      mock_config_class.return_value = mock_config
      
      mock_dirname.return_value = '/test/lib'
      mock_join.return_value = '/test/lib/lambda_function.py'
      
      # Create resource mocks with proper MockResource class that inherits from pulumi.Resource
      role_mock = MockResource('test-lambda-execution-role')
      role_mock.name = "test-lambda-execution-role"
      role_mock.arn = "arn:aws:iam::123456789012:role/test-lambda-execution-role"
      mock_iam_role.return_value = role_mock
      
      log_mock = MockResource('log-group')
      mock_log_group.return_value = log_mock
      
      lambda_mock = MockResource('test-api-handler')
      lambda_mock.name = "test-api-handler"
      lambda_mock.arn = "arn:aws:lambda:us-west-2:123456789012:function:test-api-handler"
      lambda_mock.invoke_arn = ("arn:aws:apigateway:us-west-2:lambda:path/"
                                 "2015-03-31/functions/arn:aws:lambda:us-west-2:"
                                 "123456789012:function:test-api-handler/invocations")
      mock_lambda_function.return_value = lambda_mock
      
      api_mock = MockResource('api-gateway')
      api_mock.id = "test-api-id"
      api_mock.root_resource_id = "root-resource-id"
      api_mock.execution_arn = ("arn:aws:execute-api:us-west-2:"
                                "123456789012:test-api-id")
      mock_api_gateway.return_value = api_mock
      
      # Mock other resources with MockResource class
      mock_api_resource.return_value = MockResource('api-resource')
      
      method_mock = MockResource('method')
      method_mock.http_method = 'ANY'
      mock_api_method.return_value = method_mock
      
      mock_api_integration.return_value = MockResource('integration')
      mock_lambda_permission.return_value = MockResource('permission')
      mock_api_deployment.return_value = MockResource('deployment')
      mock_api_stage.return_value = MockResource('stage')
      mock_policy_attachment.return_value = MockResource('policy')
      
      # Create stack to execute all code paths
      stack = TapStack('comprehensive-stack', self.test_args)
      
      # Verify stack attributes are properly set
      self.assertEqual(stack.environment_suffix, 'test')
      self.assertEqual(stack.tags, {'Environment': 'test', 'Project': 'serverless-test'})
      
      # Verify all exports were called (5 total)
      self.assertEqual(mock_export.call_count, 5)
      
      # Verify all expected exports
      export_calls = [call[0][0] for call in mock_export.call_args_list]
      expected_exports = [
        'lambda_function_name',
        'lambda_function_arn',
        'api_gateway_url', 
        'api_gateway_id',
        'cloudwatch_log_group'
      ]
      
      for expected_export in expected_exports:
        self.assertIn(expected_export, export_calls)

  def test_tap_stack_with_none_environment_config(self):
    """Test TapStack when Pulumi config returns None for environment."""
    
    with patch('pulumi.ComponentResource.__init__', return_value=None), \
       patch('pulumi.Config') as mock_config_class, \
       patch('pulumi.export'), \
       patch('pulumi_aws.iam.Role') as mock_iam_role, \
       patch('pulumi_aws.iam.RolePolicyAttachment') as mock_policy_attachment, \
       patch('pulumi_aws.cloudwatch.LogGroup') as mock_log_group, \
       patch('pulumi_aws.lambda_.Function') as mock_lambda_function, \
       patch('pulumi_aws.apigateway.RestApi') as mock_api_gateway, \
       patch('pulumi_aws.apigateway.Resource') as mock_api_resource, \
       patch('pulumi_aws.apigateway.Method') as mock_api_method, \
       patch('pulumi_aws.apigateway.Integration') as mock_api_integration, \
       patch('pulumi_aws.lambda_.Permission') as mock_lambda_permission, \
       patch('pulumi_aws.apigateway.Deployment') as mock_api_deployment, \
       patch('pulumi_aws.apigateway.Stage') as mock_api_stage, \
       patch('pulumi.Output.concat', return_value=Mock()):
      
      # Mock config to return None for environment
      mock_config = Mock()
      mock_config.get.return_value = None
      mock_config_class.return_value = mock_config
      
      # Set up MockResource instances  
      mock_iam_role.return_value = MockResource('role')
      mock_policy_attachment.return_value = MockResource('policy')
      mock_log_group.return_value = MockResource('log')
      mock_lambda_function.return_value = MockResource('lambda', invoke_arn='test')
      mock_api_gateway.return_value = MockResource('api', execution_arn='test')
      mock_api_resource.return_value = MockResource('resource')
      mock_api_method.return_value = MockResource('method', http_method='ANY')
      mock_api_integration.return_value = MockResource('integration')
      mock_lambda_permission.return_value = MockResource('permission')
      mock_api_deployment.return_value = MockResource('deployment')
      mock_api_stage.return_value = MockResource('stage')
      
      args = TapStackArgs(environment_suffix='none-env-test')
      TapStack('none-env-test-stack', args)
      
      # Verify config.get was called with "environment"
      mock_config.get.assert_called_with("environment")

  def test_common_tags_generation(self):
    """Test common tags generation with different environment configurations."""
    
    with patch('pulumi.ComponentResource.__init__', return_value=None), \
       patch('pulumi.ResourceOptions'), \
       patch('pulumi.Config') as mock_config_class, \
       patch('pulumi.export'), \
       patch('pulumi_aws.iam.Role') as mock_role_class, \
       patch('pulumi_aws.iam.RolePolicyAttachment') as mock_policy, \
       patch('pulumi_aws.cloudwatch.LogGroup') as mock_log_group, \
       patch('pulumi_aws.lambda_.Function') as mock_lambda, \
       patch('pulumi_aws.apigateway.RestApi') as mock_api, \
       patch('pulumi_aws.apigateway.Resource') as mock_resource, \
       patch('pulumi_aws.apigateway.Method') as mock_method, \
       patch('pulumi_aws.apigateway.Integration') as mock_integration, \
       patch('pulumi_aws.lambda_.Permission') as mock_permission, \
       patch('pulumi_aws.apigateway.Deployment') as mock_deployment, \
       patch('pulumi_aws.apigateway.Stage') as mock_stage:
      
      # Test with production environment
      mock_config = Mock()
      mock_config.get.return_value = 'production'
      mock_config_class.return_value = mock_config
      
      # Set up MockResource instances for all resources  
      mock_role_class.return_value = MockResource('role')
      mock_policy.return_value = MockResource('policy')
      mock_log_group.return_value = MockResource('log')
      mock_lambda.return_value = MockResource('lambda', invoke_arn='test')
      mock_api.return_value = MockResource('api', execution_arn='test')
      mock_resource.return_value = MockResource('resource')
      mock_method.return_value = MockResource('method', http_method='ANY')
      mock_integration.return_value = MockResource('integration')
      mock_permission.return_value = MockResource('permission')
      mock_deployment.return_value = MockResource('deployment')
      mock_stage.return_value = MockResource('stage')
      
      args = TapStackArgs(environment_suffix='tag-test')
      TapStack('tag-test-stack', args)
      
      # Verify role was created with proper tags
      self.assertTrue(mock_role_class.called)
      call_args = mock_role_class.call_args
      tags = call_args[1]['tags']
      
      # Verify all required tag keys and values
      self.assertIn('project', tags)
      self.assertIn('environment', tags)
      self.assertIn('managed-by', tags)
      self.assertEqual(tags['project'], 'serverless-infra-pulumi')
      self.assertEqual(tags['environment'], 'production')
      self.assertEqual(tags['managed-by'], 'pulumi')

  def test_iam_role_policy_document(self):
    """Test IAM role assume role policy document generation."""
    
    with patch('pulumi.ComponentResource.__init__', return_value=None), \
       patch('pulumi.ResourceOptions'), \
       patch('pulumi.export'), \
       patch('pulumi_aws.iam.Role') as mock_role_class, \
       patch('pulumi_aws.iam.RolePolicyAttachment') as mock_policy, \
       patch('pulumi_aws.cloudwatch.LogGroup') as mock_log_group, \
       patch('pulumi_aws.lambda_.Function') as mock_lambda, \
       patch('pulumi_aws.apigateway.RestApi') as mock_api, \
       patch('pulumi_aws.apigateway.Resource') as mock_resource, \
       patch('pulumi_aws.apigateway.Method') as mock_method, \
       patch('pulumi_aws.apigateway.Integration') as mock_integration, \
       patch('pulumi_aws.lambda_.Permission') as mock_permission, \
       patch('pulumi_aws.apigateway.Deployment') as mock_deployment, \
       patch('pulumi_aws.apigateway.Stage') as mock_stage:
      
      # Set up MockResource instances for all resources
      mock_role_class.return_value = MockResource('role')
      mock_policy.return_value = MockResource('policy')
      mock_log_group.return_value = MockResource('log')
      mock_lambda.return_value = MockResource('lambda', invoke_arn='test')
      mock_api.return_value = MockResource('api', execution_arn='test')
      mock_resource.return_value = MockResource('resource')
      mock_method.return_value = MockResource('method', http_method='ANY')
      mock_integration.return_value = MockResource('integration')
      mock_permission.return_value = MockResource('permission')
      mock_deployment.return_value = MockResource('deployment')
      mock_stage.return_value = MockResource('stage')
      
      args = TapStackArgs(environment_suffix='policy-test')
      TapStack('policy-test-stack', args)
      
      # Verify IAM role was created with correct policy
      self.assertTrue(mock_role_class.called)
      call_args = mock_role_class.call_args
      
      # Parse and verify the assume role policy JSON
      assume_role_policy = call_args[1]['assume_role_policy']
      policy_dict = json.loads(assume_role_policy)
      
      self.assertEqual(policy_dict['Version'], '2012-10-17')
      self.assertEqual(len(policy_dict['Statement']), 1)
      
      statement = policy_dict['Statement'][0]
      self.assertEqual(statement['Action'], 'sts:AssumeRole')
      self.assertEqual(statement['Effect'], 'Allow')
      self.assertEqual(statement['Principal']['Service'], 'lambda.amazonaws.com')

  def test_lambda_function_configuration(self):
    """Test Lambda function configuration parameters."""
    
    with patch('pulumi.ComponentResource.__init__', return_value=None), \
       patch('pulumi.ResourceOptions'), \
       patch('pulumi.export'), \
       patch('pulumi_aws.iam.Role') as mock_role, \
       patch('pulumi_aws.iam.RolePolicyAttachment') as mock_policy, \
       patch('pulumi_aws.cloudwatch.LogGroup') as mock_log_group, \
       patch('pulumi_aws.lambda_.Function') as mock_lambda_class, \
       patch('pulumi_aws.apigateway.RestApi') as mock_api, \
       patch('pulumi_aws.apigateway.Resource') as mock_resource, \
       patch('pulumi_aws.apigateway.Method') as mock_method, \
       patch('pulumi_aws.apigateway.Integration') as mock_integration, \
       patch('pulumi_aws.lambda_.Permission') as mock_permission, \
       patch('pulumi_aws.apigateway.Deployment') as mock_deployment, \
       patch('pulumi_aws.apigateway.Stage') as mock_stage:
      
      # Set up MockResource instances for all resources
      mock_role.return_value = MockResource('role')
      mock_policy.return_value = MockResource('policy')
      mock_log_group.return_value = MockResource('log')
      mock_lambda_class.return_value = MockResource('lambda')
      mock_api.return_value = MockResource('api', execution_arn='test')
      mock_resource.return_value = MockResource('resource')
      mock_method.return_value = MockResource('method', http_method='ANY')
      mock_integration.return_value = MockResource('integration')
      mock_permission.return_value = MockResource('permission')
      mock_deployment.return_value = MockResource('deployment')
      mock_stage.return_value = MockResource('stage')
      
      args = TapStackArgs(environment_suffix='lambda-test')
      TapStack('lambda-test-stack', args)
      
      # Verify Lambda function was created with correct configuration
      self.assertTrue(mock_lambda_class.called)
      call_args = mock_lambda_class.call_args
      
      # Check Lambda configuration parameters
      self.assertEqual(call_args[1]['runtime'], 'python3.9')
      self.assertEqual(call_args[1]['handler'], 'lambda_function.lambda_handler')
      self.assertEqual(call_args[1]['timeout'], 30)
      self.assertEqual(call_args[1]['memory_size'], 128)
      
      # Check environment variables
      env_vars = call_args[1]['environment']['variables']
      self.assertIn('ENVIRONMENT', env_vars)
      self.assertIn('LOG_LEVEL', env_vars)
      self.assertEqual(env_vars['LOG_LEVEL'], 'INFO')

  def test_lambda_asset_archive_creation(self):
    """Test Lambda function code asset archive creation."""
    
    with patch('pulumi.ComponentResource.__init__', return_value=None), \
       patch('pulumi.ResourceOptions'), \
       patch('pulumi.export'), \
       patch('pulumi_aws.iam.Role') as mock_role, \
       patch('pulumi_aws.iam.RolePolicyAttachment') as mock_policy, \
       patch('pulumi_aws.cloudwatch.LogGroup') as mock_log_group, \
       patch('pulumi_aws.lambda_.Function') as mock_lambda_class, \
       patch('pulumi_aws.apigateway.RestApi') as mock_api, \
       patch('pulumi_aws.apigateway.Resource') as mock_resource, \
       patch('pulumi_aws.apigateway.Method') as mock_method, \
       patch('pulumi_aws.apigateway.Integration') as mock_integration, \
       patch('pulumi_aws.lambda_.Permission') as mock_permission, \
       patch('pulumi_aws.apigateway.Deployment') as mock_deployment, \
       patch('pulumi_aws.apigateway.Stage') as mock_stage, \
       patch('os.path.dirname') as mock_dirname, \
       patch('os.path.join') as mock_join:
      
      mock_dirname.return_value = '/test/lib'
      mock_join.return_value = '/test/lib/lambda_function.py'
      
      # Set up MockResource instances for all resources
      mock_role.return_value = MockResource('role')
      mock_policy.return_value = MockResource('policy')
      mock_log_group.return_value = MockResource('log')
      mock_lambda_class.return_value = MockResource('lambda')
      mock_api.return_value = MockResource('api', execution_arn='test')
      mock_resource.return_value = MockResource('resource')
      mock_method.return_value = MockResource('method', http_method='ANY')
      mock_integration.return_value = MockResource('integration')
      mock_permission.return_value = MockResource('permission')
      mock_deployment.return_value = MockResource('deployment')
      mock_stage.return_value = MockResource('stage')
      
      args = TapStackArgs(environment_suffix='asset-test')
      TapStack('asset-test-stack', args)
      
      # Verify Lambda function was created
      self.assertTrue(mock_lambda_class.called)
      call_args = mock_lambda_class.call_args
      
      # Check code asset archive
      code = call_args[1]['code']
      self.assertIsInstance(code, pulumi.AssetArchive)
      
      # Verify path construction
      mock_dirname.assert_called()
      mock_join.assert_called_with('/test/lib', 'lambda_function.py')

  def test_all_resource_creation_calls(self):
    """Test that all AWS resources are created with correct call counts."""
    
    with patch('pulumi.ComponentResource.__init__', return_value=None), \
       patch('pulumi.ResourceOptions'), \
       patch('pulumi.export') as mock_export, \
       patch('pulumi_aws.iam.Role') as mock_iam_role, \
       patch('pulumi_aws.iam.RolePolicyAttachment') as mock_policy_attachment, \
       patch('pulumi_aws.cloudwatch.LogGroup') as mock_log_group, \
       patch('pulumi_aws.lambda_.Function') as mock_lambda_function, \
       patch('pulumi_aws.apigateway.RestApi') as mock_api_gateway, \
       patch('pulumi_aws.apigateway.Resource') as mock_api_resource, \
       patch('pulumi_aws.apigateway.Method') as mock_api_method, \
       patch('pulumi_aws.apigateway.Integration') as mock_api_integration, \
       patch('pulumi_aws.lambda_.Permission') as mock_lambda_permission, \
       patch('pulumi_aws.apigateway.Deployment') as mock_api_deployment, \
       patch('pulumi_aws.apigateway.Stage') as mock_api_stage:
      
      # Set up MockResource instances for all resources
      mock_iam_role.return_value = MockResource('role')
      mock_policy_attachment.return_value = MockResource('policy')
      mock_log_group.return_value = MockResource('log')
      mock_lambda_function.return_value = MockResource('lambda', invoke_arn='test')
      mock_api_gateway.return_value = MockResource('api', execution_arn='test')
      mock_api_resource.return_value = MockResource('resource')
      mock_api_method.return_value = MockResource('method', http_method='ANY')
      mock_api_integration.return_value = MockResource('integration')
      mock_lambda_permission.return_value = MockResource('permission')
      mock_api_deployment.return_value = MockResource('deployment')
      mock_api_stage.return_value = MockResource('stage')
      
      args = TapStackArgs(environment_suffix='resource-test')
      TapStack('resource-test-stack', args)
      
      # Verify all resources were created exactly once
      mock_iam_role.assert_called_once()
      mock_policy_attachment.assert_called_once()
      mock_log_group.assert_called_once()
      mock_lambda_function.assert_called_once()
      mock_api_gateway.assert_called_once()
      mock_api_resource.assert_called_once()
      mock_lambda_permission.assert_called_once()
      mock_api_deployment.assert_called_once()
      mock_api_stage.assert_called_once()
      
      # API methods and integrations should be called twice (proxy + root)
      self.assertEqual(mock_api_method.call_count, 2)
      self.assertEqual(mock_api_integration.call_count, 2)
      
      # Exports should be called 5 times
      self.assertEqual(mock_export.call_count, 5)

  def test_resource_naming_conventions(self):
    """Test that all resources follow proper naming conventions."""
    
    with patch('pulumi.ComponentResource.__init__', return_value=None), \
       patch('pulumi.ResourceOptions'), \
       patch('pulumi.Config') as mock_config_class, \
       patch('pulumi.export'), \
       patch('pulumi_aws.iam.Role') as mock_iam_role, \
       patch('pulumi_aws.cloudwatch.LogGroup') as mock_log_group, \
       patch('pulumi_aws.lambda_.Function') as mock_lambda_function, \
       patch('pulumi_aws.apigateway.RestApi') as mock_api_gateway, \
       patch('pulumi_aws.iam.RolePolicyAttachment') as mock_policy, \
       patch('pulumi_aws.apigateway.Resource') as mock_resource, \
       patch('pulumi_aws.apigateway.Method') as mock_method, \
       patch('pulumi_aws.apigateway.Integration') as mock_integration, \
       patch('pulumi_aws.lambda_.Permission') as mock_permission, \
       patch('pulumi_aws.apigateway.Deployment') as mock_deployment, \
       patch('pulumi_aws.apigateway.Stage') as mock_stage:
      
      # Mock config to return 'test' for environment  
      mock_config = Mock()
      mock_config.get.return_value = 'test'
      mock_config_class.return_value = mock_config
      
      # Set up MockResource instances for all resources
      mock_iam_role.return_value = MockResource('role')
      mock_policy.return_value = MockResource('policy')
      mock_log_group.return_value = MockResource('log')
      mock_lambda_function.return_value = MockResource('lambda', invoke_arn='test')
      mock_api_gateway.return_value = MockResource('api', execution_arn='test')
      mock_resource.return_value = MockResource('resource')
      mock_method.return_value = MockResource('method', http_method='ANY')
      mock_integration.return_value = MockResource('integration')
      mock_permission.return_value = MockResource('permission')
      mock_deployment.return_value = MockResource('deployment')
      mock_stage.return_value = MockResource('stage')
      
      args = TapStackArgs(environment_suffix='test')
      TapStack('test-stack', args)
      
      # Check IAM role naming
      role_call = mock_iam_role.call_args
      self.assertEqual(role_call[0][0], 'test-lambda-execution-role')
      
      # Check Log group naming  
      log_call = mock_log_group.call_args
      self.assertEqual(log_call[1]['name'], '/aws/lambda/test-api-handler')
      
      # Check Lambda function naming
      lambda_call = mock_lambda_function.call_args
      self.assertEqual(lambda_call[0][0], 'test-api-handler')
      self.assertEqual(lambda_call[1]['name'], 'test-api-handler')
      
      # Check API Gateway naming
      api_call = mock_api_gateway.call_args
      self.assertEqual(api_call[0][0], 'test-serverless-api')
      self.assertEqual(api_call[1]['name'], 'test-serverless-api')

  def test_register_outputs_call(self):
    """Test that register_outputs is called at the end of stack creation."""
    
    with patch('pulumi.ComponentResource.__init__', return_value=None), \
       patch('pulumi.ResourceOptions'), \
       patch('pulumi.export'), \
       patch('pulumi_aws.iam.Role') as mock_iam_role, \
       patch('pulumi_aws.iam.RolePolicyAttachment') as mock_policy_attachment, \
       patch('pulumi_aws.cloudwatch.LogGroup') as mock_log_group, \
       patch('pulumi_aws.lambda_.Function') as mock_lambda_function, \
       patch('pulumi_aws.apigateway.RestApi') as mock_api_gateway, \
       patch('pulumi_aws.apigateway.Resource') as mock_api_resource, \
       patch('pulumi_aws.apigateway.Method') as mock_api_method, \
       patch('pulumi_aws.apigateway.Integration') as mock_api_integration, \
       patch('pulumi_aws.lambda_.Permission') as mock_lambda_permission, \
       patch('pulumi_aws.apigateway.Deployment') as mock_api_deployment, \
       patch('pulumi_aws.apigateway.Stage') as mock_api_stage:
      
      # Set up MockResource instances for all resources
      mock_iam_role.return_value = MockResource('role')
      mock_policy_attachment.return_value = MockResource('policy')
      mock_log_group.return_value = MockResource('log')
      mock_lambda_function.return_value = MockResource('lambda', invoke_arn='test')
      mock_api_gateway.return_value = MockResource('api', execution_arn='test')
      mock_api_resource.return_value = MockResource('resource')
      mock_api_method.return_value = MockResource('method', http_method='ANY')
      mock_api_integration.return_value = MockResource('integration')
      mock_lambda_permission.return_value = MockResource('permission')
      mock_api_deployment.return_value = MockResource('deployment')
      mock_api_stage.return_value = MockResource('stage')
      
      args = TapStackArgs(environment_suffix='outputs-test')
      
      with patch.object(TapStack, 'register_outputs') as mock_register:
        TapStack('outputs-test-stack', args)
        
        # Verify register_outputs was called with empty dict
        mock_register.assert_called_once_with({})


class TestTapStackLambda(unittest.TestCase):
  """Test cases for Lambda function functionality."""

  def setUp(self):
    """Set up test fixtures before each test method."""
    self.mock_context = type('MockContext', (), {})()
    self.mock_context.function_name = "test-api-handler"
    self.mock_context.function_version = "1"
    self.mock_context.aws_request_id = "test-request-id-123"
    self.mock_context.memory_limit_in_mb = 128

    # Set environment variables for testing
    os.environ['ENVIRONMENT'] = 'test'
    os.environ['LOG_LEVEL'] = 'INFO'

  def create_api_gateway_event(self, method='GET', path='/', query_params=None, headers=None):
    """Create a mock API Gateway event for testing."""
    return {
      "httpMethod": method,
      "path": path,
      "queryStringParameters": query_params,
      "headers": headers or {"User-Agent": "test-client/1.0", "Content-Type": "application/json"},
      "body": None,
      "isBase64Encoded": False,
      "requestContext": {"requestId": "test-request-123", "stage": "test"}
    }

  def test_lambda_handler_successful_request(self):
    """Test successful Lambda handler execution."""
    event = self.create_api_gateway_event(method='GET', path='/')
    response = lambda_function.lambda_handler(event, self.mock_context)
    
    self.assertEqual(response['statusCode'], 200)
    self.assertIn('Content-Type', response['headers'])
    self.assertEqual(response['headers']['Content-Type'], 'application/json')
    
    body = json.loads(response['body'])
    self.assertIn('message', body)
    self.assertIn('timestamp', body)
    self.assertIn('environment', body)
    self.assertIn('request_info', body)
    self.assertIn('lambda_info', body)

  def test_lambda_handler_health_endpoint(self):
    """Test Lambda handler health check endpoint."""
    event = self.create_api_gateway_event(method='GET', path='/health')
    response = lambda_function.lambda_handler(event, self.mock_context)
    
    self.assertEqual(response['statusCode'], 200)
    body = json.loads(response['body'])
    self.assertIn('status', body)
    self.assertEqual(body['status'], 'healthy')

  def test_lambda_handler_info_endpoint(self):
    """Test Lambda handler info endpoint."""
    event = self.create_api_gateway_event(method='GET', path='/info')
    response = lambda_function.lambda_handler(event, self.mock_context)
    
    self.assertEqual(response['statusCode'], 200)
    body = json.loads(response['body'])
    self.assertIn('Serverless application information', body['message'])

  def test_lambda_handler_exception_handling(self):
    """Test Lambda handler exception handling."""
    # Pass None event to trigger exception
    response = lambda_function.lambda_handler(None, self.mock_context)
    
    self.assertEqual(response['statusCode'], 500)
    body = json.loads(response['body'])
    self.assertIn('error', body)
    self.assertIn('Internal server error', body['error'])

  def test_lambda_handler_cors_headers(self):
    """Test that Lambda handler includes CORS headers."""
    event = self.create_api_gateway_event()
    response = lambda_function.lambda_handler(event, self.mock_context)
    
    headers = response['headers']
    self.assertIn('Access-Control-Allow-Origin', headers)
    self.assertIn('Access-Control-Allow-Methods', headers)
    self.assertIn('Access-Control-Allow-Headers', headers)
    self.assertEqual(headers['Access-Control-Allow-Origin'], '*')

  def test_lambda_handler_query_parameters(self):
    """Test Lambda handler with query parameters."""
    query_params = {"param1": "value1", "param2": "value2"}
    event = self.create_api_gateway_event(
      method='POST', path='/api/test', query_params=query_params
    )
    
    response = lambda_function.lambda_handler(event, self.mock_context)
    self.assertEqual(response['statusCode'], 200)
    
    body = json.loads(response['body'])
    self.assertEqual(body['request_info']['query_parameters'], query_params)

  def test_lambda_handler_missing_event_properties(self):
    """Test Lambda handler with missing event properties."""
    event = {}  # Empty event
    response = lambda_function.lambda_handler(event, self.mock_context)
    
    self.assertEqual(response['statusCode'], 200)
    body = json.loads(response['body'])
    self.assertEqual(body['request_info']['method'], 'UNKNOWN')
    self.assertEqual(body['request_info']['path'], '/')

  def test_lambda_handler_none_context(self):
    """Test Lambda handler with None context."""
    event = None
    context = None
    response = lambda_function.lambda_handler(event, context)
    
    self.assertEqual(response['statusCode'], 500)
    body = json.loads(response['body'])
    self.assertEqual(body['request_id'], 'unknown')

  def test_health_check_function(self):
    """Test standalone health check function."""
    result = lambda_function.health_check()
    
    self.assertIn('status', result)
    self.assertEqual(result['status'], 'healthy')
    self.assertIn('timestamp', result)
    self.assertIn('service', result)
    self.assertEqual(result['service'], 'serverless-web-app')

  def test_handle_options_function(self):
    """Test OPTIONS request handler."""
    result = lambda_function.handle_options()
    
    self.assertEqual(result['statusCode'], 200)
    self.assertEqual(result['body'], '')
    
    headers = result['headers']
    self.assertEqual(headers['Access-Control-Allow-Origin'], '*')
    self.assertIn('GET', headers['Access-Control-Allow-Methods'])
    self.assertIn('POST', headers['Access-Control-Allow-Methods'])

  def test_lambda_handler_different_http_methods(self):
    """Test Lambda handler with different HTTP methods."""
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    
    for method in methods:
      with self.subTest(method=method):
        event = self.create_api_gateway_event(method=method, path='/test')
        response = lambda_function.lambda_handler(event, self.mock_context)
        
        self.assertEqual(response['statusCode'], 200)
        body = json.loads(response['body'])
        self.assertEqual(body['request_info']['method'], method)

  def test_lambda_handler_none_query_parameters(self):
    """Test Lambda handler with None query parameters."""
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

  def test_lambda_handler_none_headers(self):
    """Test Lambda handler with None headers."""
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


if __name__ == '__main__':
  # Configure test environment
  os.environ.setdefault('PULUMI_CONFIG_PASSPHRASE', '')
  os.environ.setdefault('PULUMI_SKIP_UPDATE_CHECK', 'true')
  
  # Run the tests
  unittest.main(verbosity=2)
