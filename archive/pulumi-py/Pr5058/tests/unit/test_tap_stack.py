"""
test_tap_stack.py
Focused unit tests for TapStack with >90% coverage.
Tests resource creation with proper mocking to avoid creating actual resources.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, Mock, PropertyMock, patch

# Add lib to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from infrastructure.config import ServerlessConfig, initialize_config


class TestServerlessConfig(unittest.TestCase):
    """Test ServerlessConfig initialization and methods."""

    @patch.dict('os.environ', {
        'ENVIRONMENT_SUFFIX': 'test',
        'PRIMARY_REGION': 'us-west-2',
        'PROJECT_NAME': 'test-project'
    })
    def test_config_initialization(self):
        """Test configuration initialization with environment variables."""
        config = initialize_config()
        self.assertEqual(config.environment_suffix, 'test')
        self.assertEqual(config.primary_region, 'us-west-2')
        self.assertEqual(config.project_name, 'test-project')

    @patch.dict('os.environ', {}, clear=True)
    def test_config_defaults(self):
        """Test configuration with default values."""
        config = initialize_config()
        self.assertEqual(config.environment_suffix, 'prod')
        self.assertEqual(config.primary_region, 'us-east-1')
        self.assertIn('serverless-app', config.project_name)

    @patch.dict('os.environ', {}, clear=True)
    def test_normalize_region(self):
        """Test region normalization."""
        config = initialize_config()
        self.assertEqual(config.normalize_region('us-east-1'), 'useast1')
        self.assertEqual(config.normalize_region('eu-west-2'), 'euwest2')

    @patch.dict('os.environ', {}, clear=True)
    def test_get_resource_name(self):
        """Test resource name generation."""
        config = initialize_config()
        name = config.get_resource_name('lambda-function')
        self.assertIn('lambda-function', name)
        self.assertIn(config.region_short, name)
        self.assertIn(config.environment_suffix, name)

    @patch.dict('os.environ', {}, clear=True)
    def test_get_common_tags(self):
        """Test common tags generation."""
        config = initialize_config()
        tags = config.get_common_tags()
        self.assertIn('Environment', tags)
        self.assertIn('Project', tags)
        self.assertEqual(tags['Environment'], 'Production')


class TestIAMStack(unittest.TestCase):
    """Test IAM Stack resource creation."""

    @patch.dict('os.environ', {}, clear=True)
    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.Policy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_iam_roles_created(self, mock_role, mock_policy, mock_attachment):
        """Test IAM roles are created for all Lambda functions."""
        from infrastructure.iam import IAMStack
        
        config = initialize_config()
        mock_provider = MagicMock()
        
        mock_role_instance = MagicMock()
        mock_role_instance.arn = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config=config, provider=mock_provider, parent=None)
        
        # Verify 3 roles created (api_handler, file_processor, stream_processor)
        self.assertEqual(mock_role.call_count, 3)
        
        # Verify roles are accessible
        self.assertIsNotNone(iam_stack.api_handler_role)
        self.assertIsNotNone(iam_stack.file_processor_role)
        self.assertIsNotNone(iam_stack.stream_processor_role)

    @patch.dict('os.environ', {}, clear=True)
    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.Policy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_iam_cloudwatch_logs_policy(self, mock_role, mock_policy, mock_attachment):
        """Test CloudWatch Logs policy attachment."""
        from infrastructure.iam import IAMStack
        from pulumi import Output
        
        config = initialize_config()
        mock_provider = MagicMock()
        
        mock_role_instance = MagicMock()
        mock_role_instance.arn = Output.from_input('arn:aws:iam::123:role/test')
        mock_role_instance.id = Output.from_input('test-role-id')
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config=config, provider=mock_provider, parent=None)
        
        # Test CloudWatch Logs policy attachment
        log_group_arn = Output.from_input('arn:aws:logs:us-east-1:123:log-group:/aws/lambda/test')
        iam_stack.attach_cloudwatch_logs_policy(mock_role_instance, log_group_arn, 'test')
        
        # Verify policy and attachment created (1 from this call)
        self.assertGreater(mock_policy.call_count, 0)
        self.assertGreater(mock_attachment.call_count, 0)

    @patch.dict('os.environ', {}, clear=True)
    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.Policy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_iam_dynamodb_policy(self, mock_role, mock_policy, mock_attachment):
        """Test DynamoDB policy attachment."""
        from infrastructure.iam import IAMStack
        from pulumi import Output
        
        config = initialize_config()
        mock_provider = MagicMock()
        
        mock_role_instance = MagicMock()
        mock_role_instance.arn = Output.from_input('arn:aws:iam::123:role/test')
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config=config, provider=mock_provider, parent=None)
        
        # Test DynamoDB policy attachment
        table_arn = Output.from_input('arn:aws:dynamodb:us-east-1:123:table/test')
        iam_stack.attach_dynamodb_policy(mock_role_instance, table_arn, 'test', read_only=False)
        
        # Verify policy created (1 from this call)
        self.assertGreater(mock_policy.call_count, 0)


class TestDynamoDBStack(unittest.TestCase):
    """Test DynamoDB Stack resource creation."""

    @patch.dict('os.environ', {}, clear=True)
    @patch('infrastructure.dynamodb.aws.dynamodb.Table')
    def test_dynamodb_table_created(self, mock_table):
        """Test DynamoDB table created with proper configuration."""
        from infrastructure.dynamodb import DynamoDBStack
        
        config = initialize_config()
        mock_provider = MagicMock()
        
        mock_table_instance = MagicMock()
        mock_table_instance.arn = MagicMock()
        mock_table_instance.name = MagicMock()
        mock_table_instance.stream_arn = MagicMock()
        mock_table.return_value = mock_table_instance
        
        dynamodb_stack = DynamoDBStack(config=config, provider=mock_provider, parent=None)
        
        # Verify table created
        mock_table.assert_called_once()
        
        # Verify table configuration
        call_kwargs = mock_table.call_args[1]
        self.assertEqual(call_kwargs['billing_mode'], 'PAY_PER_REQUEST')
        self.assertIn('stream_enabled', call_kwargs)
        self.assertIn(call_kwargs['stream_view_type'], ['NEW_IMAGE', 'NEW_AND_OLD_IMAGES'])
        
        # Verify table accessible
        self.assertIsNotNone(dynamodb_stack.items_table)


class TestStorageStack(unittest.TestCase):
    """Test Storage Stack resource creation."""

    @patch.dict('os.environ', {}, clear=True)
    @patch('infrastructure.storage.aws.s3.BucketNotification')
    @patch('infrastructure.storage.aws.s3.BucketLifecycleConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketVersioning')
    @patch('infrastructure.storage.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketPublicAccessBlock')
    @patch('infrastructure.storage.aws.s3.Bucket')
    def test_storage_bucket_created(self, mock_bucket, mock_public, mock_encrypt,
                                    mock_version, mock_lifecycle, mock_notification):
        """Test S3 bucket created with proper configuration."""
        from infrastructure.storage import StorageStack
        
        config = initialize_config()
        mock_provider = MagicMock()
        
        mock_bucket_instance = MagicMock()
        mock_bucket_instance.arn = MagicMock()
        mock_bucket_instance.id = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        storage_stack = StorageStack(config=config, provider=mock_provider, parent=None)
        
        # Verify bucket created
        mock_bucket.assert_called_once()
        
        # Verify bucket accessible
        self.assertIsNotNone(storage_stack.files_bucket)
        
        # Verify encryption, versioning, and lifecycle configured
        mock_encrypt.assert_called_once()
        mock_version.assert_called_once()
        mock_lifecycle.assert_called_once()
        mock_public.assert_called_once()


class TestNotificationsStack(unittest.TestCase):
    """Test Notifications Stack resource creation."""

    @patch.dict('os.environ', {}, clear=True)
    @patch('infrastructure.notifications.aws.sns.Topic')
    def test_sns_topic_created(self, mock_topic):
        """Test SNS topic created."""
        from infrastructure.notifications import NotificationsStack
        
        config = initialize_config()
        mock_provider = MagicMock()
        
        mock_topic_instance = MagicMock()
        mock_topic_instance.arn = MagicMock()
        mock_topic.return_value = mock_topic_instance
        
        notifications_stack = NotificationsStack(config=config, provider=mock_provider, parent=None)
        
        # Verify topic created
        mock_topic.assert_called_once()
        
        # Verify topic accessible
        self.assertIsNotNone(notifications_stack.notifications_topic)


class TestLambdaStack(unittest.TestCase):
    """Test Lambda Stack resource creation."""

    @patch.dict('os.environ', {}, clear=True)
    @patch('infrastructure.lambda_functions.aws.lambda_.Function')
    def test_lambda_function_runtime_config(self, mock_function):
        """Test Lambda function runtime configuration."""
        config = initialize_config()
        
        # Verify Lambda configuration from config
        self.assertEqual(config.lambda_runtime, 'python3.11')
        self.assertEqual(config.lambda_timeout, 180)
        self.assertEqual(config.lambda_memory_size, 256)
        self.assertEqual(config.lambda_max_retry_attempts, 2)


class TestAPIGatewayStack(unittest.TestCase):
    """Test API Gateway Stack resource creation."""

    @patch.dict('os.environ', {}, clear=True)
    def test_api_gateway_config(self):
        """Test API Gateway configuration values."""
        config = initialize_config()
        
        # Verify API Gateway naming includes environment suffix
        api_name = config.get_resource_name('api')
        self.assertIn(config.environment_suffix, api_name)
        self.assertIn(config.region_short, api_name)


class TestMonitoringStack(unittest.TestCase):
    """Test Monitoring Stack resource creation."""

    @patch.dict('os.environ', {}, clear=True)
    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    @patch('infrastructure.monitoring.aws.cloudwatch.LogGroup')
    def test_monitoring_log_groups_created(self, mock_log_group, mock_alarm):
        """Test CloudWatch log groups created for all Lambda functions."""
        from infrastructure.monitoring import MonitoringStack
        
        config = initialize_config()
        mock_provider = MagicMock()
        
        # Mock Lambda stack
        mock_lambda_stack = MagicMock()
        mock_lambda_stack.api_handler.name = MagicMock()
        mock_lambda_stack.file_processor.name = MagicMock()
        mock_lambda_stack.stream_processor.name = MagicMock()
        
        mock_dynamodb_stack = MagicMock()
        mock_dynamodb_stack.items_table.name = MagicMock()
        
        mock_notifications_stack = MagicMock()
        mock_notifications_stack.notifications_topic.arn = MagicMock()
        
        mock_log_instance = MagicMock()
        mock_log_instance.arn = MagicMock()
        mock_log_instance.name = MagicMock()
        mock_log_group.return_value = mock_log_instance
        
        monitoring_stack = MonitoringStack(
            config=config,
            provider=mock_provider,
            lambda_stack=mock_lambda_stack,
            dynamodb_stack=mock_dynamodb_stack,
            notifications_stack=mock_notifications_stack,
            parent=None
        )
        
        # Verify 3 log groups created (one per Lambda)
        self.assertEqual(mock_log_group.call_count, 3)
        
        # Verify log groups accessible
        self.assertIsNotNone(monitoring_stack.api_handler_log_group)
        self.assertIsNotNone(monitoring_stack.file_processor_log_group)
        self.assertIsNotNone(monitoring_stack.stream_processor_log_group)

    @patch.dict('os.environ', {}, clear=True)
    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    @patch('infrastructure.monitoring.aws.cloudwatch.LogGroup')
    def test_monitoring_alarms_created(self, mock_log_group, mock_alarm):
        """Test CloudWatch metric alarms created."""
        from infrastructure.monitoring import MonitoringStack
        
        config = initialize_config()
        mock_provider = MagicMock()
        
        # Mock Lambda stack
        mock_lambda_stack = MagicMock()
        mock_lambda_stack.api_handler.name = MagicMock()
        mock_lambda_stack.file_processor.name = MagicMock()
        mock_lambda_stack.stream_processor.name = MagicMock()
        
        mock_dynamodb_stack = MagicMock()
        mock_dynamodb_stack.items_table.name = MagicMock()
        
        mock_notifications_stack = MagicMock()
        mock_notifications_stack.notifications_topic.arn = MagicMock()
        
        mock_log_instance = MagicMock()
        mock_log_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_instance
        
        monitoring_stack = MonitoringStack(
            config=config,
            provider=mock_provider,
            lambda_stack=mock_lambda_stack,
            dynamodb_stack=mock_dynamodb_stack,
            notifications_stack=mock_notifications_stack,
            parent=None
        )
        
        # Verify alarms created:
        # - 3 Lambda error rate alarms (using metric math)
        # - 3 Lambda throttle alarms
        # - 2 DynamoDB throttle alarms (read/write)
        # Total: 8 alarms minimum
        self.assertGreaterEqual(mock_alarm.call_count, 8)


class TestTapStack(unittest.TestCase):
    """Test TapStack integration and orchestration."""

    @patch.dict('os.environ', {}, clear=True)
    @patch('tap_stack.pulumi.export')
    @patch('tap_stack.MonitoringStack')
    @patch('tap_stack.APIGatewayStack')
    @patch('tap_stack.LambdaStack')
    @patch('tap_stack.NotificationsStack')
    @patch('tap_stack.StorageStack')
    @patch('tap_stack.DynamoDBStack')
    @patch('tap_stack.IAMStack')
    @patch('tap_stack.get_aws_provider')
    def test_tap_stack_initialization(self, mock_provider, mock_iam, mock_dynamodb,
                                     mock_storage, mock_notifications, mock_lambda,
                                     mock_api_gateway, mock_monitoring, mock_export):
        """Test TapStack initializes all components."""
        from tap_stack import TapStack
        
        config = initialize_config()
        
        # Mock provider
        mock_provider_instance = MagicMock()
        mock_provider.return_value = mock_provider_instance
        
        # Mock IAM stack
        mock_iam_instance = MagicMock()
        mock_iam_instance.api_handler_role = MagicMock()
        mock_iam_instance.file_processor_role = MagicMock()
        mock_iam_instance.stream_processor_role = MagicMock()
        mock_iam.return_value = mock_iam_instance
        
        # Mock DynamoDB stack
        mock_dynamodb_instance = MagicMock()
        mock_dynamodb_instance.items_table.arn = MagicMock()
        mock_dynamodb.return_value = mock_dynamodb_instance
        
        # Mock Storage stack
        mock_storage_instance = MagicMock()
        mock_storage_instance.files_bucket.arn = MagicMock()
        mock_storage.return_value = mock_storage_instance
        
        # Mock Notifications stack
        mock_notifications_instance = MagicMock()
        mock_notifications_instance.notifications_topic.arn = MagicMock()
        mock_notifications.return_value = mock_notifications_instance
        
        # Mock Lambda stack
        mock_lambda_instance = MagicMock()
        mock_lambda_instance.api_handler.arn = MagicMock()
        mock_lambda_instance.api_handler.name = MagicMock()
        mock_lambda.return_value = mock_lambda_instance
        
        # Mock API Gateway stack
        mock_api_gateway_instance = MagicMock()
        mock_api_gateway_instance.rest_api.id = MagicMock()
        mock_api_gateway.return_value = mock_api_gateway_instance
        
        # Mock Monitoring stack
        mock_monitoring_instance = MagicMock()
        mock_monitoring_instance.api_handler_log_group.arn = MagicMock()
        mock_monitoring.return_value = mock_monitoring_instance
        
        # Create TapStack
        stack = TapStack('test-stack', config)
        
        # Verify all components initialized
        mock_provider.assert_called_once()
        mock_iam.assert_called_once()
        mock_dynamodb.assert_called_once()
        mock_storage.assert_called_once()
        mock_notifications.assert_called_once()
        mock_lambda.assert_called_once()
        mock_api_gateway.assert_called_once()
        mock_monitoring.assert_called_once()
        
        # Verify pulumi.export was called for outputs
        self.assertTrue(mock_export.called)
        self.assertGreater(mock_export.call_count, 20)  # At least 20+ outputs


class TestAWSProvider(unittest.TestCase):
    """Test AWS Provider creation."""

    @patch.dict('os.environ', {}, clear=True)
    @patch('infrastructure.aws_provider.aws.Provider')
    def test_provider_creation(self, mock_provider):
        """Test AWS provider created with correct configuration."""
        from infrastructure.aws_provider import get_aws_provider
        
        config = initialize_config()
        
        mock_provider_instance = MagicMock()
        mock_provider.return_value = mock_provider_instance
        
        provider = get_aws_provider(config)
        
        # Verify provider created
        mock_provider.assert_called_once()
        
        # Verify provider configuration
        call_kwargs = mock_provider.call_args[1]
        self.assertEqual(call_kwargs['region'], config.primary_region)
        self.assertIn('default_tags', call_kwargs)


class TestLibInit(unittest.TestCase):
    """Test lib package initialization."""

    def test_version_import(self):
        """Test that __version__ can be imported - covers lib/__init__.py line 8."""
        import os
        import sys
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
        from lib import __version__
        self.assertIsNotNone(__version__)
        self.assertIsInstance(__version__, str)


class TestValidation(unittest.TestCase):
    """Test validation module."""

    @patch.dict('os.environ', {}, clear=True)
    def test_validation_runs(self):
        """Test validation runs without errors."""
        from infrastructure.validation import run_all_validations
        
        config = initialize_config()
        
        # Should not raise any exceptions
        try:
            run_all_validations(config)
        except Exception as e:
            self.fail(f"Validation raised exception: {e}")

    @patch.dict('os.environ', {'LAMBDA_TIMEOUT': '1000', 'LAMBDA_MEMORY_SIZE': '100'}, clear=True)
    def test_validation_error_paths(self):
        """Test validation error handling - covers lines 55, 58, 158, 167-168."""
        from infrastructure.validation import (ValidationError,
                                               run_all_validations)
        
        config = initialize_config()
        
        # Should raise ValidationError with multiple errors
        with self.assertRaises(ValidationError) as context:
            run_all_validations(config)
        
        # Verify error message contains validation failures
        self.assertIn("Configuration validation failed", str(context.exception))

    @patch.dict('os.environ', {'DYNAMODB_BILLING_MODE': 'PROVISIONED', 'DYNAMODB_READ_CAPACITY': '0'}, clear=True)
    def test_validation_dynamodb_provisioned(self):
        """Test DynamoDB provisioned mode validation - covers lines 71-74."""
        from infrastructure.validation import validate_configuration
        
        config = initialize_config()
        is_valid, errors = validate_configuration(config)
        
        # Should fail with invalid read capacity
        self.assertFalse(is_valid)
        self.assertGreater(len(errors), 0)

    @patch.dict('os.environ', {'ERROR_RATE_THRESHOLD': '150'}, clear=True)
    def test_validation_error_rate_threshold(self):
        """Test error rate threshold validation - covers line 85."""
        from infrastructure.validation import validate_configuration
        
        config = initialize_config()
        is_valid, errors = validate_configuration(config)
        
        # Should fail with threshold > 100
        self.assertFalse(is_valid)
        self.assertGreater(len(errors), 0)

    @patch.dict('os.environ', {'LAMBDA_RUNTIME': 'python2.7'}, clear=True)
    def test_validation_invalid_runtime(self):
        """Test Lambda runtime validation - covers line 93."""
        from infrastructure.validation import validate_configuration
        
        config = initialize_config()
        is_valid, errors = validate_configuration(config)
        
        # Should fail with invalid runtime
        self.assertFalse(is_valid)
        self.assertGreater(len(errors), 0)



class TestIAMPolicyAttachments(unittest.TestCase):
    """Test IAM policy attachment methods to cover missing lines."""

    @patch.dict('os.environ', {}, clear=True)
    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.Policy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_s3_policy_attachment(self, mock_role, mock_policy, mock_attachment):
        """Test S3 policy attachment - covers lines 253-273."""
        from infrastructure.iam import IAMStack
        from pulumi import Output
        
        config = initialize_config()
        mock_provider = MagicMock()
        
        mock_role_instance = MagicMock()
        mock_role_instance.arn = Output.from_input('arn:aws:iam::123:role/test')
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config=config, provider=mock_provider, parent=None)
        
        bucket_arn = Output.from_input('arn:aws:s3:::test-bucket')
        iam_stack.attach_s3_policy(mock_role_instance, bucket_arn, 'test', read_only=False)
        
        self.assertGreater(mock_policy.call_count, 0)

    @patch.dict('os.environ', {}, clear=True)
    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.Policy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_sns_policy_attachment(self, mock_role, mock_policy, mock_attachment):
        """Test SNS policy attachment - covers lines 296-325."""
        from infrastructure.iam import IAMStack
        from pulumi import Output
        
        config = initialize_config()
        mock_provider = MagicMock()
        
        mock_role_instance = MagicMock()
        mock_role_instance.arn = Output.from_input('arn:aws:iam::123:role/test')
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config=config, provider=mock_provider, parent=None)
        
        topic_arn = Output.from_input('arn:aws:sns:us-east-1:123:topic')
        iam_stack.attach_sns_policy(mock_role_instance, topic_arn, 'test')
        
        self.assertGreater(mock_policy.call_count, 0)

    @patch.dict('os.environ', {}, clear=True)
    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.Policy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_dynamodb_streams_policy_attachment(self, mock_role, mock_policy, mock_attachment):
        """Test DynamoDB Streams policy attachment - covers lines 346-361."""
        from infrastructure.iam import IAMStack
        from pulumi import Output
        
        config = initialize_config()
        mock_provider = MagicMock()
        
        mock_role_instance = MagicMock()
        mock_role_instance.arn = Output.from_input('arn:aws:iam::123:role/test')
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config=config, provider=mock_provider, parent=None)
        
        table_arn = Output.from_input('arn:aws:dynamodb:us-east-1:123:table/test')
        iam_stack.attach_dynamodb_streams_policy(mock_role_instance, table_arn, 'test')
        
        self.assertGreater(mock_policy.call_count, 0)


class TestAPIGatewayCreation(unittest.TestCase):
    """Test API Gateway resource creation to cover missing lines."""

    @patch.dict('os.environ', {}, clear=True)
    @patch('infrastructure.api_gateway.aws.apigateway.Stage')
    @patch('infrastructure.api_gateway.aws.apigateway.Deployment')
    @patch('infrastructure.api_gateway.aws.apigateway.IntegrationResponse')
    @patch('infrastructure.api_gateway.aws.apigateway.MethodResponse')
    @patch('infrastructure.api_gateway.aws.apigateway.Integration')
    @patch('infrastructure.api_gateway.aws.lambda_.Permission')
    @patch('infrastructure.api_gateway.aws.apigateway.Method')
    @patch('infrastructure.api_gateway.aws.apigateway.Resource')
    @patch('infrastructure.api_gateway.aws.apigateway.RestApi')
    def test_api_gateway_rest_api_creation(self, mock_rest_api, mock_resource, mock_method,
                                          mock_permission, mock_integration, mock_method_response,
                                          mock_integration_response, mock_deployment, mock_stage):
        """Test API Gateway REST API creation - covers lines 39-69."""
        from infrastructure.api_gateway import APIGatewayStack
        from pulumi import Output
        
        config = initialize_config()
        mock_provider = MagicMock()
        
        # Mock Lambda stack with proper Resource types
        mock_lambda_stack = MagicMock()
        mock_lambda_instance = MagicMock(spec=['arn', 'name', 'invoke_arn'])
        mock_lambda_instance.arn = Output.from_input('arn:aws:lambda:us-east-1:123:function:test')
        mock_lambda_instance.name = Output.from_input('test-function')
        mock_lambda_instance.invoke_arn = Output.from_input('arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123:function:test/invocations')
        mock_lambda_stack.api_handler = mock_lambda_instance
        
        # Mock REST API
        mock_rest_api_instance = MagicMock(spec=['id', 'root_resource_id', 'execution_arn'])
        mock_rest_api_instance.id = Output.from_input('api123')
        mock_rest_api_instance.root_resource_id = Output.from_input('root123')
        mock_rest_api_instance.execution_arn = Output.from_input('arn:aws:execute-api:us-east-1:123:api123')
        mock_rest_api.return_value = mock_rest_api_instance
        
        # Mock Resource
        mock_resource_instance = MagicMock(spec=['id'])
        mock_resource_instance.id = Output.from_input('resource123')
        mock_resource.return_value = mock_resource_instance
        
        # Mock Method as proper Resource with http_method attribute
        from pulumi import Resource
        mock_method_instance = MagicMock(spec=Resource)
        mock_method_instance.http_method = Output.from_input('POST')
        mock_method_instance.resource_id = Output.from_input('resource123')
        mock_method_instance._name = 'test-method'
        mock_method_instance._type = 'aws:apigateway/method:Method'
        mock_method.return_value = mock_method_instance
        
        # Mock Integration as proper Resource
        mock_integration_instance = MagicMock(spec=Resource)
        mock_integration_instance._name = 'test-integration'
        mock_integration_instance._type = 'aws:apigateway/integration:Integration'
        mock_integration.return_value = mock_integration_instance
        
        # Mock Deployment as proper Resource
        mock_deployment_instance = MagicMock(spec=Resource)
        mock_deployment_instance.id = Output.from_input('deployment123')
        mock_deployment_instance._name = 'test-deployment'
        mock_deployment_instance._type = 'aws:apigateway/deployment:Deployment'
        mock_deployment.return_value = mock_deployment_instance
        
        api_gateway_stack = APIGatewayStack(
            config=config,
            provider=mock_provider,
            lambda_stack=mock_lambda_stack,
            parent=None
        )
        
        # Verify REST API created
        mock_rest_api.assert_called_once()
        # Verify resource created
        mock_resource.assert_called_once()
        # Verify methods created (POST and GET)
        self.assertGreaterEqual(mock_method.call_count, 2)


class TestLambdaFunctionCreation(unittest.TestCase):
    """Test Lambda function creation to cover missing lines."""

    @patch.dict('os.environ', {}, clear=True)
    @patch('infrastructure.lambda_functions.aws.lambda_.EventSourceMapping')
    @patch('infrastructure.lambda_functions.aws.s3.BucketNotification')
    @patch('infrastructure.lambda_functions.aws.lambda_.Permission')
    @patch('infrastructure.lambda_functions.aws.lambda_.FunctionEventInvokeConfig')
    @patch('infrastructure.lambda_functions.aws.lambda_.Function')
    def test_lambda_function_creation_with_mocked_dependencies(self, mock_function, mock_event_config,
                                                               mock_permission, mock_notification, mock_event_source):
        """Test Lambda function creation - covers lines 50-80."""
        from infrastructure.lambda_functions import LambdaStack
        from pulumi import Output, Resource
        
        config = initialize_config()
        mock_provider = MagicMock()
        
        # Create actual mock Resource instances
        mock_role = MagicMock(spec=Resource)
        mock_role.arn = Output.from_input('arn:aws:iam::123:role/test')
        mock_role._name = 'test-role'
        mock_role._type = 'aws:iam/role:Role'
        
        # Mock IAM
        mock_iam = MagicMock()
        mock_iam.api_handler_role = mock_role
        mock_iam.file_processor_role = mock_role
        mock_iam.stream_processor_role = mock_role
        
        # Mock DynamoDB with Resource spec
        mock_table = MagicMock(spec=Resource)
        mock_table.name = Output.from_input('test-table')
        mock_table.stream_arn = Output.from_input('arn:aws:dynamodb:us-east-1:123:table/test/stream/123')
        mock_table._name = 'test-table'
        mock_table._type = 'aws:dynamodb/table:Table'
        
        mock_dynamodb = MagicMock()
        mock_dynamodb.items_table = mock_table
        
        # Mock Storage with Resource spec
        mock_bucket = MagicMock(spec=Resource)
        mock_bucket.id = Output.from_input('test-bucket')
        mock_bucket.arn = Output.from_input('arn:aws:s3:::test-bucket')
        mock_bucket._name = 'test-bucket'
        mock_bucket._type = 'aws:s3/bucket:Bucket'
        
        mock_storage = MagicMock()
        mock_storage.files_bucket = mock_bucket
        
        # Mock Notifications with Resource spec
        mock_topic = MagicMock(spec=Resource)
        mock_topic.arn = Output.from_input('arn:aws:sns:us-east-1:123:topic')
        mock_topic._name = 'test-topic'
        mock_topic._type = 'aws:sns/topic:Topic'
        
        mock_notifications = MagicMock()
        mock_notifications.notifications_topic = mock_topic
        
        # Mock Function
        mock_function_instance = MagicMock(spec=Resource)
        mock_function_instance.arn = Output.from_input('arn:aws:lambda:us-east-1:123:function:test')
        mock_function_instance.name = Output.from_input('test-function')
        mock_function.return_value = mock_function_instance
        
        # Mock Permission as proper Resource
        mock_permission_instance = MagicMock(spec=Resource)
        mock_permission_instance._name = 'test-permission'
        mock_permission_instance._type = 'aws:lambda/permission:Permission'
        mock_permission.return_value = mock_permission_instance
        
        lambda_stack = LambdaStack(
            config=config,
            provider=mock_provider,
            iam_stack=mock_iam,
            dynamodb_stack=mock_dynamodb,
            storage_stack=mock_storage,
            notifications_stack=mock_notifications,
            parent=None
        )
        
        # Verify 3 functions created
        self.assertEqual(mock_function.call_count, 3)


class TestDynamoDBProvisionedMode(unittest.TestCase):
    """Test DynamoDB with PROVISIONED billing mode to cover missing lines."""

    @patch.dict('os.environ', {'DYNAMODB_BILLING_MODE': 'PROVISIONED', 'ENABLE_DYNAMODB_STREAMS': 'true'}, clear=True)
    @patch('infrastructure.dynamodb.aws.dynamodb.Table')
    def test_dynamodb_provisioned_billing_mode(self, mock_table):
        """Test DynamoDB with PROVISIONED mode - covers lines 103-108, 113-118."""
        from infrastructure.dynamodb import DynamoDBStack
        
        config = initialize_config()
        mock_provider = MagicMock()
        
        mock_table_instance = MagicMock()
        mock_table_instance.arn = MagicMock()
        mock_table_instance.name = MagicMock()
        mock_table_instance.stream_arn = MagicMock()
        mock_table.return_value = mock_table_instance
        
        dynamodb_stack = DynamoDBStack(config=config, provider=mock_provider, parent=None)
        
        # Verify table was created
        mock_table.assert_called_once()
        
        # Verify PROVISIONED mode configuration was used
        call_kwargs = mock_table.call_args[1]
        self.assertEqual(call_kwargs['billing_mode'], 'PROVISIONED')
        self.assertIn('read_capacity', call_kwargs)
        self.assertIn('write_capacity', call_kwargs)


if __name__ == '__main__':
    unittest.main()
