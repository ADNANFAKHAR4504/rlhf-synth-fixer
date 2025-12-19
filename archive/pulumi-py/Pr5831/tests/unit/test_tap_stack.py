"""
test_tap_stack.py
Unit tests for the serverless processor infrastructure focusing on resource creation
and configuration verification with full mocking and coverage.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Set Pulumi to test mode
os.environ['PULUMI_TEST_MODE'] = 'true'

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

import pulumi

# Mock Pulumi runtime
pulumi.runtime.settings.configure(
    pulumi.runtime.Settings(
        project='test-project',
        stack='test-stack',
        parallel=1,
        dry_run=True,
        monitor='',
        engine='',
    )
)

from infrastructure.config import ServerlessProcessorConfig


class TestServerlessProcessorConfig(unittest.TestCase):
    """Test ServerlessProcessorConfig resource configuration."""

    def test_config_default_values(self):
        """Test configuration with default values."""
        with patch.dict('os.environ', {}, clear=True):
            config = ServerlessProcessorConfig()
            self.assertIsInstance(config.project_name, str)
            self.assertIsInstance(config.environment, str)
            self.assertIsInstance(config.primary_region, str)
            self.assertEqual(config.lambda_timeout, 15)
            self.assertEqual(config.lambda_memory_size, 512)

    def test_normalize_region(self):
        """Test region normalization removes hyphens."""
        config = ServerlessProcessorConfig()
        self.assertEqual(config._normalize_region('us-east-1'), 'useast1')
        self.assertEqual(config._normalize_region('eu-west-2'), 'euwest2')

    def test_get_resource_name_includes_suffix_and_region(self):
        """Test resource name generation includes region and suffix."""
        config = ServerlessProcessorConfig()
        name = config.get_resource_name('lambda')
        self.assertIn('lambda', name)
        self.assertIn(config.normalized_region, name)
        self.assertIn(config.environment_suffix, name)

    def test_get_common_tags(self):
        """Test common tags generation."""
        config = ServerlessProcessorConfig()
        tags = config.get_common_tags()
        self.assertIn('Environment', tags)
        self.assertIn('ManagedBy', tags)
        self.assertEqual(tags['ManagedBy'], 'Pulumi')

    def test_s3_retain_on_delete_default_false(self):
        """Test S3 retain_on_delete defaults to False."""
        with patch.dict('os.environ', {}, clear=True):
            config = ServerlessProcessorConfig()
            self.assertEqual(config.s3_retain_on_delete, False)


class TestAWSProviderManager(unittest.TestCase):
    """Test AWS Provider Manager."""

    @patch('infrastructure.aws_provider.aws.Provider')
    def test_provider_creation(self, mock_provider):
        """Test provider manager returns None by default."""
        from infrastructure.aws_provider import AWSProviderManager
        
        config = ServerlessProcessorConfig()
        mock_provider_instance = MagicMock()
        mock_provider.return_value = mock_provider_instance
        
        manager = AWSProviderManager(config)
        provider = manager.get_provider()
        
        # Provider is None by default (no assume role)
        self.assertIsNone(provider)

    def test_get_resource_options(self):
        """Test resource options are returned."""
        from infrastructure.aws_provider import AWSProviderManager
        
        config = ServerlessProcessorConfig()
        manager = AWSProviderManager(config)
        opts = manager.get_resource_options()
        
        self.assertIsNotNone(opts)
        self.assertIsInstance(opts, pulumi.ResourceOptions)


class TestKMSStack(unittest.TestCase):
    """Test KMS Stack resource creation."""

    @patch('infrastructure.kms.aws.get_caller_identity')
    @patch('infrastructure.kms.aws.kms.Alias')
    @patch('infrastructure.kms.aws.kms.Key')
    def test_kms_key_creation_with_rotation(self, mock_key, mock_alias, mock_caller_id):
        """Test KMS key is created with rotation enabled."""
        from infrastructure.kms import KMSStack
        
        config = ServerlessProcessorConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        mock_key_instance = MagicMock(spec=pulumi.Resource)
        mock_key_instance.arn = MagicMock()
        mock_key_instance.id = MagicMock()
        mock_key.return_value = mock_key_instance
        
        kms_stack = KMSStack(config, mock_provider_manager)
        
        self.assertIsNotNone(kms_stack.keys.get('s3'))
        mock_key.assert_called_once()
        
        call_kwargs = mock_key.call_args[1]
        self.assertTrue(call_kwargs['enable_key_rotation'])

    @patch('infrastructure.kms.aws.get_caller_identity')
    @patch('infrastructure.kms.aws.kms.Alias')
    @patch('infrastructure.kms.aws.kms.Key')
    def test_kms_getters(self, mock_key, mock_alias, mock_caller_id):
        """Test KMS getter methods return correct values."""
        from infrastructure.kms import KMSStack
        
        config = ServerlessProcessorConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        mock_key_instance = MagicMock(spec=pulumi.Resource)
        mock_key_instance.arn = MagicMock()
        mock_key_instance.id = MagicMock()
        mock_key.return_value = mock_key_instance
        
        kms_stack = KMSStack(config, mock_provider_manager)
        
        key_arn = kms_stack.get_key_arn('s3')
        self.assertIsNotNone(key_arn)
        
        key_id = kms_stack.get_key_id('s3')
        self.assertIsNotNone(key_id)


class TestStorageStack(unittest.TestCase):
    """Test Storage Stack resource creation."""

    @patch('infrastructure.storage.aws.s3.BucketLifecycleConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketPublicAccessBlock')
    @patch('infrastructure.storage.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketVersioning')
    @patch('infrastructure.storage.aws.s3.Bucket')
    def test_storage_bucket_created_with_encryption(self, mock_bucket, mock_versioning,
                                                    mock_encryption, mock_public_access,
                                                    mock_lifecycle):
        """Test S3 bucket is created with KMS encryption and versioning."""
        from infrastructure.storage import StorageStack
        
        config = ServerlessProcessorConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_bucket_instance = MagicMock(spec=pulumi.Resource)
        mock_bucket_instance.id = MagicMock()
        mock_bucket_instance.bucket = MagicMock()
        mock_bucket_instance.arn = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        storage_stack = StorageStack(config, mock_provider_manager, mock_kms_stack)
        
        self.assertIsNotNone(storage_stack.buckets.get('processed-data'))
        mock_bucket.assert_called_once()
        mock_encryption.assert_called_once()
        mock_versioning.assert_called_once()
        mock_public_access.assert_called_once()
        mock_lifecycle.assert_called_once()

    @patch('infrastructure.storage.aws.s3.BucketLifecycleConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketPublicAccessBlock')
    @patch('infrastructure.storage.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketVersioning')
    @patch('infrastructure.storage.aws.s3.Bucket')
    def test_storage_getters(self, mock_bucket, mock_versioning, mock_encryption,
                            mock_public_access, mock_lifecycle):
        """Test Storage getter methods return correct values."""
        from infrastructure.storage import StorageStack
        
        config = ServerlessProcessorConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_bucket_instance = MagicMock(spec=pulumi.Resource)
        mock_bucket_instance.id = MagicMock()
        mock_bucket_instance.bucket = MagicMock()
        mock_bucket_instance.arn = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        storage_stack = StorageStack(config, mock_provider_manager, mock_kms_stack)
        
        bucket_name = storage_stack.get_bucket_name('processed-data')
        self.assertIsNotNone(bucket_name)
        
        bucket_arn = storage_stack.get_bucket_arn('processed-data')
        self.assertIsNotNone(bucket_arn)


class TestIAMStack(unittest.TestCase):
    """Test IAM Stack resource creation."""

    def test_iam_stack_initialization(self):
        """Test IAM stack initializes correctly."""
        from infrastructure.iam import IAMStack
        
        config = ServerlessProcessorConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        self.assertIsNotNone(iam_stack.roles)
        self.assertEqual(len(iam_stack.roles), 0)

    @patch('infrastructure.iam.aws.get_caller_identity')
    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_create_lambda_role_basic(self, mock_role, mock_role_policy, mock_caller_id):
        """Test create_lambda_role method with basic parameters."""
        from infrastructure.iam import IAMStack
        
        config = ServerlessProcessorConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role_instance.name = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        role = iam_stack.create_lambda_role('test-function')
        
        self.assertIsNotNone(role)
        mock_role.assert_called()

    @patch('infrastructure.iam.aws.get_caller_identity')
    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_create_lambda_role_with_all_permissions(self, mock_role, mock_role_policy, mock_caller_id):
        """Test create_lambda_role with all optional parameters to cover conditional branches."""
        from infrastructure.iam import IAMStack
        
        config = ServerlessProcessorConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role_instance.name = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        # Call with all optional parameters to cover conditional branches
        role = iam_stack.create_lambda_role(
            'comprehensive-function',
            log_group_arn=MagicMock(),
            s3_bucket_arns=[MagicMock(), MagicMock()],
            kms_key_arns=[MagicMock()]
        )
        
        self.assertIsNotNone(role)
        mock_role.assert_called()
        self.assertIn('comprehensive-function', iam_stack.roles)


class TestLambdaStack(unittest.TestCase):
    """Test Lambda Stack resource creation."""

    @patch('infrastructure.lambda_functions.aws.lambda_.FunctionEventInvokeConfig')
    @patch('infrastructure.lambda_functions.aws.sqs.Queue')
    @patch('infrastructure.lambda_functions.aws.cloudwatch.LogGroup')
    @patch('infrastructure.lambda_functions.aws.lambda_.Function')
    def test_lambda_function_creation(self, mock_function, mock_log_group, mock_queue, mock_event_config):
        """Test Lambda function is created with X-Ray tracing."""
        from infrastructure.lambda_functions import LambdaStack
        
        config = ServerlessProcessorConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_iam_stack = MagicMock()
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        mock_iam_stack.create_lambda_role.return_value = mock_role
        
        mock_storage_stack = MagicMock()
        mock_storage_stack.get_bucket_name.return_value = MagicMock()
        mock_storage_stack.get_bucket_arn.return_value = MagicMock()
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_queue_instance = MagicMock(spec=pulumi.Resource)
        mock_queue_instance.arn = MagicMock()
        mock_queue.return_value = mock_queue_instance
        
        mock_function_instance = MagicMock(spec=pulumi.Resource)
        mock_function_instance.name = MagicMock()
        mock_function_instance.arn = MagicMock()
        mock_function.return_value = mock_function_instance
        
        mock_log_instance = MagicMock(spec=pulumi.Resource)
        mock_log_instance.name = MagicMock()
        mock_log_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_instance
        
        lambda_stack = LambdaStack(config, mock_provider_manager, mock_iam_stack,
                                   mock_storage_stack, mock_kms_stack)
        
        mock_function.assert_called_once()
        mock_log_group.assert_called_once()
        # DLQ and event config are created inside _create_processor_function
        
        call_kwargs = mock_function.call_args[1]
        self.assertEqual(call_kwargs['timeout'], 15)
        self.assertEqual(call_kwargs['memory_size'], 512)

    @patch('infrastructure.lambda_functions.aws.lambda_.FunctionEventInvokeConfig')
    @patch('infrastructure.lambda_functions.aws.sqs.Queue')
    @patch('infrastructure.lambda_functions.aws.cloudwatch.LogGroup')
    @patch('infrastructure.lambda_functions.aws.lambda_.Function')
    def test_lambda_getters(self, mock_function, mock_log_group, mock_queue, mock_event_config):
        """Test Lambda getter methods return correct values."""
        from infrastructure.lambda_functions import LambdaStack
        
        config = ServerlessProcessorConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_iam_stack = MagicMock()
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        mock_iam_stack.create_lambda_role.return_value = mock_role
        
        mock_storage_stack = MagicMock()
        mock_storage_stack.get_bucket_name.return_value = MagicMock()
        mock_storage_stack.get_bucket_arn.return_value = MagicMock()
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_queue_instance = MagicMock(spec=pulumi.Resource)
        mock_queue_instance.arn = MagicMock()
        mock_queue.return_value = mock_queue_instance
        
        mock_function_instance = MagicMock(spec=pulumi.Resource)
        mock_function_instance.name = MagicMock()
        mock_function_instance.arn = MagicMock()
        mock_function.return_value = mock_function_instance
        
        mock_log_instance = MagicMock(spec=pulumi.Resource)
        mock_log_instance.name = MagicMock()
        mock_log_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_instance
        
        lambda_stack = LambdaStack(config, mock_provider_manager, mock_iam_stack,
                                   mock_storage_stack, mock_kms_stack)
        
        func_name = lambda_stack.get_function_name('processor')
        self.assertIsNotNone(func_name)
        
        func_arn = lambda_stack.get_function_arn('processor')
        self.assertIsNotNone(func_arn)
        
        log_group_name = lambda_stack.get_log_group_name('processor')
        self.assertIsNotNone(log_group_name)


class TestAPIGatewayStack(unittest.TestCase):
    """Test API Gateway Stack resource creation."""

    @patch('infrastructure.api_gateway.aws.lambda_.Permission')
    @patch('infrastructure.api_gateway.aws.apigatewayv2.Stage')
    @patch('infrastructure.api_gateway.aws.apigatewayv2.Route')
    @patch('infrastructure.api_gateway.aws.apigatewayv2.Integration')
    @patch('infrastructure.api_gateway.aws.apigatewayv2.Api')
    def test_api_gateway_creation(self, mock_api, mock_integration, mock_route, mock_stage, mock_permission):
        """Test API Gateway HTTP API is created with Lambda integration."""
        from infrastructure.api_gateway import APIGatewayStack
        
        config = ServerlessProcessorConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_lambda_stack = MagicMock()
        mock_lambda_stack.get_function_arn.return_value = MagicMock()
        mock_lambda_stack.get_function_name.return_value = MagicMock()
        
        mock_api_instance = MagicMock(spec=pulumi.Resource)
        mock_api_instance.id = MagicMock()
        mock_api_instance.api_endpoint = MagicMock()
        mock_api_instance.execution_arn = MagicMock()
        mock_api.return_value = mock_api_instance
        
        mock_integration_instance = MagicMock(spec=pulumi.Resource)
        mock_integration_instance.id = MagicMock()
        mock_integration.return_value = mock_integration_instance
        
        mock_route_instance = MagicMock(spec=pulumi.Resource)
        mock_route_instance.id = MagicMock()
        mock_route.return_value = mock_route_instance
        
        mock_stage_instance = MagicMock(spec=pulumi.Resource)
        mock_stage_instance.id = MagicMock()
        mock_stage_instance.invoke_url = MagicMock()
        mock_stage_instance.name = MagicMock()
        mock_stage.return_value = mock_stage_instance
        
        api_stack = APIGatewayStack(config, mock_provider_manager, mock_lambda_stack)
        
        self.assertIsNotNone(api_stack.api)
        mock_api.assert_called_once()
        mock_integration.assert_called_once()
        mock_route.assert_called_once()
        mock_stage.assert_called_once()
        mock_permission.assert_called_once()

    @patch('infrastructure.api_gateway.aws.lambda_.Permission')
    @patch('infrastructure.api_gateway.aws.apigatewayv2.Stage')
    @patch('infrastructure.api_gateway.aws.apigatewayv2.Route')
    @patch('infrastructure.api_gateway.aws.apigatewayv2.Integration')
    @patch('infrastructure.api_gateway.aws.apigatewayv2.Api')
    def test_api_gateway_getters(self, mock_api, mock_integration, mock_route, mock_stage, mock_permission):
        """Test API Gateway getter methods return correct values."""
        from infrastructure.api_gateway import APIGatewayStack
        
        config = ServerlessProcessorConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_lambda_stack = MagicMock()
        mock_lambda_stack.get_function_arn.return_value = MagicMock()
        mock_lambda_stack.get_function_name.return_value = MagicMock()
        
        mock_api_instance = MagicMock(spec=pulumi.Resource)
        mock_api_instance.id = MagicMock()
        mock_api_instance.api_endpoint = MagicMock()
        mock_api_instance.execution_arn = MagicMock()
        mock_api.return_value = mock_api_instance
        
        mock_integration_instance = MagicMock(spec=pulumi.Resource)
        mock_integration_instance.id = MagicMock()
        mock_integration.return_value = mock_integration_instance
        
        mock_route_instance = MagicMock(spec=pulumi.Resource)
        mock_route_instance.id = MagicMock()
        mock_route.return_value = mock_route_instance
        
        mock_stage_instance = MagicMock(spec=pulumi.Resource)
        mock_stage_instance.id = MagicMock()
        mock_stage_instance.invoke_url = MagicMock()
        mock_stage_instance.name = MagicMock()
        mock_stage.return_value = mock_stage_instance
        
        api_stack = APIGatewayStack(config, mock_provider_manager, mock_lambda_stack)
        
        api_url = api_stack.get_api_url()
        self.assertIsNotNone(api_url)
        
        api_id = api_stack.get_api_id()
        self.assertIsNotNone(api_id)
        
        api_endpoint = api_stack.get_api_endpoint()
        self.assertIsNotNone(api_endpoint)


class TestMonitoringStack(unittest.TestCase):
    """Test Monitoring Stack resource creation."""

    @patch('infrastructure.monitoring.aws.cloudwatch.Dashboard')
    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    @patch('infrastructure.monitoring.aws.sns.Topic')
    @patch('infrastructure.monitoring.aws.cloudwatch.LogGroup')
    def test_monitoring_stack_creation(self, mock_log_group, mock_topic, mock_alarm, mock_dashboard):
        """Test monitoring resources are created with alarms and dashboard."""
        from infrastructure.monitoring import MonitoringStack
        
        config = ServerlessProcessorConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_lambda_stack = MagicMock()
        mock_lambda_stack.get_function_name.return_value = MagicMock()
        
        mock_log_group_instance = MagicMock(spec=pulumi.Resource)
        mock_log_group_instance.name = MagicMock()
        mock_log_group_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_group_instance
        
        mock_topic_instance = MagicMock(spec=pulumi.Resource)
        mock_topic_instance.arn = MagicMock()
        mock_topic.return_value = mock_topic_instance
        
        mock_alarm_instance = MagicMock(spec=pulumi.Resource)
        mock_alarm.return_value = mock_alarm_instance
        
        mock_dashboard_instance = MagicMock(spec=pulumi.Resource)
        mock_dashboard.return_value = mock_dashboard_instance
        
        monitoring_stack = MonitoringStack(config, mock_provider_manager, mock_lambda_stack)
        
        self.assertIsNotNone(monitoring_stack.sns_topic)
        self.assertGreaterEqual(mock_alarm.call_count, 2)

    @patch('infrastructure.monitoring.aws.cloudwatch.Dashboard')
    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    @patch('infrastructure.monitoring.aws.sns.Topic')
    @patch('infrastructure.monitoring.aws.cloudwatch.LogGroup')
    def test_monitoring_getters(self, mock_log_group, mock_topic, mock_alarm, mock_dashboard):
        """Test Monitoring getter methods return correct values."""
        from infrastructure.monitoring import MonitoringStack
        
        config = ServerlessProcessorConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_lambda_stack = MagicMock()
        mock_lambda_stack.get_function_name.return_value = MagicMock()
        
        mock_log_group_instance = MagicMock(spec=pulumi.Resource)
        mock_log_group_instance.name = MagicMock()
        mock_log_group_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_group_instance
        
        mock_topic_instance = MagicMock(spec=pulumi.Resource)
        mock_topic_instance.arn = MagicMock()
        mock_topic.return_value = mock_topic_instance
        
        monitoring_stack = MonitoringStack(config, mock_provider_manager, mock_lambda_stack)
        
        sns_topic_arn = monitoring_stack.get_sns_topic_arn()
        self.assertIsNotNone(sns_topic_arn)


class TestTapStack(unittest.TestCase):
    """Test TapStack component resource orchestration."""

    @patch('lib.tap_stack.pulumi.export')
    @patch('lib.tap_stack.MonitoringStack')
    @patch('lib.tap_stack.APIGatewayStack')
    @patch('lib.tap_stack.LambdaStack')
    @patch('lib.tap_stack.IAMStack')
    @patch('lib.tap_stack.StorageStack')
    @patch('lib.tap_stack.KMSStack')
    @patch('lib.tap_stack.AWSProviderManager')
    @patch('lib.tap_stack.ServerlessProcessorConfig')
    def test_tap_stack_initialization(self, mock_config, mock_provider, mock_kms,
                                      mock_storage, mock_iam, mock_lambda, mock_api,
                                      mock_monitoring, mock_export):
        """Test TapStack initializes all components and exports outputs."""
        from lib.tap_stack import TapStack, TapStackArgs
        
        mock_config_instance = MagicMock()
        mock_config_instance.get_resource_name.return_value = 'test-resource'
        mock_config_instance.get_common_tags.return_value = {}
        mock_config.return_value = mock_config_instance
        
        mock_provider_manager = MagicMock()
        mock_provider.return_value = mock_provider_manager
        
        mock_kms_instance = MagicMock()
        mock_kms_instance.get_key_arn.return_value = MagicMock()
        mock_kms_instance.get_key_id.return_value = MagicMock()
        mock_kms.return_value = mock_kms_instance
        
        mock_storage_instance = MagicMock()
        mock_storage_instance.get_bucket_name.return_value = MagicMock()
        mock_storage_instance.get_bucket_arn.return_value = MagicMock()
        mock_storage.return_value = mock_storage_instance
        
        mock_iam_instance = MagicMock()
        mock_iam.return_value = mock_iam_instance
        
        mock_lambda_instance = MagicMock()
        mock_lambda_instance.get_function_name.return_value = MagicMock()
        mock_lambda_instance.get_function_arn.return_value = MagicMock()
        mock_lambda_instance.get_log_group_name.return_value = MagicMock()
        mock_lambda.return_value = mock_lambda_instance
        
        mock_api_instance = MagicMock()
        mock_api_instance.get_api_url.return_value = MagicMock()
        mock_api_instance.get_api_id.return_value = MagicMock()
        mock_api_instance.get_api_endpoint.return_value = MagicMock()
        mock_api.return_value = mock_api_instance
        
        mock_monitoring_instance = MagicMock()
        mock_monitoring_instance.get_sns_topic_arn.return_value = MagicMock()
        mock_monitoring.return_value = mock_monitoring_instance
        
        args = TapStackArgs()
        args.environment_suffix = 'test'
        args.tags = {}
        
        stack = TapStack('test-stack', args)
        
        mock_config.assert_called_once()
        mock_provider.assert_called_once()
        mock_kms.assert_called_once()
        mock_storage.assert_called_once()
        mock_iam.assert_called_once()
        mock_lambda.assert_called_once()
        mock_api.assert_called_once()
        mock_monitoring.assert_called_once()
        
        self.assertGreater(mock_export.call_count, 0)


if __name__ == '__main__':
    unittest.main()
