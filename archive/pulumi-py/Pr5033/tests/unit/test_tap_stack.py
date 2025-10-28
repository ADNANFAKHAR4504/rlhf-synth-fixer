"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component focusing on resource creation
and configuration verification with full mocking and coverage.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, PropertyMock, patch

# Add lib to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from infrastructure.config import ServerlessConfig


class TestServerlessConfig(unittest.TestCase):
    """Test ServerlessConfig resource configuration."""

    def test_config_initialization(self):
        """Test configuration initialization with default values."""
        with patch.dict('os.environ', {}, clear=True):
            config = ServerlessConfig()
            self.assertEqual(config.project_name, 'serverless')
            self.assertEqual(config.primary_region, 'us-east-1')
            self.assertTrue(config.enable_notifications)

    def test_get_resource_name_includes_environment_suffix(self):
        """Test resource name generation includes environment suffix."""
        config = ServerlessConfig()
        name = config.get_resource_name('lambda')
        self.assertIn('serverless', name)
        self.assertIn('lambda', name)
        self.assertIn('useast1', name)
        self.assertTrue(len(name) > 10)

    def test_normalize_name_lowercase(self):
        """Test name normalization converts to lowercase."""
        config = ServerlessConfig()
        normalized = config.normalize_name('Test-BUCKET-Name')
        self.assertEqual(normalized, 'test-bucket-name')


class TestAWSProviderManager(unittest.TestCase):
    """Test AWS Provider resource creation."""

    @patch('pulumi_aws.Provider')
    def test_provider_creation_with_correct_region(self, mock_provider):
        """Test AWS provider is created with correct region configuration."""
        from infrastructure.aws_provider import AWSProviderManager
        
        config = ServerlessConfig()
        provider_manager = AWSProviderManager(config)

        mock_provider.assert_called_once()
        call_args = mock_provider.call_args
        self.assertEqual(call_args[1]['region'], 'us-east-1')
        self.assertIn('default_tags', call_args[1])


class TestIAMStack(unittest.TestCase):
    """Test IAM resource creation."""

    @patch('pulumi_aws.iam.Role')
    def test_lambda_role_creation_with_trust_policy(self, mock_role):
        """Test Lambda execution role is created with correct trust policy."""
        from infrastructure.iam import IAMStack
        
        config = ServerlessConfig()
        mock_provider = MagicMock()
        mock_parent = MagicMock()
        
        iam_stack = IAMStack(config, mock_provider, mock_parent)

        mock_role.assert_called_once()
        call_args = mock_role.call_args
        self.assertIn('lambda-role', call_args[1]['name'])
        assume_role_policy = call_args[1]['assume_role_policy']
        self.assertIn('lambda.amazonaws.com', assume_role_policy)

    @patch('pulumi_aws.iam.RolePolicyAttachment')
    @patch('pulumi_aws.iam.Policy')
    @patch('pulumi_aws.iam.Role')
    def test_cloudwatch_logs_policy_creation(self, mock_role, mock_policy, mock_attachment):
        """Test CloudWatch Logs policy is created with correct permissions."""
        from infrastructure.iam import IAMStack
        
        config = ServerlessConfig()
        mock_provider = MagicMock()
        mock_parent = MagicMock()
        mock_role.return_value.arn = MagicMock()
        
        iam_stack = IAMStack(config, mock_provider, mock_parent)
        
        log_group_arn = MagicMock()
        log_group_arn.apply = lambda fn: fn('arn:aws:logs:us-east-1:123456789012:log-group:/aws/lambda/test')
        iam_stack.attach_cloudwatch_logs_policy(log_group_arn)
        
        self.assertGreater(mock_policy.call_count, 0)
        self.assertGreater(mock_attachment.call_count, 0)

    @patch('pulumi_aws.iam.RolePolicyAttachment')
    @patch('pulumi_aws.iam.Policy')
    @patch('pulumi_aws.iam.Role')
    def test_s3_policy_creation_with_bucket_access(self, mock_role, mock_policy, mock_attachment):
        """Test S3 policy is created with correct bucket permissions."""
        from infrastructure.iam import IAMStack
        
        config = ServerlessConfig()
        mock_provider = MagicMock()
        mock_parent = MagicMock()
        mock_role.return_value.arn = MagicMock()
        
        iam_stack = IAMStack(config, mock_provider, mock_parent)
        
        bucket_arn = MagicMock()
        bucket_arn.apply = lambda fn: fn('arn:aws:s3:::test-bucket')
        iam_stack.attach_s3_policy(bucket_arn)
        
        self.assertGreater(mock_policy.call_count, 0)
        self.assertGreater(mock_attachment.call_count, 0)


class TestStorageStack(unittest.TestCase):
    """Test S3 Storage resource creation."""

    @patch('pulumi_aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('pulumi_aws.s3.BucketVersioning')
    @patch('pulumi_aws.s3.BucketLifecycleConfiguration')
    @patch('pulumi_aws.s3.BucketPublicAccessBlock')
    @patch('pulumi_aws.s3.Bucket')
    def test_s3_bucket_creation_with_encryption(self, mock_bucket, mock_public_access, mock_lifecycle, mock_versioning, mock_encryption):
        """Test S3 bucket is created with server-side encryption."""
        from infrastructure.storage import StorageStack
        
        config = ServerlessConfig()
        mock_provider = MagicMock()
        mock_parent = MagicMock()
        
        storage_stack = StorageStack(config, mock_provider, mock_parent)

        mock_bucket.assert_called_once()
        mock_encryption.assert_called_once()
        
        bucket_call_args = mock_bucket.call_args
        bucket_name = bucket_call_args[1]['bucket']
        self.assertEqual(bucket_name, bucket_name.lower())
        self.assertIn('serverless-s3-useast1', bucket_name)

    @patch('pulumi_aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('pulumi_aws.s3.BucketVersioning')
    @patch('pulumi_aws.s3.BucketLifecycleConfiguration')
    @patch('pulumi_aws.s3.BucketPublicAccessBlock')
    @patch('pulumi_aws.s3.Bucket')
    def test_s3_public_access_block_configuration(self, mock_bucket, mock_public_access, mock_lifecycle, mock_versioning, mock_encryption):
        """Test S3 bucket has public access blocked."""
        from infrastructure.storage import StorageStack
        
        config = ServerlessConfig()
        mock_provider = MagicMock()
        mock_parent = MagicMock()
        
        storage_stack = StorageStack(config, mock_provider, mock_parent)

        mock_public_access.assert_called_once()
        call_args = mock_public_access.call_args
        self.assertTrue(call_args[1]['block_public_acls'])
        self.assertTrue(call_args[1]['block_public_policy'])


class TestNotificationsStack(unittest.TestCase):
    """Test SNS Notifications resource creation."""

    @patch('pulumi_aws.sns.Topic')
    def test_sns_topic_creation_with_tags(self, mock_topic):
        """Test SNS topic is created with correct configuration and tags."""
        from infrastructure.notifications import NotificationsStack
        
        config = ServerlessConfig()
        mock_provider = MagicMock()
        mock_parent = MagicMock()
        
        notifications_stack = NotificationsStack(config, mock_provider, mock_parent)

        mock_topic.assert_called_once()
        call_args = mock_topic.call_args
        self.assertIn('serverless-notifications-useast1', call_args[1]['name'])
        self.assertIn('tags', call_args[1])


class TestLambdaStack(unittest.TestCase):
    """Test Lambda resource creation."""

    @patch('pulumi_aws.s3.BucketNotification')
    @patch('pulumi_aws.lambda_.Permission')
    @patch('pulumi_aws.lambda_.FunctionEventInvokeConfig')
    @patch('pulumi_aws.lambda_.Function')
    def test_lambda_function_creation_with_runtime(self, mock_function, mock_event_config, mock_permission, mock_notification):
        """Test Lambda function is created with correct runtime and configuration."""
        from infrastructure.lambda_functions import LambdaStack
        from pulumi import Resource
        
        config = ServerlessConfig()
        mock_provider = MagicMock()
        mock_parent = MagicMock()
        
        mock_function_instance = MagicMock(spec=Resource)
        type(mock_function_instance).name = PropertyMock(return_value='test-function')
        type(mock_function_instance).arn = PropertyMock(return_value='arn:aws:lambda:us-east-1:123456789012:function:test-function')
        mock_function.return_value = mock_function_instance
        
        mock_permission_instance = MagicMock(spec=Resource)
        mock_permission.return_value = mock_permission_instance
        
        lambda_stack = LambdaStack(
            config,
            mock_provider,
            MagicMock(),
            MagicMock(),
            MagicMock(),
            MagicMock(),
            mock_parent
        )

        mock_function.assert_called_once()
        call_args = mock_function.call_args
        self.assertIn('serverless-file-processor-useast1', call_args[1]['name'])
        self.assertEqual(call_args[1]['runtime'], 'python3.11')
        self.assertEqual(call_args[1]['timeout'], 180)

    @patch('pulumi_aws.s3.BucketNotification')
    @patch('pulumi_aws.lambda_.Permission')
    @patch('pulumi_aws.lambda_.FunctionEventInvokeConfig')
    @patch('pulumi_aws.lambda_.Function')
    def test_lambda_event_invoke_config_with_retries(self, mock_function, mock_event_config, mock_permission, mock_notification):
        """Test Lambda event invoke config is created with retry configuration."""
        from infrastructure.lambda_functions import LambdaStack
        from pulumi import Resource
        
        config = ServerlessConfig()
        mock_provider = MagicMock()
        mock_parent = MagicMock()
        
        mock_function_instance = MagicMock(spec=Resource)
        type(mock_function_instance).name = PropertyMock(return_value='test-function')
        type(mock_function_instance).arn = PropertyMock(return_value='arn:aws:lambda:us-east-1:123456789012:function:test-function')
        mock_function.return_value = mock_function_instance
        
        mock_permission_instance = MagicMock(spec=Resource)
        mock_permission.return_value = mock_permission_instance
        
        lambda_stack = LambdaStack(
            config,
            mock_provider,
            MagicMock(),
            MagicMock(),
            MagicMock(),
            MagicMock(),
            mock_parent
        )

        mock_event_config.assert_called_once()
        call_args = mock_event_config.call_args
        self.assertEqual(call_args[1]['maximum_retry_attempts'], 2)

    @patch('pulumi_aws.s3.BucketNotification')
    @patch('pulumi_aws.lambda_.Permission')
    @patch('pulumi_aws.lambda_.FunctionEventInvokeConfig')
    @patch('pulumi_aws.lambda_.Function')
    def test_lambda_s3_permission_creation(self, mock_function, mock_event_config, mock_permission, mock_notification):
        """Test Lambda permission for S3 trigger is created."""
        from infrastructure.lambda_functions import LambdaStack
        from pulumi import Resource
        
        config = ServerlessConfig()
        mock_provider = MagicMock()
        mock_parent = MagicMock()
        
        mock_function_instance = MagicMock(spec=Resource)
        type(mock_function_instance).name = PropertyMock(return_value='test-function')
        type(mock_function_instance).arn = PropertyMock(return_value='arn:aws:lambda:us-east-1:123456789012:function:test-function')
        mock_function.return_value = mock_function_instance
        
        mock_permission_instance = MagicMock(spec=Resource)
        mock_permission.return_value = mock_permission_instance
        
        lambda_stack = LambdaStack(
            config,
            mock_provider,
            MagicMock(),
            MagicMock(),
            MagicMock(),
            MagicMock(),
            mock_parent
        )

        self.assertGreaterEqual(mock_permission.call_count, 1)


class TestMonitoringStack(unittest.TestCase):
    """Test CloudWatch Monitoring resource creation."""

    @patch('pulumi_aws.cloudwatch.MetricAlarm')
    @patch('pulumi_aws.cloudwatch.LogGroup')
    def test_log_group_creation_with_retention(self, mock_log_group, mock_alarm):
        """Test CloudWatch log group is created with retention policy."""
        from infrastructure.monitoring import MonitoringStack
        
        config = ServerlessConfig()
        mock_provider = MagicMock()
        mock_parent = MagicMock()
        mock_function_name = MagicMock()
        mock_function_name.apply = lambda fn: fn('test-function')
        
        monitoring_stack = MonitoringStack(
            config,
            mock_provider,
            mock_function_name,
            MagicMock(),
            mock_parent
        )

        mock_log_group.assert_called_once()
        call_args = mock_log_group.call_args
        self.assertEqual(call_args[1]['retention_in_days'], 7)

    @patch('pulumi_aws.cloudwatch.MetricAlarm')
    @patch('pulumi_aws.cloudwatch.LogGroup')
    def test_error_rate_alarm_creation(self, mock_log_group, mock_alarm):
        """Test CloudWatch error rate alarm is created."""
        from infrastructure.monitoring import MonitoringStack
        
        config = ServerlessConfig()
        mock_provider = MagicMock()
        mock_parent = MagicMock()
        mock_function_name = MagicMock()
        mock_function_name.apply = lambda fn: fn('test-function')
        
        monitoring_stack = MonitoringStack(
            config,
            mock_provider,
            mock_function_name,
            MagicMock(),
            mock_parent
        )

        self.assertGreaterEqual(mock_alarm.call_count, 3)
        alarm_calls = [call[1]['name'] for call in mock_alarm.call_args_list]
        error_rate_alarms = [name for name in alarm_calls if 'error-rate-alarm' in name]
        self.assertGreater(len(error_rate_alarms), 0)

    @patch('pulumi_aws.cloudwatch.MetricAlarm')
    @patch('pulumi_aws.cloudwatch.LogGroup')
    def test_throttle_alarm_creation(self, mock_log_group, mock_alarm):
        """Test CloudWatch throttle alarm is created."""
        from infrastructure.monitoring import MonitoringStack
        
        config = ServerlessConfig()
        mock_provider = MagicMock()
        mock_parent = MagicMock()
        mock_function_name = MagicMock()
        mock_function_name.apply = lambda fn: fn('test-function')
        
        monitoring_stack = MonitoringStack(
            config,
            mock_provider,
            mock_function_name,
            MagicMock(),
            mock_parent
        )

        alarm_calls = [call[1]['name'] for call in mock_alarm.call_args_list]
        throttle_alarms = [name for name in alarm_calls if 'throttle-alarm' in name]
        self.assertGreater(len(throttle_alarms), 0)


class TestAPIGatewayStack(unittest.TestCase):
    """Test API Gateway resource creation."""

    @patch('pulumi_aws.apigateway.Stage')
    @patch('pulumi_aws.apigateway.Deployment')
    @patch('pulumi_aws.apigateway.IntegrationResponse')
    @patch('pulumi_aws.apigateway.MethodResponse')
    @patch('pulumi_aws.apigateway.Integration')
    @patch('pulumi_aws.apigateway.Method')
    @patch('pulumi_aws.apigateway.Resource')
    @patch('pulumi_aws.lambda_.Permission')
    @patch('pulumi_aws.apigateway.RestApi')
    def test_rest_api_creation_with_name(self, mock_rest_api, mock_permission, mock_resource, mock_method, mock_integration, mock_method_response, mock_integration_response, mock_deployment, mock_stage):
        """Test API Gateway REST API is created with correct name."""
        from infrastructure.api_gateway import APIGatewayStack
        from pulumi import Resource
        
        config = ServerlessConfig()
        mock_provider = MagicMock()
        mock_parent = MagicMock()
        
        mock_rest_api_instance = MagicMock(spec=Resource)
        type(mock_rest_api_instance).id = PropertyMock(return_value='test-api-id')
        type(mock_rest_api_instance).root_resource_id = PropertyMock(return_value='root-id')
        type(mock_rest_api_instance).execution_arn = PropertyMock(return_value='arn:aws:execute-api:us-east-1:123456789012:test-api-id')
        mock_rest_api.return_value = mock_rest_api_instance
        
        mock_resource_instance = MagicMock(spec=Resource)
        type(mock_resource_instance).id = PropertyMock(return_value='resource-id')
        mock_resource.return_value = mock_resource_instance
        
        mock_method_instance = MagicMock(spec=Resource)
        type(mock_method_instance).http_method = PropertyMock(return_value='POST')
        mock_method.return_value = mock_method_instance
        
        mock_integration_instance = MagicMock(spec=Resource)
        type(mock_integration_instance).http_method = PropertyMock(return_value='POST')
        mock_integration.return_value = mock_integration_instance
        
        mock_deployment_instance = MagicMock(spec=Resource)
        type(mock_deployment_instance).id = PropertyMock(return_value='deployment-id')
        mock_deployment.return_value = mock_deployment_instance
        
        api_gateway_stack = APIGatewayStack(
            config,
            mock_provider,
            MagicMock(),
            MagicMock(),
            mock_parent
        )

        mock_rest_api.assert_called_once()
        call_args = mock_rest_api.call_args
        self.assertIn('serverless-api-useast1', call_args[1]['name'])

    @patch('pulumi_aws.apigateway.Stage')
    @patch('pulumi_aws.apigateway.Deployment')
    @patch('pulumi_aws.apigateway.IntegrationResponse')
    @patch('pulumi_aws.apigateway.MethodResponse')
    @patch('pulumi_aws.apigateway.Integration')
    @patch('pulumi_aws.apigateway.Method')
    @patch('pulumi_aws.apigateway.Resource')
    @patch('pulumi_aws.lambda_.Permission')
    @patch('pulumi_aws.apigateway.RestApi')
    def test_api_method_creation_as_post(self, mock_rest_api, mock_permission, mock_resource, mock_method, mock_integration, mock_method_response, mock_integration_response, mock_deployment, mock_stage):
        """Test API Gateway method is created as POST."""
        from infrastructure.api_gateway import APIGatewayStack
        from pulumi import Resource
        
        config = ServerlessConfig()
        mock_provider = MagicMock()
        mock_parent = MagicMock()
        
        mock_rest_api_instance = MagicMock(spec=Resource)
        type(mock_rest_api_instance).id = PropertyMock(return_value='test-api-id')
        type(mock_rest_api_instance).root_resource_id = PropertyMock(return_value='root-id')
        type(mock_rest_api_instance).execution_arn = PropertyMock(return_value='arn:aws:execute-api:us-east-1:123456789012:test-api-id')
        mock_rest_api.return_value = mock_rest_api_instance
        
        mock_resource_instance = MagicMock(spec=Resource)
        type(mock_resource_instance).id = PropertyMock(return_value='resource-id')
        mock_resource.return_value = mock_resource_instance
        
        mock_method_instance = MagicMock(spec=Resource)
        type(mock_method_instance).http_method = PropertyMock(return_value='POST')
        mock_method.return_value = mock_method_instance
        
        mock_integration_instance = MagicMock(spec=Resource)
        type(mock_integration_instance).http_method = PropertyMock(return_value='POST')
        mock_integration.return_value = mock_integration_instance
        
        mock_deployment_instance = MagicMock(spec=Resource)
        type(mock_deployment_instance).id = PropertyMock(return_value='deployment-id')
        mock_deployment.return_value = mock_deployment_instance
        
        api_gateway_stack = APIGatewayStack(
            config,
            mock_provider,
            MagicMock(),
            MagicMock(),
            mock_parent
        )

        mock_method.assert_called_once()
        call_args = mock_method.call_args
        self.assertEqual(call_args[1]['http_method'], 'POST')

    @patch('pulumi_aws.apigateway.Stage')
    @patch('pulumi_aws.apigateway.Deployment')
    @patch('pulumi_aws.apigateway.IntegrationResponse')
    @patch('pulumi_aws.apigateway.MethodResponse')
    @patch('pulumi_aws.apigateway.Integration')
    @patch('pulumi_aws.apigateway.Method')
    @patch('pulumi_aws.apigateway.Resource')
    @patch('pulumi_aws.lambda_.Permission')
    @patch('pulumi_aws.apigateway.RestApi')
    def test_api_integration_type_aws_proxy(self, mock_rest_api, mock_permission, mock_resource, mock_method, mock_integration, mock_method_response, mock_integration_response, mock_deployment, mock_stage):
        """Test API Gateway integration is configured as AWS_PROXY."""
        from infrastructure.api_gateway import APIGatewayStack
        from pulumi import Resource
        
        config = ServerlessConfig()
        mock_provider = MagicMock()
        mock_parent = MagicMock()
        
        mock_rest_api_instance = MagicMock(spec=Resource)
        type(mock_rest_api_instance).id = PropertyMock(return_value='test-api-id')
        type(mock_rest_api_instance).root_resource_id = PropertyMock(return_value='root-id')
        type(mock_rest_api_instance).execution_arn = PropertyMock(return_value='arn:aws:execute-api:us-east-1:123456789012:test-api-id')
        mock_rest_api.return_value = mock_rest_api_instance
        
        mock_resource_instance = MagicMock(spec=Resource)
        type(mock_resource_instance).id = PropertyMock(return_value='resource-id')
        mock_resource.return_value = mock_resource_instance
        
        mock_method_instance = MagicMock(spec=Resource)
        type(mock_method_instance).http_method = PropertyMock(return_value='POST')
        mock_method.return_value = mock_method_instance
        
        mock_integration_instance = MagicMock(spec=Resource)
        type(mock_integration_instance).http_method = PropertyMock(return_value='POST')
        mock_integration.return_value = mock_integration_instance
        
        mock_deployment_instance = MagicMock(spec=Resource)
        type(mock_deployment_instance).id = PropertyMock(return_value='deployment-id')
        mock_deployment.return_value = mock_deployment_instance
        
        api_gateway_stack = APIGatewayStack(
            config,
            mock_provider,
            MagicMock(),
            MagicMock(),
            mock_parent
        )

        mock_integration.assert_called_once()
        call_args = mock_integration.call_args
        self.assertEqual(call_args[1]['type'], 'AWS_PROXY')


class TestTapStack(unittest.TestCase):
    """Test TapStack integration and resource orchestration."""

    @patch('pulumi.export')
    @patch('tap_stack.APIGatewayStack')
    @patch('tap_stack.MonitoringStack')
    @patch('tap_stack.LambdaStack')
    @patch('tap_stack.IAMStack')
    @patch('tap_stack.NotificationsStack')
    @patch('tap_stack.StorageStack')
    @patch('tap_stack.AWSProviderManager')
    @patch('tap_stack.ServerlessConfig')
    def test_stack_component_initialization(self, mock_config, mock_provider, mock_storage, mock_notifications, mock_iam, mock_lambda, mock_monitoring, mock_api_gateway, mock_export):
        """Test TapStack initializes all infrastructure components."""
        mock_config_instance = mock_config.return_value
        mock_config_instance.enable_notifications = True
        mock_provider_instance = mock_provider.return_value
        mock_provider_instance.get_provider.return_value = MagicMock()
        
        mock_storage_instance = mock_storage.return_value
        mock_storage_instance.get_bucket_name.return_value = MagicMock()
        mock_storage_instance.get_bucket_arn.return_value = MagicMock()
        
        mock_notifications_instance = mock_notifications.return_value
        mock_notifications_instance.get_topic_arn.return_value = MagicMock()
        
        mock_iam_instance = mock_iam.return_value
        mock_iam_instance.get_lambda_role_arn.return_value = MagicMock()
        
        mock_lambda_instance = mock_lambda.return_value
        mock_lambda_instance.get_function_name.return_value = MagicMock()
        mock_lambda_instance.get_function_arn.return_value = MagicMock()
        
        mock_monitoring_instance = mock_monitoring.return_value
        mock_monitoring_instance.get_log_group_name.return_value = MagicMock()
        mock_monitoring_instance.get_log_group_arn.return_value = MagicMock()
        
        mock_api_gateway_instance = mock_api_gateway.return_value
        mock_api_gateway_instance.get_api_url.return_value = MagicMock()
        mock_api_gateway_instance.get_rest_api_id.return_value = MagicMock()

        from tap_stack import TapStack, TapStackArgs
        args = TapStackArgs()
        stack = TapStack('test-stack', args)

        mock_config.assert_called_once()
        mock_provider.assert_called_once()
        mock_storage.assert_called_once()
        mock_notifications.assert_called_once()
        mock_iam.assert_called_once()
        mock_lambda.assert_called_once()
        mock_monitoring.assert_called_once()
        mock_api_gateway.assert_called_once()

    @patch('pulumi.export')
    @patch('tap_stack.APIGatewayStack')
    @patch('tap_stack.MonitoringStack')
    @patch('tap_stack.LambdaStack')
    @patch('tap_stack.IAMStack')
    @patch('tap_stack.NotificationsStack')
    @patch('tap_stack.StorageStack')
    @patch('tap_stack.AWSProviderManager')
    @patch('tap_stack.ServerlessConfig')
    def test_stack_outputs_registration(self, mock_config, mock_provider, mock_storage, mock_notifications, mock_iam, mock_lambda, mock_monitoring, mock_api_gateway, mock_export):
        """Test TapStack registers all required outputs."""
        mock_config_instance = mock_config.return_value
        mock_config_instance.environment = 'Production'
        mock_config_instance.environment_suffix = 'prod'
        mock_config_instance.primary_region = 'us-east-1'
        mock_config_instance.enable_notifications = True
        
        mock_provider_instance = mock_provider.return_value
        mock_provider_instance.get_provider.return_value = MagicMock()
        
        mock_storage_instance = mock_storage.return_value
        mock_storage_instance.get_bucket_name.return_value = MagicMock()
        mock_storage_instance.get_bucket_arn.return_value = MagicMock()
        
        mock_notifications_instance = mock_notifications.return_value
        mock_notifications_instance.get_topic_arn.return_value = MagicMock()
        
        mock_iam_instance = mock_iam.return_value
        mock_iam_instance.get_lambda_role_arn.return_value = MagicMock()
        
        mock_lambda_instance = mock_lambda.return_value
        mock_lambda_instance.get_function_name.return_value = MagicMock()
        mock_lambda_instance.get_function_arn.return_value = MagicMock()
        
        mock_monitoring_instance = mock_monitoring.return_value
        mock_monitoring_instance.get_log_group_name.return_value = MagicMock()
        mock_monitoring_instance.get_log_group_arn.return_value = MagicMock()
        
        mock_api_gateway_instance = mock_api_gateway.return_value
        mock_api_gateway_instance.get_api_url.return_value = MagicMock()
        mock_api_gateway_instance.get_rest_api_id.return_value = MagicMock()

        from tap_stack import TapStack, TapStackArgs
        args = TapStackArgs()
        stack = TapStack('test-stack', args)

        export_calls = [call[0][0] for call in mock_export.call_args_list]
        expected_outputs = [
            'environment', 'environment_suffix', 'primary_region',
            'bucket_name', 'bucket_arn',
            'lambda_function_name', 'lambda_function_arn', 'lambda_role_arn',
            'sns_topic_arn',
            'log_group_name', 'log_group_arn',
            'api_gateway_url', 'api_gateway_id'
        ]

        for output in expected_outputs:
            self.assertIn(output, export_calls)


if __name__ == '__main__':
    unittest.main()
