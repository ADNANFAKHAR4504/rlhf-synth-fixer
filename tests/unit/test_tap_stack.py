"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component and Lambda handler.
"""

import pytest
import json
import os
from unittest.mock import Mock, patch, MagicMock
from typing import Dict, Any
import importlib


class TestTapStackArgs:
    """Test cases for TapStackArgs configuration class."""
    
    def setup_method(self):
        """Setup for each test method."""
        # Import here to avoid Pulumi dependency issues
        try:
            from lib.tap_stack import TapStackArgs
            self.TapStackArgs = TapStackArgs
            self.pulumi_available = True
        except ImportError:
            self.pulumi_available = False

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        if not self.pulumi_available:
            pytest.skip("Pulumi dependencies not available")
            
        args = self.TapStackArgs()
        
        assert args.environment_suffix == 'dev'
        assert args.tags == {}
        assert args.region == 'us-west-2'

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
        assert args.region == "us-west-2"


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
            'REGION': 'us-west-2',
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


class TestTapStackResources:
    """Test cases for TapStack resource creation with mocking."""
    
    def setup_method(self):
        """Setup for each test method."""
        try:
            from lib.tap_stack import TapStack, TapStackArgs
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
             patch('lib.tap_stack.apigateway.Resource') as mock_api_resource, \
             patch('lib.tap_stack.apigateway.Method') as mock_method, \
             patch('lib.tap_stack.apigateway.Integration') as mock_integration, \
             patch('lib.tap_stack.apigateway.IntegrationResponse') as mock_int_response, \
             patch('lib.tap_stack.apigateway.MethodResponse') as mock_method_response, \
             patch('lib.tap_stack.apigateway.Deployment') as mock_deployment, \
             patch('lib.tap_stack.lambda_.Permission') as mock_permission, \
             patch('lib.tap_stack.cloudwatch.MetricAlarm') as mock_alarm, \
             patch('lib.tap_stack.cloudwatch.Dashboard') as mock_dashboard, \
             patch('pulumi.export') as mock_export:
            
            # Configure mocks with necessary attributes
            mock_role_instance = Mock()
            mock_role_instance.arn = "arn:aws:iam::123456789012:role/test-role"
            mock_role.return_value = mock_role_instance
            
            mock_policy_instance = Mock()
            mock_policy_instance.arn = "arn:aws:iam::123456789012:policy/test-policy"
            mock_policy.return_value = mock_policy_instance
            
            mock_log_group_instance = Mock()
            mock_log_group_instance.name = "/aws/lambda/test-function"
            mock_log_group.return_value = mock_log_group_instance
            
            mock_lambda_instance = Mock()
            mock_lambda_instance.name = "test-lambda-function"
            mock_lambda_instance.arn = "arn:aws:lambda:us-west-2:123456789012:function:test-function"
            mock_lambda_instance.invoke_arn = "arn:aws:apigateway:us-west-2:lambda:path/2015-03-31/functions/arn:aws:lambda:us-west-2:123456789012:function:test-function/invocations"
            mock_lambda_instance.memory_size = 512
            mock_lambda_instance.timeout = 60
            mock_lambda_instance.runtime = "python3.12"
            mock_lambda.return_value = mock_lambda_instance
            
            mock_api_instance = Mock()
            mock_api_instance.id = "test-api-id"
            mock_api_instance.root_resource_id = "root-resource-id"
            mock_api_instance.execution_arn = "arn:aws:execute-api:us-west-2:123456789012:test-api-id"
            mock_api.return_value = mock_api_instance
            
            yield {
                'role': mock_role,
                'policy': mock_policy, 
                'attachment': mock_attachment,
                'log_group': mock_log_group,
                'lambda': mock_lambda,
                'api': mock_api,
                'export': mock_export
            }

    def test_iam_role_creation(self, mock_pulumi_resources):
        """Test IAM role creation for Lambda."""
        if not self.pulumi_available:
            pytest.skip("Pulumi dependencies not available")
            
        args = self.TapStackArgs(environment_suffix="test", region="us-west-2")
        
        with patch('pulumi.ComponentResource.__init__') as mock_init:
            mock_init.return_value = None
            with patch.object(self.TapStack, 'register_outputs'):
                stack = self.TapStack("test-stack", args)
                
                # Verify IAM role creation
                mock_pulumi_resources['role'].assert_called()
                role_call = mock_pulumi_resources['role'].call_args
                assert "lambda-execution-role-test" in role_call[0]
                
                # Verify assume role policy
                role_kwargs = role_call[1]
                assume_role_policy = json.loads(role_kwargs['assume_role_policy'])
                assert assume_role_policy['Version'] == "2012-10-17"
                assert assume_role_policy['Statement'][0]['Effect'] == "Allow"
                assert assume_role_policy['Statement'][0]['Principal']['Service'] == "lambda.amazonaws.com"

    def test_lambda_function_configuration(self, mock_pulumi_resources):
        """Test Lambda function creation with correct configuration."""
        if not self.pulumi_available:
            pytest.skip("Pulumi dependencies not available")
            
        args = self.TapStackArgs(environment_suffix="dev", region="us-west-2")
        
        with patch('pulumi.ComponentResource.__init__') as mock_init:
            mock_init.return_value = None
            with patch.object(self.TapStack, 'register_outputs'):
                stack = self.TapStack("test-stack", args)
                
                # Verify Lambda function creation
                mock_pulumi_resources['lambda'].assert_called()
                lambda_call = mock_pulumi_resources['lambda'].call_args
                assert "tap-api-handler-dev" in lambda_call[0]
                
                # Verify Lambda configuration
                lambda_kwargs = lambda_call[1]
                assert lambda_kwargs['runtime'] == "python3.12"
                assert lambda_kwargs['timeout'] == 60
                assert lambda_kwargs['memory_size'] == 512
                assert lambda_kwargs['handler'] == "handler.lambda_handler"
                
                # Verify environment variables
                env_vars = lambda_kwargs['environment']['variables']
                assert env_vars['ENVIRONMENT'] == "dev"
                assert env_vars['REGION'] == "us-west-2"
                assert env_vars['LOG_LEVEL'] == "INFO"
                assert env_vars['FUNCTION_NAME'] == "tap-api-handler-dev"

    def test_api_gateway_configuration(self, mock_pulumi_resources):
        """Test API Gateway configuration."""
        if not self.pulumi_available:
            pytest.skip("Pulumi dependencies not available")
            
        args = self.TapStackArgs(environment_suffix="test")
        
        with patch('pulumi.ComponentResource.__init__') as mock_init:
            mock_init.return_value = None
            with patch.object(self.TapStack, 'register_outputs'):
                stack = self.TapStack("test-stack", args)
                
                # Verify API Gateway creation
                mock_pulumi_resources['api'].assert_called()
                api_call = mock_pulumi_resources['api'].call_args
                api_kwargs = api_call[1]
                
                # Check enhanced API Gateway configuration
                assert api_kwargs['minimum_compression_size'] == 1024
                assert api_kwargs['binary_media_types'] == ["*/*"]
                assert "tap-api-test" in api_call[0]

    def test_cloudwatch_log_group_retention(self, mock_pulumi_resources):
        """Test CloudWatch log group retention based on environment."""
        if not self.pulumi_available:
            pytest.skip("Pulumi dependencies not available")
            
        # Test prod environment
        args_prod = self.TapStackArgs(environment_suffix="prod")
        
        with patch('pulumi.ComponentResource.__init__') as mock_init:
            mock_init.return_value = None
            with patch.object(self.TapStack, 'register_outputs'):
                stack = self.TapStack("test-stack", args_prod)
                
                # Verify log group creation
                mock_pulumi_resources['log_group'].assert_called()
                log_group_call = mock_pulumi_resources['log_group'].call_args
                log_group_kwargs = log_group_call[1]
                assert log_group_kwargs['retention_in_days'] == 30  # prod retention

    def test_resource_tagging(self, mock_pulumi_resources):
        """Test that all resources are properly tagged."""
        if not self.pulumi_available:
            pytest.skip("Pulumi dependencies not available")
            
        custom_tags = {"Owner": "TestTeam", "Custom": "Value"}
        args = self.TapStackArgs(
            environment_suffix="test",
            tags=custom_tags,
            region="us-west-2"
        )
        
        with patch('pulumi.ComponentResource.__init__') as mock_init:
            mock_init.return_value = None
            with patch.object(self.TapStack, 'register_outputs'):
                stack = self.TapStack("test-stack", args)
                
                # Verify Lambda function tags
                lambda_call = mock_pulumi_resources['lambda'].call_args
                lambda_kwargs = lambda_call[1]
                
                tags = lambda_kwargs['tags']
                assert tags['Environment'] == "Test"  # Capitalized
                assert tags['Project'] == "TAP"
                assert tags['ManagedBy'] == "Pulumi"
                assert tags['Region'] == "us-west-2"
                assert tags['CostCenter'] == "TAP-API"
                assert tags['Owner'] == "TestTeam"  # Custom tag
                assert tags['Custom'] == "Value"  # Custom tag

    def test_outputs_export(self, mock_pulumi_resources):
        """Test that outputs are properly exported."""
        if not self.pulumi_available:
            pytest.skip("Pulumi dependencies not available")
            
        args = self.TapStackArgs(environment_suffix="test")
        
        with patch('pulumi.ComponentResource.__init__') as mock_init:
            mock_init.return_value = None
            with patch.object(self.TapStack, 'register_outputs'):
                stack = self.TapStack("test-stack", args)
                
                # Verify pulumi.export was called for all expected outputs
                export_calls = mock_pulumi_resources['export'].call_args_list
                exported_keys = [call[0][0] for call in export_calls]
                
                expected_outputs = [
                    "api_gateway_url", "lambda_function_name", "lambda_function_arn",
                    "api_gateway_id", "cloudwatch_log_group", "environment_suffix",
                    "lambda_role_arn", "region", "memory_size", "timeout", "runtime"
                ]
                
                for output in expected_outputs:
                    assert output in exported_keys