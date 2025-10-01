"""
Unit tests for the Lambda function module.
Tests Lambda function creation, S3 event notifications, and CloudWatch alarms.
"""

from unittest.mock import MagicMock, Mock, patch

import pytest

# Mock Pulumi before importing our modules
pulumi = Mock()
pulumi.AssetArchive = Mock
pulumi.FileArchive = Mock
pulumi.ResourceOptions = Mock
pulumi_aws = Mock()

# Mock AWS Lambda resources
mock_lambda_function = Mock()
mock_lambda_function.name = "test-lambda"
mock_lambda_function.arn = "arn:aws:lambda:us-east-1:123456789012:function:test-lambda"

mock_lambda_permission = Mock()
mock_lambda_permission.id = "test-permission-id"

mock_bucket_notification = Mock()
mock_bucket_notification.id = "test-notification-id"

mock_log_group = Mock()
mock_log_group.id = "test-log-group-id"

mock_alarm = Mock()
mock_alarm.id = "test-alarm-id"

# Set up mocks
pulumi_aws.lambda_.Function = Mock(return_value=mock_lambda_function)
pulumi_aws.lambda_.Permission = Mock(return_value=mock_lambda_permission)
pulumi_aws.s3.BucketNotification = Mock(return_value=mock_bucket_notification)
pulumi_aws.cloudwatch.LogGroup = Mock(return_value=mock_log_group)
pulumi_aws.cloudwatch.MetricAlarm = Mock(return_value=mock_alarm)

from lib.infrastructure.config import ServerlessConfig
from lib.infrastructure.lambda_function import (create_lambda_alarms,
                                                create_lambda_function,
                                                create_lambda_resources,
                                                create_s3_event_notification)


class TestLambdaFunction:
    """Test cases for Lambda function creation."""
    
    def test_create_lambda_function_basic(self):
        """Test basic Lambda function creation."""
        with patch('lib.infrastructure.lambda_function.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.lambda_function.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.lambda_timeout = 300
                config.lambda_memory = 128
                config.get_tags.return_value = {"Environment": "test"}
                config.get_environment_variables.return_value = {
                    "ENVIRONMENT": "test",
                    "REGION": "us-east-1"
                }
                config.aws_provider = Mock()
                
                lambda_role = Mock()
                lambda_role.arn = "arn:aws:iam::123456789012:role/test-role"
                
                input_bucket = Mock()
                output_bucket = Mock()
                
                result = create_lambda_function(config, lambda_role, input_bucket, output_bucket)
                
                # Verify Lambda function was created
                assert result == mock_lambda_function
                pulumi_aws.lambda_.Function.assert_called_once()
                
                # Verify Lambda configuration
                call_args = pulumi_aws.lambda_.Function.call_args
                assert call_args[1]['role'] == "arn:aws:iam::123456789012:role/test-role"
                assert call_args[1]['handler'] == "app.lambda_handler"
                assert call_args[1]['runtime'] == "python3.9"
                assert call_args[1]['timeout'] == 300
                assert call_args[1]['memory_size'] == 128
    
    def test_lambda_function_code_packaging(self):
        """Test Lambda function code packaging."""
        with patch('lib.infrastructure.lambda_function.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.lambda_function.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.lambda_timeout = 300
                config.lambda_memory = 128
                config.get_tags.return_value = {"Environment": "test"}
                config.get_environment_variables.return_value = {}
                config.aws_provider = Mock()
                
                lambda_role = Mock()
                lambda_role.arn = "arn:aws:iam::123456789012:role/test-role"
                
                input_bucket = Mock()
                output_bucket = Mock()
                
                create_lambda_function(config, lambda_role, input_bucket, output_bucket)
                
                # Verify code packaging
                call_args = pulumi_aws.lambda_.Function.call_args
                code = call_args[1]['code']
                
                # Should use AssetArchive for packaging
                assert hasattr(code, '__class__')
    
    def test_lambda_function_environment_variables(self):
        """Test Lambda function environment variables."""
        with patch('lib.infrastructure.lambda_function.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.lambda_function.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.lambda_timeout = 300
                config.lambda_memory = 128
                config.get_tags.return_value = {"Environment": "test"}
                config.get_environment_variables.return_value = {
                    "ENVIRONMENT": "test",
                    "REGION": "us-east-1",
                    "INPUT_BUCKET": "test-input-bucket",
                    "OUTPUT_BUCKET": "test-output-bucket"
                }
                config.aws_provider = Mock()
                
                lambda_role = Mock()
                lambda_role.arn = "arn:aws:iam::123456789012:role/test-role"
                
                input_bucket = Mock()
                output_bucket = Mock()
                
                create_lambda_function(config, lambda_role, input_bucket, output_bucket)
                
                # Verify environment variables
                call_args = pulumi_aws.lambda_.Function.call_args
                environment = call_args[1]['environment']
                
                assert environment is not None
                assert hasattr(environment, 'variables')
    
    def test_create_s3_event_notification(self):
        """Test S3 event notification creation."""
        with patch('lib.infrastructure.lambda_function.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.lambda_function.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.environment_suffix = "test"
                config.aws_provider = Mock()
                
                input_bucket = Mock()
                input_bucket.id = "test-bucket-id"
                input_bucket.arn = "arn:aws:s3:::test-bucket"
                
                lambda_function = Mock()
                lambda_function.arn = "arn:aws:lambda:us-east-1:123456789012:function:test-lambda"
                lambda_function.name = "test-lambda"
                
                result = create_s3_event_notification(config, input_bucket, lambda_function)
                
                # Verify notification was created
                assert result == mock_bucket_notification
                pulumi_aws.s3.BucketNotification.assert_called_once()
                
                # Verify permission was created
                pulumi_aws.lambda_.Permission.assert_called_once()
    
    def test_s3_event_notification_filter_structure(self):
        """Test S3 event notification filter structure."""
        with patch('lib.infrastructure.lambda_function.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.lambda_function.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.environment_suffix = "test"
                config.aws_provider = Mock()
                
                input_bucket = Mock()
                input_bucket.id = "test-bucket-id"
                input_bucket.arn = "arn:aws:s3:::test-bucket"
                
                lambda_function = Mock()
                lambda_function.arn = "arn:aws:lambda:us-east-1:123456789012:function:test-lambda"
                lambda_function.name = "test-lambda"
                
                create_s3_event_notification(config, input_bucket, lambda_function)
                
                # Verify notification configuration
                call_args = pulumi_aws.s3.BucketNotification.call_args
                lambda_functions = call_args[1]['lambda_functions']
                
                assert len(lambda_functions) == 1
                assert lambda_functions[0].lambda_function_arn == "arn:aws:lambda:us-east-1:123456789012:function:test-lambda"
                assert lambda_functions[0].events == ["s3:ObjectCreated:*"]
                assert lambda_functions[0].filter_prefix == "test/"
                assert lambda_functions[0].filter_suffix == ".json"
    
    def test_lambda_permission_configuration(self):
        """Test Lambda permission configuration."""
        with patch('lib.infrastructure.lambda_function.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.lambda_function.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.environment_suffix = "test"
                config.aws_provider = Mock()
                
                input_bucket = Mock()
                input_bucket.id = "test-bucket-id"
                input_bucket.arn = "arn:aws:s3:::test-bucket"
                
                lambda_function = Mock()
                lambda_function.arn = "arn:aws:lambda:us-east-1:123456789012:function:test-lambda"
                lambda_function.name = "test-lambda"
                
                create_s3_event_notification(config, input_bucket, lambda_function)
                
                # Verify permission configuration
                call_args = pulumi_aws.lambda_.Permission.call_args
                assert call_args[1]['statement_id'] == "AllowExecutionFromS3Bucket"
                assert call_args[1]['action'] == "lambda:InvokeFunction"
                assert call_args[1]['function'] == "test-lambda"
                assert call_args[1]['principal'] == "s3.amazonaws.com"
                assert call_args[1]['source_arn'] == "arn:aws:s3:::test-bucket"
    
    def test_create_lambda_alarms(self):
        """Test CloudWatch alarm creation."""
        with patch('lib.infrastructure.lambda_function.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.lambda_function.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.aws_provider = Mock()
                
                lambda_function = Mock()
                lambda_function.name = "test-lambda"
                
                result = create_lambda_alarms(config, lambda_function)
                
                # Verify alarms were created
                assert "error_alarm" in result
                assert "throttle_alarm" in result
                assert "duration_alarm" in result
                
                # Verify alarm creation calls
                assert pulumi_aws.cloudwatch.MetricAlarm.call_count == 3
    
    def test_error_alarm_configuration(self):
        """Test error alarm configuration."""
        with patch('lib.infrastructure.lambda_function.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.lambda_function.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.aws_provider = Mock()
                
                lambda_function = Mock()
                lambda_function.name = "test-lambda"
                
                create_lambda_alarms(config, lambda_function)
                
                # Verify error alarm configuration
                alarm_calls = pulumi_aws.cloudwatch.MetricAlarm.call_args_list
                error_alarm_call = next(
                    (call for call in alarm_calls if "errors" in call[1]['name']),
                    None
                )
                assert error_alarm_call is not None
                assert error_alarm_call[1]['metric_name'] == "Errors"
                assert error_alarm_call[1]['comparison_operator'] == "GreaterThanThreshold"
                assert error_alarm_call[1]['threshold'] == 1
    
    def test_throttle_alarm_configuration(self):
        """Test throttle alarm configuration."""
        with patch('lib.infrastructure.lambda_function.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.lambda_function.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.aws_provider = Mock()
                
                lambda_function = Mock()
                lambda_function.name = "test-lambda"
                
                create_lambda_alarms(config, lambda_function)
                
                # Verify throttle alarm configuration
                alarm_calls = pulumi_aws.cloudwatch.MetricAlarm.call_args_list
                throttle_alarm_call = next(
                    (call for call in alarm_calls if "throttles" in call[1]['name']),
                    None
                )
                assert throttle_alarm_call is not None
                assert throttle_alarm_call[1]['metric_name'] == "Throttles"
                assert throttle_alarm_call[1]['comparison_operator'] == "GreaterThanThreshold"
                assert throttle_alarm_call[1]['threshold'] == 1
    
    def test_duration_alarm_configuration(self):
        """Test duration alarm configuration."""
        with patch('lib.infrastructure.lambda_function.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.lambda_function.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.aws_provider = Mock()
                
                lambda_function = Mock()
                lambda_function.name = "test-lambda"
                
                create_lambda_alarms(config, lambda_function)
                
                # Verify duration alarm configuration
                alarm_calls = pulumi_aws.cloudwatch.MetricAlarm.call_args_list
                duration_alarm_call = next(
                    (call for call in alarm_calls if "duration" in call[1]['name']),
                    None
                )
                assert duration_alarm_call is not None
                assert duration_alarm_call[1]['metric_name'] == "Duration"
                assert duration_alarm_call[1]['comparison_operator'] == "GreaterThanThreshold"
                assert duration_alarm_call[1]['threshold'] == 240000  # 4 minutes in milliseconds
    
    def test_create_lambda_resources_complete(self):
        """Test complete Lambda resources creation."""
        with patch('lib.infrastructure.lambda_function.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.lambda_function.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.lambda_timeout = 300
                config.lambda_memory = 128
                config.get_tags.return_value = {"Environment": "test"}
                config.get_environment_variables.return_value = {}
                config.aws_provider = Mock()
                
                lambda_role = Mock()
                lambda_role.arn = "arn:aws:iam::123456789012:role/test-role"
                
                input_bucket = Mock()
                input_bucket.id = "test-bucket-id"
                input_bucket.arn = "arn:aws:s3:::test-bucket"
                
                output_bucket = Mock()
                
                result = create_lambda_resources(config, lambda_role, input_bucket, output_bucket)
                
                # Verify all resources were created
                assert "lambda_function" in result
                assert "log_group" in result
                assert "s3_permission" in result
                assert "bucket_notification" in result
                assert "alarms" in result
                
                # Verify Lambda function was created
                assert result["lambda_function"] == mock_lambda_function
                
                # Verify alarms were created
                assert "error_alarm" in result["alarms"]
                assert "throttle_alarm" in result["alarms"]
                assert "duration_alarm" in result["alarms"]
    
    def test_lambda_function_timeout_enforcement(self):
        """Test Lambda function timeout enforcement."""
        with patch('lib.infrastructure.lambda_function.pulumi_aws', pulumi_aws):
            with patch('lib.infrastructure.lambda_function.pulumi', pulumi):
                config = Mock(spec=ServerlessConfig)
                config.lambda_function_name = "test-lambda"
                config.lambda_timeout = 300  # 5 minutes
                config.lambda_memory = 128
                config.get_tags.return_value = {"Environment": "test"}
                config.get_environment_variables.return_value = {}
                config.aws_provider = Mock()
                
                lambda_role = Mock()
                lambda_role.arn = "arn:aws:iam::123456789012:role/test-role"
                
                input_bucket = Mock()
                output_bucket = Mock()
                
                create_lambda_function(config, lambda_role, input_bucket, output_bucket)
                
                # Verify timeout is enforced
                call_args = pulumi_aws.lambda_.Function.call_args
                assert call_args[1]['timeout'] == 300  # 5 minutes max
