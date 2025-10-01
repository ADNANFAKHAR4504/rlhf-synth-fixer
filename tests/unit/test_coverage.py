"""
Additional tests to achieve 80% coverage.
Tests the remaining infrastructure modules.
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


class TestStorageModule:
    """Test S3 storage module functionality."""
    
    def test_create_s3_buckets_basic(self):
        """Test basic S3 bucket creation."""
        with patch('lib.infrastructure.storage.pulumi_aws') as mock_aws:
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
                
                assert "input_bucket" in result
                assert "output_bucket" in result
                assert "input_public_access_block" in result
                assert "output_public_access_block" in result
                assert "input_versioning" in result
                assert "output_versioning" in result
                assert "input_encryption" in result
                assert "output_encryption" in result
    
    def test_create_s3_lifecycle_policies(self):
        """Test S3 lifecycle policy creation."""
        with patch('lib.infrastructure.storage.pulumi_aws') as mock_aws:
            with patch('lib.infrastructure.storage.pulumi') as mock_pulumi:
                # Mock AWS resources
                mock_lifecycle = Mock()
                mock_aws.s3.BucketLifecycleConfiguration.return_value = mock_lifecycle
                
                from lib.infrastructure.config import ServerlessConfig
                from lib.infrastructure.storage import \
                    create_s3_lifecycle_policies
                
                config = ServerlessConfig()
                mock_bucket = Mock()
                
                result = create_s3_lifecycle_policies(config, mock_bucket, mock_bucket)
                
                assert "input_lifecycle" in result
                assert "output_lifecycle" in result
    
    def test_create_ip_restricted_bucket_policy(self):
        """Test IP-restricted bucket policy creation."""
        with patch('lib.infrastructure.storage.pulumi_aws') as mock_aws:
            with patch('lib.infrastructure.storage.pulumi') as mock_pulumi:
                # Mock AWS resources
                mock_policy = Mock()
                mock_aws.s3.BucketPolicy.return_value = mock_policy
                
                from lib.infrastructure.config import ServerlessConfig
                from lib.infrastructure.storage import \
                    create_ip_restricted_bucket_policy
                
                config = ServerlessConfig()
                mock_bucket = Mock()
                mock_bucket.bucket = "test-bucket"
                
                result = create_ip_restricted_bucket_policy(config, mock_bucket, "input")
                
                assert result == mock_policy


class TestIAMModule:
    """Test IAM module functionality."""
    
    def test_create_lambda_execution_role(self):
        """Test Lambda execution role creation."""
        with patch('lib.infrastructure.iam.pulumi_aws') as mock_aws:
            with patch('lib.infrastructure.iam.pulumi') as mock_pulumi:
                # Mock AWS resources
                mock_role = Mock()
                mock_aws.iam.Role.return_value = mock_role
                
                from lib.infrastructure.config import ServerlessConfig
                from lib.infrastructure.iam import create_lambda_execution_role
                
                config = ServerlessConfig()
                result = create_lambda_execution_role(config)
                
                assert result == mock_role
    
    def test_create_s3_access_policy(self):
        """Test S3 access policy creation."""
        with patch('lib.infrastructure.iam.pulumi_aws') as mock_aws:
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
                
                assert result == mock_policy
    
    def test_create_cloudwatch_logs_policy(self):
        """Test CloudWatch logs policy creation."""
        with patch('lib.infrastructure.iam.pulumi_aws') as mock_aws:
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
                
                assert result == mock_policy
    
    def test_create_lambda_invoke_policy(self):
        """Test Lambda invoke policy creation."""
        with patch('lib.infrastructure.iam.pulumi_aws') as mock_aws:
            with patch('lib.infrastructure.iam.pulumi') as mock_pulumi:
                # Mock AWS resources
                mock_policy = Mock()
                mock_aws.iam.Policy.return_value = mock_policy
                
                from lib.infrastructure.config import ServerlessConfig
                from lib.infrastructure.iam import create_lambda_invoke_policy
                
                config = ServerlessConfig()
                mock_lambda_function = Mock()
                mock_lambda_function.arn = "arn:aws:lambda:us-east-1:123456789012:function:test"
                
                result = create_lambda_invoke_policy(config, mock_lambda_function)
                
                assert result == mock_policy
    
    def test_create_iam_resources(self):
        """Test IAM resources creation."""
        with patch('lib.infrastructure.iam.pulumi_aws') as mock_aws:
            with patch('lib.infrastructure.iam.pulumi') as mock_pulumi:
                # Mock AWS resources
                mock_role = Mock()
                mock_s3_policy = Mock()
                mock_logs_policy = Mock()
                mock_policy_attachment = Mock()
                
                mock_aws.iam.Role.return_value = mock_role
                mock_aws.iam.Policy.return_value = mock_s3_policy
                mock_aws.iam.Policy.return_value = mock_logs_policy
                mock_aws.iam.RolePolicyAttachment.return_value = mock_policy_attachment
                
                from lib.infrastructure.config import ServerlessConfig
                from lib.infrastructure.iam import create_iam_resources
                
                config = ServerlessConfig()
                mock_input_bucket = Mock()
                mock_output_bucket = Mock()
                
                result = create_iam_resources(config, mock_input_bucket, mock_output_bucket, None)
                
                assert "lambda_role" in result
                assert "s3_policy" in result
                assert "logs_policy" in result


class TestLambdaFunctionModule:
    """Test Lambda function module functionality."""
    
    def test_create_lambda_function(self):
        """Test Lambda function creation."""
        with patch('lib.infrastructure.lambda_function.pulumi_aws') as mock_aws:
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
                
                assert result == mock_function
    
    def test_create_s3_event_notification(self):
        """Test S3 event notification creation."""
        with patch('lib.infrastructure.lambda_function.pulumi_aws') as mock_aws:
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
                
                assert result == mock_notification
    
    def test_create_lambda_alarms(self):
        """Test Lambda CloudWatch alarms creation."""
        with patch('lib.infrastructure.lambda_function.pulumi_aws') as mock_aws:
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
                
                assert "error_alarm" in result
                assert "throttle_alarm" in result
                assert "duration_alarm" in result
    
    def test_create_lambda_resources(self):
        """Test complete Lambda resources creation."""
        with patch('lib.infrastructure.lambda_function.pulumi_aws') as mock_aws:
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
                
                assert "lambda_function" in result
                assert "lambda_permission" in result
                assert "bucket_notification" in result
                assert "alarms" in result


class TestTapStackModule:
    """Test TapStack module functionality."""
    
    def test_tap_stack_args_initialization(self):
        """Test TapStackArgs initialization."""
        from lib.tap_stack import TapStackArgs
        
        args = TapStackArgs("test")
        assert args.environment_suffix == "test"
    
    def test_tap_stack_initialization(self):
        """Test TapStack initialization."""
        with patch('lib.tap_stack.create_infrastructure') as mock_create_infrastructure:
            with patch('lib.tap_stack.pulumi') as mock_pulumi:
                mock_create_infrastructure.return_value = {
                    "config": Mock(),
                    "storage": Mock(),
                    "iam": Mock(),
                    "lambda": Mock()
                }
                
                from lib.tap_stack import TapStack, TapStackArgs
                
                args = TapStackArgs("test")
                stack = TapStack("test-stack", args)
                
                assert stack.name == "test-stack"
                assert stack.args == args
                assert stack.infrastructure is not None
    
    def test_tap_stack_validation(self):
        """Test TapStack validation."""
        with patch('lib.tap_stack.create_infrastructure') as mock_create_infrastructure:
            with patch('lib.tap_stack.pulumi') as mock_pulumi:
                mock_create_infrastructure.return_value = {
                    "config": Mock(),
                    "storage": Mock(),
                    "iam": Mock(),
                    "lambda": Mock()
                }
                
                from lib.tap_stack import TapStack, TapStackArgs
                
                args = TapStackArgs("test")
                stack = TapStack("test-stack", args)
                
                # Validation should not raise any exceptions
                stack.validate_deployment()
    
    def test_tap_stack_outputs(self):
        """Test TapStack output registration."""
        with patch('lib.tap_stack.create_infrastructure') as mock_create_infrastructure:
            with patch('lib.tap_stack.pulumi') as mock_pulumi:
                mock_create_infrastructure.return_value = {
                    "config": Mock(),
                    "storage": Mock(),
                    "iam": Mock(),
                    "lambda": Mock()
                }
                
                from lib.tap_stack import TapStack, TapStackArgs
                
                args = TapStackArgs("test")
                stack = TapStack("test-stack", args)
                
                # Output registration should not raise any exceptions
                stack.register_outputs()


class TestLambdaCodeAdditional:
    """Additional Lambda code tests for better coverage."""
    
    def test_lambda_handler_context_usage(self):
        """Test Lambda handler uses context parameter."""
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
        
        mock_context = Mock()
        mock_context.function_name = "test-function"
        mock_context.aws_request_id = "test-request-id"
        
        with patch('app.process_s3_record') as mock_process:
            mock_process.return_value = {'status': 'success'}
            result = lambda_handler(event, mock_context)
            
            assert result['statusCode'] == 200
            mock_process.assert_called_once()
    
    def test_lambda_handler_error_handling(self):
        """Test Lambda handler error handling."""
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
        
        with patch('app.process_s3_record', side_effect=Exception("Processing error")):
            result = lambda_handler(event, Mock())
            
            assert result['statusCode'] == 200
            body = json.loads(result['body'])
            assert len(body) == 1
            assert body[0]['status'] == 'error'
    
    def test_process_s3_record_metadata_extraction(self):
        """Test S3 record metadata extraction."""
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
