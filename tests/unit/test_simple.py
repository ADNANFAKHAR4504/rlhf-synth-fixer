"""
Simplified unit tests for infrastructure modules.
Focuses on core functionality to achieve 80% coverage.
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


class TestLambdaCode:
    """Test Lambda handler and processing functions."""
    
    def test_lambda_handler_single_record(self):
        """Test Lambda handler with single S3 record."""
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
            mock_process.return_value = {
                'status': 'success',
                'bucket': 'test-input-bucket',
                'key': 'test/file.json'
            }
            
            result = lambda_handler(event, Mock())
            
            assert result['statusCode'] == 200
            assert 'body' in result
            mock_process.assert_called_once()
    
    def test_lambda_handler_multiple_records(self):
        """Test Lambda handler with multiple S3 records."""
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
            mock_process.return_value = {
                'status': 'success',
                'bucket': 'test-input-bucket',
                'key': 'test/file1.json'
            }
            
            result = lambda_handler(event, Mock())
            
            assert mock_process.call_count == 2
            assert result['statusCode'] == 200
    
    def test_lambda_handler_non_s3_record(self):
        """Test Lambda handler with non-S3 record."""
        event = {
            'Records': [
                {
                    'eventSource': 'aws:sqs',
                    'body': 'test message'
                }
            ]
        }
        
        result = lambda_handler(event, Mock())
        
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert len(body) == 1
        assert body[0]['status'] == 'skipped'
    
    def test_process_s3_record_success(self):
        """Test successful S3 record processing."""
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
            assert result['input_bucket'] == 'test-input-bucket'
            assert result['input_key'] == 'test/file.json'
    
    def test_process_s3_record_s3_error(self):
        """Test S3 record processing with S3 error."""
        record = {
            's3': {
                'bucket': {'name': 'test-input-bucket'},
                'object': {'key': 'test/file.json'}
            }
        }
        
        with patch('app.s3_client') as mock_s3:
            mock_s3.get_object.side_effect = Exception("S3 error")
            
            result = process_s3_record(record)
            
            assert result['status'] == 'error'
            assert 'error' in result
            assert 'S3 error' in result['error']


class TestConfigModule:
    """Test configuration module functionality."""
    
    def test_config_initialization(self):
        """Test basic config initialization."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = None
            
            # Import here to avoid issues
            from lib.infrastructure.config import ServerlessConfig
            
            config = ServerlessConfig()
            
            assert config.environment_suffix == "dev"
            assert config.region == "us-east-1"
            assert config.lambda_timeout == 300
            assert config.lambda_memory == 128
    
    def test_config_validation(self):
        """Test configuration validation."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = None
            
            from lib.infrastructure.config import ServerlessConfig
            
            config = ServerlessConfig()
            
            # Should not raise any exceptions
            assert config.validate_configuration() is True
    
    def test_config_invalid_region(self):
        """Test configuration validation with invalid region."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = None
            
            from lib.infrastructure.config import ServerlessConfig
            
            config = ServerlessConfig()
            config.region = "us-west-2"  # Invalid region
            
            with pytest.raises(ValueError, match="Deployment must be restricted to us-east-1 region"):
                config.validate_configuration()
    
    def test_config_invalid_ip_range(self):
        """Test configuration validation with invalid IP range."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = ["0.0.0.0/0"]  # Invalid IP range
            
            from lib.infrastructure.config import ServerlessConfig
            
            config = ServerlessConfig()
            
            with pytest.raises(ValueError, match="IP range 0.0.0.0/0 is not allowed for security reasons"):
                config.validate_configuration()
    
    def test_config_invalid_timeout(self):
        """Test configuration validation with invalid timeout."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 400  # Invalid timeout > 300 seconds
            }.get(key, default)
            mock_config.return_value.get_object.return_value = None
            
            from lib.infrastructure.config import ServerlessConfig
            
            config = ServerlessConfig()
            
            with pytest.raises(ValueError, match="Lambda timeout cannot exceed 5 minutes"):
                config.validate_configuration()
    
    def test_config_get_tags(self):
        """Test configuration tag retrieval."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = None
            
            from lib.infrastructure.config import ServerlessConfig
            
            config = ServerlessConfig()
            tags = config.get_tags()
            
            assert tags["Environment"] == "dev"
            assert tags["Project"] == "s3-lambda-processor"
            assert tags["ManagedBy"] == "pulumi"
            assert tags["Component"] == "serverless"
            assert tags["Region"] == "us-east-1"
    
    def test_config_get_environment_variables(self):
        """Test environment variables retrieval."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = None
            
            from lib.infrastructure.config import ServerlessConfig
            
            config = ServerlessConfig()
            env_vars = config.get_environment_variables()
            
            assert env_vars["ENVIRONMENT"] == "dev"
            assert env_vars["REGION"] == "us-east-1"
            assert env_vars["INPUT_BUCKET"] == "clean-s3-lambda-input-dev"
            assert env_vars["OUTPUT_BUCKET"] == "clean-s3-lambda-output-dev"
            assert env_vars["LOG_LEVEL"] == "INFO"
    
    def test_config_get_allowed_ip_ranges(self):
        """Test IP ranges retrieval."""
        with patch('pulumi.Config') as mock_config:
            mock_config.return_value.get.return_value = None
            mock_config.return_value.get_int.return_value = None
            mock_config.return_value.get_object.return_value = None
            
            from lib.infrastructure.config import ServerlessConfig
            
            config = ServerlessConfig()
            ip_ranges = config.get_allowed_ip_ranges()
            
            assert "10.0.0.0/8" in ip_ranges
            assert "172.16.0.0/12" in ip_ranges
            assert "192.168.0.0/16" in ip_ranges


class TestMainModule:
    """Test main infrastructure module."""
    
    def test_create_infrastructure_basic(self):
        """Test basic infrastructure creation."""
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
                                    
                                    # Verify infrastructure components were created
                                    assert "config" in result
                                    assert "storage" in result
                                    assert "lifecycle_policies" in result
                                    assert "iam" in result
                                    assert "lambda" in result
                                    assert "lambda_function" in result
                                    
                                    # Verify configuration validation was called
                                    mock_config_instance.validate_configuration.assert_called_once()
    
    def test_create_infrastructure_validation_failure(self):
        """Test infrastructure creation with validation failure."""
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
