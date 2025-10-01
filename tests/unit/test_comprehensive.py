"""
Comprehensive unit tests to achieve 80% coverage.
Tests all infrastructure modules with proper mocking.
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


class TestLambdaCodeComprehensive:
    """Comprehensive tests for Lambda code."""
    
    def test_lambda_handler_empty_records(self):
        """Test Lambda handler with empty records."""
        event = {'Records': []}
        result = lambda_handler(event, Mock())
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert len(body) == 0
    
    def test_lambda_handler_mixed_records(self):
        """Test Lambda handler with mixed record types."""
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
                }
            ]
        }
        
        with patch('app.process_s3_record') as mock_process:
            mock_process.return_value = {'status': 'success'}
            result = lambda_handler(event, Mock())
            
            assert result['statusCode'] == 200
            mock_process.assert_called_once()
    
    def test_process_s3_record_processing_error(self):
        """Test S3 record processing with processing error."""
        record = {
            's3': {
                'bucket': {'name': 'test-input-bucket'},
                'object': {'key': 'test/file.json'}
            }
        }
        
        with patch('app.s3_client') as mock_s3:
            # Simulate S3 get_object failure
            mock_s3.get_object.side_effect = Exception("S3 get_object failed")
            mock_s3.head_object.return_value = {
                'ContentType': 'application/json',
                'ContentLength': 15,
                'LastModified': datetime.now()
            }
            
            result = process_s3_record(record)
            
            assert result['status'] == 'error'
            assert 'error' in result
            assert 'S3 get_object failed' in result['error']
    
    def test_process_s3_record_upload_error(self):
        """Test S3 record processing with upload error."""
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
            mock_s3.put_object.side_effect = Exception("Upload error")
            
            result = process_s3_record(record)
            
            assert result['status'] == 'error'
            assert 'Upload error' in result['error']
    
    def test_process_s3_record_data_processing(self):
        """Test S3 record data processing logic."""
        record = {
            's3': {
                'bucket': {'name': 'test-input-bucket'},
                'object': {'key': 'test/file.json'}
            }
        }
        
        test_data = {"test": "data", "value": 123}
        
        with patch('app.s3_client') as mock_s3:
            mock_s3.get_object.return_value = {
                'Body': Mock(read=Mock(return_value=json.dumps(test_data).encode()))
            }
            mock_s3.head_object.return_value = {
                'ContentType': 'application/json',
                'ContentLength': 15,
                'LastModified': datetime.now()
            }
            mock_s3.put_object.return_value = {'ETag': '"test-etag"'}
            
            result = process_s3_record(record)
            
            assert result['status'] == 'success'
            mock_s3.get_object.assert_called_once_with(
                Bucket='test-input-bucket',
                Key='test/file.json'
            )
            mock_s3.put_object.assert_called_once()
    
    def test_process_s3_record_output_bucket_configuration(self):
        """Test S3 record processing with output bucket configuration."""
        record = {
            's3': {
                'bucket': {'name': 'test-input-bucket'},
                'object': {'key': 'test/file.json'}
            }
        }
        
        with patch('app.s3_client') as mock_s3:
            with patch.dict(os.environ, {'OUTPUT_BUCKET': 'test-output-bucket'}):
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
                mock_s3.put_object.assert_called_once()
                
                put_call_args = mock_s3.put_object.call_args
                assert put_call_args[1]['Bucket'] == 'test-output-bucket'
    
    def test_process_s3_record_logging(self):
        """Test S3 record processing logging."""
        record = {
            's3': {
                'bucket': {'name': 'test-input-bucket'},
                'object': {'key': 'test/file.json'}
            }
        }
        
        with patch('app.s3_client') as mock_s3:
            with patch('app.logger') as mock_logger:
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
                
                assert mock_logger.info.called
                assert mock_logger.info.call_count >= 2


class TestConfigModuleComprehensive:
    """Comprehensive tests for configuration module."""
    
    def test_config_custom_environment_suffix(self):
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
            
            from lib.infrastructure.config import ServerlessConfig
            config = ServerlessConfig()
            
            assert config.environment_suffix == "prod"
            assert config.input_bucket_name == "clean-s3-lambda-input-prod"
            assert config.output_bucket_name == "clean-s3-lambda-output-prod"
            assert config.lambda_function_name == "s3-processor-prod"
    
    def test_config_custom_bucket_names(self):
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
            
            from lib.infrastructure.config import ServerlessConfig
            config = ServerlessConfig()
            
            assert config.input_bucket_name == "custom-input-bucket"
            assert config.output_bucket_name == "custom-output-bucket"
    
    def test_config_custom_lambda_settings(self):
        """Test configuration with custom Lambda settings."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 600,
                'lambda_memory': 256
            }.get(key, default)
            mock_config.return_value.get_object.return_value = None
            
            from lib.infrastructure.config import ServerlessConfig
            config = ServerlessConfig()
            
            assert config.lambda_timeout == 600
            assert config.lambda_memory == 256
    
    def test_config_custom_ip_ranges(self):
        """Test configuration with custom IP ranges."""
        custom_ranges = ["10.0.0.0/8", "192.168.1.0/24"]
        
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = custom_ranges
            
            from lib.infrastructure.config import ServerlessConfig
            config = ServerlessConfig()
            
            assert config.allowed_ip_ranges == custom_ranges
    
    def test_config_environment_variables(self):
        """Test Lambda environment variables configuration."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'staging',
                'log_level': 'DEBUG'
            }.get(key, default)
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = None
            
            from lib.infrastructure.config import ServerlessConfig
            config = ServerlessConfig()
            env_vars = config.get_environment_variables()
            
            assert env_vars["ENVIRONMENT"] == "staging"
            assert env_vars["REGION"] == "us-east-1"
            assert env_vars["INPUT_BUCKET"] == "clean-s3-lambda-input-staging"
            assert env_vars["OUTPUT_BUCKET"] == "clean-s3-lambda-output-staging"
            assert env_vars["LOG_LEVEL"] == "DEBUG"


class TestMainModuleComprehensive:
    """Comprehensive tests for main infrastructure module."""
    
    def test_create_infrastructure_resource_coordination(self):
        """Test infrastructure resource coordination."""
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
                                    
                                    # Verify resource coordination
                                    assert result["config"] == mock_config_instance
                                    assert result["storage"] == mock_s3.return_value
                                    assert result["lifecycle_policies"] == mock_lifecycle.return_value
                                    assert result["iam"] == mock_iam.return_value
                                    assert result["lambda"] == mock_lambda.return_value
    
    def test_create_infrastructure_error_handling(self):
        """Test infrastructure error handling."""
        with patch('lib.infrastructure.main.ServerlessConfig') as mock_config_class:
            with patch('lib.infrastructure.main.create_s3_buckets', side_effect=Exception("S3 creation failed")):
                with patch('lib.infrastructure.main.pulumi') as mock_pulumi:
                    
                    # Mock config instance
                    mock_config_instance = Mock()
                    mock_config_instance.validate_configuration.return_value = True
                    mock_config_class.return_value = mock_config_instance
                    
                    from lib.infrastructure.main import create_infrastructure

                    # Should raise the S3 creation error
                    with pytest.raises(Exception, match="S3 creation failed"):
                        create_infrastructure()
    
    def test_create_infrastructure_return_structure(self):
        """Test infrastructure return structure."""
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
                                    
                                    # Verify return structure
                                    assert isinstance(result, dict)
                                    assert len(result) == 6
                                    
                                    # Verify all required keys are present
                                    required_keys = ["config", "storage", "lifecycle_policies", "iam", "lambda", "lambda_function"]
                                    for key in required_keys:
                                        assert key in result
                                    
                                    # Verify lambda_function is the same as lambda["lambda_function"]
                                    assert result["lambda_function"] == result["lambda"]["lambda_function"]
    
    def test_create_infrastructure_modular_design(self):
        """Test infrastructure modular design."""
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
                                    
                                    # Verify modular design - each component is separate
                                    assert "storage" in result
                                    assert "iam" in result
                                    assert "lambda" in result
                                    
                                    # Verify each module has its own resources
                                    assert "input_bucket" in result["storage"]
                                    assert "output_bucket" in result["storage"]
                                    assert "lambda_role" in result["iam"]
                                    assert "lambda_function" in result["lambda"]
