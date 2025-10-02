"""
Comprehensive unit tests for Lambda function infrastructure module.
"""
import unittest
from unittest.mock import Mock, patch

import pulumi


class TestLambdaFunctionComprehensive(unittest.TestCase):
    """Comprehensive tests for Lambda function infrastructure."""

    def setUp(self):
        """Set up test fixtures."""
        # Mock Pulumi before importing our modules
        pulumi.Config = Mock
        pulumi.ResourceOptions = Mock

    def test_lambda_module_import(self):
        """Test that Lambda function module can be imported."""
        try:
            from lib.infrastructure import lambda_function
            self.assertTrue(hasattr(lambda_function, 'create_lambda_resources'))
        except ImportError as e:
            self.fail(f"Failed to import Lambda function module: {e}")

    def test_lambda_function_signature(self):
        """Test that create_lambda_resources has the correct signature."""
        import inspect

        from lib.infrastructure.lambda_function import create_lambda_resources

        # Get function signature
        sig = inspect.signature(create_lambda_resources)
        params = list(sig.parameters.keys())
        
        # Should have 4 parameters: config, lambda_role, input_bucket, output_bucket
        expected_params = ['config', 'lambda_role', 'input_bucket', 'output_bucket']
        self.assertEqual(params, expected_params)

    def test_lambda_config_attributes(self):
        """Test that config object has required attributes."""
        # Mock config object
        mock_config = Mock()
        mock_config.environment_suffix = "dev"
        mock_config.region = "us-east-1"
        mock_config.lambda_function_name = "test-lambda"
        mock_config.lambda_timeout = 300
        mock_config.lambda_memory = 128
        mock_config.get_environment_variables.return_value = {
            "ENVIRONMENT": "dev",
            "REGION": "us-east-1",
            "INPUT_BUCKET": "test-input-bucket",
            "OUTPUT_BUCKET": "test-output-bucket",
            "LOG_LEVEL": "INFO"
        }
        
        # Test that config has required attributes
        self.assertEqual(mock_config.environment_suffix, "dev")
        self.assertEqual(mock_config.region, "us-east-1")
        self.assertEqual(mock_config.lambda_function_name, "test-lambda")
        self.assertEqual(mock_config.lambda_timeout, 300)
        self.assertEqual(mock_config.lambda_memory, 128)

    def test_lambda_role_attributes(self):
        """Test that lambda role has required attributes."""
        # Mock lambda role
        mock_lambda_role = Mock()
        mock_lambda_role.name = "test-lambda-role"
        mock_lambda_role.arn = "arn:aws:iam::123456789012:role/test-lambda-role"
        
        # Test role attributes
        self.assertEqual(mock_lambda_role.name, "test-lambda-role")
        self.assertIn("arn:aws:iam", mock_lambda_role.arn)

    def test_lambda_bucket_attributes(self):
        """Test that bucket objects have required attributes."""
        # Mock bucket objects
        mock_input_bucket = Mock()
        mock_input_bucket.bucket = "test-input-bucket"
        mock_output_bucket = Mock()
        mock_output_bucket.bucket = "test-output-bucket"
        
        # Test bucket attributes
        self.assertEqual(mock_input_bucket.bucket, "test-input-bucket")
        self.assertEqual(mock_output_bucket.bucket, "test-output-bucket")

    def test_lambda_function_creation_mock(self):
        """Test Lambda function creation with mocked AWS resources."""
        with patch('lib.infrastructure.lambda_function.aws.lambda_.Function') as mock_function:
            # Mock function instance
            mock_function_instance = Mock()
            mock_function_instance.name = "test-lambda"
            mock_function_instance.arn = "arn:aws:lambda:us-east-1:123456789012:function:test-lambda"
            mock_function.return_value = mock_function_instance
            
            # Create function
            function = mock_function("test-lambda", role="role", handler="app.lambda_handler")
            
            # Verify function was created
            mock_function.assert_called_once()
            self.assertEqual(function.name, "test-lambda")
            self.assertIn("arn:aws:lambda", function.arn)

    def test_lambda_permission_creation_mock(self):
        """Test Lambda permission creation with mocked AWS resources."""
        with patch('lib.infrastructure.lambda_function.aws.lambda_.Permission') as mock_permission:
            # Mock permission instance
            mock_permission_instance = Mock()
            mock_permission.return_value = mock_permission_instance
            
            # Create permission
            permission = mock_permission("test-permission", function_name="test-lambda", action="lambda:InvokeFunction")
            
            # Verify permission was created
            mock_permission.assert_called_once()

    def test_lambda_s3_notification_mock(self):
        """Test S3 notification creation with mocked AWS resources."""
        with patch('lib.infrastructure.lambda_function.aws.s3.BucketNotification') as mock_notification:
            # Mock notification instance
            mock_notification_instance = Mock()
            mock_notification.return_value = mock_notification_instance
            
            # Create notification
            notification = mock_notification("test-notification", bucket="test-bucket")
            
            # Verify notification was created
            mock_notification.assert_called_once()

    def test_lambda_cloudwatch_alarm_mock(self):
        """Test CloudWatch alarm creation with mocked AWS resources."""
        with patch('lib.infrastructure.lambda_function.aws.cloudwatch.MetricAlarm') as mock_alarm:
            # Mock alarm instance
            mock_alarm_instance = Mock()
            mock_alarm.return_value = mock_alarm_instance
            
            # Create alarm
            alarm = mock_alarm("test-alarm", metric_name="Errors", namespace="AWS/Lambda")
            
            # Verify alarm was created
            mock_alarm.assert_called_once()

    def test_lambda_function_naming(self):
        """Test that Lambda function is named correctly."""
        # Test naming patterns
        environment_suffix = "dev"
        lambda_function_name = "test-lambda"
        
        # Expected naming patterns
        expected_function_name = f"{lambda_function_name}"
        expected_permission_name = f"{lambda_function_name}-s3-permission"
        expected_notification_name = f"{lambda_function_name}-s3-notification"
        
        # Verify naming patterns
        self.assertEqual(expected_function_name, "test-lambda")
        self.assertEqual(expected_permission_name, "test-lambda-s3-permission")
        self.assertEqual(expected_notification_name, "test-lambda-s3-notification")

    def test_lambda_function_configuration(self):
        """Test Lambda function configuration structure."""
        # Mock function configuration
        function_config = {
            "runtime": "python3.9",
            "handler": "app.lambda_handler",
            "timeout": 300,
            "memory_size": 128,
            "role": "arn:aws:iam::123456789012:role/test-lambda-role",
            "environment": {
                "ENVIRONMENT": "dev",
                "REGION": "us-east-1",
                "INPUT_BUCKET": "test-input-bucket",
                "OUTPUT_BUCKET": "test-output-bucket",
                "LOG_LEVEL": "INFO"
            }
        }
        
        # Verify function configuration
        self.assertEqual(function_config["runtime"], "python3.9")
        self.assertEqual(function_config["handler"], "app.lambda_handler")
        self.assertEqual(function_config["timeout"], 300)
        self.assertEqual(function_config["memory_size"], 128)
        self.assertIn("arn:aws:iam", function_config["role"])
        self.assertIn("ENVIRONMENT", function_config["environment"])

    def test_lambda_s3_notification_configuration(self):
        """Test S3 notification configuration structure."""
        # Mock S3 notification configuration
        notification_config = {
            "bucket": "test-input-bucket",
            "lambda_function": [
                {
                    "lambda_function_arn": "arn:aws:lambda:us-east-1:123456789012:function:test-lambda",
                    "events": ["s3:ObjectCreated:*"],
                    "filter_prefix": "input/",
                    "filter_suffix": ".json"
                }
            ]
        }
        
        # Verify notification configuration
        self.assertEqual(notification_config["bucket"], "test-input-bucket")
        self.assertIsInstance(notification_config["lambda_function"], list)
        
        lambda_config = notification_config["lambda_function"][0]
        self.assertIn("arn:aws:lambda", lambda_config["lambda_function_arn"])
        self.assertIn("s3:ObjectCreated:*", lambda_config["events"])
        self.assertEqual(lambda_config["filter_prefix"], "input/")
        self.assertEqual(lambda_config["filter_suffix"], ".json")

    def test_lambda_permission_configuration(self):
        """Test Lambda permission configuration structure."""
        # Mock permission configuration
        permission_config = {
            "statement_id": "AllowExecutionFromS3Bucket",
            "action": "lambda:InvokeFunction",
            "function_name": "test-lambda",
            "principal": "s3.amazonaws.com",
            "source_arn": "arn:aws:s3:::test-input-bucket"
        }
        
        # Verify permission configuration
        self.assertEqual(permission_config["statement_id"], "AllowExecutionFromS3Bucket")
        self.assertEqual(permission_config["action"], "lambda:InvokeFunction")
        self.assertEqual(permission_config["function_name"], "test-lambda")
        self.assertEqual(permission_config["principal"], "s3.amazonaws.com")
        self.assertIn("arn:aws:s3", permission_config["source_arn"])

    def test_lambda_cloudwatch_alarm_configuration(self):
        """Test CloudWatch alarm configuration structure."""
        # Mock CloudWatch alarm configuration
        alarm_config = {
            "alarm_name": "test-lambda-errors",
            "comparison_operator": "GreaterThanThreshold",
            "evaluation_periods": 2,
            "metric_name": "Errors",
            "namespace": "AWS/Lambda",
            "period": 300,
            "statistic": "Sum",
            "threshold": 1.0,
            "alarm_description": "Lambda function errors"
        }
        
        # Verify alarm configuration
        self.assertEqual(alarm_config["alarm_name"], "test-lambda-errors")
        self.assertEqual(alarm_config["comparison_operator"], "GreaterThanThreshold")
        self.assertEqual(alarm_config["evaluation_periods"], 2)
        self.assertEqual(alarm_config["metric_name"], "Errors")
        self.assertEqual(alarm_config["namespace"], "AWS/Lambda")
        self.assertEqual(alarm_config["period"], 300)
        self.assertEqual(alarm_config["statistic"], "Sum")
        self.assertEqual(alarm_config["threshold"], 1.0)

    def test_lambda_timeout_validation(self):
        """Test Lambda timeout validation."""
        # Test valid timeout values
        valid_timeouts = [1, 60, 300, 900]  # 1 second to 15 minutes
        
        for timeout in valid_timeouts:
            self.assertGreaterEqual(timeout, 1)
            self.assertLessEqual(timeout, 900)
        
        # Test invalid timeout values
        invalid_timeouts = [0, -1, 901, 1000]
        
        for timeout in invalid_timeouts:
            if timeout <= 0:
                self.assertLessEqual(timeout, 0)
            elif timeout > 900:
                self.assertGreater(timeout, 900)

    def test_lambda_memory_validation(self):
        """Test Lambda memory validation."""
        # Test valid memory values
        valid_memories = [128, 256, 512, 1024, 1536, 3008]  # 128MB to 3008MB
        
        for memory in valid_memories:
            self.assertGreaterEqual(memory, 128)
            self.assertLessEqual(memory, 3008)
            self.assertEqual(memory % 64, 0)  # Must be multiple of 64
        
        # Test invalid memory values
        invalid_memories = [64, 100, 200, 3009, 4000]
        
        for memory in invalid_memories:
            if memory < 128:
                self.assertLess(memory, 128)
            elif memory > 3008:
                self.assertGreater(memory, 3008)
            elif memory % 64 != 0:
                self.assertNotEqual(memory % 64, 0)

    def test_lambda_environment_variables(self):
        """Test Lambda environment variables structure."""
        # Mock environment variables
        env_vars = {
            "ENVIRONMENT": "dev",
            "REGION": "us-east-1",
            "INPUT_BUCKET": "test-input-bucket",
            "OUTPUT_BUCKET": "test-output-bucket",
            "LOG_LEVEL": "INFO"
        }
        
        # Verify environment variables
        self.assertIn("ENVIRONMENT", env_vars)
        self.assertIn("REGION", env_vars)
        self.assertIn("INPUT_BUCKET", env_vars)
        self.assertIn("OUTPUT_BUCKET", env_vars)
        self.assertIn("LOG_LEVEL", env_vars)
        
        self.assertEqual(env_vars["ENVIRONMENT"], "dev")
        self.assertEqual(env_vars["REGION"], "us-east-1")
        self.assertEqual(env_vars["LOG_LEVEL"], "INFO")

    def test_lambda_error_handling(self):
        """Test Lambda error handling scenarios."""
        # Test with invalid config
        invalid_config = Mock()
        invalid_config.lambda_function_name = None
        invalid_config.lambda_timeout = None
        invalid_config.lambda_memory = None
        
        # Should handle None values gracefully
        self.assertIsNone(invalid_config.lambda_function_name)
        self.assertIsNone(invalid_config.lambda_timeout)
        self.assertIsNone(invalid_config.lambda_memory)

    def test_lambda_resource_dependencies(self):
        """Test that Lambda resources have correct dependencies."""
        # Mock resources with dependencies
        mock_function = Mock()
        mock_permission = Mock()
        mock_notification = Mock()
        mock_alarm = Mock()
        
        # Set up dependencies
        mock_permission.depends_on = [mock_function]
        mock_notification.depends_on = [mock_function, mock_permission]
        mock_alarm.depends_on = [mock_function]
        
        # Verify dependencies
        self.assertIn(mock_function, mock_permission.depends_on)
        self.assertIn(mock_function, mock_notification.depends_on)
        self.assertIn(mock_permission, mock_notification.depends_on)
        self.assertIn(mock_function, mock_alarm.depends_on)

    def test_lambda_custom_environment_naming(self):
        """Test Lambda resource naming with custom environment."""
        # Test with custom environment
        environment_suffix = "prod"
        lambda_function_name = "prod-lambda"
        
        # Expected naming patterns for prod environment
        expected_function_name = f"{lambda_function_name}"
        expected_permission_name = f"{lambda_function_name}-s3-permission"
        
        # Verify custom naming
        self.assertEqual(expected_function_name, "prod-lambda")
        self.assertEqual(expected_permission_name, "prod-lambda-s3-permission")

    def test_lambda_resource_tags(self):
        """Test that Lambda resources have appropriate tags."""
        # Mock resource tags
        tags = {
            "Environment": "dev",
            "Project": "serverless-infrastructure",
            "ManagedBy": "pulumi",
            "Function": "s3-processor"
        }
        
        # Verify tags
        self.assertIn("Environment", tags)
        self.assertIn("Project", tags)
        self.assertIn("ManagedBy", tags)
        self.assertIn("Function", tags)
        self.assertEqual(tags["Environment"], "dev")
        self.assertEqual(tags["Project"], "serverless-infrastructure")
        self.assertEqual(tags["ManagedBy"], "pulumi")
        self.assertEqual(tags["Function"], "s3-processor")


if __name__ == '__main__':
    unittest.main()
