"""
Unit tests for the ServerlessConfig module.
Tests configuration validation, environment variables, and region enforcement.
"""

from unittest.mock import Mock, patch

import pulumi
import pytest

# Mock Pulumi before importing our modules
pulumi.Config = Mock
pulumi.ResourceOptions = Mock

from lib.infrastructure.config import ServerlessConfig


class TestServerlessConfig:
    """Test cases for ServerlessConfig class."""
    
    def test_default_initialization(self):
        """Test default configuration values."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = None
            
            config = ServerlessConfig()
            
            assert config.environment_suffix == "dev"
            assert config.region == "us-east-1"
            assert config.input_bucket_name == "clean-s3-lambda-input-dev"
            assert config.output_bucket_name == "clean-s3-lambda-output-dev"
            assert config.lambda_function_name == "s3-processor-dev"
            assert config.lambda_timeout == 300
            assert config.lambda_memory == 128
    
    def test_custom_environment_suffix(self):
        """Test configuration with custom environment suffix."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'prod',
                'input_bucket_name': None,
                'output_bucket_name': None,
                'log_level': None
            }.get(key, default)
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = None
            
            config = ServerlessConfig()
            
            assert config.environment_suffix == "prod"
            assert config.input_bucket_name == "clean-s3-lambda-input-prod"
            assert config.output_bucket_name == "clean-s3-lambda-output-prod"
            assert config.lambda_function_name == "s3-processor-prod"
    
    def test_custom_bucket_names(self):
        """Test configuration with custom bucket names."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'test',
                'input_bucket_name': 'custom-input-bucket',
                'output_bucket_name': 'custom-output-bucket',
                'log_level': None
            }.get(key, default)
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = None
            
            config = ServerlessConfig()
            
            assert config.input_bucket_name == "custom-input-bucket"
            assert config.output_bucket_name == "custom-output-bucket"
    
    def test_custom_lambda_settings(self):
        """Test configuration with custom Lambda settings."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 600,
                'lambda_memory': 256
            }.get(key, default)
            mock_config.return_value.get_object.return_value = None
            
            config = ServerlessConfig()
            
            assert config.lambda_timeout == 600
            assert config.lambda_memory == 256
    
    def test_custom_ip_ranges(self):
        """Test configuration with custom IP ranges."""
        custom_ranges = ["10.0.0.0/8", "192.168.1.0/24"]
        
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = custom_ranges
            
            config = ServerlessConfig()
            
            assert config.allowed_ip_ranges == custom_ranges
    
    def test_environment_variables(self):
        """Test Lambda environment variables configuration."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'staging',
                'log_level': 'DEBUG'
            }.get(key, default)
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = None
            
            config = ServerlessConfig()
            env_vars = config.get_environment_variables()
            
            assert env_vars["ENVIRONMENT"] == "staging"
            assert env_vars["REGION"] == "us-east-1"
            assert env_vars["INPUT_BUCKET"] == "clean-s3-lambda-input-staging"
            assert env_vars["OUTPUT_BUCKET"] == "clean-s3-lambda-output-staging"
            assert env_vars["LOG_LEVEL"] == "DEBUG"
    
    def test_get_tags(self):
        """Test resource tagging configuration."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = None
            
            config = ServerlessConfig()
            tags = config.get_tags()
            
            assert tags["Environment"] == "dev"
            assert tags["Project"] == "s3-lambda-processor"
            assert tags["ManagedBy"] == "pulumi"
            assert tags["Component"] == "serverless"
            assert tags["Region"] == "us-east-1"
    
    def test_get_allowed_ip_ranges(self):
        """Test IP ranges retrieval."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = None
            
            config = ServerlessConfig()
            ip_ranges = config.get_allowed_ip_ranges()
            
            assert "10.0.0.0/8" in ip_ranges
            assert "172.16.0.0/12" in ip_ranges
            assert "192.168.0.0/16" in ip_ranges
    
    def test_validate_configuration_success(self):
        """Test successful configuration validation."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = None
            
            config = ServerlessConfig()
            
            # Should not raise any exceptions
            assert config.validate_configuration() is True
    
    def test_validate_configuration_invalid_region(self):
        """Test configuration validation with invalid region."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = None
            
            config = ServerlessConfig()
            config.region = "us-west-2"  # Invalid region
            
            with pytest.raises(ValueError, match="Deployment must be restricted to us-east-1 region"):
                config.validate_configuration()
    
    def test_validate_configuration_invalid_ip_range(self):
        """Test configuration validation with invalid IP range."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = ["0.0.0.0/0"]  # Invalid IP range
            
            config = ServerlessConfig()
            
            with pytest.raises(ValueError, match="IP range 0.0.0.0/0 is not allowed for security reasons"):
                config.validate_configuration()
    
    def test_validate_configuration_invalid_timeout(self):
        """Test configuration validation with invalid timeout."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 400  # Invalid timeout > 300 seconds
            }.get(key, default)
            mock_config.return_value.get_object.return_value = None
            
            config = ServerlessConfig()
            
            with pytest.raises(ValueError, match="Lambda timeout cannot exceed 5 minutes"):
                config.validate_configuration()
    
    def test_aws_provider_creation(self):
        """Test AWS provider creation with region enforcement."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = None
            
            with patch('pulumi_aws.Provider') as mock_provider:
                config = ServerlessConfig()
                
                # Verify provider was created with correct region
                mock_provider.assert_called_once()
                call_args = mock_provider.call_args
                assert call_args[1]['region'] == "us-east-1"
