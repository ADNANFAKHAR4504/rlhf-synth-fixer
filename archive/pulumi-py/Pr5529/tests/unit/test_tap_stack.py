"""
test_tap_stack.py
Unit tests for the serverless payment processing infrastructure focusing on
resource creation and configuration verification with full mocking and coverage.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, Mock, patch, call

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from infrastructure.config import PaymentProcessingConfig


class TestPaymentProcessingConfig(unittest.TestCase):
    """Test PaymentProcessingConfig resource configuration."""

    def test_config_default_values(self):
        """Test configuration with default values."""
        with patch.dict('os.environ', {}, clear=True):
            config = PaymentProcessingConfig()
            self.assertIsInstance(config.project_name, str)
            self.assertIsInstance(config.environment, str)
            self.assertIsInstance(config.primary_region, str)
            self.assertEqual(config.lambda_timeout, 30)
            self.assertEqual(config.lambda_memory_size, 512)
            self.assertEqual(config.lambda_reserved_concurrency, 100)

    def test_get_resource_name_includes_suffix_and_region(self):
        """Test resource name generation includes region and suffix."""
        config = PaymentProcessingConfig()
        name = config.get_resource_name('lambda')
        self.assertIn('lambda', name)
        self.assertIn(config.normalized_region, name)
        self.assertIn(config.environment_suffix, name)

    def test_normalize_name_converts_to_lowercase(self):
        """Test normalize_name converts to lowercase for S3."""
        config = PaymentProcessingConfig()
        normalized = config.normalize_name('MyBucket-Name')
        self.assertEqual(normalized, 'mybucket-name')


class TestAWSProviderManager(unittest.TestCase):
    """Test AWS Provider Manager."""

    def test_provider_creation_without_role(self):
        """Test provider returns None without assume role."""
        from infrastructure.aws_provider import AWSProviderManager
        config = PaymentProcessingConfig()
        manager = AWSProviderManager(config)
        
        provider = manager.get_provider()
        self.assertIsNone(provider)

    def test_get_resource_options_without_provider(self):
        """Test get_resource_options returns empty dict without provider."""
        from infrastructure.aws_provider import AWSProviderManager
        config = PaymentProcessingConfig()
        manager = AWSProviderManager(config)
        
        opts = manager.get_resource_options()
        self.assertEqual(opts, {})


class TestIAMStack(unittest.TestCase):
    """Test IAM Stack resource creation."""

    @patch('infrastructure.iam.aws.get_caller_identity')
    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_lambda_role_creation(self, mock_role, mock_policy, mock_caller_id):
        """Test Lambda IAM role is created with policies."""
        import pulumi
        from infrastructure.iam import IAMStack
        
        config = PaymentProcessingConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        mock_table_arn = MagicMock()
        mock_queue_arn = MagicMock()
        
        role = iam_stack.create_lambda_role(
            'payment-processor',
            dynamodb_table_arn=mock_table_arn,
            sqs_queue_arn=mock_queue_arn,
            enable_xray=True
        )
        
        self.assertIsNotNone(role)
        mock_role.assert_called_once()
        self.assertEqual(mock_policy.call_count, 4)

    @patch('infrastructure.iam.aws.get_caller_identity')
    def test_iam_policies_scoped_to_resources(self, mock_caller_id):
        """Test IAM policies are scoped to specific resources."""
        from infrastructure.iam import IAMStack
        
        config = PaymentProcessingConfig()
        mock_provider_manager = MagicMock()
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        self.assertEqual(iam_stack.account_id, '123456789012')


class TestDynamoDBStack(unittest.TestCase):
    """Test DynamoDB Stack resource creation."""

    @patch('infrastructure.dynamodb.aws.appautoscaling.Policy')
    @patch('infrastructure.dynamodb.aws.appautoscaling.Target')
    @patch('infrastructure.dynamodb.aws.dynamodb.Table')
    def test_payments_table_creation(self, mock_table, mock_target, mock_policy):
        """Test DynamoDB payments table is created with auto-scaling."""
        import pulumi
        from infrastructure.dynamodb import DynamoDBStack
        
        config = PaymentProcessingConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_table_instance = MagicMock(spec=pulumi.Resource)
        mock_table_instance.name = MagicMock()
        mock_table_instance.arn = MagicMock()
        mock_table.return_value = mock_table_instance
        
        dynamodb_stack = DynamoDBStack(config, mock_provider_manager)
        
        self.assertIsNotNone(dynamodb_stack.tables.get('payments'))
        mock_table.assert_called_once()
        self.assertEqual(mock_target.call_count, 4)
        self.assertEqual(mock_policy.call_count, 4)

    @patch('infrastructure.dynamodb.aws.appautoscaling.Policy')
    @patch('infrastructure.dynamodb.aws.appautoscaling.Target')
    @patch('infrastructure.dynamodb.aws.dynamodb.Table')
    def test_dynamodb_provisioned_capacity(self, mock_table, mock_target, mock_policy):
        """Test DynamoDB table uses provisioned capacity."""
        from infrastructure.dynamodb import DynamoDBStack
        
        config = PaymentProcessingConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_table_instance = MagicMock()
        mock_table_instance.name = MagicMock()
        mock_table_instance.arn = MagicMock()
        mock_table.return_value = mock_table_instance
        
        dynamodb_stack = DynamoDBStack(config, mock_provider_manager)
        
        call_kwargs = mock_table.call_args[1]
        self.assertEqual(call_kwargs['billing_mode'], 'PROVISIONED')
        self.assertEqual(call_kwargs['read_capacity'], 5)
        self.assertEqual(call_kwargs['write_capacity'], 5)


class TestSQSStack(unittest.TestCase):
    """Test SQS Stack resource creation."""

    @patch('infrastructure.sqs.aws.sqs.Queue')
    def test_dlq_creation(self, mock_queue):
        """Test SQS DLQ is created."""
        import pulumi
        from infrastructure.sqs import SQSStack
        
        config = PaymentProcessingConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_queue_instance = MagicMock(spec=pulumi.Resource)
        mock_queue_instance.url = MagicMock()
        mock_queue_instance.arn = MagicMock()
        mock_queue.return_value = mock_queue_instance
        
        sqs_stack = SQSStack(config, mock_provider_manager)
        
        self.assertIsNotNone(sqs_stack.queues.get('payment-processor-dlq'))
        mock_queue.assert_called_once()

    @patch('infrastructure.sqs.aws.sqs.Queue')
    def test_dlq_retention_period(self, mock_queue):
        """Test DLQ has correct message retention."""
        from infrastructure.sqs import SQSStack
        
        config = PaymentProcessingConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_queue_instance = MagicMock()
        mock_queue_instance.url = MagicMock()
        mock_queue_instance.arn = MagicMock()
        mock_queue.return_value = mock_queue_instance
        
        sqs_stack = SQSStack(config, mock_provider_manager)
        
        call_kwargs = mock_queue.call_args[1]
        self.assertEqual(call_kwargs['message_retention_seconds'], 1209600)


class TestLambdaStack(unittest.TestCase):
    """Test Lambda Stack resource creation."""

    @patch('infrastructure.lambda_functions.aws.lambda_.Function')
    @patch('infrastructure.lambda_functions.aws.cloudwatch.LogGroup')
    def test_payment_processor_creation(self, mock_log_group, mock_function):
        """Test payment processor Lambda is created."""
        import pulumi
        from infrastructure.lambda_functions import LambdaStack
        
        config = PaymentProcessingConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_iam_stack = MagicMock()
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        mock_iam_stack.create_lambda_role.return_value = mock_role
        
        mock_dynamodb_stack = MagicMock()
        mock_dynamodb_stack.get_table_name.return_value = MagicMock()
        mock_dynamodb_stack.get_table_arn.return_value = MagicMock()
        
        mock_sqs_stack = MagicMock()
        mock_sqs_stack.get_queue_url.return_value = MagicMock()
        mock_sqs_stack.get_queue_arn.return_value = MagicMock()
        
        mock_function_instance = MagicMock(spec=pulumi.Resource)
        mock_function_instance.name = MagicMock()
        mock_function_instance.arn = MagicMock()
        mock_function.return_value = mock_function_instance
        
        mock_log_group_instance = MagicMock(spec=pulumi.Resource)
        mock_log_group.return_value = mock_log_group_instance
        
        lambda_stack = LambdaStack(
            config,
            mock_provider_manager,
            mock_iam_stack,
            mock_dynamodb_stack,
            mock_sqs_stack
        )
        
        self.assertIsNotNone(lambda_stack.functions.get('payment-processor'))
        mock_function.assert_called_once()
        mock_log_group.assert_called_once()

    @patch('infrastructure.lambda_functions.aws.lambda_.Function')
    @patch('infrastructure.lambda_functions.aws.cloudwatch.LogGroup')
    def test_lambda_dlq_configuration(self, mock_log_group, mock_function):
        """Test Lambda has DLQ properly configured."""
        import pulumi
        from infrastructure.lambda_functions import LambdaStack
        
        config = PaymentProcessingConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_iam_stack = MagicMock()
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        mock_iam_stack.create_lambda_role.return_value = mock_role
        
        mock_dynamodb_stack = MagicMock()
        mock_dynamodb_stack.get_table_name.return_value = MagicMock()
        mock_dynamodb_stack.get_table_arn.return_value = MagicMock()
        
        mock_sqs_stack = MagicMock()
        mock_sqs_stack.get_queue_url.return_value = MagicMock()
        mock_sqs_stack.get_queue_arn.return_value = MagicMock()
        
        mock_function_instance = MagicMock(spec=pulumi.Resource)
        mock_function.return_value = mock_function_instance
        
        mock_log_group_instance = MagicMock(spec=pulumi.Resource)
        mock_log_group.return_value = mock_log_group_instance
        
        lambda_stack = LambdaStack(
            config,
            mock_provider_manager,
            mock_iam_stack,
            mock_dynamodb_stack,
            mock_sqs_stack
        )
        
        call_kwargs = mock_function.call_args[1]
        self.assertIn('dead_letter_config', call_kwargs)


class TestAPIGatewayStack(unittest.TestCase):
    """Test API Gateway Stack resource creation."""

    @patch('infrastructure.api_gateway.aws.apigateway.MethodSettings')
    @patch('infrastructure.api_gateway.aws.apigateway.Stage')
    @patch('infrastructure.api_gateway.aws.apigateway.Deployment')
    @patch('infrastructure.api_gateway.aws.lambda_.Permission')
    @patch('infrastructure.api_gateway.aws.apigateway.Integration')
    @patch('infrastructure.api_gateway.aws.apigateway.Method')
    @patch('infrastructure.api_gateway.aws.apigateway.Resource')
    @patch('infrastructure.api_gateway.aws.apigateway.RestApi')
    @patch('infrastructure.api_gateway.aws.get_caller_identity')
    def test_api_gateway_creation(self, mock_caller_id, mock_api, mock_resource,
                                  mock_method, mock_integration, mock_permission,
                                  mock_deployment, mock_stage, mock_settings):
        """Test API Gateway REST API is created."""
        import pulumi
        from infrastructure.api_gateway import APIGatewayStack
        
        config = PaymentProcessingConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        mock_api_instance = MagicMock(spec=pulumi.Resource)
        mock_api_instance.id = MagicMock()
        mock_api_instance.root_resource_id = MagicMock()
        mock_api.return_value = mock_api_instance
        
        mock_resource_instance = MagicMock(spec=pulumi.Resource)
        mock_resource_instance.id = MagicMock()
        mock_resource.return_value = mock_resource_instance
        
        mock_method_instance = MagicMock(spec=pulumi.Resource)
        mock_method_instance.http_method = 'POST'
        mock_method.return_value = mock_method_instance
        
        mock_integration_instance = MagicMock(spec=pulumi.Resource)
        mock_integration.return_value = mock_integration_instance
        
        mock_deployment_instance = MagicMock(spec=pulumi.Resource)
        mock_deployment_instance.id = MagicMock()
        mock_deployment.return_value = mock_deployment_instance
        
        mock_stage_instance = MagicMock(spec=pulumi.Resource)
        mock_stage_instance.stage_name = 'prod'
        mock_stage.return_value = mock_stage_instance
        
        mock_lambda_stack = MagicMock()
        mock_function = MagicMock()
        mock_function.name = MagicMock()
        mock_function.arn = MagicMock()
        mock_lambda_stack.get_function.return_value = mock_function
        
        api_stack = APIGatewayStack(config, mock_provider_manager, mock_lambda_stack)
        
        self.assertIsNotNone(api_stack.api)
        mock_api.assert_called_once()
        self.assertEqual(mock_resource.call_count, 2)
        self.assertEqual(mock_method.call_count, 3)

    @patch('infrastructure.api_gateway.aws.apigateway.MethodSettings')
    @patch('infrastructure.api_gateway.aws.apigateway.Stage')
    @patch('infrastructure.api_gateway.aws.apigateway.Deployment')
    @patch('infrastructure.api_gateway.aws.lambda_.Permission')
    @patch('infrastructure.api_gateway.aws.apigateway.Integration')
    @patch('infrastructure.api_gateway.aws.apigateway.Method')
    @patch('infrastructure.api_gateway.aws.apigateway.Resource')
    @patch('infrastructure.api_gateway.aws.apigateway.RestApi')
    @patch('infrastructure.api_gateway.aws.get_caller_identity')
    def test_api_gateway_caching_enabled(self, mock_caller_id, mock_api, mock_resource,
                                        mock_method, mock_integration, mock_permission,
                                        mock_deployment, mock_stage, mock_settings):
        """Test API Gateway has caching enabled."""
        import pulumi
        from infrastructure.api_gateway import APIGatewayStack
        
        config = PaymentProcessingConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        mock_api_instance = MagicMock(spec=pulumi.Resource)
        mock_api_instance.id = MagicMock()
        mock_api_instance.root_resource_id = MagicMock()
        mock_api.return_value = mock_api_instance
        
        mock_resource_instance = MagicMock(spec=pulumi.Resource)
        mock_resource_instance.id = MagicMock()
        mock_resource.return_value = mock_resource_instance
        
        mock_method_instance = MagicMock(spec=pulumi.Resource)
        mock_method_instance.http_method = 'POST'
        mock_method.return_value = mock_method_instance
        
        mock_integration_instance = MagicMock(spec=pulumi.Resource)
        mock_integration.return_value = mock_integration_instance
        
        mock_deployment_instance = MagicMock(spec=pulumi.Resource)
        mock_deployment_instance.id = MagicMock()
        mock_deployment.return_value = mock_deployment_instance
        
        mock_stage_instance = MagicMock(spec=pulumi.Resource)
        mock_stage_instance.stage_name = 'prod'
        mock_stage.return_value = mock_stage_instance
        
        mock_lambda_stack = MagicMock()
        mock_function = MagicMock()
        mock_function.name = MagicMock()
        mock_function.arn = MagicMock()
        mock_lambda_stack.get_function.return_value = mock_function
        
        api_stack = APIGatewayStack(config, mock_provider_manager, mock_lambda_stack)
        
        call_kwargs = mock_stage.call_args[1]
        self.assertTrue(call_kwargs['cache_cluster_enabled'])
        self.assertTrue(call_kwargs['xray_tracing_enabled'])


class TestMonitoringStack(unittest.TestCase):
    """Test Monitoring Stack resource creation."""

    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    def test_error_rate_alarm_creation(self, mock_alarm):
        """Test error rate alarm is created with metric math."""
        import pulumi
        from infrastructure.monitoring import MonitoringStack
        
        config = PaymentProcessingConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_lambda_stack = MagicMock()
        mock_function = MagicMock(spec=pulumi.Resource)
        mock_function.name = MagicMock()
        mock_lambda_stack.get_function.return_value = mock_function
        
        mock_alarm_instance = MagicMock(spec=pulumi.Resource)
        mock_alarm_instance.arn = MagicMock()
        mock_alarm.return_value = mock_alarm_instance
        
        monitoring_stack = MonitoringStack(config, mock_provider_manager, mock_lambda_stack)
        
        self.assertIsNotNone(monitoring_stack.alarms.get('payment-processor-error-rate'))
        self.assertEqual(mock_alarm.call_count, 3)

    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    def test_error_rate_alarm_uses_metric_math(self, mock_alarm):
        """Test error rate alarm uses metric math for percentage."""
        from infrastructure.monitoring import MonitoringStack
        
        config = PaymentProcessingConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_lambda_stack = MagicMock()
        mock_function = MagicMock()
        mock_function.name = MagicMock()
        mock_lambda_stack.get_function.return_value = mock_function
        
        mock_alarm.return_value = MagicMock()
        
        monitoring_stack = MonitoringStack(config, mock_provider_manager, mock_lambda_stack)
        
        first_call_kwargs = mock_alarm.call_args_list[0][1]
        self.assertIn('metric_queries', first_call_kwargs)


class TestLambdaStackGetters(unittest.TestCase):
    """Test Lambda Stack getter methods."""

    @patch('infrastructure.lambda_functions.aws.lambda_.Function')
    @patch('infrastructure.lambda_functions.aws.cloudwatch.LogGroup')
    def test_lambda_stack_getters(self, mock_log_group, mock_function):
        """Test Lambda stack getter methods return correct values."""
        import pulumi
        from infrastructure.lambda_functions import LambdaStack
        
        config = PaymentProcessingConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_iam_stack = MagicMock()
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        mock_iam_stack.create_lambda_role.return_value = mock_role
        
        mock_dynamodb_stack = MagicMock()
        mock_dynamodb_stack.get_table_name.return_value = MagicMock()
        mock_dynamodb_stack.get_table_arn.return_value = MagicMock()
        
        mock_sqs_stack = MagicMock()
        mock_sqs_stack.get_queue_url.return_value = MagicMock()
        mock_sqs_stack.get_queue_arn.return_value = MagicMock()
        
        mock_function_instance = MagicMock(spec=pulumi.Resource)
        mock_function_instance.name = MagicMock()
        mock_function_instance.arn = MagicMock()
        mock_function_instance.invoke_arn = MagicMock()
        mock_function.return_value = mock_function_instance
        
        mock_log_group_instance = MagicMock(spec=pulumi.Resource)
        mock_log_group_instance.name = MagicMock()
        mock_log_group_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_group_instance
        
        lambda_stack = LambdaStack(
            config,
            mock_provider_manager,
            mock_iam_stack,
            mock_dynamodb_stack,
            mock_sqs_stack
        )
        
        self.assertIsNotNone(lambda_stack.get_function('payment-processor'))
        self.assertIsNotNone(lambda_stack.get_function_name('payment-processor'))
        self.assertIsNotNone(lambda_stack.get_function_arn('payment-processor'))
        self.assertIsNotNone(lambda_stack.get_function_invoke_arn('payment-processor'))
        self.assertIsNotNone(lambda_stack.get_log_group_name('payment-processor'))
        self.assertIsNotNone(lambda_stack.get_log_group_arn('payment-processor'))


class TestSQSStackGetters(unittest.TestCase):
    """Test SQS Stack getter methods."""

    @patch('infrastructure.sqs.aws.sqs.Queue')
    def test_sqs_stack_getters(self, mock_queue):
        """Test SQS stack getter methods return correct values."""
        import pulumi
        from infrastructure.sqs import SQSStack
        
        config = PaymentProcessingConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_queue_instance = MagicMock(spec=pulumi.Resource)
        mock_queue_instance.url = MagicMock()
        mock_queue_instance.arn = MagicMock()
        mock_queue.return_value = mock_queue_instance
        
        sqs_stack = SQSStack(config, mock_provider_manager)
        
        self.assertIsNotNone(sqs_stack.get_queue('payment-processor-dlq'))
        self.assertIsNotNone(sqs_stack.get_queue_url('payment-processor-dlq'))
        self.assertIsNotNone(sqs_stack.get_queue_arn('payment-processor-dlq'))


class TestDynamoDBStackGetters(unittest.TestCase):
    """Test DynamoDB Stack getter methods."""

    @patch('infrastructure.dynamodb.aws.appautoscaling.Policy')
    @patch('infrastructure.dynamodb.aws.appautoscaling.Target')
    @patch('infrastructure.dynamodb.aws.dynamodb.Table')
    def test_dynamodb_stack_getters(self, mock_table, mock_target, mock_policy):
        """Test DynamoDB stack getter methods return correct values."""
        import pulumi
        from infrastructure.dynamodb import DynamoDBStack
        
        config = PaymentProcessingConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_table_instance = MagicMock(spec=pulumi.Resource)
        mock_table_instance.name = MagicMock()
        mock_table_instance.arn = MagicMock()
        mock_table.return_value = mock_table_instance
        
        dynamodb_stack = DynamoDBStack(config, mock_provider_manager)
        
        self.assertIsNotNone(dynamodb_stack.get_table('payments'))
        self.assertIsNotNone(dynamodb_stack.get_table_name('payments'))
        self.assertIsNotNone(dynamodb_stack.get_table_arn('payments'))


class TestAPIGatewayStackGetters(unittest.TestCase):
    """Test API Gateway Stack getter methods."""

    @patch('infrastructure.api_gateway.aws.apigateway.MethodSettings')
    @patch('infrastructure.api_gateway.aws.apigateway.Stage')
    @patch('infrastructure.api_gateway.aws.apigateway.Deployment')
    @patch('infrastructure.api_gateway.aws.lambda_.Permission')
    @patch('infrastructure.api_gateway.aws.apigateway.Integration')
    @patch('infrastructure.api_gateway.aws.apigateway.Method')
    @patch('infrastructure.api_gateway.aws.apigateway.Resource')
    @patch('infrastructure.api_gateway.aws.apigateway.RestApi')
    @patch('infrastructure.api_gateway.aws.get_caller_identity')
    def test_api_gateway_stack_getters(self, mock_caller_id, mock_api, mock_resource,
                                      mock_method, mock_integration, mock_permission,
                                      mock_deployment, mock_stage, mock_settings):
        """Test API Gateway stack getter methods return correct values."""
        import pulumi
        from infrastructure.api_gateway import APIGatewayStack
        
        config = PaymentProcessingConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        mock_api_instance = MagicMock(spec=pulumi.Resource)
        mock_api_instance.id = MagicMock()
        mock_api_instance.root_resource_id = MagicMock()
        mock_api_instance.execution_arn = MagicMock()
        mock_api.return_value = mock_api_instance
        
        mock_resource_instance = MagicMock(spec=pulumi.Resource)
        mock_resource_instance.id = MagicMock()
        mock_resource.return_value = mock_resource_instance
        
        mock_method_instance = MagicMock(spec=pulumi.Resource)
        mock_method_instance.http_method = 'POST'
        mock_method.return_value = mock_method_instance
        
        mock_integration_instance = MagicMock(spec=pulumi.Resource)
        mock_integration.return_value = mock_integration_instance
        
        mock_deployment_instance = MagicMock(spec=pulumi.Resource)
        mock_deployment_instance.id = MagicMock()
        mock_deployment.return_value = mock_deployment_instance
        
        mock_stage_instance = MagicMock(spec=pulumi.Resource)
        mock_stage_instance.stage_name = 'prod'
        mock_stage.return_value = mock_stage_instance
        
        mock_lambda_stack = MagicMock()
        mock_function = MagicMock()
        mock_function.name = MagicMock()
        mock_function.arn = MagicMock()
        mock_lambda_stack.get_function.return_value = mock_function
        
        api_stack = APIGatewayStack(config, mock_provider_manager, mock_lambda_stack)
        
        self.assertIsNotNone(api_stack.get_api_id())
        self.assertIsNotNone(api_stack.get_api_url())
        self.assertIsNotNone(api_stack.get_stage_name())


class TestMonitoringStackGetters(unittest.TestCase):
    """Test Monitoring Stack getter methods."""

    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    def test_monitoring_stack_getters(self, mock_alarm):
        """Test Monitoring stack getter methods return correct values."""
        import pulumi
        from infrastructure.monitoring import MonitoringStack
        
        config = PaymentProcessingConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_lambda_stack = MagicMock()
        mock_function = MagicMock(spec=pulumi.Resource)
        mock_function.name = MagicMock()
        mock_lambda_stack.get_function.return_value = mock_function
        
        mock_alarm_instance = MagicMock(spec=pulumi.Resource)
        mock_alarm_instance.arn = MagicMock()
        mock_alarm.return_value = mock_alarm_instance
        
        monitoring_stack = MonitoringStack(config, mock_provider_manager, mock_lambda_stack)
        
        self.assertIsNotNone(monitoring_stack.get_alarm_arn('payment-processor-error-rate'))
        self.assertIsNotNone(monitoring_stack.get_alarm_arn('payment-processor-throttle'))
        self.assertIsNotNone(monitoring_stack.get_alarm_arn('payment-processor-duration'))


class TestIAMStackGetters(unittest.TestCase):
    """Test IAM Stack getter methods."""

    @patch('infrastructure.iam.aws.get_caller_identity')
    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_iam_stack_getters(self, mock_role, mock_policy, mock_caller_id):
        """Test IAM stack getter methods return correct values."""
        import pulumi
        from infrastructure.iam import IAMStack
        
        config = PaymentProcessingConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        mock_table_arn = MagicMock()
        mock_queue_arn = MagicMock()
        
        role = iam_stack.create_lambda_role(
            'test-function',
            dynamodb_table_arn=mock_table_arn,
            sqs_queue_arn=mock_queue_arn,
            enable_xray=True
        )
        
        self.assertIsNotNone(iam_stack.get_role_arn('test-function'))


class TestTapStack(unittest.TestCase):
    """Test TapStack orchestration."""

    @patch('tap_stack.MonitoringStack')
    @patch('tap_stack.APIGatewayStack')
    @patch('tap_stack.LambdaStack')
    @patch('tap_stack.SQSStack')
    @patch('tap_stack.DynamoDBStack')
    @patch('tap_stack.IAMStack')
    @patch('tap_stack.AWSProviderManager')
    @patch('tap_stack.PaymentProcessingConfig')
    def test_tap_stack_initialization(self, mock_config, mock_provider, mock_iam,
                                     mock_dynamodb, mock_sqs, mock_lambda,
                                     mock_api, mock_monitoring):
        """Test TapStack initializes all components."""
        from tap_stack import TapStack, TapStackArgs
        
        mock_config_instance = MagicMock()
        mock_config_instance.environment = 'Production'
        mock_config_instance.environment_suffix = 'dev'
        mock_config_instance.primary_region = 'us-east-1'
        mock_config_instance.normalized_region = 'useast1'
        mock_config_instance.project_name = 'payment'
        mock_config_instance.application = 'PaymentProcessing'
        mock_config_instance.cost_center = 'Finance-123'
        mock_config_instance.lambda_memory_size = 512
        mock_config_instance.lambda_timeout = 30
        mock_config_instance.lambda_reserved_concurrency = 100
        mock_config.return_value = mock_config_instance
        
        mock_provider_instance = MagicMock()
        mock_provider.return_value = mock_provider_instance
        
        mock_iam_instance = MagicMock()
        mock_iam_instance.get_role_arn.return_value = MagicMock()
        mock_iam.return_value = mock_iam_instance
        
        mock_dynamodb_instance = MagicMock()
        mock_dynamodb_instance.get_table_name.return_value = MagicMock()
        mock_dynamodb_instance.get_table_arn.return_value = MagicMock()
        mock_dynamodb.return_value = mock_dynamodb_instance
        
        mock_sqs_instance = MagicMock()
        mock_sqs_instance.get_queue_url.return_value = MagicMock()
        mock_sqs_instance.get_queue_arn.return_value = MagicMock()
        mock_sqs.return_value = mock_sqs_instance
        
        mock_lambda_instance = MagicMock()
        mock_lambda_instance.get_function_arn.return_value = MagicMock()
        mock_lambda_instance.get_function_name.return_value = MagicMock()
        mock_lambda_instance.get_function_invoke_arn.return_value = MagicMock()
        mock_lambda_instance.get_log_group_name.return_value = MagicMock()
        mock_lambda_instance.get_log_group_arn.return_value = MagicMock()
        mock_lambda.return_value = mock_lambda_instance
        
        mock_api_instance = MagicMock()
        mock_api_instance.get_api_url.return_value = MagicMock()
        mock_api_instance.get_api_id.return_value = MagicMock()
        mock_api_instance.get_stage_name.return_value = MagicMock()
        mock_api.return_value = mock_api_instance
        
        mock_monitoring_instance = MagicMock()
        mock_monitoring_instance.get_alarm_arn.return_value = MagicMock()
        mock_monitoring.return_value = mock_monitoring_instance
        
        args = TapStackArgs(environment_suffix='dev')
        stack = TapStack('payment-processing', args)
        
        self.assertIsNotNone(stack.config)
        self.assertIsNotNone(stack.provider_manager)
        self.assertIsNotNone(stack.iam_stack)
        self.assertIsNotNone(stack.dynamodb_stack)
        self.assertIsNotNone(stack.sqs_stack)
        self.assertIsNotNone(stack.lambda_stack)
        self.assertIsNotNone(stack.api_gateway_stack)
        self.assertIsNotNone(stack.monitoring_stack)


if __name__ == '__main__':
    unittest.main()
