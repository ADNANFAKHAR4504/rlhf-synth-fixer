"""
Additional tests specifically for iam.py to increase coverage to 70%.
Focuses on testing the uncovered IAM functions and code paths.
"""

import json
import os
import sys
from unittest.mock import MagicMock, Mock, patch

import pytest

# Add the lib directory to the Python path for module resolution
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib'))


class TestIamModuleAdditional:
    """Additional tests for iam.py to increase coverage."""
    
    def test_create_iam_resources_comprehensive(self):
        """Test IAM resources creation with comprehensive mocking."""
        with patch('lib.infrastructure.iam.aws') as mock_aws:
            with patch('lib.infrastructure.iam.pulumi') as mock_pulumi:
                # Mock AWS resources
                mock_role = Mock()
                mock_policy = Mock()
                mock_role_policy_attachment = Mock()
                
                mock_aws.iam.Role.return_value = mock_role
                mock_aws.iam.Policy.return_value = mock_policy
                mock_aws.iam.RolePolicyAttachment.return_value = mock_role_policy_attachment
                
                from lib.infrastructure.config import ServerlessConfig
                from lib.infrastructure.iam import create_iam_resources
                
                config = ServerlessConfig()
                mock_input_bucket = Mock()
                mock_output_bucket = Mock()
                mock_lambda_function = Mock()
                
                result = create_iam_resources(config, mock_input_bucket, mock_output_bucket, mock_lambda_function)
                
                # Verify all expected resources are created
                assert "lambda_role" in result
                assert "s3_policy" in result
                assert "logs_policy" in result
                assert "lambda_policy" in result
                
                # Verify creation calls
                mock_aws.iam.Role.assert_called_once()
                assert mock_aws.iam.Policy.call_count == 3  # s3, logs, lambda policies
                assert mock_aws.iam.RolePolicyAttachment.call_count == 3
    
    def test_create_lambda_role_comprehensive(self):
        """Test Lambda role creation with comprehensive mocking."""
        with patch('lib.infrastructure.iam.aws') as mock_aws:
            with patch('lib.infrastructure.iam.pulumi') as mock_pulumi:
                # Mock AWS resources
                mock_role = Mock()
                mock_aws.iam.Role.return_value = mock_role
                
                from lib.infrastructure.config import ServerlessConfig
                from lib.infrastructure.iam import create_lambda_role
                
                config = ServerlessConfig()
                
                result = create_lambda_role(config)
                
                # Verify role is created
                assert result == mock_role
                mock_aws.iam.Role.assert_called_once()
                
                # Verify the role was called with correct parameters
                call_args = mock_aws.iam.Role.call_args
                assert call_args[1]['assume_role_policy'] is not None
                assert call_args[1]['tags'] == config.get_tags()
    
    def test_create_s3_access_policy_comprehensive(self):
        """Test S3 access policy creation with comprehensive mocking."""
        with patch('lib.infrastructure.iam.aws') as mock_aws:
            with patch('lib.infrastructure.iam.pulumi') as mock_pulumi:
                # Mock AWS resources
                mock_policy = Mock()
                mock_aws.iam.Policy.return_value = mock_policy
                
                from lib.infrastructure.config import ServerlessConfig
                from lib.infrastructure.iam import create_s3_access_policy
                
                config = ServerlessConfig()
                mock_role = Mock()
                mock_input_bucket = Mock()
                mock_output_bucket = Mock()
                
                result = create_s3_access_policy(config, mock_role, mock_input_bucket, mock_output_bucket)
                
                # Verify policy is created
                assert result == mock_policy
                mock_aws.iam.Policy.assert_called_once()
                
                # Verify the policy was called with correct parameters
                call_args = mock_aws.iam.Policy.call_args
                assert call_args[1]['description'] is not None
                assert call_args[1]['tags'] == config.get_tags()
    
    def test_create_cloudwatch_logs_policy_comprehensive(self):
        """Test CloudWatch Logs policy creation with comprehensive mocking."""
        with patch('lib.infrastructure.iam.aws') as mock_aws:
            with patch('lib.infrastructure.iam.pulumi') as mock_pulumi:
                # Mock AWS resources
                mock_policy = Mock()
                mock_aws.iam.Policy.return_value = mock_policy
                
                from lib.infrastructure.config import ServerlessConfig
                from lib.infrastructure.iam import \
                    create_cloudwatch_logs_policy
                
                config = ServerlessConfig()
                mock_role = Mock()
                
                result = create_cloudwatch_logs_policy(config, mock_role)
                
                # Verify policy is created
                assert result == mock_policy
                mock_aws.iam.Policy.assert_called_once()
                
                # Verify the policy was called with correct parameters
                call_args = mock_aws.iam.Policy.call_args
                assert call_args[1]['description'] is not None
                assert call_args[1]['tags'] == config.get_tags()
    
    def test_create_lambda_invoke_policy_comprehensive(self):
        """Test Lambda invoke policy creation with comprehensive mocking."""
        with patch('lib.infrastructure.iam.aws') as mock_aws:
            with patch('lib.infrastructure.iam.pulumi') as mock_pulumi:
                # Mock AWS resources
                mock_policy = Mock()
                mock_aws.iam.Policy.return_value = mock_policy
                
                from lib.infrastructure.config import ServerlessConfig
                from lib.infrastructure.iam import create_lambda_invoke_policy
                
                config = ServerlessConfig()
                mock_lambda_function = Mock()
                mock_lambda_function.arn = "arn:aws:lambda:us-east-1:123456789012:function:test-lambda"
                
                result = create_lambda_invoke_policy(config, mock_lambda_function)
                
                # Verify policy is created
                assert result == mock_policy
                mock_aws.iam.Policy.assert_called_once()
                
                # Verify the policy was called with correct parameters
                call_args = mock_aws.iam.Policy.call_args
                assert call_args[1]['description'] is not None
                assert call_args[1]['tags'] == config.get_tags()
    
    def test_create_lambda_policy_comprehensive(self):
        """Test Lambda policy creation with comprehensive mocking."""
        with patch('lib.infrastructure.iam.aws') as mock_aws:
            with patch('lib.infrastructure.iam.pulumi') as mock_pulumi:
                # Mock AWS resources
                mock_policy = Mock()
                mock_aws.iam.Policy.return_value = mock_policy
                
                from lib.infrastructure.config import ServerlessConfig
                from lib.infrastructure.iam import create_lambda_policy
                
                config = ServerlessConfig()
                mock_role = Mock()
                
                result = create_lambda_policy(config, mock_role)
                
                # Verify policy is created
                assert result == mock_policy
                mock_aws.iam.Policy.assert_called_once()
                
                # Verify the policy was called with correct parameters
                call_args = mock_aws.iam.Policy.call_args
                assert call_args[1]['description'] is not None
                assert call_args[1]['tags'] == config.get_tags()
    
    def test_attach_policies_to_role_comprehensive(self):
        """Test policy attachment to role with comprehensive mocking."""
        with patch('lib.infrastructure.iam.aws') as mock_aws:
            with patch('lib.infrastructure.iam.pulumi') as mock_pulumi:
                # Mock AWS resources
                mock_attachment = Mock()
                mock_aws.iam.RolePolicyAttachment.return_value = mock_attachment
                
                from lib.infrastructure.config import ServerlessConfig
                from lib.infrastructure.iam import attach_policies_to_role
                
                config = ServerlessConfig()
                mock_role = Mock()
                mock_s3_policy = Mock()
                mock_logs_policy = Mock()
                mock_lambda_policy = Mock()
                
                result = attach_policies_to_role(
                    config, 
                    mock_role, 
                    mock_s3_policy, 
                    mock_logs_policy, 
                    mock_lambda_policy
                )
                
                # Verify attachments are created
                assert "s3_attachment" in result
                assert "logs_attachment" in result
                assert "lambda_attachment" in result
                
                # Verify attachment calls
                assert mock_aws.iam.RolePolicyAttachment.call_count == 3


class TestMainModuleRemaining:
    """Additional tests for main.py to cover remaining uncovered lines."""
    
    def test_create_infrastructure_export_statements(self):
        """Test infrastructure creation export statements."""
        with patch('lib.infrastructure.main.ServerlessConfig') as mock_config_class:
            with patch('lib.infrastructure.main.create_s3_buckets') as mock_s3:
                with patch('lib.infrastructure.main.create_s3_lifecycle_policies') as mock_lifecycle:
                    with patch('lib.infrastructure.main.create_iam_resources') as mock_iam:
                        with patch('lib.infrastructure.main.create_lambda_resources') as mock_lambda:
                            with patch('lib.infrastructure.main.create_lambda_invoke_policy') as mock_invoke:
                                with patch('lib.infrastructure.main.pulumi') as mock_pulumi:
                                    
                                    # Mock config instance
                                    mock_config_instance = Mock()
                                    mock_config_instance.validate_configuration.return_value = True
                                    mock_config_instance.environment_suffix = "test"
                                    mock_config_instance.region = "us-east-1"
                                    mock_config_instance.lambda_function_name = "test-lambda"
                                    mock_config_instance.get_tags.return_value = {"Environment": "test"}
                                    mock_config_class.return_value = mock_config_instance
                                    
                                    # Mock return values with proper attributes
                                    mock_lambda_function = Mock()
                                    mock_lambda_function.name = "test-lambda"
                                    mock_lambda_function.arn = "arn:aws:lambda:us-east-1:123456789012:function:test-lambda"
                                    
                                    mock_input_bucket = Mock()
                                    mock_input_bucket.name = "test-input-bucket"
                                    mock_input_bucket.arn = "arn:aws:s3:::test-input-bucket"
                                    
                                    mock_output_bucket = Mock()
                                    mock_output_bucket.name = "test-output-bucket"
                                    mock_output_bucket.arn = "arn:aws:s3:::test-output-bucket"
                                    
                                    mock_s3.return_value = {
                                        "input_bucket": mock_input_bucket,
                                        "output_bucket": mock_output_bucket
                                    }
                                    mock_lifecycle.return_value = {
                                        "input_lifecycle": Mock(),
                                        "output_lifecycle": Mock()
                                    }
                                    mock_iam.return_value = {
                                        "lambda_role": Mock(),
                                        "s3_policy": Mock(),
                                        "logs_policy": Mock()
                                    }
                                    mock_lambda.return_value = {
                                        "lambda_function": mock_lambda_function,
                                        "alarms": {}
                                    }
                                    mock_invoke.return_value = Mock()
                                    
                                    from lib.infrastructure.main import \
                                        create_infrastructure
                                    
                                    result = create_infrastructure()
                                    
                                    # Verify export calls were made
                                    assert mock_pulumi.export.call_count >= 4  # At least 4 exports
                                    
                                    # Verify specific export calls
                                    mock_pulumi.export.assert_any_call("lambda_function_name", mock_lambda_function.name)
                                    mock_pulumi.export.assert_any_call("lambda_function_arn", mock_lambda_function.arn)
                                    mock_pulumi.export.assert_any_call("input_bucket_name", mock_input_bucket.name)
                                    mock_pulumi.export.assert_any_call("output_bucket_name", mock_output_bucket.name)
    
    def test_create_infrastructure_return_structure_detailed(self):
        """Test infrastructure creation return structure in detail."""
        with patch('lib.infrastructure.main.ServerlessConfig') as mock_config_class:
            with patch('lib.infrastructure.main.create_s3_buckets') as mock_s3:
                with patch('lib.infrastructure.main.create_s3_lifecycle_policies') as mock_lifecycle:
                    with patch('lib.infrastructure.main.create_iam_resources') as mock_iam:
                        with patch('lib.infrastructure.main.create_lambda_resources') as mock_lambda:
                            with patch('lib.infrastructure.main.create_lambda_invoke_policy') as mock_invoke:
                                with patch('lib.infrastructure.main.pulumi') as mock_pulumi:
                                    
                                    # Mock config instance
                                    mock_config_instance = Mock()
                                    mock_config_instance.validate_configuration.return_value = True
                                    mock_config_instance.environment_suffix = "test"
                                    mock_config_instance.region = "us-east-1"
                                    mock_config_instance.lambda_function_name = "test-lambda"
                                    mock_config_instance.get_tags.return_value = {"Environment": "test"}
                                    mock_config_class.return_value = mock_config_instance
                                    
                                    # Mock return values
                                    mock_s3_result = {
                                        "input_bucket": Mock(name="test-input-bucket"),
                                        "output_bucket": Mock(name="test-output-bucket"),
                                        "input_public_access_block": Mock(),
                                        "output_public_access_block": Mock(),
                                        "input_versioning": Mock(),
                                        "output_versioning": Mock(),
                                        "input_encryption": Mock(),
                                        "output_encryption": Mock()
                                    }
                                    mock_lifecycle_result = {
                                        "input_lifecycle": Mock(),
                                        "output_lifecycle": Mock()
                                    }
                                    mock_iam_result = {
                                        "lambda_role": Mock(),
                                        "s3_policy": Mock(),
                                        "logs_policy": Mock()
                                    }
                                    mock_lambda_result = {
                                        "lambda_function": Mock(name="test-lambda"),
                                        "lambda_permission": Mock(),
                                        "bucket_notification": Mock(),
                                        "alarms": {
                                            "error_alarm": Mock(),
                                            "throttle_alarm": Mock(),
                                            "duration_alarm": Mock()
                                        }
                                    }
                                    
                                    mock_s3.return_value = mock_s3_result
                                    mock_lifecycle.return_value = mock_lifecycle_result
                                    mock_iam.return_value = mock_iam_result
                                    mock_lambda.return_value = mock_lambda_result
                                    mock_invoke.return_value = Mock()
                                    
                                    from lib.infrastructure.main import \
                                        create_infrastructure
                                    
                                    result = create_infrastructure()
                                    
                                    # Verify comprehensive structure
                                    assert isinstance(result, dict)
                                    assert len(result) == 6
                                    
                                    # Verify all required keys
                                    required_keys = ["config", "storage", "lifecycle_policies", "iam", "lambda", "lambda_function"]
                                    for key in required_keys:
                                        assert key in result
                                    
                                    # Verify detailed content
                                    assert result["config"] == mock_config_instance
                                    assert result["storage"] == mock_s3_result
                                    assert result["lifecycle_policies"] == mock_lifecycle_result
                                    assert result["iam"] == mock_iam_result
                                    assert result["lambda"] == mock_lambda_result
                                    assert result["lambda_function"] == mock_lambda_result["lambda_function"]
                                    
                                    # Verify configuration validation was called
                                    mock_config_instance.validate_configuration.assert_called_once()
                                    
                                    # Verify all resource creation functions were called
                                    mock_s3.assert_called_once_with(mock_config_instance)
                                    mock_lifecycle.assert_called_once()
                                    mock_iam.assert_called_once()
                                    mock_lambda.assert_called_once()
                                    mock_invoke.assert_called_once()


class TestConfigModuleEdgeCases:
    """Additional tests for config.py edge cases to increase coverage."""
    
    def test_config_validation_edge_cases(self):
        """Test config validation with edge cases."""
        with patch('lib.infrastructure.config.pulumi.Config') as mock_config:
            # Test with valid configuration
            mock_config.return_value.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'valid',
                'allowed_ip_ranges': ['1.1.1.1/32'],
                'lambda_timeout': 100
            }.get(key, default)
            mock_config.return_value.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 100
            }.get(key, default)
            
            from lib.infrastructure.config import ServerlessConfig
            
            config = ServerlessConfig()
            assert config.validate_configuration() == True
            
            # Test with invalid IP range
            mock_config.return_value.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'valid',
                'allowed_ip_ranges': ['invalid-ip'],
                'lambda_timeout': 100
            }.get(key, default)
            
            with pytest.raises(ValueError):
                config.validate_configuration()
            
            # Test with invalid timeout
            mock_config.return_value.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'valid',
                'allowed_ip_ranges': ['1.1.1.1/32'],
                'lambda_timeout': 301
            }.get(key, default)
            mock_config.return_value.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 301
            }.get(key, default)
            
            with pytest.raises(ValueError):
                config.validate_configuration()
    
    def test_config_get_methods_comprehensive(self):
        """Test config get methods comprehensively."""
        with patch('lib.infrastructure.config.pulumi.Config') as mock_config:
            mock_config.return_value.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'test',
                'allowed_ip_ranges': ['192.168.1.0/24', '10.0.0.0/8'],
                'environment_variables': {'API_KEY': 'secret', 'DEBUG': 'true'}
            }.get(key, default)
            mock_config.return_value.get_object.side_effect = lambda key, default=None: {
                'allowed_ip_ranges': ['192.168.1.0/24', '10.0.0.0/8'],
                'environment_variables': {'API_KEY': 'secret', 'DEBUG': 'true'}
            }.get(key, default)
            
            from lib.infrastructure.config import ServerlessConfig
            
            config = ServerlessConfig()
            
            # Test get_allowed_ip_ranges
            ip_ranges = config.get_allowed_ip_ranges()
            assert ip_ranges == ['192.168.1.0/24', '10.0.0.0/8']
            
            # Test get_environment_variables
            env_vars = config.get_environment_variables()
            assert env_vars == {'API_KEY': 'secret', 'DEBUG': 'true'}
            
            # Test get_tags
            tags = config.get_tags()
            assert isinstance(tags, dict)
            assert 'Environment' in tags
            assert tags['Environment'] == 'test'
