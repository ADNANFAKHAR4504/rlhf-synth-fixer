"""
Final comprehensive tests to achieve 80% coverage.
Focuses on testing core functionality without complex mocking.
"""

import json
import os
# Test the Lambda code directly
import sys
from datetime import datetime
from unittest.mock import MagicMock, Mock, patch

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/infrastructure/lambda_code'))

from app import lambda_handler, process_s3_record


class TestLambdaCodeFinal:
    """Final comprehensive tests for Lambda code."""
    
    def test_lambda_handler_comprehensive(self):
        """Test Lambda handler with comprehensive scenarios."""
        # Test with multiple S3 records
        event = {
            'Records': [
                {
                    's3': {
                        'bucket': {'name': 'test-input-bucket'},
                        'object': {'key': 'test/file1.json'}
                    }
                },
                {
                    's3': {
                        'bucket': {'name': 'test-input-bucket'},
                        'object': {'key': 'test/file2.json'}
                    }
                }
            ]
        }
        
        with patch('app.process_s3_record') as mock_process:
            mock_process.return_value = {'status': 'success'}
            result = lambda_handler(event, Mock())
            
            assert result['statusCode'] == 200
            assert mock_process.call_count == 2
    
    def test_process_s3_record_comprehensive(self):
        """Test S3 record processing with comprehensive scenarios."""
        record = {
            's3': {
                'bucket': {'name': 'test-input-bucket'},
                'object': {'key': 'test/file.json'}
            }
        }
        
        with patch('app.s3_client') as mock_s3:
            mock_s3.get_object.return_value = {
                'Body': Mock(read=Mock(return_value=b'{"test": "data"}'))
            }
            mock_s3.head_object.return_value = {
                'ContentType': 'application/json',
                'ContentLength': 15,
                'LastModified': datetime.now()
            }
            mock_s3.put_object.return_value = {'ETag': '"test-etag"'}
            
            result = process_s3_record(record)
            
            assert result['status'] == 'success'
            assert 'input_bucket' in result
            assert 'input_key' in result
            assert 'processed_at' in result
            assert 'output_bucket' in result
            assert 'output_key' in result
    
    def test_process_s3_record_error_scenarios(self):
        """Test S3 record processing error scenarios."""
        record = {
            's3': {
                'bucket': {'name': 'test-input-bucket'},
                'object': {'key': 'test/file.json'}
            }
        }
        
        # Test S3 get_object error
        with patch('app.s3_client') as mock_s3:
            mock_s3.get_object.side_effect = Exception("S3 error")
            mock_s3.head_object.return_value = {
                'ContentType': 'application/json',
                'ContentLength': 15,
                'LastModified': datetime.now()
            }
            
            result = process_s3_record(record)
            
            assert result['status'] == 'error'
            assert 'S3 error' in result['error']
        
        # Test S3 put_object error
        with patch('app.s3_client') as mock_s3:
            mock_s3.get_object.return_value = {
                'Body': Mock(read=Mock(return_value=b'{"test": "data"}'))
            }
            mock_s3.head_object.return_value = {
                'ContentType': 'application/json',
                'ContentLength': 15,
                'LastModified': datetime.now()
            }
            mock_s3.put_object.side_effect = Exception("Upload error")
            
            result = process_s3_record(record)
            
            assert result['status'] == 'error'
            assert 'Upload error' in result['error']


class TestConfigModuleFinal:
    """Final comprehensive tests for configuration module."""
    
    def test_config_comprehensive_validation(self):
        """Test comprehensive configuration validation."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = None
            
            from lib.infrastructure.config import ServerlessConfig
            
            config = ServerlessConfig()
            
            # Test all validation methods
            assert config.validate_configuration() is True
            
            # Test get methods
            tags = config.get_tags()
            assert isinstance(tags, dict)
            assert "Environment" in tags
            
            env_vars = config.get_environment_variables()
            assert isinstance(env_vars, dict)
            assert "ENVIRONMENT" in env_vars
            
            ip_ranges = config.get_allowed_ip_ranges()
            assert isinstance(ip_ranges, list)
            assert len(ip_ranges) > 0
    
    def test_config_custom_values(self):
        """Test configuration with custom values."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'prod',
                'input_bucket_name': 'custom-input',
                'output_bucket_name': 'custom-output',
                'log_level': 'DEBUG'
            }.get(key, default)
            mock_config.return_value.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 600,
                'lambda_memory': 256
            }.get(key, default)
            mock_config.return_value.get_object.return_value = ["10.0.0.0/8", "192.168.1.0/24"]
            
            from lib.infrastructure.config import ServerlessConfig
            
            config = ServerlessConfig()
            
            assert config.environment_suffix == "prod"
            assert config.input_bucket_name == "custom-input"
            assert config.output_bucket_name == "custom-output"
            assert config.lambda_timeout == 600
            assert config.lambda_memory == 256
            assert config.allowed_ip_ranges == ["10.0.0.0/8", "192.168.1.0/24"]
    
    def test_config_validation_errors(self):
        """Test configuration validation errors."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = None
            
            from lib.infrastructure.config import ServerlessConfig
            
            config = ServerlessConfig()
            
            # Test invalid region
            config.region = "us-west-2"
            with pytest.raises(ValueError, match="Deployment must be restricted to us-east-1 region"):
                config.validate_configuration()
            
            # Reset region
            config.region = "us-east-1"
            
            # Test invalid IP range
            config.allowed_ip_ranges = ["0.0.0.0/0"]
            with pytest.raises(ValueError, match="IP range 0.0.0.0/0 is not allowed for security reasons"):
                config.validate_configuration()
            
            # Reset IP ranges
            config.allowed_ip_ranges = ["10.0.0.0/8"]
            
            # Test invalid timeout
            config.lambda_timeout = 400
            with pytest.raises(ValueError, match="Lambda timeout cannot exceed 5 minutes"):
                config.validate_configuration()


class TestMainModuleFinal:
    """Final comprehensive tests for main infrastructure module."""
    
    def test_create_infrastructure_comprehensive(self):
        """Test comprehensive infrastructure creation."""
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
                                    mock_config_class.return_value = mock_config_instance
                                    
                                    # Mock return values
                                    mock_s3.return_value = {
                                        "input_bucket": Mock(),
                                        "output_bucket": Mock(),
                                        "input_public_access_block": Mock(),
                                        "output_public_access_block": Mock(),
                                        "input_versioning": Mock(),
                                        "output_versioning": Mock(),
                                        "input_encryption": Mock(),
                                        "output_encryption": Mock()
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
                                        "lambda_function": Mock(),
                                        "lambda_permission": Mock(),
                                        "bucket_notification": Mock(),
                                        "alarms": {
                                            "error_alarm": Mock(),
                                            "throttle_alarm": Mock(),
                                            "duration_alarm": Mock()
                                        }
                                    }
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
                                    
                                    # Verify resource coordination
                                    assert result["config"] == mock_config_instance
                                    assert result["storage"] == mock_s3.return_value
                                    assert result["lifecycle_policies"] == mock_lifecycle.return_value
                                    assert result["iam"] == mock_iam.return_value
                                    assert result["lambda"] == mock_lambda.return_value
                                    assert result["lambda_function"] == mock_lambda.return_value["lambda_function"]
                                    
                                    # Verify configuration validation was called
                                    mock_config_instance.validate_configuration.assert_called_once()
    
    def test_create_infrastructure_error_handling(self):
        """Test infrastructure error handling."""
        with patch('lib.infrastructure.main.ServerlessConfig') as mock_config_class:
            with patch('lib.infrastructure.main.pulumi') as mock_pulumi:
                
                # Mock config instance with validation failure
                mock_config_instance = Mock()
                mock_config_instance.validate_configuration.side_effect = ValueError("Invalid configuration")
                mock_config_class.return_value = mock_config_instance
                
                from lib.infrastructure.main import create_infrastructure

                # Should raise the validation error
                with pytest.raises(ValueError, match="Invalid configuration"):
                    create_infrastructure()
    
    def test_create_infrastructure_resource_creation(self):
        """Test infrastructure resource creation."""
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
                                    mock_config_class.return_value = mock_config_instance
                                    
                                    # Mock return values
                                    mock_s3.return_value = {"input_bucket": Mock(), "output_bucket": Mock()}
                                    mock_lifecycle.return_value = {"input_lifecycle": Mock(), "output_lifecycle": Mock()}
                                    mock_iam.return_value = {"lambda_role": Mock(), "s3_policy": Mock()}
                                    mock_lambda.return_value = {"lambda_function": Mock(), "alarms": {}}
                                    mock_invoke.return_value = Mock()
                                    
                                    from lib.infrastructure.main import \
                                        create_infrastructure
                                    
                                    result = create_infrastructure()
                                    
                                    # Verify all resource creation functions were called
                                    mock_s3.assert_called_once_with(mock_config_instance)
                                    mock_lifecycle.assert_called_once()
                                    mock_iam.assert_called_once()
                                    mock_lambda.assert_called_once()
                                    mock_invoke.assert_called_once()


class TestTapStackFinal:
    """Final comprehensive tests for TapStack module."""
    
    def test_tap_stack_args_comprehensive(self):
        """Test TapStackArgs comprehensive functionality."""
        # Test with different environment suffixes
        from lib.tap_stack import TapStackArgs
        
        args1 = TapStackArgs("dev")
        assert args1.environment_suffix == "dev"
        
        args2 = TapStackArgs("prod")
        assert args2.environment_suffix == "prod"
        
        args3 = TapStackArgs("staging")
        assert args3.environment_suffix == "staging"
    
    def test_tap_stack_comprehensive(self):
        """Test TapStack comprehensive functionality."""
        with patch('lib.tap_stack.create_infrastructure') as mock_create_infrastructure:
            with patch('lib.tap_stack.pulumi') as mock_pulumi:
                # Mock infrastructure result
                mock_infrastructure = {
                    "config": Mock(),
                    "storage": {
                        "input_bucket": Mock(),
                        "output_bucket": Mock()
                    },
                    "iam": {
                        "lambda_role": Mock(),
                        "s3_policy": Mock()
                    },
                    "lambda": {
                        "lambda_function": Mock(),
                        "alarms": {}
                    }
                }
                mock_create_infrastructure.return_value = mock_infrastructure
                
                from lib.tap_stack import TapStack, TapStackArgs

                # Test initialization
                args = TapStackArgs("test")
                stack = TapStack("test-stack", args)
                
                assert stack.name == "test-stack"
                assert stack.args == args
                assert stack.infrastructure == mock_infrastructure
                
                # Test validation (should not raise exceptions)
                stack.validate_deployment()
                
                # Test output registration (should not raise exceptions)
                stack.register_outputs()
    
    def test_tap_stack_error_handling(self):
        """Test TapStack error handling."""
        with patch('lib.tap_stack.create_infrastructure', side_effect=Exception("Infrastructure creation failed")):
            with patch('lib.tap_stack.pulumi') as mock_pulumi:
                from lib.tap_stack import TapStack, TapStackArgs
                
                args = TapStackArgs("test")
                
                # Should raise the infrastructure creation error
                with pytest.raises(Exception, match="Infrastructure creation failed"):
                    TapStack("test-stack", args)
    
    def test_tap_stack_validation_comprehensive(self):
        """Test TapStack validation comprehensive scenarios."""
        with patch('lib.tap_stack.create_infrastructure') as mock_create_infrastructure:
            with patch('lib.tap_stack.pulumi') as mock_pulumi:
                # Mock infrastructure result
                mock_infrastructure = {
                    "config": Mock(),
                    "storage": Mock(),
                    "iam": Mock(),
                    "lambda": Mock()
                }
                mock_create_infrastructure.return_value = mock_infrastructure
                
                from lib.tap_stack import TapStack, TapStackArgs

                # Test with different environment suffixes
                for env in ["dev", "prod", "staging", "test"]:
                    args = TapStackArgs(env)
                    stack = TapStack(f"{env}-stack", args)
                    
                    # Validation should not raise any exceptions
                    stack.validate_deployment()
                    
                    # Output registration should not raise any exceptions
                    stack.register_outputs()
