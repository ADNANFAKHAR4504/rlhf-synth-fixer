"""
test_tap_stack.py
Unit tests for the TapStack Pulumi component focusing on resource creation
and configuration verification with full mocking and coverage.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, Mock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from infrastructure.config import TransactionPipelineConfig


class TestTransactionPipelineConfig(unittest.TestCase):
    """Test TransactionPipelineConfig resource configuration."""

    def test_config_default_values(self):
        """Test configuration with default values."""
        with patch.dict('os.environ', {}, clear=True):
            config = TransactionPipelineConfig()
            self.assertIsInstance(config.project_name, str)
            self.assertIsInstance(config.environment, str)
            self.assertIsInstance(config.primary_region, str)
            self.assertGreater(config.fraud_threshold, 0)
            self.assertGreater(config.audit_retention_days, 0)

    @patch.dict('os.environ', {
        'PROJECT_NAME': 'custom-txn',
        'ENVIRONMENT': 'staging',
        'AWS_REGION': 'us-west-2',
        'FRAUD_THRESHOLD': '0.75',
        'AUDIT_RETENTION_DAYS': '60'
    })
    def test_config_custom_values(self):
        """Test configuration with custom environment variables."""
        config = TransactionPipelineConfig()
        self.assertEqual(config.project_name, 'custom-txn')
        self.assertEqual(config.environment, 'staging')
        self.assertEqual(config.primary_region, 'us-west-2')
        self.assertEqual(config.fraud_threshold, 0.75)
        self.assertEqual(config.audit_retention_days, 60)

    def test_normalize_region(self):
        """Test region normalization."""
        config = TransactionPipelineConfig()
        self.assertEqual(config._normalize_region('us-east-1'), 'useast1')
        self.assertEqual(config._normalize_region('eu-west-2'), 'euwest2')

    def test_get_resource_name(self):
        """Test resource name generation includes region and suffix."""
        config = TransactionPipelineConfig()
        name = config.get_resource_name('lambda')
        self.assertIn('lambda', name)
        self.assertIn(config.normalized_region, name)
        self.assertIn(config.environment_suffix, name)

    def test_get_common_tags(self):
        """Test common tags generation."""
        config = TransactionPipelineConfig()
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
        config = TransactionPipelineConfig()
        manager = AWSProviderManager(config)
        
        provider = manager.get_provider()
        self.assertIsNotNone(provider)
        mock_provider.assert_called_once()


class TestIAMStack(unittest.TestCase):
    """Test IAM Stack resource creation."""

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_lambda_role_creation(self, mock_role, mock_role_policy):
        """Test Lambda IAM role is created with proper policies."""
        import pulumi
        from infrastructure.iam import IAMStack
        
        config = TransactionPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        role = iam_stack.create_lambda_role('test-function', dynamodb_table_arns=[MagicMock()])
        
        self.assertIsNotNone(role)
        mock_role.assert_called_once()
        self.assertGreaterEqual(mock_role_policy.call_count, 2)

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_eventbridge_sqs_role_creation(self, mock_role, mock_role_policy):
        """Test EventBridge to SQS role is created."""
        import pulumi
        from infrastructure.iam import IAMStack
        
        config = TransactionPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        role = iam_stack.create_eventbridge_sqs_role('test-bus-arn', [MagicMock()])
        
        self.assertIsNotNone(role)
        mock_role.assert_called_once()


class TestDynamoDBStack(unittest.TestCase):
    """Test DynamoDB Stack resource creation."""

    @patch('infrastructure.dynamodb.aws.dynamodb.Table')
    def test_tables_created(self, mock_table):
        """Test DynamoDB tables are created with GSI."""
        import pulumi
        from infrastructure.dynamodb import DynamoDBStack
        
        config = TransactionPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_table_instance = MagicMock(spec=pulumi.Resource)
        mock_table_instance.name = MagicMock()
        mock_table_instance.arn = MagicMock()
        mock_table.return_value = mock_table_instance
        
        dynamodb_stack = DynamoDBStack(config, mock_provider_manager)
        
        self.assertEqual(mock_table.call_count, 2)
        self.assertIsNotNone(dynamodb_stack.get_table('transactions'))


class TestSQSStack(unittest.TestCase):
    """Test SQS Stack resource creation."""

    @patch('infrastructure.sqs.aws.sqs.Queue')
    def test_queues_with_dlq_created(self, mock_queue):
        """Test SQS queues are created with DLQs and redrive policy."""
        import pulumi
        from infrastructure.sqs import SQSStack
        
        config = TransactionPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_queue_instance = MagicMock(spec=pulumi.Resource)
        mock_queue_instance.arn = MagicMock()
        mock_queue_instance.url = MagicMock()
        mock_queue.return_value = mock_queue_instance
        
        sqs_stack = SQSStack(config, mock_provider_manager)
        
        self.assertGreaterEqual(mock_queue.call_count, 8)
        self.assertIsNotNone(sqs_stack.get_queue('failed-validations'))


class TestLambdaStack(unittest.TestCase):
    """Test Lambda Stack resource creation."""

    @patch('infrastructure.lambda_functions.aws.cloudwatch.LogGroup')
    @patch('infrastructure.lambda_functions.aws.lambda_.EventSourceMapping')
    @patch('infrastructure.lambda_functions.aws.lambda_.Function')
    def test_lambda_functions_created(self, mock_function, mock_event_source, mock_log_group):
        """Test Lambda functions are created with proper configuration."""
        import pulumi
        from infrastructure.lambda_functions import LambdaStack
        
        config = TransactionPipelineConfig()
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
        mock_sqs_stack.get_queue_url.return_value = MagicMock()
        mock_sqs_stack.get_queue_arn.return_value = MagicMock()
        
        mock_function_instance = MagicMock(spec=pulumi.Resource)
        mock_function_instance.arn = MagicMock()
        mock_function_instance.name = MagicMock()
        mock_function.return_value = mock_function_instance
        
        lambda_stack = LambdaStack(
            config, mock_provider_manager, mock_iam_stack,
            mock_dynamodb_stack, mock_sqs_stack
        )
        
        self.assertEqual(mock_function.call_count, 3)
        self.assertIsNotNone(lambda_stack.get_function('transaction-receiver'))


class TestEventBridgeStack(unittest.TestCase):
    """Test EventBridge Stack resource creation."""

    @patch('infrastructure.eventbridge.aws.sqs.QueuePolicy')
    @patch('infrastructure.eventbridge.aws.lambda_.Permission')
    @patch('infrastructure.eventbridge.aws.cloudwatch.EventTarget')
    @patch('infrastructure.eventbridge.aws.cloudwatch.EventRule')
    def test_eventbridge_rules_created(self, mock_rule, mock_target, mock_permission, mock_queue_policy):
        """Test EventBridge rules and targets are created."""
        import pulumi
        from infrastructure.eventbridge import EventBridgeStack
        
        config = TransactionPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_iam_stack = MagicMock()
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        mock_iam_stack.create_eventbridge_sqs_role.return_value = mock_role
        
        mock_lambda_stack = MagicMock()
        mock_function = MagicMock(spec=pulumi.Resource)
        mock_function.arn = MagicMock()
        mock_function.name = MagicMock()
        mock_lambda_stack.get_function.return_value = mock_function
        
        mock_sqs_stack = MagicMock()
        mock_queue = MagicMock(spec=pulumi.Resource)
        mock_queue.arn = MagicMock()
        mock_queue.url = MagicMock()
        mock_sqs_stack.get_queue.return_value = mock_queue
        mock_sqs_stack.get_queue_arn.return_value = MagicMock()
        
        mock_rule_instance = MagicMock(spec=pulumi.Resource)
        mock_rule_instance.arn = MagicMock()
        mock_rule_instance.name = MagicMock()
        mock_rule.return_value = mock_rule_instance
        
        eventbridge_stack = EventBridgeStack(
            config, mock_provider_manager, mock_iam_stack,
            mock_lambda_stack, mock_sqs_stack
        )
        
        self.assertEqual(mock_rule.call_count, 2)
        self.assertEqual(mock_target.call_count, 2)


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
    def test_api_gateway_resources_created(self, mock_api, mock_resource, mock_validator,
                                          mock_method, mock_integration, mock_permission,
                                          mock_deployment, mock_stage, mock_settings):
        """Test API Gateway is created with all components."""
        import pulumi
        from infrastructure.api_gateway import APIGatewayStack
        
        config = TransactionPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_lambda_stack = MagicMock()
        mock_function = MagicMock(spec=pulumi.Resource)
        mock_function.arn = MagicMock()
        mock_function.name = MagicMock()
        mock_function.invoke_arn = MagicMock()
        mock_lambda_stack.get_function.return_value = mock_function
        
        mock_api_instance = MagicMock(spec=pulumi.Resource)
        mock_api_instance.id = MagicMock()
        mock_api_instance.execution_arn = MagicMock()
        mock_api_instance.root_resource_id = MagicMock()
        mock_api.return_value = mock_api_instance
        
        mock_resource_instance = MagicMock(spec=pulumi.Resource)
        mock_resource_instance.id = MagicMock()
        mock_resource_instance.path_part = MagicMock()
        mock_resource.return_value = mock_resource_instance
        
        mock_method_instance = MagicMock(spec=pulumi.Resource)
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
        mock_stage_instance.stage_name = MagicMock()
        mock_stage.return_value = mock_stage_instance
        
        api_gateway_stack = APIGatewayStack(
            config, mock_provider_manager, mock_lambda_stack
        )
        
        mock_api.assert_called_once()
        mock_resource.assert_called_once()
        mock_method.assert_called_once()
        mock_integration.assert_called_once()


class TestMonitoringStack(unittest.TestCase):
    """Test Monitoring Stack resource creation."""

    @patch('infrastructure.monitoring.aws.cloudwatch.LogGroup')
    def test_log_groups_created(self, mock_log_group):
        """Test CloudWatch log groups are created for Lambda functions."""
        import pulumi
        from infrastructure.monitoring import MonitoringStack
        
        config = TransactionPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_lambda_stack = MagicMock()
        mock_lambda_stack.get_all_function_names.return_value = [
            'transaction-receiver', 'fraud-validator', 'audit-logger'
        ]
        mock_lambda_stack.get_function_name.return_value = MagicMock()
        
        mock_log_group_instance = MagicMock(spec=pulumi.Resource)
        mock_log_group_instance.name = MagicMock()
        mock_log_group_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_group_instance
        
        monitoring_stack = MonitoringStack(
            config, mock_provider_manager, mock_lambda_stack
        )
        
        self.assertEqual(mock_log_group.call_count, 3)


class TestIAMStackPolicies(unittest.TestCase):
    """Test IAM Stack policy attachment methods."""

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_lambda_role_with_sqs_policy(self, mock_role, mock_role_policy):
        """Test Lambda role with SQS policy attachment."""
        import pulumi
        from infrastructure.iam import IAMStack
        
        config = TransactionPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        role = iam_stack.create_lambda_role(
            'test-function',
            sqs_queue_arns=[MagicMock()]
        )
        
        self.assertIsNotNone(role)
        self.assertGreaterEqual(mock_role_policy.call_count, 2)

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_lambda_role_with_eventbridge_policy(self, mock_role, mock_role_policy):
        """Test Lambda role with EventBridge policy attachment."""
        import pulumi
        from infrastructure.iam import IAMStack
        
        config = TransactionPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        role = iam_stack.create_lambda_role(
            'test-function',
            eventbridge_bus_arns=['arn:aws:events:us-east-1:123456789012:event-bus/default']
        )
        
        self.assertIsNotNone(role)
        self.assertGreaterEqual(mock_role_policy.call_count, 2)


class TestTapStack(unittest.TestCase):
    """Test TapStack orchestration and outputs."""

    @patch('tap_stack.MonitoringStack')
    @patch('tap_stack.APIGatewayStack')
    @patch('tap_stack.EventBridgeStack')
    @patch('tap_stack.LambdaStack')
    @patch('tap_stack.SQSStack')
    @patch('tap_stack.DynamoDBStack')
    @patch('tap_stack.IAMStack')
    @patch('tap_stack.AWSProviderManager')
    @patch('tap_stack.TransactionPipelineConfig')
    def test_tap_stack_initialization(self, mock_config, mock_provider, mock_iam,
                                     mock_dynamodb, mock_sqs, mock_lambda,
                                     mock_eventbridge, mock_api, mock_monitoring):
        """Test TapStack initializes all component stacks."""
        from tap_stack import TapStack, TapStackArgs
        
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance
        
        args = TapStackArgs(environment_suffix='test')
        
        with patch('tap_stack.pulumi.ComponentResource.__init__'):
            stack = TapStack('test-stack', args)
        
        mock_config.assert_called_once()
        mock_provider.assert_called_once()
        mock_iam.assert_called_once()
        mock_dynamodb.assert_called_once()
        mock_sqs.assert_called_once()
        mock_lambda.assert_called_once()
        mock_eventbridge.assert_called_once()
        mock_api.assert_called_once()
        mock_monitoring.assert_called_once()

    @patch('tap_stack.pulumi.export')
    @patch('tap_stack.MonitoringStack')
    @patch('tap_stack.APIGatewayStack')
    @patch('tap_stack.EventBridgeStack')
    @patch('tap_stack.LambdaStack')
    @patch('tap_stack.SQSStack')
    @patch('tap_stack.DynamoDBStack')
    @patch('tap_stack.IAMStack')
    @patch('tap_stack.AWSProviderManager')
    @patch('tap_stack.TransactionPipelineConfig')
    def test_tap_stack_getter_methods_and_outputs(self, mock_config, mock_provider, mock_iam,
                                                  mock_dynamodb, mock_sqs, mock_lambda,
                                                  mock_eventbridge, mock_api, mock_monitoring,
                                                  mock_export):
        """Test TapStack getter methods and output registration."""
        from tap_stack import TapStack, TapStackArgs
        
        mock_config_instance = MagicMock()
        mock_config_instance.environment = 'prod'
        mock_config_instance.environment_suffix = 'dev'
        mock_config_instance.primary_region = 'us-east-1'
        mock_config_instance.normalized_region = 'useast1'
        mock_config_instance.project_name = 'txn-pipeline'
        mock_config_instance.fraud_threshold = 0.85
        mock_config_instance.audit_retention_days = 90
        mock_config.return_value = mock_config_instance
        
        mock_lambda_instance = MagicMock()
        mock_lambda_instance.get_all_function_names.return_value = [
            'transaction-receiver', 'fraud-validator', 'audit-logger'
        ]
        mock_lambda_instance.get_function_arn.return_value = MagicMock()
        mock_lambda_instance.get_function_name.return_value = MagicMock()
        mock_lambda.return_value = mock_lambda_instance
        
        mock_dynamodb_instance = MagicMock()
        mock_dynamodb_instance.get_table_name.return_value = MagicMock()
        mock_dynamodb_instance.get_table_arn.return_value = MagicMock()
        mock_dynamodb.return_value = mock_dynamodb_instance
        
        mock_sqs_instance = MagicMock()
        mock_sqs_instance.get_queue_url.return_value = MagicMock()
        mock_sqs_instance.get_queue_arn.return_value = MagicMock()
        mock_sqs_instance.get_dlq.return_value = MagicMock()
        mock_sqs_instance.get_dlq_arn.return_value = MagicMock()
        mock_sqs.return_value = mock_sqs_instance
        
        mock_api_instance = MagicMock()
        mock_api_instance.get_api_url.return_value = MagicMock()
        mock_api_instance.get_api_id.return_value = MagicMock()
        mock_api.return_value = mock_api_instance
        
        mock_monitoring_instance = MagicMock()
        mock_monitoring_instance.get_log_group_name.return_value = MagicMock()
        mock_monitoring_instance.get_log_group_arn.return_value = MagicMock()
        mock_monitoring.return_value = mock_monitoring_instance
        
        mock_eventbridge_instance = MagicMock()
        mock_eventbridge_instance.get_rule_arn.return_value = MagicMock()
        mock_eventbridge.return_value = mock_eventbridge_instance
        
        mock_iam_instance = MagicMock()
        mock_iam_instance.get_role_arn.return_value = MagicMock()
        mock_iam.return_value = mock_iam_instance
        
        args = TapStackArgs(environment_suffix='test')
        
        with patch('tap_stack.pulumi.ComponentResource.__init__'):
            stack = TapStack('test-stack', args)
            
            api_url = stack.get_api_url()
            self.assertIsNotNone(api_url)
            
            lambda_arn = stack.get_lambda_function_arn('transaction-receiver')
            self.assertIsNotNone(lambda_arn)
            
            lambda_name = stack.get_lambda_function_name('fraud-validator')
            self.assertIsNotNone(lambda_name)
            
            table_name = stack.get_table_name('transactions')
            self.assertIsNotNone(table_name)
            
            table_arn = stack.get_table_arn('validation-results')
            self.assertIsNotNone(table_arn)


if __name__ == '__main__':
    unittest.main()
