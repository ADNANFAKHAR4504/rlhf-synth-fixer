"""
test_tap_stack.py
Unit tests for the Financial Data Pipeline TapStack focusing on resource creation
and configuration verification with full mocking and coverage.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from infrastructure.config import FinancialDataPipelineConfig


class TestFinancialDataPipelineConfig(unittest.TestCase):
    """Test FinancialDataPipelineConfig resource configuration."""

    def test_config_default_values(self):
        """Test configuration with default values."""
        with patch.dict('os.environ', {}, clear=True):
            config = FinancialDataPipelineConfig()
            self.assertIsInstance(config.project_name, str)
            self.assertIsInstance(config.environment, str)
            self.assertIsInstance(config.primary_region, str)
            self.assertGreater(config.lambda_timeout, 0)
            self.assertGreater(config.lambda_memory_size, 0)

    @patch.dict('os.environ', {
        'PROJECT_NAME': 'custom-findata',
        'ENVIRONMENT': 'staging',
        'AWS_REGION': 'us-west-2',
        'LAMBDA_TIMEOUT': '180',
        'LAMBDA_MEMORY_SIZE': '2048'
    })
    def test_config_custom_values(self):
        """Test configuration with custom environment variables."""
        config = FinancialDataPipelineConfig()
        self.assertEqual(config.project_name, 'custom-findata')
        self.assertEqual(config.environment, 'staging')
        self.assertEqual(config.primary_region, 'us-west-2')
        self.assertEqual(config.lambda_timeout, 180)
        self.assertEqual(config.lambda_memory_size, 2048)

    def test_normalize_region(self):
        """Test region normalization."""
        config = FinancialDataPipelineConfig()
        self.assertEqual(config._normalize_region('us-east-1'), 'useast1')
        self.assertEqual(config._normalize_region('eu-west-2'), 'euwest2')

    def test_get_resource_name(self):
        """Test resource name generation includes region and suffix."""
        config = FinancialDataPipelineConfig()
        name = config.get_resource_name('lambda')
        self.assertIn('lambda', name)
        self.assertIn(config.normalized_region, name)
        self.assertIn(config.environment_suffix, name)

    def test_get_common_tags(self):
        """Test common tags generation."""
        config = FinancialDataPipelineConfig()
        tags = config.get_common_tags()
        self.assertIn('Environment', tags)
        self.assertIn('Team', tags)
        self.assertIn('CostCenter', tags)


class TestAWSProviderManager(unittest.TestCase):
    """Test AWS Provider Manager."""

    @patch('infrastructure.aws_provider.aws.Provider')
    def test_provider_creation(self, mock_provider):
        """Test provider is created with correct region and tags."""
        from infrastructure.aws_provider import AWSProviderManager
        config = FinancialDataPipelineConfig()
        manager = AWSProviderManager(config)
        
        provider = manager.get_provider()
        self.assertIsNotNone(provider)
        mock_provider.assert_called_once()


class TestIAMStack(unittest.TestCase):
    """Test IAM Stack resource creation."""

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_lambda_role_creation_with_dynamodb(self, mock_role, mock_role_policy):
        """Test Lambda IAM role is created with DynamoDB policy."""
        import pulumi
        from infrastructure.iam import IAMStack
        
        config = FinancialDataPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        role = iam_stack.create_lambda_role(
            'test-function',
            dynamodb_table_arn=MagicMock()
        )
        
        self.assertIsNotNone(role)
        mock_role.assert_called_once()
        self.assertGreaterEqual(mock_role_policy.call_count, 2)

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_lambda_role_with_s3_and_sqs(self, mock_role, mock_role_policy):
        """Test Lambda role with S3 and SQS policies."""
        import pulumi
        from infrastructure.iam import IAMStack
        
        config = FinancialDataPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        role = iam_stack.create_lambda_role(
            'processor',
            s3_bucket_arn=MagicMock(),
            dlq_arn=MagicMock()
        )
        
        self.assertIsNotNone(role)
        self.assertGreaterEqual(mock_role_policy.call_count, 3)


class TestDynamoDBStack(unittest.TestCase):
    """Test DynamoDB Stack resource creation."""

    @patch('infrastructure.dynamodb.aws.dynamodb.ContributorInsights')
    @patch('infrastructure.dynamodb.aws.dynamodb.Table')
    def test_market_data_table_created(self, mock_table, mock_insights):
        """Test DynamoDB market data table is created with PITR."""
        import pulumi
        from infrastructure.dynamodb import DynamoDBStack
        
        config = FinancialDataPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_table_instance = MagicMock(spec=pulumi.Resource)
        mock_table_instance.name = MagicMock()
        mock_table_instance.arn = MagicMock()
        mock_table.return_value = mock_table_instance
        
        dynamodb_stack = DynamoDBStack(config, mock_provider_manager)
        
        mock_table.assert_called_once()
        mock_insights.assert_called_once()
        self.assertIsNotNone(dynamodb_stack.get_table_name())


class TestSQSStack(unittest.TestCase):
    """Test SQS Stack resource creation."""

    @patch('infrastructure.sqs.aws.sqs.Queue')
    def test_dlq_queues_created(self, mock_queue):
        """Test SQS DLQ queues are created for all Lambda functions."""
        import pulumi
        from infrastructure.sqs import SQSStack
        
        config = FinancialDataPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_queue_instance = MagicMock(spec=pulumi.Resource)
        mock_queue_instance.arn = MagicMock()
        mock_queue_instance.url = MagicMock()
        mock_queue.return_value = mock_queue_instance
        
        sqs_stack = SQSStack(config, mock_provider_manager)
        
        self.assertEqual(mock_queue.call_count, 4)
        self.assertIsNotNone(sqs_stack.get_dlq_arn('upload'))


class TestStorageStack(unittest.TestCase):
    """Test Storage Stack resource creation."""

    @patch('infrastructure.storage.aws.s3.BucketLifecycleConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketPublicAccessBlock')
    @patch('infrastructure.storage.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('infrastructure.storage.aws.s3.Bucket')
    def test_data_bucket_created(self, mock_bucket, mock_encryption,
                                 mock_public_access, mock_lifecycle):
        """Test S3 data bucket is created with encryption and lifecycle."""
        import pulumi
        from infrastructure.storage import StorageStack
        
        config = FinancialDataPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_bucket_instance = MagicMock(spec=pulumi.Resource)
        mock_bucket_instance.id = MagicMock()
        mock_bucket_instance.arn = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        storage_stack = StorageStack(config, mock_provider_manager)
        
        mock_bucket.assert_called_once()
        mock_encryption.assert_called_once()
        mock_public_access.assert_called_once()
        mock_lifecycle.assert_called_once()

    @patch('infrastructure.storage.aws.s3.BucketNotification')
    @patch('infrastructure.storage.aws.s3.BucketLifecycleConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketPublicAccessBlock')
    @patch('infrastructure.storage.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('infrastructure.storage.aws.s3.Bucket')
    def test_event_notification_setup(self, mock_bucket, mock_encryption,
                                     mock_public_access, mock_lifecycle,
                                     mock_notification):
        """Test S3 event notification is set up for Lambda trigger."""
        import pulumi
        from infrastructure.storage import StorageStack
        
        config = FinancialDataPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_bucket_instance = MagicMock(spec=pulumi.Resource)
        mock_bucket_instance.id = MagicMock()
        mock_bucket_instance.arn = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        storage_stack = StorageStack(config, mock_provider_manager)
        storage_stack.setup_event_notification(MagicMock())
        
        mock_notification.assert_called_once()


class TestLambdaStack(unittest.TestCase):
    """Test Lambda Stack resource creation."""

    @patch('infrastructure.lambda_functions.aws.lambda_.Function')
    def test_lambda_functions_created(self, mock_function):
        """Test all Lambda functions are created with proper configuration."""
        import pulumi
        from infrastructure.lambda_functions import LambdaStack
        
        config = FinancialDataPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_iam_stack = MagicMock()
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        mock_iam_stack.create_lambda_role.return_value = mock_role
        
        mock_dynamodb_stack = MagicMock()
        mock_dynamodb_stack.get_table_name.return_value = MagicMock()
        mock_dynamodb_stack.get_table_arn.return_value = MagicMock()
        
        mock_sqs_stack = MagicMock()
        mock_sqs_stack.get_dlq_arn.return_value = MagicMock()
        
        mock_storage_stack = MagicMock()
        mock_storage_stack.get_bucket_name.return_value = MagicMock()
        mock_storage_stack.get_bucket_arn.return_value = MagicMock()
        
        mock_function_instance = MagicMock(spec=pulumi.Resource)
        mock_function_instance.arn = MagicMock()
        mock_function_instance.name = MagicMock()
        mock_function.return_value = mock_function_instance
        
        lambda_stack = LambdaStack(
            config, mock_provider_manager, mock_iam_stack,
            mock_dynamodb_stack, mock_sqs_stack, mock_storage_stack
        )
        
        self.assertEqual(mock_function.call_count, 4)
        self.assertIsNotNone(lambda_stack.get_function('upload'))


class TestAPIGatewayStack(unittest.TestCase):
    """Test API Gateway Stack resource creation."""

    @patch('infrastructure.api_gateway.aws.apigateway.MethodSettings')
    @patch('infrastructure.api_gateway.aws.apigateway.Stage')
    @patch('infrastructure.api_gateway.aws.apigateway.Deployment')
    @patch('infrastructure.api_gateway.aws.lambda_.Permission')
    @patch('infrastructure.api_gateway.aws.apigateway.Integration')
    @patch('infrastructure.api_gateway.aws.apigateway.Method')
    @patch('infrastructure.api_gateway.aws.apigateway.RequestValidator')
    @patch('infrastructure.api_gateway.aws.apigateway.Resource')
    @patch('infrastructure.api_gateway.aws.apigateway.RestApi')
    def test_api_gateway_resources_created(self, mock_api, mock_resource,
                                          mock_validator, mock_method,
                                          mock_integration, mock_permission,
                                          mock_deployment, mock_stage,
                                          mock_settings):
        """Test API Gateway is created with all endpoints."""
        import pulumi
        from infrastructure.api_gateway import APIGatewayStack
        
        config = FinancialDataPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_lambda_stack = MagicMock()
        mock_function = MagicMock(spec=pulumi.Resource)
        mock_function.arn = MagicMock()
        mock_function.name = MagicMock()
        mock_function.invoke_arn = MagicMock()
        mock_lambda_stack.get_function.return_value = mock_function
        mock_lambda_stack.get_function_invoke_arn.return_value = MagicMock()
        
        mock_api_instance = MagicMock(spec=pulumi.Resource)
        mock_api_instance.id = MagicMock()
        mock_api_instance.execution_arn = MagicMock()
        mock_api_instance.root_resource_id = MagicMock()
        mock_api.return_value = mock_api_instance
        
        mock_resource_instance = MagicMock(spec=pulumi.Resource)
        mock_resource_instance.id = MagicMock()
        mock_resource.return_value = mock_resource_instance
        
        mock_validator_instance = MagicMock(spec=pulumi.Resource)
        mock_validator_instance.id = MagicMock()
        mock_validator.return_value = mock_validator_instance
        
        mock_method_instance = MagicMock(spec=pulumi.Resource)
        mock_method_instance.id = MagicMock()
        mock_method_instance.http_method = MagicMock()
        mock_method.return_value = mock_method_instance
        
        mock_integration_instance = MagicMock(spec=pulumi.Resource)
        mock_integration_instance.id = MagicMock()
        mock_integration.return_value = mock_integration_instance
        
        mock_permission_instance = MagicMock(spec=pulumi.Resource)
        mock_permission_instance.id = MagicMock()
        mock_permission.return_value = mock_permission_instance
        
        mock_deployment_instance = MagicMock(spec=pulumi.Resource)
        mock_deployment_instance.id = MagicMock()
        mock_deployment.return_value = mock_deployment_instance
        
        mock_stage_instance = MagicMock(spec=pulumi.Resource)
        mock_stage_instance.id = MagicMock()
        mock_stage_instance.stage_name = MagicMock()
        mock_stage.return_value = mock_stage_instance
        
        mock_settings_instance = MagicMock(spec=pulumi.Resource)
        mock_settings_instance.id = MagicMock()
        mock_settings.return_value = mock_settings_instance
        
        api_gateway_stack = APIGatewayStack(
            config, mock_provider_manager, mock_lambda_stack
        )
        
        mock_api.assert_called_once()
        self.assertGreaterEqual(mock_resource.call_count, 4)
        self.assertEqual(mock_method.call_count, 3)
        self.assertEqual(mock_integration.call_count, 3)
        self.assertEqual(mock_permission.call_count, 3)


class TestMonitoringStack(unittest.TestCase):
    """Test Monitoring Stack resource creation."""

    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    @patch('infrastructure.monitoring.aws.cloudwatch.LogGroup')
    def test_log_groups_and_alarms_created(self, mock_log_group, mock_alarm):
        """Test CloudWatch log groups and alarms are created."""
        import pulumi
        from infrastructure.monitoring import MonitoringStack
        
        config = FinancialDataPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_lambda_stack = MagicMock()
        mock_lambda_stack.get_function_name.return_value = MagicMock()
        
        mock_dynamodb_stack = MagicMock()
        mock_dynamodb_stack.get_table_name.return_value = MagicMock()
        
        mock_log_group_instance = MagicMock(spec=pulumi.Resource)
        mock_log_group_instance.name = MagicMock()
        mock_log_group_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_group_instance
        
        mock_alarm_instance = MagicMock(spec=pulumi.Resource)
        mock_alarm.return_value = mock_alarm_instance
        
        monitoring_stack = MonitoringStack(
            config, mock_provider_manager, mock_lambda_stack,
            mock_dynamodb_stack
        )
        
        self.assertEqual(mock_log_group.call_count, 4)
        self.assertEqual(mock_alarm.call_count, 5)


class TestTapStack(unittest.TestCase):
    """Test TapStack orchestration and outputs."""

    @patch('tap_stack.MonitoringStack')
    @patch('tap_stack.APIGatewayStack')
    @patch('tap_stack.LambdaStack')
    @patch('tap_stack.StorageStack')
    @patch('tap_stack.SQSStack')
    @patch('tap_stack.DynamoDBStack')
    @patch('tap_stack.IAMStack')
    @patch('tap_stack.AWSProviderManager')
    @patch('tap_stack.FinancialDataPipelineConfig')
    def test_tap_stack_initialization(self, mock_config, mock_provider,
                                     mock_iam, mock_dynamodb, mock_sqs,
                                     mock_storage, mock_lambda, mock_api,
                                     mock_monitoring):
        """Test TapStack initializes all component stacks."""
        from tap_stack import TapStack, TapStackArgs
        
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance
        
        mock_lambda_instance = MagicMock()
        mock_lambda_instance.get_function_arn.return_value = MagicMock()
        mock_lambda.return_value = mock_lambda_instance
        
        mock_storage_instance = MagicMock()
        mock_storage_instance.get_bucket_arn.return_value = MagicMock()
        mock_storage.return_value = mock_storage_instance
        
        args = TapStackArgs(environment_suffix='test')
        
        with patch('tap_stack.pulumi.ComponentResource.__init__'):
            stack = TapStack('test-stack', args)
        
        mock_config.assert_called_once()
        mock_provider.assert_called_once()
        mock_iam.assert_called_once()
        mock_dynamodb.assert_called_once()
        mock_sqs.assert_called_once()
        mock_storage.assert_called_once()
        mock_lambda.assert_called_once()
        mock_api.assert_called_once()
        mock_monitoring.assert_called_once()

    @patch('tap_stack.pulumi.export')
    @patch('tap_stack.MonitoringStack')
    @patch('tap_stack.APIGatewayStack')
    @patch('tap_stack.LambdaStack')
    @patch('tap_stack.StorageStack')
    @patch('tap_stack.SQSStack')
    @patch('tap_stack.DynamoDBStack')
    @patch('tap_stack.IAMStack')
    @patch('tap_stack.AWSProviderManager')
    @patch('tap_stack.FinancialDataPipelineConfig')
    def test_tap_stack_outputs(self, mock_config, mock_provider, mock_iam,
                              mock_dynamodb, mock_sqs, mock_storage,
                              mock_lambda, mock_api, mock_monitoring,
                              mock_export):
        """Test TapStack output registration."""
        from tap_stack import TapStack, TapStackArgs
        
        mock_config_instance = MagicMock()
        mock_config_instance.environment = 'prod'
        mock_config_instance.environment_suffix = 'dev'
        mock_config_instance.primary_region = 'us-east-1'
        mock_config_instance.normalized_region = 'useast1'
        mock_config_instance.project_name = 'findata'
        mock_config.return_value = mock_config_instance
        
        mock_lambda_instance = MagicMock()
        mock_lambda_instance.get_function_arn.return_value = MagicMock()
        mock_lambda_instance.get_function_name.return_value = MagicMock()
        mock_lambda.return_value = mock_lambda_instance
        
        mock_dynamodb_instance = MagicMock()
        mock_dynamodb_instance.get_table_name.return_value = MagicMock()
        mock_dynamodb_instance.get_table_arn.return_value = MagicMock()
        mock_dynamodb.return_value = mock_dynamodb_instance
        
        mock_sqs_instance = MagicMock()
        mock_sqs_instance.get_dlq_url.return_value = MagicMock()
        mock_sqs_instance.get_dlq_arn.return_value = MagicMock()
        mock_sqs.return_value = mock_sqs_instance
        
        mock_storage_instance = MagicMock()
        mock_storage_instance.get_bucket_name.return_value = MagicMock()
        mock_storage_instance.get_bucket_arn.return_value = MagicMock()
        mock_storage.return_value = mock_storage_instance
        
        mock_api_instance = MagicMock()
        mock_api_instance.get_api_url.return_value = MagicMock()
        mock_api_instance.get_api_id.return_value = MagicMock()
        mock_api_instance.deployment = MagicMock()
        mock_api_instance.deployment.id = MagicMock()
        mock_api.return_value = mock_api_instance
        
        mock_monitoring_instance = MagicMock()
        mock_monitoring_instance.get_log_group_name.return_value = MagicMock()
        mock_monitoring_instance.get_log_group_arn.return_value = MagicMock()
        mock_monitoring.return_value = mock_monitoring_instance
        
        args = TapStackArgs(environment_suffix='test')
        
        with patch('tap_stack.pulumi.ComponentResource.__init__'):
            stack = TapStack('test-stack', args)
            
            api_url = stack.get_api_url()
            self.assertIsNotNone(api_url)
            
            lambda_arn = stack.get_lambda_function_arn('upload')
            self.assertIsNotNone(lambda_arn)
            
            table_name = stack.get_table_name()
            self.assertIsNotNone(table_name)
            
            bucket_name = stack.get_bucket_name()
            self.assertIsNotNone(bucket_name)


if __name__ == '__main__':
    unittest.main()
