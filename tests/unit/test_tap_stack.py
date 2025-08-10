"""
test_tap_stack.py

Comprehensive unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import json
import os
import unittest
from unittest.mock import Mock, patch, MagicMock
from moto import mock_aws
import pulumi
from pulumi import ResourceOptions

# Import the classes we're testing
from lib.tap_stack import TapStackArgs, TapStack


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

    def test_tap_stack_args_empty_tags(self):
        """Test TapStackArgs with empty tags dict."""
        args = TapStackArgs(tags={})
        self.assertEqual(args.tags, {})


class MockPulumiResource:
    """Mock class to simulate Pulumi resource behavior."""
    def __init__(self, name, resource_type, props=None, opts=None):
        self.name = name
        self.resource_type = resource_type
        self.props = props or {}
        self.opts = opts
        self.arn = f"arn:aws:mock:us-west-2:123456789012:resource/{name}"
        self.id = f"mock-{name}"
        
        # Mock common attributes based on resource type
        if 'lambda' in resource_type.lower():
            self.invoke_arn = f"arn:aws:apigateway:us-west-2:lambda:path/2015-03-31/functions/{self.arn}/invocations"
        elif 'apigateway' in resource_type.lower():
            self.root_resource_id = "mock-root-resource-id"
            self.execution_arn = f"arn:aws:execute-api:us-west-2:123456789012:{self.id}"
        

class TestTapStack(unittest.TestCase):
    """Comprehensive test cases for TapStack Pulumi component."""

    def setUp(self):
        """Set up test fixtures."""
        self.test_args = TapStackArgs(
            environment_suffix='test',
            tags={'Environment': 'test', 'Project': 'serverless-test'}
        )
        self.mock_resources = {}
        
    @patch('pulumi.Config')
    @patch('pulumi.ComponentResource.__init__')
    @patch('pulumi_aws.iam.Role')
    @patch('pulumi_aws.iam.RolePolicyAttachment')
    @patch('pulumi_aws.cloudwatch.LogGroup')
    @patch('pulumi_aws.lambda_.Function')
    @patch('pulumi_aws.apigateway.RestApi')
    @patch('pulumi_aws.apigateway.Resource')
    @patch('pulumi_aws.apigateway.Method')
    @patch('pulumi_aws.apigateway.Integration')
    @patch('pulumi_aws.lambda_.Permission')
    @patch('pulumi_aws.apigateway.Deployment')
    @patch('pulumi_aws.apigateway.Stage')
    @patch('pulumi.export')
    def test_tap_stack_initialization(self, mock_export, mock_stage, mock_deployment, 
                                    mock_permission, mock_integration, mock_method,
                                    mock_resource, mock_api, mock_lambda_func, 
                                    mock_log_group, mock_policy_attach, mock_role, 
                                    mock_component_init, mock_config):
        """Test TapStack initialization creates all necessary resources."""
        
        # Mock Pulumi config
        mock_config_instance = Mock()
        mock_config_instance.get.return_value = 'test'
        mock_config.return_value = mock_config_instance
        
        # Mock all AWS resources
        mock_role_instance = Mock()
        mock_role_instance.name = 'test-lambda-execution-role'
        mock_role_instance.arn = 'arn:aws:iam::123456789012:role/test-lambda-execution-role'
        mock_role.return_value = mock_role_instance
        
        mock_log_group_instance = Mock()
        mock_log_group_instance.name = '/aws/lambda/test-api-handler'
        mock_log_group.return_value = mock_log_group_instance
        
        mock_lambda_instance = Mock()
        mock_lambda_instance.name = 'test-api-handler'
        mock_lambda_instance.arn = 'arn:aws:lambda:us-west-2:123456789012:function:test-api-handler'
        mock_lambda_instance.invoke_arn = 'arn:aws:apigateway:us-west-2:lambda:path/2015-03-31/functions/arn:aws:lambda:us-west-2:123456789012:function:test-api-handler/invocations'
        mock_lambda_func.return_value = mock_lambda_instance
        
        mock_api_instance = Mock()
        mock_api_instance.id = 'test-api-id'
        mock_api_instance.root_resource_id = 'root-resource-id'
        mock_api_instance.execution_arn = 'arn:aws:execute-api:us-west-2:123456789012:test-api-id'
        mock_api.return_value = mock_api_instance
        
        # Create TapStack instance
        stack = TapStack('test-stack', self.test_args)
        
        # Verify component initialization
        mock_component_init.assert_called_once()
        
        # Verify IAM role creation
        mock_role.assert_called_once()
        role_call_args = mock_role.call_args
        self.assertEqual(role_call_args[0][0], 'test-lambda-execution-role')
        
        # Verify policy attachment
        mock_policy_attach.assert_called_once()
        
        # Verify CloudWatch log group creation
        mock_log_group.assert_called_once()
        
        # Verify Lambda function creation
        mock_lambda_func.assert_called_once()
        
        # Verify API Gateway creation
        mock_api.assert_called_once()
        
        # Verify exports are called
        self.assertEqual(mock_export.call_count, 5)  # 5 exports in the stack
        
    def test_stack_attributes_assignment(self):
        """Test that TapStack properly assigns attributes from args."""
        with patch('pulumi.ComponentResource.__init__'):
            with patch.multiple('pulumi_aws.iam', Role=Mock(), RolePolicyAttachment=Mock()):
                with patch.multiple('pulumi_aws.cloudwatch', LogGroup=Mock()):
                    with patch.multiple('pulumi_aws.lambda_', Function=Mock(), Permission=Mock()):
                        with patch.multiple('pulumi_aws.apigateway', 
                                          RestApi=Mock(), Resource=Mock(), Method=Mock(),
                                          Integration=Mock(), Deployment=Mock(), Stage=Mock()):
                            with patch('pulumi.Config'):
                                with patch('pulumi.export'):
                                    stack = TapStack('test-stack', self.test_args)
                                    
                                    self.assertEqual(stack.environment_suffix, 'test')
                                    self.assertEqual(stack.tags, {'Environment': 'test', 'Project': 'serverless-test'})

    @patch('os.path.dirname')
    @patch('os.path.join')
    def test_lambda_code_path_construction(self, mock_join, mock_dirname):
        """Test that Lambda code path is constructed correctly."""
        mock_dirname.return_value = '/mock/lib/path'
        mock_join.return_value = '/mock/lib/path/lambda_function.py'
        
        with patch('pulumi.ComponentResource.__init__'):
            with patch('pulumi.Config'):
                with patch.multiple('pulumi_aws.iam', Role=Mock(), RolePolicyAttachment=Mock()):
                    with patch.multiple('pulumi_aws.cloudwatch', LogGroup=Mock()):
                        with patch.multiple('pulumi_aws.lambda_', Function=Mock(), Permission=Mock()):
                            with patch.multiple('pulumi_aws.apigateway', 
                                              RestApi=Mock(), Resource=Mock(), Method=Mock(),
                                              Integration=Mock(), Deployment=Mock(), Stage=Mock()):
                                with patch('pulumi.export'):
                                    TapStack('test-stack', self.test_args)
                                    
                                    # Verify path construction was called
                                    mock_dirname.assert_called()
                                    mock_join.assert_called_with(mock_dirname.return_value, "lambda_function.py")

    def test_common_tags_structure(self):
        """Test that common tags are properly structured."""
        with patch('pulumi.ComponentResource.__init__'):
            with patch('pulumi.Config') as mock_config:
                mock_config_instance = Mock()
                mock_config_instance.get.return_value = 'test'
                mock_config.return_value = mock_config_instance
                
                with patch.multiple('pulumi_aws.iam', Role=Mock(), RolePolicyAttachment=Mock()) as mock_iam:
                    with patch.multiple('pulumi_aws.cloudwatch', LogGroup=Mock()):
                        with patch.multiple('pulumi_aws.lambda_', Function=Mock(), Permission=Mock()):
                            with patch.multiple('pulumi_aws.apigateway', 
                                              RestApi=Mock(), Resource=Mock(), Method=Mock(),
                                              Integration=Mock(), Deployment=Mock(), Stage=Mock()):
                                with patch('pulumi.export'):
                                    TapStack('test-stack', self.test_args)
                                    
                                    # Get the tags from the IAM role call
                                    role_call_kwargs = mock_iam['Role'].call_args[1]
                                    tags = role_call_kwargs['tags']
                                    
                                    # Verify common tags structure
                                    self.assertIn('project', tags)
                                    self.assertIn('environment', tags)
                                    self.assertIn('managed-by', tags)
                                    self.assertEqual(tags['project'], 'serverless-infra-pulumi')
                                    self.assertEqual(tags['environment'], 'test')
                                    self.assertEqual(tags['managed-by'], 'pulumi')

    def test_lambda_function_configuration(self):
        """Test Lambda function configuration parameters."""
        with patch('pulumi.ComponentResource.__init__'):
            with patch('pulumi.Config'):
                with patch.multiple('pulumi_aws.iam', Role=Mock(), RolePolicyAttachment=Mock()):
                    with patch.multiple('pulumi_aws.cloudwatch', LogGroup=Mock()):
                        with patch.multiple('pulumi_aws.lambda_', Function=Mock(), Permission=Mock()) as mock_lambda:
                            with patch.multiple('pulumi_aws.apigateway', 
                                              RestApi=Mock(), Resource=Mock(), Method=Mock(),
                                              Integration=Mock(), Deployment=Mock(), Stage=Mock()):
                                with patch('pulumi.export'):
                                    TapStack('test-stack', self.test_args)
                                    
                                    # Get Lambda function call arguments
                                    lambda_call_kwargs = mock_lambda['Function'].call_args[1]
                                    
                                    # Verify Lambda configuration
                                    self.assertEqual(lambda_call_kwargs['runtime'], 'python3.9')
                                    self.assertEqual(lambda_call_kwargs['handler'], 'lambda_function.lambda_handler')
                                    self.assertEqual(lambda_call_kwargs['timeout'], 30)
                                    self.assertEqual(lambda_call_kwargs['memory_size'], 128)
                                    
                                    # Verify environment variables
                                    env_vars = lambda_call_kwargs['environment']['variables']
                                    self.assertIn('ENVIRONMENT', env_vars)
                                    self.assertIn('LOG_LEVEL', env_vars)
                                    self.assertEqual(env_vars['LOG_LEVEL'], 'INFO')

    def test_api_gateway_configuration(self):
        """Test API Gateway configuration parameters."""
        with patch('pulumi.ComponentResource.__init__'):
            with patch('pulumi.Config'):
                with patch.multiple('pulumi_aws.iam', Role=Mock(), RolePolicyAttachment=Mock()):
                    with patch.multiple('pulumi_aws.cloudwatch', LogGroup=Mock()):
                        with patch.multiple('pulumi_aws.lambda_', Function=Mock(), Permission=Mock()):
                            with patch.multiple('pulumi_aws.apigateway', 
                                              RestApi=Mock(), Resource=Mock(), Method=Mock(),
                                              Integration=Mock(), Deployment=Mock(), Stage=Mock()) as mock_api:
                                with patch('pulumi.export'):
                                    TapStack('test-stack', self.test_args)
                                    
                                    # Get API Gateway call arguments
                                    api_call_kwargs = mock_api['RestApi'].call_args[1]
                                    
                                    # Verify API Gateway configuration
                                    self.assertEqual(api_call_kwargs['name'], 'test-serverless-api')
                                    self.assertIn('Serverless API for test environment', api_call_kwargs['description'])
                                    self.assertEqual(api_call_kwargs['endpoint_configuration']['types'], 'REGIONAL')


if __name__ == '__main__':
    unittest.main()