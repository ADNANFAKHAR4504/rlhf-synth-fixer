"""
test_infrastructure_parameters.py

Unit tests for the infrastructure parameters module.
Tests Parameter Store creation and secure parameter management.
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

from infrastructure.parameters import (create_parameter_hierarchy,
                                       create_public_parameters,
                                       create_secure_parameters)


class TestParametersModule(unittest.TestCase):
    """Test cases for parameters module functions."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_config = MagicMock()
        self.mock_config.aws_provider = MagicMock()
        self.mock_config.aws_region = "us-east-1"
        self.mock_config.get_tags.return_value = {
            "Environment": "dev",
            "Project": "serverless-infrastructure"
        }

    @patch('infrastructure.parameters.aws.ssm.Parameter')
    @patch('infrastructure.parameters.config')
    def test_create_secure_parameters(self, mock_config, mock_parameter):
        """Test that secure parameters are created."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock parameter creation
        mock_parameter_instance = MagicMock()
        mock_parameter.return_value = mock_parameter_instance
        
        parameters = {
            "DB_PASSWORD": "secret123",
            "API_KEY": "key456",
            "JWT_SECRET": "jwt789"
        }
        
        result = create_secure_parameters("test/security", parameters)
        
        # Test that parameters are created
        self.assertEqual(mock_parameter.call_count, 3)
        
        # Test that secure parameters have correct type
        call_args_list = mock_parameter.call_args_list
        for call_args in call_args_list:
            self.assertEqual(call_args[1]['type'], "SecureString")

    @patch('infrastructure.parameters.aws.ssm.Parameter')
    @patch('infrastructure.parameters.config')
    def test_create_public_parameters(self, mock_config, mock_parameter):
        """Test that public parameters are created."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock parameter creation
        mock_parameter_instance = MagicMock()
        mock_parameter.return_value = mock_parameter_instance
        
        parameters = {
            "APP_NAME": "test-app",
            "VERSION": "1.0.0",
            "REGION": "us-east-1"
        }
        
        result = create_public_parameters("test/app", parameters)
        
        # Test that parameters are created
        self.assertEqual(mock_parameter.call_count, 3)
        
        # Test that public parameters have correct type
        call_args_list = mock_parameter.call_args_list
        for call_args in call_args_list:
            self.assertEqual(call_args[1]['type'], "String")

    @patch('infrastructure.parameters.create_secure_parameters')
    @patch('infrastructure.parameters.create_public_parameters')
    @patch('infrastructure.parameters.config')
    def test_create_parameter_hierarchy(self, mock_config, 
                                        mock_create_public, mock_create_secure):
        """Test that parameter hierarchy is created."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        mock_config.aws_region = "us-east-1"
        mock_config.lambda_function_name = "test-function"
        mock_config.lambda_timeout = 180
        
        # Mock public parameter creation
        mock_create_public.return_value = {"env": "params", "app": "params"}
        
        # Mock secure parameter creation
        mock_create_secure.return_value = {"security": "params"}
        
        result = create_parameter_hierarchy("test-function")
        
        # Test that parameter hierarchy is created
        self.assertEqual(mock_create_public.call_count, 2)  # env and app
        self.assertEqual(mock_create_secure.call_count, 1)  # security

    @patch('infrastructure.parameters.aws.ssm.Parameter')
    @patch('infrastructure.parameters.config')
    def test_secure_parameter_encryption(self, mock_config, mock_parameter):
        """Test that secure parameters use encryption."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock parameter creation
        mock_parameter_instance = MagicMock()
        mock_parameter.return_value = mock_parameter_instance
        
        parameters = {
            "DB_PASSWORD": "secret123"
        }
        
        create_secure_parameters("test/security", parameters)
        
        # Test that secure parameter uses encryption
        call_args = mock_parameter.call_args
        self.assertEqual(call_args[1]['type'], "SecureString")
        self.assertIn('key_id', call_args[1])

    @patch('infrastructure.parameters.aws.ssm.Parameter')
    @patch('infrastructure.parameters.config')
    def test_parameter_naming_convention(self, mock_config, mock_parameter):
        """Test that parameters follow naming convention."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock parameter creation
        mock_parameter_instance = MagicMock()
        mock_parameter.return_value = mock_parameter_instance
        
        parameters = {
            "TEST_PARAM": "test-value"
        }
        
        create_public_parameters("test/app", parameters)
        
        # Test that parameter name follows convention
        call_args = mock_parameter.call_args
        self.assertEqual(call_args[1]['name'], "/test/app/TEST_PARAM")

    @patch('infrastructure.parameters.aws.ssm.Parameter')
    @patch('infrastructure.parameters.config')
    def test_parameter_descriptions(self, mock_config, mock_parameter):
        """Test that parameters have proper descriptions."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock parameter creation
        mock_parameter_instance = MagicMock()
        mock_parameter.return_value = mock_parameter_instance
        
        parameters = {
            "TEST_PARAM": "test-value"
        }
        
        create_public_parameters("test/app", parameters)
        
        # Test that parameter has description
        call_args = mock_parameter.call_args
        self.assertIn('description', call_args[1])
        self.assertIn("test/app", call_args[1]['description'])

    @patch('infrastructure.parameters.aws.ssm.Parameter')
    @patch('infrastructure.parameters.config')
    def test_parameter_tags(self, mock_config, mock_parameter):
        """Test that parameters have proper tags."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock parameter creation
        mock_parameter_instance = MagicMock()
        mock_parameter.return_value = mock_parameter_instance
        
        parameters = {
            "TEST_PARAM": "test-value"
        }
        
        create_public_parameters("test/app", parameters)
        
        # Test that parameter has tags
        call_args = mock_parameter.call_args
        self.assertIn('tags', call_args[1])
        expected_tags = {
            "Environment": "dev",
            "ParameterName": "TEST_PARAM",
            "Purpose": "Configuration",
            "Sensitivity": "Public"
        }
        self.assertEqual(call_args[1]['tags'], expected_tags)

    @patch('infrastructure.parameters.create_secure_parameters')
    @patch('infrastructure.parameters.create_public_parameters')
    @patch('infrastructure.parameters.config')
    def test_parameter_hierarchy_structure(self, mock_config, 
                                          mock_create_public, mock_create_secure):
        """Test that parameter hierarchy has correct structure."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        mock_config.aws_region = "us-east-1"
        mock_config.lambda_function_name = "test-function"
        mock_config.lambda_timeout = 180
        
        # Mock public parameter creation
        mock_create_public.return_value = {"env": "params", "app": "params"}
        
        # Mock secure parameter creation
        mock_create_secure.return_value = {"security": "params"}
        
        result = create_parameter_hierarchy("test-function")
        
        # Test that result has correct structure
        self.assertIn("env", result)
        self.assertIn("app", result)
        self.assertIn("security", result)


if __name__ == '__main__':
    unittest.main()