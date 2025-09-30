"""
test_infrastructure_config.py

Unit tests for the infrastructure config module.
Tests configuration management and validation logic.
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

from infrastructure.config import ServerlessConfig


class TestServerlessConfig(unittest.TestCase):
    """Test cases for ServerlessConfig class."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_config = MagicMock()
        self.mock_config.get.return_value = None  # Return None to use defaults
        self.mock_config.get_int.return_value = None  # Return None to use defaults

    @patch('infrastructure.config.pulumi.Config')
    @patch('infrastructure.config.pulumi.get_stack')
    @patch('infrastructure.config.aws.Provider')
    def test_config_initialization(self, mock_provider, mock_get_stack, mock_config_class):
        """Test that ServerlessConfig initializes correctly."""
        mock_config_class.return_value = self.mock_config
        mock_get_stack.return_value = "dev"
        
        config = ServerlessConfig()
        
        # Test that required parameters are set with defaults
        self.assertEqual(config.aws_region, "us-east-1")  # Default from os.getenv
        self.assertEqual(config.lambda_timeout, 180)  # Default value
        self.assertEqual(config.lambda_runtime, "python3.9")  # Default value
        
        # Test that AWS provider is created
        mock_provider.assert_called_once()

    @patch('infrastructure.config.pulumi.Config')
    @patch('infrastructure.config.pulumi.get_stack')
    @patch('infrastructure.config.aws.Provider')
    def test_get_environment_variables(self, mock_provider, mock_get_stack, mock_config_class):
        """Test that environment variables are correctly formatted."""
        mock_config_class.return_value = self.mock_config
        mock_get_stack.return_value = "dev"
        
        config = ServerlessConfig()
        env_vars = config.get_environment_variables()
        
        # Test that all required environment variables are present
        self.assertIn("ENVIRONMENT", env_vars)
        self.assertIn("REGION", env_vars)
        self.assertIn("PARAMETER_PREFIX", env_vars)
        self.assertIn("S3_BUCKET_NAME", env_vars)
        
        # Test that values are correct
        self.assertEqual(env_vars["ENVIRONMENT"], "dev")
        self.assertEqual(env_vars["REGION"], "us-east-1")

    @patch('infrastructure.config.pulumi.Config')
    @patch('infrastructure.config.pulumi.get_stack')
    @patch('infrastructure.config.aws.Provider')
    def test_get_tags(self, mock_provider, mock_get_stack, mock_config_class):
        """Test that default tags are correctly formatted."""
        mock_config_class.return_value = self.mock_config
        mock_get_stack.return_value = "dev"
        
        config = ServerlessConfig()
        tags = config.get_tags()
        
        # Test that all required tags are present
        self.assertIn("Environment", tags)
        self.assertIn("Project", tags)
        self.assertIn("ManagedBy", tags)
        self.assertIn("Component", tags)
        
        # Test that values are correct
        self.assertEqual(tags["Environment"], "dev")
        self.assertEqual(tags["Project"], "serverless-infrastructure")
        self.assertEqual(tags["ManagedBy"], "pulumi")
        self.assertEqual(tags["Component"], "serverless")

    @patch('infrastructure.config.pulumi.Config')
    @patch('infrastructure.config.pulumi.get_stack')
    @patch('infrastructure.config.aws.Provider')
    def test_config_with_defaults(self, mock_provider, mock_get_stack, mock_config_class):
        """Test that default values are used when config values are not provided."""
        # Mock config to return None for optional values
        mock_config = MagicMock()
        mock_config.require.return_value = "us-east-1"
        mock_config.get_int.return_value = None
        mock_config.get.return_value = None
        mock_config_class.return_value = mock_config
        mock_get_stack.return_value = "dev"
        
        config = ServerlessConfig()
        
        # Test that defaults are used
        self.assertEqual(config.lambda_timeout, 180)  # Default
        self.assertEqual(config.lambda_provisioned_concurrency, 5)  # Default
        self.assertEqual(config.lambda_memory_size, 256)  # Default
        self.assertEqual(config.lambda_runtime, "python3.9")  # Default
        self.assertEqual(config.lambda_handler, "app.handler")  # Default
        self.assertEqual(config.lambda_code_path, "lib/infrastructure/lambda_code")  # Updated default

    @patch('infrastructure.config.pulumi.Config')
    @patch('infrastructure.config.pulumi.get_stack')
    @patch('infrastructure.config.aws.Provider')
    def test_region_restriction(self, mock_provider, mock_get_stack, mock_config_class):
        """Test that region restriction is properly configured."""
        mock_config_class.return_value = self.mock_config
        mock_get_stack.return_value = "dev"
        
        config = ServerlessConfig()
        
        # Test that AWS provider is created with correct region
        mock_provider.assert_called_once()
        call_args = mock_provider.call_args
        self.assertEqual(call_args[1]['region'], "us-east-1")


if __name__ == '__main__':
    unittest.main()
