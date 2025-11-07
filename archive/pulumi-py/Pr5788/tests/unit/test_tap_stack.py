"""
test_tap_stack.py

Unit tests for the Transaction Processing infrastructure focusing on resource creation
and configuration verification with full mocking and coverage.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, Mock, patch, call

# Set Pulumi to test mode BEFORE importing pulumi
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

from lib.infrastructure.config import TransactionConfig
from lib.infrastructure.aws_provider import AWSProviderManager
from lib.infrastructure.kms import KMSStack
from lib.infrastructure.s3 import S3Stack
from lib.infrastructure.dynamodb import DynamoDBStack
from lib.infrastructure.sqs import SQSStack
from lib.infrastructure.iam import IAMStack
from lib.infrastructure.lambda_functions import LambdaStack
from lib.infrastructure.api_gateway import APIGatewayStack
from lib.infrastructure.monitoring import MonitoringStack
from lib.tap_stack import TapStack, TapStackArgs


class TestTransactionConfig(unittest.TestCase):
    """Test TransactionConfig resource configuration."""

    def test_config_default_values(self):
        """Test configuration with default values."""
        with patch.dict('os.environ', {}, clear=True):
            config = TransactionConfig()
            self.assertIsInstance(config.project_name, str)
            self.assertIsInstance(config.environment, str)
            self.assertIsInstance(config.primary_region, str)
            self.assertEqual(config.lambda_timeout, 30)
            self.assertEqual(config.transaction_validator_memory, 1536)

    def test_normalize_region(self):
        """Test region normalization removes hyphens."""
        config = TransactionConfig()
        self.assertEqual(config._normalize_region('us-east-1'), 'useast1')
        self.assertEqual(config._normalize_region('eu-west-2'), 'euwest2')

    def test_get_resource_name(self):
        """Test resource name generation includes region and suffix."""
        config = TransactionConfig()
        name = config.get_resource_name('lambda')
        self.assertIn('lambda', name)
        self.assertIn(config.normalized_region, name)

    def test_get_common_tags(self):
        """Test common tags generation."""
        config = TransactionConfig()
        tags = config.get_common_tags()
        self.assertIn('Environment', tags)
        self.assertIn('ManagedBy', tags)
        self.assertEqual(tags['ManagedBy'], 'Pulumi')


class TestAWSProviderManager(unittest.TestCase):
    """Test AWS Provider Manager."""

    @patch('lib.infrastructure.aws_provider.aws.Provider')
    def test_provider_creation(self, mock_provider):
        """Test provider is created with correct region and tags."""
        config = TransactionConfig()
        
        mock_provider_instance = MagicMock()
        mock_provider.return_value = mock_provider_instance
        
        manager = AWSProviderManager(config)
        provider = manager.get_provider()
        
        self.assertIsNotNone(provider)
        mock_provider.assert_called_once()

    @patch('lib.infrastructure.aws_provider.aws.Provider')
    def test_get_resource_options(self, mock_provider):
        """Test get_resource_options returns ResourceOptions with provider."""
        config = TransactionConfig()
        mock_provider_instance = MagicMock()
        mock_provider.return_value = mock_provider_instance
        
        manager = AWSProviderManager(config)
        opts = manager.get_resource_options()
        
        self.assertIsInstance(opts, pulumi.ResourceOptions)


class TestKMSStack(unittest.TestCase):
    """Test KMS Stack resource creation."""

    @patch('lib.infrastructure.kms.aws.get_caller_identity')
    @patch('lib.infrastructure.kms.aws.kms.Alias')
    @patch('lib.infrastructure.kms.aws.kms.Key')
    def test_kms_keys_creation(self, mock_key, mock_alias, mock_caller_identity):
        """Test KMS keys are created for each service."""
        config = TransactionConfig()
        provider_manager = MagicMock()
        provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_caller_identity.return_value = MagicMock(account_id='123456789012')
        mock_key_instance = MagicMock()
        mock_key_instance.id = MagicMock()
        mock_key_instance.arn = MagicMock()
        mock_key.return_value = mock_key_instance
        
        kms_stack = KMSStack(config, provider_manager)
        
        # Verify KMS keys created for s3, dynamodb, sqs, logs
        self.assertEqual(mock_key.call_count, 4)


class TestS3Stack(unittest.TestCase):
    """Test S3 Stack resource creation."""

    @patch('lib.infrastructure.s3.aws.s3.BucketLifecycleConfiguration')
    @patch('lib.infrastructure.s3.aws.s3.BucketPublicAccessBlock')
    @patch('lib.infrastructure.s3.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('lib.infrastructure.s3.aws.s3.BucketVersioning')
    @patch('lib.infrastructure.s3.aws.s3.Bucket')
    def test_logs_bucket_creation(self, mock_bucket, mock_versioning, mock_encryption, 
                                   mock_public_access, mock_lifecycle):
        """Test S3 logs bucket is created with proper configuration."""
        config = TransactionConfig()
        provider_manager = MagicMock()
        provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        kms_stack = MagicMock()
        kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_bucket_instance = MagicMock()
        mock_bucket_instance.id = MagicMock()
        mock_bucket_instance.arn = MagicMock()
        mock_bucket_instance.bucket = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        s3_stack = S3Stack(config, provider_manager, kms_stack)
        
        mock_bucket.assert_called_once()
        mock_versioning.assert_called_once()
        mock_encryption.assert_called_once()
        mock_public_access.assert_called_once()
        mock_lifecycle.assert_called_once()


class TestDynamoDBStack(unittest.TestCase):
    """Test DynamoDB Stack resource creation."""

    @patch('lib.infrastructure.dynamodb.aws.appautoscaling.Policy')
    @patch('lib.infrastructure.dynamodb.aws.appautoscaling.Target')
    @patch('lib.infrastructure.dynamodb.aws.dynamodb.Table')
    def test_transactions_table_creation(self, mock_table, mock_target, mock_policy):
        """Test DynamoDB transactions table is created with GSIs and auto-scaling."""
        config = TransactionConfig()
        provider_manager = MagicMock()
        provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        provider_manager.get_provider.return_value = MagicMock()
        
        kms_stack = MagicMock()
        kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_table_instance = MagicMock()
        mock_table_instance.id = MagicMock()
        mock_table_instance.arn = MagicMock()
        mock_table_instance.name = MagicMock()
        mock_table.return_value = mock_table_instance
        
        dynamodb_stack = DynamoDBStack(config, provider_manager, kms_stack)
        
        mock_table.assert_called_once()
        # Auto-scaling targets: read and write
        self.assertEqual(mock_target.call_count, 2)
        # Auto-scaling policies: read and write
        self.assertEqual(mock_policy.call_count, 2)


class TestSQSStack(unittest.TestCase):
    """Test SQS Stack resource creation."""

    @patch('lib.infrastructure.sqs.aws.sqs.Queue')
    def test_queues_and_dlqs_creation(self, mock_queue):
        """Test SQS queues and DLQs are created."""
        config = TransactionConfig()
        provider_manager = MagicMock()
        provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        kms_stack = MagicMock()
        kms_stack.get_key_id.return_value = MagicMock()
        
        mock_queue_instance = MagicMock()
        mock_queue_instance.arn = MagicMock()
        mock_queue_instance.url = MagicMock()
        mock_queue.return_value = mock_queue_instance
        
        sqs_stack = SQSStack(config, provider_manager, kms_stack)
        
        # 2 queues (analytics, reporting) + 2 DLQs + 4 Lambda DLQs = 8 total
        self.assertEqual(mock_queue.call_count, 8)


class TestIAMStack(unittest.TestCase):
    """Test IAM Stack resource creation."""

    @patch('lib.infrastructure.iam.aws.get_caller_identity')
    @patch('lib.infrastructure.iam.aws.iam.RolePolicy')
    @patch('lib.infrastructure.iam.aws.iam.Role')
    def test_lambda_role_creation(self, mock_role, mock_policy, mock_caller_identity):
        """Test IAM role creation for Lambda with proper permissions."""
        config = TransactionConfig()
        provider_manager = MagicMock()
        provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_caller_identity.return_value = MagicMock(account_id='123456789012')
        
        mock_role_instance = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role_instance.arn = MagicMock()
        mock_role_instance.name = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, provider_manager)
        
        # Create a Lambda role
        log_group_arn = MagicMock()
        role = iam_stack.create_lambda_role(
            'test-function',
            log_group_arn=log_group_arn,
            enable_xray=True
        )
        
        mock_role.assert_called_once()
        self.assertIsNotNone(role)


class TestLambdaStack(unittest.TestCase):
    """Test Lambda Stack resource creation."""

    @patch('lib.infrastructure.lambda_functions.aws.lambda_.FunctionEventInvokeConfig')
    @patch('lib.infrastructure.lambda_functions.aws.lambda_.EventSourceMapping')
    @patch('lib.infrastructure.lambda_functions.aws.lambda_.Function')
    @patch('lib.infrastructure.lambda_functions.aws.cloudwatch.LogGroup')
    def test_lambda_functions_creation(self, mock_log_group, mock_function, 
                                       mock_event_source, mock_event_invoke):
        """Test Lambda functions are created with proper configuration."""
        config = TransactionConfig()
        provider_manager = MagicMock()
        provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        provider_manager.get_provider.return_value = MagicMock()
        
        iam_stack = MagicMock()
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        iam_stack.create_lambda_role.return_value = mock_role
        
        dynamodb_stack = MagicMock()
        dynamodb_stack.get_table_name.return_value = MagicMock()
        dynamodb_stack.get_table_arn.return_value = MagicMock()
        
        sqs_stack = MagicMock()
        sqs_stack.get_queue_url.return_value = MagicMock()
        sqs_stack.get_queue_arn.return_value = MagicMock()
        sqs_stack.get_dlq_arn.return_value = MagicMock()
        
        kms_stack = MagicMock()
        kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_log_group_instance = MagicMock(spec=pulumi.Resource)
        mock_log_group_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_group_instance
        
        mock_function_instance = MagicMock(spec=pulumi.Resource)
        mock_function_instance.name = MagicMock()
        mock_function_instance.arn = MagicMock()
        mock_function.return_value = mock_function_instance
        
        lambda_stack = LambdaStack(
            config, provider_manager, iam_stack, 
            dynamodb_stack, sqs_stack, kms_stack
        )
        
        # 4 Lambda functions
        self.assertEqual(mock_function.call_count, 4)
        # 4 Log groups
        self.assertEqual(mock_log_group.call_count, 4)
        # 4 Event invoke configs
        self.assertEqual(mock_event_invoke.call_count, 4)
        # 2 Event source mappings (analytics and reporting processors)
        self.assertEqual(mock_event_source.call_count, 2)


class TestAPIGatewayStack(unittest.TestCase):
    """Test API Gateway Stack resource creation."""

    @patch('lib.infrastructure.api_gateway.aws.apigateway.UsagePlanKey')
    @patch('lib.infrastructure.api_gateway.aws.apigateway.ApiKey')
    @patch('lib.infrastructure.api_gateway.aws.apigateway.UsagePlan')
    @patch('lib.infrastructure.api_gateway.aws.apigateway.MethodSettings')
    @patch('lib.infrastructure.api_gateway.aws.apigateway.Stage')
    @patch('lib.infrastructure.api_gateway.aws.cloudwatch.LogGroup')
    @patch('lib.infrastructure.api_gateway.aws.apigateway.Deployment')
    @patch('lib.infrastructure.api_gateway.aws.lambda_.Permission')
    @patch('lib.infrastructure.api_gateway.aws.apigateway.Integration')
    @patch('lib.infrastructure.api_gateway.aws.apigateway.Method')
    @patch('lib.infrastructure.api_gateway.aws.apigateway.Resource')
    @patch('lib.infrastructure.api_gateway.aws.apigateway.RestApi')
    def test_api_gateway_creation(self, mock_rest_api, mock_resource, mock_method,
                                   mock_integration, mock_permission, mock_deployment,
                                   mock_log_group, mock_stage, mock_method_settings,
                                   mock_usage_plan, mock_api_key, mock_usage_plan_key):
        """Test API Gateway is created with methods, deployment, and usage plan."""
        config = TransactionConfig()
        provider_manager = MagicMock()
        provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        provider_manager.get_provider.return_value = MagicMock()
        
        lambda_stack = MagicMock()
        mock_function = MagicMock()
        mock_function.name = MagicMock()
        mock_function.invoke_arn = MagicMock()
        lambda_stack.get_function.return_value = mock_function
        lambda_stack.get_function_name.return_value = MagicMock()
        
        mock_api_instance = MagicMock(spec=pulumi.Resource)
        mock_api_instance.id = MagicMock()
        mock_api_instance.root_resource_id = MagicMock()
        mock_api_instance.execution_arn = MagicMock()
        mock_rest_api.return_value = mock_api_instance
        
        mock_resource_instance = MagicMock(spec=pulumi.Resource)
        mock_resource_instance.id = MagicMock()
        mock_resource_instance.path = MagicMock()
        mock_resource.return_value = mock_resource_instance
        
        mock_integration_instance = MagicMock(spec=pulumi.Resource)
        mock_integration_instance.id = MagicMock()
        mock_integration.return_value = mock_integration_instance
        
        mock_method_instance = MagicMock(spec=pulumi.Resource)
        mock_method_instance.id = MagicMock()
        mock_method_instance.http_method = MagicMock()
        mock_method.return_value = mock_method_instance
        
        mock_deployment_instance = MagicMock(spec=pulumi.Resource)
        mock_deployment_instance.id = MagicMock()
        mock_deployment.return_value = mock_deployment_instance
        
        mock_stage_instance = MagicMock(spec=pulumi.Resource)
        mock_stage_instance.stage_name = MagicMock()
        mock_stage.return_value = mock_stage_instance
        
        api_gateway_stack = APIGatewayStack(config, provider_manager, lambda_stack)
        
        mock_rest_api.assert_called_once()
        mock_resource.assert_called_once()
        # 1 method (POST)
        self.assertEqual(mock_method.call_count, 1)
        # 1 integration
        self.assertEqual(mock_integration.call_count, 1)
        mock_deployment.assert_called_once()
        mock_stage.assert_called_once()
        mock_usage_plan.assert_called_once()


class TestMonitoringStack(unittest.TestCase):
    """Test Monitoring Stack resource creation."""

    @patch('lib.infrastructure.monitoring.aws.cloudwatch.Dashboard')
    @patch('lib.infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    @patch('lib.infrastructure.monitoring.aws.sns.Topic')
    def test_monitoring_resources_creation(self, mock_topic, mock_alarm, mock_dashboard):
        """Test monitoring resources are created with alarms and dashboard."""
        config = TransactionConfig()
        provider_manager = MagicMock()
        provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        lambda_stack = MagicMock()
        lambda_stack.get_function_name.return_value = MagicMock()
        
        dynamodb_stack = MagicMock()
        dynamodb_stack.get_table_name.return_value = MagicMock()
        
        mock_topic_instance = MagicMock()
        mock_topic_instance.arn = MagicMock()
        mock_topic.return_value = mock_topic_instance
        
        monitoring_stack = MonitoringStack(
            config, provider_manager, lambda_stack, dynamodb_stack
        )
        
        mock_topic.assert_called_once()
        # 4 Lambda functions * 1 alarm each (error rate) + 1 DynamoDB alarm = 5
        self.assertEqual(mock_alarm.call_count, 5)
        mock_dashboard.assert_called_once()


class TestTapStack(unittest.TestCase):
    """Test TapStack main component."""

    @patch('lib.tap_stack.MonitoringStack')
    @patch('lib.tap_stack.APIGatewayStack')
    @patch('lib.tap_stack.LambdaStack')
    @patch('lib.tap_stack.IAMStack')
    @patch('lib.tap_stack.SQSStack')
    @patch('lib.tap_stack.DynamoDBStack')
    @patch('lib.tap_stack.S3Stack')
    @patch('lib.tap_stack.KMSStack')
    @patch('lib.tap_stack.AWSProviderManager')
    @patch('lib.tap_stack.TransactionConfig')
    def test_tap_stack_initializes_all_stacks(self, mock_config, mock_provider_manager,
                                               mock_kms, mock_s3, mock_dynamodb, mock_sqs,
                                               mock_iam, mock_lambda, mock_api_gateway,
                                               mock_monitoring):
        """Test TapStack initializes all infrastructure stacks."""
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance
        
        mock_provider_instance = MagicMock()
        mock_provider_manager.return_value = mock_provider_instance
        
        args = TapStackArgs(environment_suffix='test')
        
        stack = TapStack('test-stack', args)
        
        mock_config.assert_called_once()
        mock_provider_manager.assert_called_once()
        mock_kms.assert_called_once()
        mock_s3.assert_called_once()
        mock_dynamodb.assert_called_once()
        mock_sqs.assert_called_once()
        mock_iam.assert_called_once()
        mock_lambda.assert_called_once()
        mock_api_gateway.assert_called_once()
        mock_monitoring.assert_called_once()


class TestTapStackArgs(unittest.TestCase):
    """Test TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()
        
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Project': 'Test', 'Owner': 'TestUser'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)
        
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)


if __name__ == '__main__':
    unittest.main()
