"""
Final tests to push coverage to 70%+ by focusing on the remaining uncovered code.
Simplified approach to avoid complex mocking issues.
"""

import json
import os
import sys
from unittest.mock import MagicMock, Mock, patch

import pytest

# Add the lib directory to the Python path for module resolution
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib'))


class TestIamModuleSimplified:
    """Simplified tests for iam.py to increase coverage."""
    
    def test_create_iam_resources_simplified(self):
        """Test IAM resources creation with simplified mocking."""
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
                
                # Verify all expected resources are created (corrected key names)
                assert "lambda_role" in result
                assert "s3_policy" in result
                assert "logs_policy" in result
                assert "invoke_policy" in result  # Corrected key name
                
                # Verify creation calls
                mock_aws.iam.Role.assert_called_once()
                assert mock_aws.iam.Policy.call_count == 3  # s3, logs, invoke policies
                assert mock_aws.iam.RolePolicyAttachment.call_count == 3
    
    def test_create_s3_access_policy_simplified(self):
        """Test S3 access policy creation with simplified mocking."""
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
    
    def test_create_cloudwatch_logs_policy_simplified(self):
        """Test CloudWatch Logs policy creation with simplified mocking."""
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
    
    def test_create_lambda_invoke_policy_simplified(self):
        """Test Lambda invoke policy creation with simplified mocking."""
        with patch('lib.infrastructure.iam.aws') as mock_aws:
            with patch('lib.infrastructure.iam.pulumi') as mock_pulumi:
                # Mock AWS resources
                mock_policy = Mock()
                mock_aws.iam.Policy.return_value = mock_policy
                
                # Mock the lambda function with proper Output behavior
                mock_lambda_function = Mock()
                mock_lambda_function.arn = Mock()
                mock_lambda_function.arn.apply = Mock(return_value="arn:aws:lambda:us-east-1:123456789012:function:test-lambda")
                
                from lib.infrastructure.config import ServerlessConfig
                from lib.infrastructure.iam import create_lambda_invoke_policy
                
                config = ServerlessConfig()
                
                result = create_lambda_invoke_policy(config, mock_lambda_function)
                
                # Verify policy is created
                assert result == mock_policy
                mock_aws.iam.Policy.assert_called_once()


class TestMainModuleRemainingSimplified:
    """Simplified tests for main.py to cover remaining uncovered lines."""
    
    def test_create_infrastructure_export_statements_simplified(self):
        """Test infrastructure creation export statements with simplified approach."""
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
                                    mock_input_bucket.bucket = "test-input-bucket"  # Use .bucket instead of .name
                                    
                                    mock_output_bucket = Mock()
                                    mock_output_bucket.bucket = "test-output-bucket"  # Use .bucket instead of .name
                                    
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
    
    def test_create_infrastructure_return_structure_detailed_simplified(self):
        """Test infrastructure creation return structure in detail with simplified approach."""
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
                                        "input_bucket": Mock(bucket="test-input-bucket"),
                                        "output_bucket": Mock(bucket="test-output-bucket"),
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


class TestConfigModuleEdgeCasesSimplified:
    """Simplified tests for config.py edge cases to increase coverage."""
    
    def test_config_validation_edge_cases_simplified(self):
        """Test config validation with edge cases using simplified approach."""
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
            
            # This should raise a ValueError
            try:
                config.validate_configuration()
                assert False, "Expected ValueError to be raised"
            except ValueError:
                pass  # Expected behavior
            
            # Test with invalid timeout
            mock_config.return_value.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'valid',
                'allowed_ip_ranges': ['1.1.1.1/32'],
                'lambda_timeout': 301
            }.get(key, default)
            mock_config.return_value.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 301
            }.get(key, default)
            
            # This should raise a ValueError
            try:
                config.validate_configuration()
                assert False, "Expected ValueError to be raised"
            except ValueError:
                pass  # Expected behavior
    
    def test_config_get_methods_comprehensive_simplified(self):
        """Test config get methods comprehensively with simplified approach."""
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
            
            # Test get_environment_variables (this includes both custom and default vars)
            env_vars = config.get_environment_variables()
            assert isinstance(env_vars, dict)
            # Should contain both custom and default environment variables
            assert 'API_KEY' in env_vars
            assert 'DEBUG' in env_vars
            assert 'ENVIRONMENT' in env_vars  # Default variable
            
            # Test get_tags
            tags = config.get_tags()
            assert isinstance(tags, dict)
            assert 'Environment' in tags
            assert tags['Environment'] == 'test'
