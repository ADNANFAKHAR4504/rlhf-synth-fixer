"""
test_infrastructure_api.py

Unit tests for the infrastructure API module.
Tests API Gateway creation, HTTPS enforcement, and Lambda integration.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Add lib to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

# Mock pulumi before importing our modules
sys.modules['pulumi'] = MagicMock()
sys.modules['pulumi_aws'] = MagicMock()
sys.modules['pulumi_aws.aws'] = MagicMock()

from infrastructure.api import create_api_gateway


class TestAPIModule(unittest.TestCase):
    """Test cases for API module functions."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_config = MagicMock()
        self.mock_config.aws_provider = MagicMock()
        self.mock_config.aws_region = "us-east-1"
        self.mock_config.get_tags.return_value = {
            "Environment": "dev",
            "Project": "serverless-infrastructure"
        }

    @patch('infrastructure.api.aws.apigateway.RestApi')
    @patch('infrastructure.api.aws.apigateway.Resource')
    @patch('infrastructure.api.aws.apigateway.Method')
    @patch('infrastructure.api.aws.apigateway.Integration')
    @patch('infrastructure.api.aws.apigateway.Deployment')
    @patch('infrastructure.api.aws.apigateway.Stage')
    @patch('infrastructure.api.aws.apigateway.MethodSettings')
    @patch('infrastructure.api.aws.apigateway.DomainName')
    @patch('infrastructure.api.aws.apigateway.BasePathMapping')
    @patch('infrastructure.api.aws.lambda_.Permission')
    @patch('infrastructure.api.aws.apigateway.UsagePlan')
    @patch('infrastructure.api.aws.apigateway.ApiKey')
    @patch('infrastructure.api.aws.apigateway.UsagePlanKey')
    @patch('infrastructure.api.config')
    def test_create_api_gateway(self, mock_config, mock_usage_plan_key, mock_api_key, 
                               mock_usage_plan, mock_permission, mock_base_path_mapping, 
                               mock_domain_name, mock_method_settings, mock_stage, 
                               mock_deployment, mock_integration, mock_method, 
                               mock_resource, mock_rest_api):
        """Test that API Gateway is created with proper configuration."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock Lambda function
        mock_lambda_function = MagicMock()
        mock_lambda_function.invoke_arn = "arn:aws:lambda:us-east-1:123456789012:function:test-function"
        mock_lambda_function.name = "test-function"
        
        # Mock REST API creation
        mock_rest_api_instance = MagicMock()
        mock_rest_api_instance.id = "test-api"
        mock_rest_api.return_value = mock_rest_api_instance
        
        # Mock other components
        mock_resource_instance = MagicMock()
        mock_resource.return_value = mock_resource_instance
        
        mock_method_instance = MagicMock()
        mock_method.return_value = mock_method_instance
        
        mock_integration_instance = MagicMock()
        mock_integration.return_value = mock_integration_instance
        
        mock_deployment_instance = MagicMock()
        mock_deployment.return_value = mock_deployment_instance
        
        mock_stage_instance = MagicMock()
        mock_stage.return_value = mock_stage_instance
        
        mock_method_settings_instance = MagicMock()
        mock_method_settings.return_value = mock_method_settings_instance
        
        mock_domain_name_instance = MagicMock()
        mock_domain_name.return_value = mock_domain_name_instance
        
        mock_base_path_mapping_instance = MagicMock()
        mock_base_path_mapping.return_value = mock_base_path_mapping_instance
        
        mock_permission_instance = MagicMock()
        mock_permission.return_value = mock_permission_instance
        
        mock_usage_plan_instance = MagicMock()
        mock_usage_plan.return_value = mock_usage_plan_instance
        
        mock_api_key_instance = MagicMock()
        mock_api_key.return_value = mock_api_key_instance
        
        mock_usage_plan_key_instance = MagicMock()
        mock_usage_plan_key.return_value = mock_usage_plan_key_instance
        
        result = create_api_gateway("test-api", mock_lambda_function, "api.example.com")
        
        # Test that REST API is created
        mock_rest_api.assert_called_once()
        call_args = mock_rest_api.call_args
        self.assertEqual(call_args[1]['name'], "test-api-api")
        
        # Test that resource is created
        mock_resource.assert_called_once()
        
        # Test that method is created
        mock_method.assert_called_once()
        method_call_args = mock_method.call_args
        self.assertEqual(method_call_args[1]['http_method'], "ANY")
        
        # Test that integration is created
        mock_integration.assert_called_once()
        integration_call_args = mock_integration.call_args
        self.assertEqual(integration_call_args[1]['type'], "AWS_PROXY")
        self.assertEqual(integration_call_args[1]['uri'], "arn:aws:lambda:us-east-1:123456789012:function:test-function")
        
        # Test that deployment is created
        mock_deployment.assert_called_once()
        
        # Test that stage is created
        mock_stage.assert_called_once()
        stage_call_args = mock_stage.call_args
        self.assertEqual(stage_call_args[1]['stage_name'], "api")
        
        # Test that method settings are created
        mock_method_settings.assert_called_once()
        
        # Test that permission is created
        mock_permission.assert_called_once()
        permission_call_args = mock_permission.call_args
        self.assertEqual(permission_call_args[1]['action'], "lambda:InvokeFunction")
        self.assertEqual(permission_call_args[1]['function'], "test-function")

    @patch('infrastructure.api.aws.apigateway.RestApi')
    @patch('infrastructure.api.aws.apigateway.Resource')
    @patch('infrastructure.api.aws.apigateway.Method')
    @patch('infrastructure.api.aws.apigateway.Integration')
    @patch('infrastructure.api.aws.apigateway.Deployment')
    @patch('infrastructure.api.aws.apigateway.Stage')
    @patch('infrastructure.api.aws.apigateway.MethodSettings')
    @patch('infrastructure.api.aws.lambda_.Permission')
    @patch('infrastructure.api.aws.apigateway.UsagePlan')
    @patch('infrastructure.api.aws.apigateway.ApiKey')
    @patch('infrastructure.api.aws.apigateway.UsagePlanKey')
    @patch('infrastructure.api.config')
    def test_api_gateway_https_enforcement(self, mock_config, mock_usage_plan_key, 
                                         mock_api_key, mock_usage_plan, mock_permission, 
                                         mock_method_settings, mock_stage, mock_deployment, 
                                         mock_integration, mock_method, mock_resource, 
                                         mock_rest_api):
        """Test that API Gateway enforces HTTPS."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock Lambda function
        mock_lambda_function = MagicMock()
        mock_lambda_function.invoke_arn = "arn:aws:lambda:us-east-1:123456789012:function:test-function"
        mock_lambda_function.name = "test-function"
        
        # Mock REST API creation
        mock_rest_api_instance = MagicMock()
        mock_rest_api_instance.id = "test-api"
        mock_rest_api.return_value = mock_rest_api_instance
        
        # Mock other components
        mock_resource_instance = MagicMock()
        mock_resource.return_value = mock_resource_instance
        
        mock_method_instance = MagicMock()
        mock_method.return_value = mock_method_instance
        
        mock_integration_instance = MagicMock()
        mock_integration.return_value = mock_integration_instance
        
        mock_deployment_instance = MagicMock()
        mock_deployment.return_value = mock_deployment_instance
        
        mock_stage_instance = MagicMock()
        mock_stage.return_value = mock_stage_instance
        
        mock_method_settings_instance = MagicMock()
        mock_method_settings.return_value = mock_method_settings_instance
        
        mock_permission_instance = MagicMock()
        mock_permission.return_value = mock_permission_instance
        
        mock_usage_plan_instance = MagicMock()
        mock_usage_plan.return_value = mock_usage_plan_instance
        
        mock_api_key_instance = MagicMock()
        mock_api_key.return_value = mock_api_key_instance
        
        mock_usage_plan_key_instance = MagicMock()
        mock_usage_plan_key.return_value = mock_usage_plan_key_instance
        
        create_api_gateway("test-api", mock_lambda_function, "api.example.com")
        
        # Test that REST API has HTTPS enforcement policy
        call_args = mock_rest_api.call_args
        self.assertIn('policy', call_args[1])
        policy = call_args[1]['policy']
        self.assertIn('aws:SecureTransport', policy)
        self.assertIn('false', policy)

    @patch('infrastructure.api.aws.apigateway.RestApi')
    @patch('infrastructure.api.aws.apigateway.Resource')
    @patch('infrastructure.api.aws.apigateway.Method')
    @patch('infrastructure.api.aws.apigateway.Integration')
    @patch('infrastructure.api.aws.apigateway.Deployment')
    @patch('infrastructure.api.aws.apigateway.Stage')
    @patch('infrastructure.api.aws.apigateway.MethodSettings')
    @patch('infrastructure.api.aws.lambda_.Permission')
    @patch('infrastructure.api.aws.apigateway.UsagePlan')
    @patch('infrastructure.api.aws.apigateway.ApiKey')
    @patch('infrastructure.api.aws.apigateway.UsagePlanKey')
    @patch('infrastructure.api.config')
    def test_api_gateway_lambda_integration(self, mock_config, mock_usage_plan_key, 
                                          mock_api_key, mock_usage_plan, mock_permission, 
                                          mock_method_settings, mock_stage, mock_deployment, 
                                          mock_integration, mock_method, mock_resource, 
                                          mock_rest_api):
        """Test that API Gateway is properly integrated with Lambda."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock Lambda function
        mock_lambda_function = MagicMock()
        mock_lambda_function.invoke_arn = "arn:aws:lambda:us-east-1:123456789012:function:test-function"
        mock_lambda_function.name = "test-function"
        
        # Mock REST API creation
        mock_rest_api_instance = MagicMock()
        mock_rest_api_instance.id = "test-api"
        mock_rest_api.return_value = mock_rest_api_instance
        
        # Mock other components
        mock_resource_instance = MagicMock()
        mock_resource.return_value = mock_resource_instance
        
        mock_method_instance = MagicMock()
        mock_method.return_value = mock_method_instance
        
        mock_integration_instance = MagicMock()
        mock_integration.return_value = mock_integration_instance
        
        mock_deployment_instance = MagicMock()
        mock_deployment.return_value = mock_deployment_instance
        
        mock_stage_instance = MagicMock()
        mock_stage.return_value = mock_stage_instance
        
        mock_method_settings_instance = MagicMock()
        mock_method_settings.return_value = mock_method_settings_instance
        
        mock_permission_instance = MagicMock()
        mock_permission.return_value = mock_permission_instance
        
        mock_usage_plan_instance = MagicMock()
        mock_usage_plan.return_value = mock_usage_plan_instance
        
        mock_api_key_instance = MagicMock()
        mock_api_key.return_value = mock_api_key_instance
        
        mock_usage_plan_key_instance = MagicMock()
        mock_usage_plan_key.return_value = mock_usage_plan_key_instance
        
        create_api_gateway("test-api", mock_lambda_function, "api.example.com")
        
        # Test that integration uses correct URI
        call_args = mock_integration.call_args
        self.assertEqual(call_args[1]['type'], "AWS_PROXY")
        self.assertEqual(call_args[1]['uri'], "arn:aws:lambda:us-east-1:123456789012:function:test-function")
        self.assertEqual(call_args[1]['integration_http_method'], "POST")

    @patch('infrastructure.api.aws.apigateway.RestApi')
    @patch('infrastructure.api.aws.apigateway.Resource')
    @patch('infrastructure.api.aws.apigateway.Method')
    @patch('infrastructure.api.aws.apigateway.Integration')
    @patch('infrastructure.api.aws.apigateway.Deployment')
    @patch('infrastructure.api.aws.apigateway.Stage')
    @patch('infrastructure.api.aws.apigateway.MethodSettings')
    @patch('infrastructure.api.aws.lambda_.Permission')
    @patch('infrastructure.api.aws.apigateway.UsagePlan')
    @patch('infrastructure.api.aws.apigateway.ApiKey')
    @patch('infrastructure.api.aws.apigateway.UsagePlanKey')
    @patch('infrastructure.api.config')
    def test_api_gateway_method_settings(self, mock_config, mock_usage_plan_key, 
                                        mock_api_key, mock_usage_plan, mock_permission, 
                                        mock_method_settings, mock_stage, mock_deployment, 
                                        mock_integration, mock_method, mock_resource, 
                                        mock_rest_api):
        """Test that API Gateway method settings are configured."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock Lambda function
        mock_lambda_function = MagicMock()
        mock_lambda_function.invoke_arn = "arn:aws:lambda:us-east-1:123456789012:function:test-function"
        mock_lambda_function.name = "test-function"
        
        # Mock REST API creation
        mock_rest_api_instance = MagicMock()
        mock_rest_api_instance.id = "test-api"
        mock_rest_api.return_value = mock_rest_api_instance
        
        # Mock other components
        mock_resource_instance = MagicMock()
        mock_resource.return_value = mock_resource_instance
        
        mock_method_instance = MagicMock()
        mock_method.return_value = mock_method_instance
        
        mock_integration_instance = MagicMock()
        mock_integration.return_value = mock_integration_instance
        
        mock_deployment_instance = MagicMock()
        mock_deployment.return_value = mock_deployment_instance
        
        mock_stage_instance = MagicMock()
        mock_stage.return_value = mock_stage_instance
        
        mock_method_settings_instance = MagicMock()
        mock_method_settings.return_value = mock_method_settings_instance
        
        mock_permission_instance = MagicMock()
        mock_permission.return_value = mock_permission_instance
        
        mock_usage_plan_instance = MagicMock()
        mock_usage_plan.return_value = mock_usage_plan_instance
        
        mock_api_key_instance = MagicMock()
        mock_api_key.return_value = mock_api_key_instance
        
        mock_usage_plan_key_instance = MagicMock()
        mock_usage_plan_key.return_value = mock_usage_plan_key_instance
        
        create_api_gateway("test-api", mock_lambda_function, "api.example.com")
        
        # Test that method settings are configured
        call_args = mock_method_settings.call_args
        self.assertIn('settings', call_args[1])
        settings = call_args[1]['settings']
        # Check that settings object has the expected attributes
        self.assertTrue(hasattr(settings, 'metrics_enabled'))
        self.assertTrue(hasattr(settings, 'throttling_rate_limit'))
        self.assertTrue(hasattr(settings, 'throttling_burst_limit'))

    @patch('infrastructure.api.aws.apigateway.RestApi')
    @patch('infrastructure.api.aws.apigateway.Resource')
    @patch('infrastructure.api.aws.apigateway.Method')
    @patch('infrastructure.api.aws.apigateway.Integration')
    @patch('infrastructure.api.aws.apigateway.Deployment')
    @patch('infrastructure.api.aws.apigateway.Stage')
    @patch('infrastructure.api.aws.apigateway.MethodSettings')
    @patch('infrastructure.api.aws.lambda_.Permission')
    @patch('infrastructure.api.aws.apigateway.UsagePlan')
    @patch('infrastructure.api.aws.apigateway.ApiKey')
    @patch('infrastructure.api.aws.apigateway.UsagePlanKey')
    @patch('infrastructure.api.config')
    def test_api_gateway_usage_plan(self, mock_config, mock_usage_plan_key, 
                                   mock_api_key, mock_usage_plan, mock_permission, 
                                   mock_method_settings, mock_stage, mock_deployment, 
                                   mock_integration, mock_method, mock_resource, 
                                   mock_rest_api):
        """Test that API Gateway usage plan is created."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock Lambda function
        mock_lambda_function = MagicMock()
        mock_lambda_function.invoke_arn = "arn:aws:lambda:us-east-1:123456789012:function:test-function"
        mock_lambda_function.name = "test-function"
        
        # Mock REST API creation
        mock_rest_api_instance = MagicMock()
        mock_rest_api_instance.id = "test-api"
        mock_rest_api.return_value = mock_rest_api_instance
        
        # Mock other components
        mock_resource_instance = MagicMock()
        mock_resource.return_value = mock_resource_instance
        
        mock_method_instance = MagicMock()
        mock_method.return_value = mock_method_instance
        
        mock_integration_instance = MagicMock()
        mock_integration.return_value = mock_integration_instance
        
        mock_deployment_instance = MagicMock()
        mock_deployment.return_value = mock_deployment_instance
        
        mock_stage_instance = MagicMock()
        mock_stage.return_value = mock_stage_instance
        
        mock_method_settings_instance = MagicMock()
        mock_method_settings.return_value = mock_method_settings_instance
        
        mock_permission_instance = MagicMock()
        mock_permission.return_value = mock_permission_instance
        
        mock_usage_plan_instance = MagicMock()
        mock_usage_plan.return_value = mock_usage_plan_instance
        
        mock_api_key_instance = MagicMock()
        mock_api_key.return_value = mock_api_key_instance
        
        mock_usage_plan_key_instance = MagicMock()
        mock_usage_plan_key.return_value = mock_usage_plan_key_instance
        
        create_api_gateway("test-api", mock_lambda_function, "api.example.com")
        
        # Test that usage plan is created
        mock_usage_plan.assert_called_once()
        call_args = mock_usage_plan.call_args
        self.assertEqual(call_args[1]['name'], "test-api-usage-plan")
        
        # Test that API key is created
        mock_api_key.assert_called_once()
        
        # Test that usage plan key is created
        mock_usage_plan_key.assert_called_once()


if __name__ == '__main__':
    unittest.main()