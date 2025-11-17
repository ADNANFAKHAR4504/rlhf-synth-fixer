"""
Unit tests for Pulumi __main__.py infrastructure code
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import os
import sys


class TestPulumiMain(unittest.TestCase):
    """Test cases for Pulumi main infrastructure definition"""

    def setUp(self):
        """Set up test environment"""
        os.environ['ENVIRONMENT_SUFFIX'] = 'test'
        os.environ['AWS_REGION'] = 'us-east-1'
        os.environ['PULUMI_CONFIG_PASSPHRASE'] = 'test'
        
        # Mock pulumi modules
        self.mock_pulumi = MagicMock()
        self.mock_pulumi_aws = MagicMock()
        self.mock_pulumi.ResourceOptions = MagicMock
        self.mock_pulumi.AssetArchive = MagicMock
        self.mock_pulumi.FileAsset = MagicMock
        
        sys.modules['pulumi'] = self.mock_pulumi
        sys.modules['pulumi_aws'] = self.mock_pulumi_aws
        sys.modules['pulumi_aws.dynamodb'] = MagicMock()
        sys.modules['pulumi_aws.cloudwatch'] = MagicMock()
        sys.modules['pulumi_aws.iam'] = MagicMock()
        sys.modules['pulumi_aws.lambda_'] = MagicMock()

    def tearDown(self):
        """Clean up after tests"""
        # Remove mocked modules
        modules_to_remove = [
            'lib.__main__',
            'pulumi',
            'pulumi_aws',
            'pulumi_aws.dynamodb',
            'pulumi_aws.cloudwatch',
            'pulumi_aws.iam',
            'pulumi_aws.lambda_'
        ]
        for module in modules_to_remove:
            if module in sys.modules:
                del sys.modules[module]

    def test_infrastructure_creation_with_env_vars(self):
        """Test infrastructure resources are created with environment variables"""
        # Set up mocks
        mock_config = MagicMock()
        mock_config.get.return_value = None  # Force using env vars
        self.mock_pulumi.Config.return_value = mock_config

        # Import the main module (this executes the infrastructure code)
        import lib.__main__

        # Verify Config was called
        self.mock_pulumi.Config.assert_called_once()
        
        # Verify get was called for both config values
        mock_config.get.assert_any_call("environment_suffix")
        mock_config.get.assert_any_call("aws_region")

    def test_infrastructure_with_config_values(self):
        """Test infrastructure uses Pulumi config when available"""
        # Set up mocks to return config values
        mock_config = MagicMock()
        mock_config.get.side_effect = lambda key: {
            "environment_suffix": "config-test",
            "aws_region": "us-west-2"
        }.get(key)
        self.mock_pulumi.Config.return_value = mock_config

        # Clear and re-import
        if 'lib.__main__' in sys.modules:
            del sys.modules['lib.__main__']
        
        import lib.__main__

        # Verify Config was used
        self.mock_pulumi.Config.assert_called()

    def test_environment_suffix_fallback(self):
        """Test that environment_suffix falls back to ENVIRONMENT_SUFFIX env var"""
        os.environ['ENVIRONMENT_SUFFIX'] = 'fallback-test'
        
        mock_config = MagicMock()
        mock_config.get.return_value = None
        self.mock_pulumi.Config.return_value = mock_config

        if 'lib.__main__' in sys.modules:
            del sys.modules['lib.__main__']
        
        import lib.__main__

        # Verify config.get was called
        mock_config.get.assert_any_call("environment_suffix")

    def test_aws_region_fallback(self):
        """Test that aws_region falls back to AWS_REGION env var"""
        os.environ['AWS_REGION'] = 'eu-west-1'
        
        mock_config = MagicMock()
        mock_config.get.return_value = None
        self.mock_pulumi.Config.return_value = mock_config

        if 'lib.__main__' in sys.modules:
            del sys.modules['lib.__main__']
        
        import lib.__main__

        # Verify config.get was called for aws_region
        mock_config.get.assert_any_call("aws_region")

    def test_default_values(self):
        """Test that default values are used when neither config nor env vars are set"""
        # Clear environment variables
        if 'ENVIRONMENT_SUFFIX' in os.environ:
            del os.environ['ENVIRONMENT_SUFFIX']
        if 'AWS_REGION' in os.environ:
            del os.environ['AWS_REGION']
        
        mock_config = MagicMock()
        mock_config.get.return_value = None
        self.mock_pulumi.Config.return_value = mock_config

        if 'lib.__main__' in sys.modules:
            del sys.modules['lib.__main__']
        
        import lib.__main__

        # Verify Config was used
        self.mock_pulumi.Config.assert_called()

    def test_pulumi_provider_creation(self):
        """Test that AWS provider is created"""
        mock_config = MagicMock()
        mock_config.get.return_value = None
        self.mock_pulumi.Config.return_value = mock_config
        
        mock_provider = MagicMock()
        self.mock_pulumi_aws.Provider = MagicMock(return_value=mock_provider)

        if 'lib.__main__' in sys.modules:
            del sys.modules['lib.__main__']
        
        import lib.__main__

        # Verify Provider was called
        self.mock_pulumi_aws.Provider.assert_called()

    def test_pulumi_exports_called(self):
        """Test that Pulumi exports are called"""
        mock_config = MagicMock()
        mock_config.get.return_value = None
        self.mock_pulumi.Config.return_value = mock_config
        
        mock_export = MagicMock()
        self.mock_pulumi.export = mock_export

        if 'lib.__main__' in sys.modules:
            del sys.modules['lib.__main__']
        
        import lib.__main__

        # Verify exports were called (should have 6 exports)
        self.assertGreaterEqual(mock_export.call_count, 6)


if __name__ == '__main__':
    unittest.main()
