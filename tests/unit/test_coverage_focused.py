"""
Focused tests to achieve 70%+ coverage on testable modules.
Excludes problematic Pulumi modules and focuses on core functionality.
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


class TestConfigModuleFocused:
    """Focused tests for config module to maximize coverage."""
    
    def test_config_comprehensive_initialization(self):
        """Test comprehensive config initialization scenarios."""
        with patch('pulumi.Config') as mock_config:
            # Test with all possible configuration values
            mock_config.return_value.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'test',
                'allowed_account_id': '123456789012',
                'input_bucket_name': 'custom-input-bucket',
                'output_bucket_name': 'custom-output-bucket',
                'lambda_function_name': 'custom-lambda-function',
                'lambda_timeout': 120,
                'lambda_memory': 256,
                'allowed_ip_ranges': ['10.0.0.0/8', '192.168.1.0/24'],
                'log_retention_days': 14,
                'environment_variables': {'API_KEY': 'secret', 'DEBUG': 'true'}
            }.get(key, default)
            mock_config.return_value.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 120,
                'lambda_memory': 256,
                'log_retention_days': 14
            }.get(key, default)
            mock_config.return_value.get_object.side_effect = lambda key, default=None: {
                'allowed_ip_ranges': ['10.0.0.0/8', '192.168.1.0/24'],
                'environment_variables': {'API_KEY': 'secret', 'DEBUG': 'true'}
            }.get(key, default)
            
            from lib.infrastructure.config import ServerlessConfig
            
            config = ServerlessConfig()
            
            # Test all attributes
            assert config.environment_suffix == "test"
            assert config.region == "us-east-1"  # Should be enforced
            assert config.input_bucket_name == "custom-input-bucket"
            assert config.output_bucket_name == "custom-output-bucket"
            assert config.lambda_function_name == "custom-lambda-function"
            assert config.lambda_timeout == 120
            assert config.lambda_memory == 256
            assert config.allowed_ip_ranges == ['10.0.0.0/8', '192.168.1.0/24']
            assert config.log_retention_days == 14
            assert config.environment_variables == {'API_KEY': 'secret', 'DEBUG': 'true'}
            
            # Test validation
            assert config.validate_configuration() is True
            
            # Test get methods
            tags = config.get_tags()
            assert isinstance(tags, dict)
            assert "Environment" in tags
            assert tags["Environment"] == "test"
            
            env_vars = config.get_environment_variables()
            assert isinstance(env_vars, dict)
            assert "ENVIRONMENT" in env_vars
            assert env_vars["ENVIRONMENT"] == "test"
            
            ip_ranges = config.get_allowed_ip_ranges()
            assert isinstance(ip_ranges, list)
            assert len(ip_ranges) == 2
    
    def test_config_edge_cases(self):
        """Test config edge cases and error handling."""
        with patch('pulumi.Config') as mock_config:
            # Test with minimal configuration
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = None
            
            from lib.infrastructure.config import ServerlessConfig
            
            config = ServerlessConfig()
            
            # Test default values
            assert config.environment_suffix == "dev"
            assert config.region == "us-east-1"
            assert config.input_bucket_name == "clean-s3-lambda-input-dev"
            assert config.output_bucket_name == "clean-s3-lambda-output-dev"
            assert config.lambda_function_name == "s3-lambda-processor"
            assert config.lambda_timeout == 300
            assert config.lambda_memory == 128
            assert config.log_retention_days == 7
            
            # Test validation with defaults
            assert config.validate_configuration() is True
    
    def test_config_validation_comprehensive(self):
        """Test comprehensive config validation."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = None
            
            from lib.infrastructure.config import ServerlessConfig
            
            config = ServerlessConfig()
            
            # Test valid configuration
            assert config.validate_configuration() is True
            
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


class TestLambdaCodeFocused:
    """Focused tests for Lambda code to maximize coverage."""
    
    def test_lambda_handler_comprehensive_scenarios(self):
        """Test Lambda handler with comprehensive scenarios."""
        # Test with empty event
        event = {'Records': []}
        result = lambda_handler(event, Mock())
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert len(body) == 0
        
        # Test with single S3 record
        event = {
            'Records': [
                {
                    's3': {
                        'bucket': {'name': 'test-input-bucket'},
                        'object': {'key': 'test/file.json'}
                    }
                }
            ]
        }
        
        with patch('app.process_s3_record') as mock_process:
            mock_process.return_value = {'status': 'success'}
            result = lambda_handler(event, Mock())
            
            assert result['statusCode'] == 200
            mock_process.assert_called_once()
        
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
        
        # Test with mixed record types
        event = {
            'Records': [
                {
                    's3': {
                        'bucket': {'name': 'test-input-bucket'},
                        'object': {'key': 'test/file.json'}
                    }
                },
                {
                    'eventSource': 'aws:sqs',
                    'body': 'test message'
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
            # Should process 2 S3 records and skip 1 non-S3 record
            assert mock_process.call_count == 2
    
    def test_process_s3_record_comprehensive_scenarios(self):
        """Test S3 record processing with comprehensive scenarios."""
        record = {
            's3': {
                'bucket': {'name': 'test-input-bucket'},
                'object': {'key': 'test/file.json'}
            }
        }
        
        # Test successful processing
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
        
        # Test with different content types
        with patch('app.s3_client') as mock_s3:
            mock_s3.get_object.return_value = {
                'Body': Mock(read=Mock(return_value=b'{"test": "data"}'))
            }
            mock_s3.head_object.return_value = {
                'ContentType': 'text/plain',
                'ContentLength': 15,
                'LastModified': datetime.now()
            }
            mock_s3.put_object.return_value = {'ETag': '"test-etag"'}
            
            result = process_s3_record(record)
            
            assert result['status'] == 'success'
        
        # Test with different file sizes
        with patch('app.s3_client') as mock_s3:
            mock_s3.get_object.return_value = {
                'Body': Mock(read=Mock(return_value=b'{"test": "data"}'))
            }
            mock_s3.head_object.return_value = {
                'ContentType': 'application/json',
                'ContentLength': 1000,
                'LastModified': datetime.now()
            }
            mock_s3.put_object.return_value = {'ETag': '"test-etag"'}
            
            result = process_s3_record(record)
            
            assert result['status'] == 'success'
    
    def test_process_s3_record_error_scenarios_comprehensive(self):
        """Test S3 record processing error scenarios comprehensively."""
        record = {
            's3': {
                'bucket': {'name': 'test-input-bucket'},
                'object': {'key': 'test/file.json'}
            }
        }
        
        # Test S3 head_object error
        with patch('app.s3_client') as mock_s3:
            mock_s3.head_object.side_effect = Exception("Head object error")
            
            result = process_s3_record(record)
            
            assert result['status'] == 'error'
            assert 'Head object error' in result['error']
        
        # Test S3 get_object error
        with patch('app.s3_client') as mock_s3:
            mock_s3.head_object.return_value = {
                'ContentType': 'application/json',
                'ContentLength': 15,
                'LastModified': datetime.now()
            }
            mock_s3.get_object.side_effect = Exception("Get object error")
            
            result = process_s3_record(record)
            
            assert result['status'] == 'error'
            assert 'Get object error' in result['error']
        
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
            mock_s3.put_object.side_effect = Exception("Put object error")
            
            result = process_s3_record(record)
            
            assert result['status'] == 'error'
            assert 'Put object error' in result['error']


class TestMainModuleFocused:
    """Focused tests for main module to maximize coverage."""
    
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
                                    mock_config_instance.environment_suffix = "test"
                                    mock_config_instance.region = "us-east-1"
                                    mock_config_instance.lambda_function_name = "test-lambda"
                                    mock_config_instance.get_tags.return_value = {"Environment": "test"}
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
                                    mock_config_instance.environment_suffix = "test"
                                    mock_config_instance.region = "us-east-1"
                                    mock_config_instance.lambda_function_name = "test-lambda"
                                    mock_config_instance.get_tags.return_value = {"Environment": "test"}
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
