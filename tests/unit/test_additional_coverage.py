"""
Additional tests to increase coverage for lambda_function.py, main.py, and storage.py.
Focuses on testing the uncovered functions and code paths.
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


class TestLambdaFunctionModuleAdditional:
    """Additional tests for lambda_function.py to increase coverage."""
    
    def test_create_lambda_function_comprehensive(self):
        """Test Lambda function creation with comprehensive mocking."""
        with patch('lib.infrastructure.lambda_function.aws') as mock_aws:
            with patch('lib.infrastructure.lambda_function.pulumi') as mock_pulumi:
                # Mock AWS resources
                mock_function = Mock()
                mock_aws.lambda_.Function.return_value = mock_function
                
                from lib.infrastructure.config import ServerlessConfig
                from lib.infrastructure.lambda_function import \
                    create_lambda_function
                
                config = ServerlessConfig()
                mock_role = Mock()
                mock_input_bucket = Mock()
                mock_output_bucket = Mock()
                
                result = create_lambda_function(config, mock_role, mock_input_bucket, mock_output_bucket)
                
                # Verify function is created
                assert result == mock_function
                mock_aws.lambda_.Function.assert_called_once()
                
                # Verify the function was called with correct parameters
                call_args = mock_aws.lambda_.Function.call_args
                assert call_args[1]['role'] == mock_role.arn
                assert call_args[1]['runtime'] == 'python3.9'
                assert call_args[1]['handler'] == 'app.lambda_handler'
                assert call_args[1]['timeout'] == config.lambda_timeout
                assert call_args[1]['memory_size'] == config.lambda_memory
    
    def test_create_s3_event_notification_comprehensive(self):
        """Test S3 event notification creation with comprehensive mocking."""
        with patch('lib.infrastructure.lambda_function.aws') as mock_aws:
            with patch('lib.infrastructure.lambda_function.pulumi') as mock_pulumi:
                # Mock AWS resources
                mock_permission = Mock()
                mock_notification = Mock()
                mock_aws.lambda_.Permission.return_value = mock_permission
                mock_aws.s3.BucketNotification.return_value = mock_notification
                
                from lib.infrastructure.config import ServerlessConfig
                from lib.infrastructure.lambda_function import \
                    create_s3_event_notification
                
                config = ServerlessConfig()
                mock_input_bucket = Mock()
                mock_lambda_function = Mock()
                
                result = create_s3_event_notification(config, mock_input_bucket, mock_lambda_function)
                
                # Verify notification is created
                assert result == mock_notification
                mock_aws.s3.BucketNotification.assert_called_once()
                
                # Verify permission is created
                mock_aws.lambda_.Permission.assert_called_once()
    
    def test_create_lambda_alarms_comprehensive(self):
        """Test Lambda CloudWatch alarms creation with comprehensive mocking."""
        with patch('lib.infrastructure.lambda_function.aws') as mock_aws:
            with patch('lib.infrastructure.lambda_function.pulumi') as mock_pulumi:
                # Mock AWS resources
                mock_alarm = Mock()
                mock_aws.cloudwatch.MetricAlarm.return_value = mock_alarm
                
                from lib.infrastructure.config import ServerlessConfig
                from lib.infrastructure.lambda_function import \
                    create_lambda_alarms
                
                config = ServerlessConfig()
                mock_lambda_function = Mock()
                
                result = create_lambda_alarms(config, mock_lambda_function)
                
                # Verify alarms are created
                assert "error_alarm" in result
                assert "throttle_alarm" in result
                assert "duration_alarm" in result
                assert mock_aws.cloudwatch.MetricAlarm.call_count == 3
    
    def test_create_lambda_resources_comprehensive(self):
        """Test complete Lambda resources creation with comprehensive mocking."""
        with patch('lib.infrastructure.lambda_function.aws') as mock_aws:
            with patch('lib.infrastructure.lambda_function.pulumi') as mock_pulumi:
                # Mock AWS resources
                mock_function = Mock()
                mock_permission = Mock()
                mock_notification = Mock()
                mock_alarm = Mock()
                
                mock_aws.lambda_.Function.return_value = mock_function
                mock_aws.lambda_.Permission.return_value = mock_permission
                mock_aws.s3.BucketNotification.return_value = mock_notification
                mock_aws.cloudwatch.MetricAlarm.return_value = mock_alarm
                
                from lib.infrastructure.config import ServerlessConfig
                from lib.infrastructure.lambda_function import \
                    create_lambda_resources
                
                config = ServerlessConfig()
                mock_role = Mock()
                mock_input_bucket = Mock()
                mock_output_bucket = Mock()
                
                result = create_lambda_resources(config, mock_role, mock_input_bucket, mock_output_bucket)
                
                # Verify all resources are created
                assert "lambda_function" in result
                assert "s3_notification" in result  # Corrected key name
                assert "alarms" in result
                
                # Verify creation calls
                mock_aws.lambda_.Function.assert_called_once()
                mock_aws.lambda_.Permission.assert_called_once()
                mock_aws.s3.BucketNotification.assert_called_once()
                assert mock_aws.cloudwatch.MetricAlarm.call_count == 3


class TestStorageModuleAdditional:
    """Additional tests for storage.py to increase coverage."""
    
    def test_create_s3_buckets_comprehensive(self):
        """Test S3 bucket creation with comprehensive mocking."""
        with patch('lib.infrastructure.storage.aws') as mock_aws:
            with patch('lib.infrastructure.storage.pulumi') as mock_pulumi:
                # Mock AWS resources
                mock_bucket = Mock()
                mock_public_access_block = Mock()
                mock_versioning = Mock()
                mock_encryption = Mock()
                
                mock_aws.s3.Bucket.return_value = mock_bucket
                mock_aws.s3.BucketPublicAccessBlock.return_value = mock_public_access_block
                mock_aws.s3.BucketVersioning.return_value = mock_versioning
                mock_aws.s3.BucketServerSideEncryptionConfiguration.return_value = mock_encryption
                
                from lib.infrastructure.config import ServerlessConfig
                from lib.infrastructure.storage import create_s3_buckets
                
                config = ServerlessConfig()
                result = create_s3_buckets(config)
                
                # Verify all expected resources are created
                assert "input_bucket" in result
                assert "output_bucket" in result
                assert "input_public_access_block" in result
                assert "output_public_access_block" in result
                assert "input_versioning" in result
                assert "output_versioning" in result
                assert "input_encryption" in result
                assert "output_encryption" in result
                
                # Verify bucket creation calls
                assert mock_aws.s3.Bucket.call_count == 2  # input and output buckets
                assert mock_aws.s3.BucketPublicAccessBlock.call_count == 2
                assert mock_aws.s3.BucketVersioning.call_count == 2
                assert mock_aws.s3.BucketServerSideEncryptionConfiguration.call_count == 2
    
    def test_create_s3_lifecycle_policies_comprehensive(self):
        """Test S3 lifecycle policy creation with comprehensive mocking."""
        with patch('lib.infrastructure.storage.aws') as mock_aws:
            with patch('lib.infrastructure.storage.pulumi') as mock_pulumi:
                # Mock AWS resources
                mock_lifecycle = Mock()
                mock_aws.s3.BucketLifecycleConfiguration.return_value = mock_lifecycle
                
                from lib.infrastructure.config import ServerlessConfig
                from lib.infrastructure.storage import \
                    create_s3_lifecycle_policies
                
                config = ServerlessConfig()
                mock_input_bucket = Mock()
                mock_output_bucket = Mock()
                
                result = create_s3_lifecycle_policies(config, mock_input_bucket, mock_output_bucket)
                
                # Verify lifecycle policies are created
                assert "input_lifecycle" in result
                assert "output_lifecycle" in result
                assert mock_aws.s3.BucketLifecycleConfiguration.call_count == 2
    
    def test_create_ip_restricted_bucket_policy_comprehensive(self):
        """Test IP-restricted bucket policy creation with comprehensive mocking."""
        with patch('lib.infrastructure.storage.aws') as mock_aws:
            with patch('lib.infrastructure.storage.pulumi') as mock_pulumi:
                # Mock AWS resources
                mock_policy = Mock()
                mock_aws.s3.BucketPolicy.return_value = mock_policy
                
                # Mock the bucket with proper Output behavior
                mock_bucket = Mock()
                mock_bucket.id = "test-bucket-id"
                mock_bucket.bucket = Mock()
                mock_bucket.bucket.apply = Mock(return_value="test-bucket-name")
                
                from lib.infrastructure.config import ServerlessConfig
                from lib.infrastructure.storage import \
                    create_ip_restricted_bucket_policy
                
                config = ServerlessConfig()
                
                result = create_ip_restricted_bucket_policy(config, mock_bucket, "input")
                
                # Verify policy is created
                assert result == mock_policy
                mock_aws.s3.BucketPolicy.assert_called_once()


class TestMainModuleAdditional:
    """Additional tests for main.py to increase coverage."""
    
    def test_create_infrastructure_comprehensive_scenarios(self):
        """Test infrastructure creation with comprehensive scenarios."""
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
    
    def test_create_infrastructure_error_handling_comprehensive(self):
        """Test infrastructure error handling with comprehensive scenarios."""
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
    
    def test_create_infrastructure_resource_creation_comprehensive(self):
        """Test infrastructure resource creation with comprehensive scenarios."""
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


class TestLambdaCodeAdditional:
    """Additional tests for Lambda code to increase coverage."""
    
    def test_lambda_handler_edge_cases(self):
        """Test Lambda handler with edge cases."""
        # Test with empty records
        event = {'Records': []}
        result = lambda_handler(event, Mock())
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert len(body) == 0
        
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
    
    def test_process_s3_record_edge_cases(self):
        """Test S3 record processing with edge cases."""
        record = {
            's3': {
                'bucket': {'name': 'test-input-bucket'},
                'object': {'key': 'test/file.json'}
            }
        }
        
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
    
    def test_process_s3_record_error_scenarios(self):
        """Test S3 record processing error scenarios."""
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
