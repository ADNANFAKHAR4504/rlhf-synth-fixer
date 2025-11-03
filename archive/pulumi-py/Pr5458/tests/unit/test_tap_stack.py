"""
test_tap_stack.py
Unit tests for the serverless infrastructure focusing on resource creation
and configuration verification with full mocking and coverage.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, Mock, patch, call
from decimal import Decimal

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from infrastructure.config import ServerlessConfig


class TestServerlessConfig(unittest.TestCase):
    """Test ServerlessConfig resource configuration."""

    def test_config_default_values(self):
        """Test configuration with default values."""
        with patch.dict('os.environ', {}, clear=True):
            config = ServerlessConfig()
            self.assertIsInstance(config.project_name, str)
            self.assertIsInstance(config.environment, str)
            self.assertIsInstance(config.primary_region, str)
            self.assertEqual(config.lambda_timeout, 300)
            self.assertEqual(config.lambda_memory_size, 3008)

    def test_get_resource_name_includes_suffix_and_region(self):
        """Test resource name generation includes region and suffix."""
        config = ServerlessConfig()
        name = config.get_resource_name('lambda')
        self.assertIn('lambda', name)
        self.assertIn(config.normalized_region, name)
        self.assertIn(config.environment_suffix, name)


class TestAWSProviderManager(unittest.TestCase):
    """Test AWS Provider Manager."""

    @patch('infrastructure.aws_provider.aws.Provider')
    def test_provider_creation_without_role(self, mock_provider):
        """Test provider is created without assume role."""
        from infrastructure.aws_provider import AWSProviderManager
        config = ServerlessConfig()
        config.role_arn = None
        manager = AWSProviderManager(config)
        
        provider = manager.get_provider()
        self.assertIsNotNone(provider)
        mock_provider.assert_called_once()

    @patch('infrastructure.aws_provider.aws.Provider')
    def test_get_resource_options_with_provider(self, mock_provider):
        """Test get_resource_options returns ResourceOptions with provider."""
        from infrastructure.aws_provider import AWSProviderManager
        config = ServerlessConfig()
        
        mock_provider_instance = MagicMock()
        mock_provider.return_value = mock_provider_instance
        
        manager = AWSProviderManager(config)
        opts = manager.get_resource_options()
        
        self.assertIsNotNone(opts)
        self.assertEqual(opts.provider, mock_provider_instance)


class TestKMSStack(unittest.TestCase):
    """Test KMS Stack resource creation."""

    @patch('infrastructure.kms.aws.get_caller_identity')
    @patch('infrastructure.kms.aws.kms.Alias')
    @patch('infrastructure.kms.aws.kms.Key')
    def test_s3_key_creation(self, mock_key, mock_alias, mock_caller_id):
        """Test KMS key for S3 encryption is created."""
        import pulumi
        from infrastructure.kms import KMSStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        mock_key_instance = MagicMock(spec=pulumi.Resource)
        mock_key_instance.arn = MagicMock()
        mock_key_instance.id = MagicMock()
        mock_key.return_value = mock_key_instance
        
        kms_stack = KMSStack(config, mock_provider_manager)
        
        self.assertIsNotNone(kms_stack.s3_key)
        mock_key.assert_called_once()
        mock_alias.assert_called_once()


class TestDynamoDBStack(unittest.TestCase):
    """Test DynamoDB Stack resource creation."""

    @patch('infrastructure.dynamodb.aws.dynamodb.ContributorInsights')
    @patch('infrastructure.dynamodb.aws.dynamodb.Table')
    def test_table_created_with_correct_schema(self, mock_table, mock_insights):
        """Test DynamoDB table created with symbol+timestamp keys."""
        import pulumi
        from infrastructure.dynamodb import DynamoDBStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_table_instance = MagicMock(spec=pulumi.Resource)
        mock_table_instance.name = MagicMock()
        mock_table_instance.arn = MagicMock()
        mock_table.return_value = mock_table_instance
        
        dynamodb_stack = DynamoDBStack(config, mock_provider_manager)
        
        self.assertIsNotNone(dynamodb_stack.data_table)
        mock_table.assert_called_once()
        
        call_kwargs = mock_table.call_args[1]
        self.assertEqual(call_kwargs['hash_key'], 'symbol')
        self.assertEqual(call_kwargs['range_key'], 'timestamp')
        self.assertEqual(call_kwargs['billing_mode'], 'PAY_PER_REQUEST')


class TestStorageStack(unittest.TestCase):
    """Test Storage Stack resource creation."""

    @patch('infrastructure.storage.aws.s3.BucketLifecycleConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketPublicAccessBlock')
    @patch('infrastructure.storage.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketVersioning')
    @patch('infrastructure.storage.aws.s3.Bucket')
    def test_bucket_created_with_encryption(self, mock_bucket, mock_versioning,
                                           mock_encryption, mock_public_access,
                                           mock_lifecycle):
        """Test S3 bucket created with KMS encryption and lifecycle."""
        import pulumi
        from infrastructure.storage import StorageStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_bucket_instance = MagicMock(spec=pulumi.Resource)
        mock_bucket_instance.id = MagicMock()
        mock_bucket_instance.bucket = MagicMock()
        mock_bucket_instance.arn = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        kms_key_id = MagicMock()
        storage_stack = StorageStack(config, mock_provider_manager, kms_key_id)
        
        self.assertIsNotNone(storage_stack.data_bucket)
        mock_bucket.assert_called_once()
        mock_versioning.assert_called_once()
        mock_encryption.assert_called_once()


class TestSQSStack(unittest.TestCase):
    """Test SQS Stack resource creation."""

    @patch('infrastructure.sqs.aws.sqs.Queue')
    def test_dlq_creation(self, mock_queue):
        """Test DLQ is created with correct retention."""
        import pulumi
        from infrastructure.sqs import SQSStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_queue_instance = MagicMock(spec=pulumi.Resource)
        mock_queue_instance.arn = MagicMock()
        mock_queue_instance.url = MagicMock()
        mock_queue.return_value = mock_queue_instance
        
        sqs_stack = SQSStack(config, mock_provider_manager)
        dlq = sqs_stack.create_dlq('test-lambda')
        
        self.assertIsNotNone(dlq)
        mock_queue.assert_called_once()
        
        call_kwargs = mock_queue.call_args[1]
        self.assertEqual(call_kwargs['message_retention_seconds'], 1209600)


class TestLambdaStack(unittest.TestCase):
    """Test Lambda Stack resource creation."""

    @patch('infrastructure.lambda_functions.aws.lambda_.FunctionEventInvokeConfig')
    @patch('infrastructure.lambda_functions.aws.cloudwatch.LogGroup')
    @patch('infrastructure.lambda_functions.aws.lambda_.Function')
    def test_processing_lambda_created(self, mock_function, mock_log_group,
                                      mock_invoke_config):
        """Test processing Lambda created with correct config."""
        import pulumi
        from infrastructure.lambda_functions import LambdaStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_iam_stack = MagicMock()
        mock_sqs_stack = MagicMock()
        mock_sqs_stack.get_queue_arn.return_value = MagicMock()
        
        mock_function_instance = MagicMock(spec=pulumi.Resource)
        mock_function_instance.name = MagicMock()
        mock_function_instance.arn = MagicMock()
        mock_function.return_value = mock_function_instance
        
        mock_log_instance = MagicMock(spec=pulumi.Resource)
        mock_log_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_instance
        
        mock_role = MagicMock()
        mock_role.arn = MagicMock()
        
        lambda_stack = LambdaStack(
            config, mock_provider_manager, mock_iam_stack,
            mock_sqs_stack, MagicMock(), MagicMock()
        )
        
        function = lambda_stack.create_processing_lambda(mock_role)
        
        self.assertIsNotNone(function)
        mock_function.assert_called_once()
        mock_log_group.assert_called_once()
        
        call_kwargs = mock_function.call_args[1]
        self.assertEqual(call_kwargs['timeout'], 300)
        self.assertEqual(call_kwargs['memory_size'], 3008)

    @patch('infrastructure.lambda_functions.aws.lambda_.FunctionEventInvokeConfig')
    @patch('infrastructure.lambda_functions.aws.cloudwatch.LogGroup')
    @patch('infrastructure.lambda_functions.aws.lambda_.Function')
    def test_api_lambda_created_with_all_handlers(self, mock_function, mock_log_group,
                                                  mock_invoke_config):
        """Test all API Lambda functions are created."""
        import pulumi
        from infrastructure.lambda_functions import LambdaStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_iam_stack = MagicMock()
        mock_sqs_stack = MagicMock()
        mock_sqs_stack.get_queue_arn.return_value = MagicMock()
        
        mock_function_instance = MagicMock(spec=pulumi.Resource)
        mock_function_instance.name = MagicMock()
        mock_function_instance.arn = MagicMock()
        mock_function_instance.invoke_arn = MagicMock()
        mock_function.return_value = mock_function_instance
        
        mock_log_instance = MagicMock(spec=pulumi.Resource)
        mock_log_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_instance
        
        mock_role = MagicMock()
        mock_role.arn = MagicMock()
        
        lambda_stack = LambdaStack(
            config, mock_provider_manager, mock_iam_stack,
            mock_sqs_stack, MagicMock(), MagicMock()
        )
        
        lambda_stack.create_api_lambda('upload', 'api_handler.upload_handler', mock_role)
        lambda_stack.create_api_lambda('status', 'api_handler.status_handler', mock_role)
        lambda_stack.create_api_lambda('results', 'api_handler.results_handler', mock_role)
        
        self.assertEqual(mock_function.call_count, 3)
        self.assertEqual(mock_log_group.call_count, 3)


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
    def test_api_created_with_throttling(self, mock_api, mock_resource,
                                        mock_method, mock_integration,
                                        mock_permission, mock_deployment,
                                        mock_stage, mock_settings):
        """Test API Gateway created with correct throttling."""
        import pulumi
        from infrastructure.api_gateway import APIGatewayStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_api_instance = MagicMock(spec=pulumi.Resource)
        mock_api_instance.id = MagicMock()
        mock_api_instance.root_resource_id = MagicMock()
        mock_api_instance.execution_arn = MagicMock()
        mock_api.return_value = mock_api_instance
        
        mock_resource_instance = MagicMock(spec=pulumi.Resource)
        mock_resource_instance.id = MagicMock()
        mock_resource.return_value = mock_resource_instance
        
        mock_method_instance = MagicMock(spec=pulumi.Resource)
        mock_method_instance.http_method = MagicMock()
        mock_method.return_value = mock_method_instance
        
        mock_integration_instance = MagicMock(spec=pulumi.Resource)
        mock_integration.return_value = mock_integration_instance
        
        mock_deployment_instance = MagicMock(spec=pulumi.Resource)
        mock_deployment_instance.id = MagicMock()
        mock_deployment.return_value = mock_deployment_instance
        
        mock_stage_instance = MagicMock(spec=pulumi.Resource)
        mock_stage_instance.stage_name = MagicMock()
        mock_stage.return_value = mock_stage_instance
        
        mock_lambda = MagicMock()
        mock_lambda.name = MagicMock()
        mock_lambda.invoke_arn = MagicMock()
        
        api_gateway_stack = APIGatewayStack(config, mock_provider_manager)
        api = api_gateway_stack.create_api(mock_lambda, mock_lambda, mock_lambda)
        
        self.assertIsNotNone(api)
        mock_api.assert_called_once()
        self.assertEqual(mock_resource.call_count, 5)
        self.assertEqual(mock_method.call_count, 3)
        
        settings_kwargs = mock_settings.call_args[1]['settings']
        self.assertEqual(settings_kwargs.throttling_rate_limit, 1000)


class TestStepFunctionsStack(unittest.TestCase):
    """Test Step Functions Stack resource creation."""

    @patch('infrastructure.step_functions.aws.sfn.StateMachine')
    def test_state_machine_created_with_service_integration(self, mock_state_machine):
        """Test state machine uses proper service integration patterns."""
        import pulumi
        from infrastructure.step_functions import StepFunctionsStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_role = MagicMock()
        mock_role.arn = MagicMock()
        
        mock_sm_instance = MagicMock(spec=pulumi.Resource)
        mock_sm_instance.arn = MagicMock()
        mock_sm_instance.name = MagicMock()
        mock_state_machine.return_value = mock_sm_instance
        
        sf_stack = StepFunctionsStack(config, mock_provider_manager, mock_role)
        
        lambda_arn = MagicMock()
        dlq_url = MagicMock()
        
        state_machine = sf_stack.create_processing_workflow(lambda_arn, dlq_url)
        
        self.assertIsNotNone(state_machine)
        mock_state_machine.assert_called_once()


class TestMonitoringStack(unittest.TestCase):
    """Test Monitoring Stack resource creation."""

    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    def test_lambda_error_alarm_uses_percentage(self, mock_alarm):
        """Test Lambda error alarm uses percentage-based threshold."""
        import pulumi
        from infrastructure.monitoring import MonitoringStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_alarm_instance = MagicMock(spec=pulumi.Resource)
        mock_alarm.return_value = mock_alarm_instance
        
        monitoring_stack = MonitoringStack(config, mock_provider_manager)
        
        function_name = MagicMock()
        alarm = monitoring_stack.create_lambda_error_alarm(function_name, 'test')
        
        self.assertIsNotNone(alarm)
        mock_alarm.assert_called_once()
        
        call_kwargs = mock_alarm.call_args[1]
        self.assertIn('metric_queries', call_kwargs)
        self.assertEqual(len(call_kwargs['metric_queries']), 3)

    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    def test_all_monitoring_alarms_created(self, mock_alarm):
        """Test all monitoring alarms can be created."""
        import pulumi
        from infrastructure.monitoring import MonitoringStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_alarm_instance = MagicMock(spec=pulumi.Resource)
        mock_alarm.return_value = mock_alarm_instance
        
        monitoring_stack = MonitoringStack(config, mock_provider_manager)
        
        monitoring_stack.create_lambda_throttle_alarm(MagicMock(), 'test')
        monitoring_stack.create_dynamodb_throttle_alarm(MagicMock())
        monitoring_stack.create_api_gateway_error_alarm(MagicMock(), MagicMock())
        monitoring_stack.create_step_functions_error_alarm(MagicMock())
        
        self.assertGreaterEqual(mock_alarm.call_count, 4)


class TestIAMStack(unittest.TestCase):
    """Test IAM Stack resource creation."""

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_lambda_role_with_xray_enabled(self, mock_role, mock_attachment, mock_policy):
        """Test Lambda IAM role with X-Ray tracing enabled."""
        import pulumi
        from infrastructure.iam import IAMStack
        
        config = ServerlessConfig()
        config.enable_xray_tracing = True
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.name = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        role = iam_stack.create_lambda_role(
            'test',
            s3_bucket_arns=[MagicMock()],
            dynamodb_table_arns=[MagicMock()],
            sqs_queue_arns=[MagicMock()],
            kms_key_arn=MagicMock()
        )
        
        self.assertIsNotNone(role)
        mock_role.assert_called_once()
        self.assertGreaterEqual(mock_attachment.call_count, 2)

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_step_functions_role_creation(self, mock_role, mock_attachment, mock_policy):
        """Test Step Functions IAM role is created."""
        import pulumi
        from infrastructure.iam import IAMStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.name = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        role = iam_stack.create_step_functions_role(
            lambda_arns=[MagicMock()],
            sqs_queue_arns=[MagicMock()]
        )
        
        self.assertIsNotNone(role)
        mock_role.assert_called_once()

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_attach_lambda_policies_called(self, mock_role, mock_role_policy):
        """Test IAM helper method _attach_lambda_policies is called."""
        import pulumi
        from infrastructure.iam import IAMStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.name = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        iam_stack._attach_lambda_policies(
            mock_role_instance,
            'test-role',
            ['arn:aws:s3:::bucket'],
            ['arn:aws:dynamodb:us-east-1:123456789012:table/test'],
            ['arn:aws:sqs:us-east-1:123456789012:queue'],
            'arn:aws:kms:us-east-1:123456789012:key/test',
            None
        )
        
        self.assertGreaterEqual(mock_role_policy.call_count, 4)

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_attach_step_functions_policies_called(self, mock_role, mock_role_policy):
        """Test IAM helper method _attach_step_functions_policies is called."""
        import pulumi
        from infrastructure.iam import IAMStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.name = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        iam_stack._attach_step_functions_policies(
            mock_role_instance,
            'test-role',
            ['arn:aws:lambda:us-east-1:123456789012:function:test'],
            ['arn:aws:sqs:us-east-1:123456789012:queue'],
            None
        )
        
        self.assertGreaterEqual(mock_role_policy.call_count, 3)

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_api_gateway_role_creation(self, mock_role, mock_attachment, mock_policy):
        """Test API Gateway IAM role is created."""
        import pulumi
        from infrastructure.iam import IAMStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.name = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        role = iam_stack.create_api_gateway_role(MagicMock())
        
        self.assertIsNotNone(role)
        mock_role.assert_called_once()
        mock_attachment.assert_called_once()


class TestTapStack(unittest.TestCase):
    """Test TapStack initialization and outputs."""

    @patch('tap_stack.pulumi.export')
    @patch('tap_stack.MonitoringStack')
    @patch('tap_stack.StepFunctionsStack')
    @patch('tap_stack.APIGatewayStack')
    @patch('tap_stack.LambdaStack')
    @patch('tap_stack.SQSStack')
    @patch('tap_stack.StorageStack')
    @patch('tap_stack.DynamoDBStack')
    @patch('tap_stack.KMSStack')
    @patch('tap_stack.IAMStack')
    @patch('tap_stack.AWSProviderManager')
    def test_tap_stack_exports_all_outputs(self, mock_provider, mock_iam, mock_kms,
                                          mock_dynamodb, mock_storage, mock_sqs,
                                          mock_lambda, mock_api, mock_sf, 
                                          mock_monitoring, mock_export):
        """Test TapStack exports all required outputs."""
        from tap_stack import TapStack
        
        for mock_obj in [mock_provider, mock_iam, mock_kms, mock_dynamodb,
                        mock_storage, mock_sqs, mock_lambda, mock_api,
                        mock_sf, mock_monitoring]:
            mock_instance = MagicMock()
            mock_obj.return_value = mock_instance
        
        mock_kms_instance = mock_kms.return_value
        mock_kms_instance.get_s3_key_id.return_value = MagicMock()
        mock_kms_instance.get_s3_key_arn.return_value = MagicMock()
        
        mock_dynamodb_instance = mock_dynamodb.return_value
        mock_dynamodb_instance.get_table_name.return_value = MagicMock()
        mock_dynamodb_instance.get_table_arn.return_value = MagicMock()
        
        mock_storage_instance = mock_storage.return_value
        mock_storage_instance.get_bucket_name.return_value = MagicMock()
        mock_storage_instance.get_bucket_arn.return_value = MagicMock()
        
        mock_sqs_instance = mock_sqs.return_value
        mock_sqs_instance.create_dlq.return_value = MagicMock(arn=MagicMock(), url=MagicMock())
        
        mock_iam_instance = mock_iam.return_value
        mock_iam_instance.create_lambda_role.return_value = MagicMock(arn=MagicMock())
        mock_iam_instance.create_step_functions_role.return_value = MagicMock(arn=MagicMock())
        
        mock_lambda_instance = mock_lambda.return_value
        mock_lambda_instance.create_processing_lambda.return_value = MagicMock(
            name=MagicMock(), arn=MagicMock()
        )
        mock_lambda_instance.create_api_lambda.return_value = MagicMock(
            name=MagicMock(), arn=MagicMock()
        )
        
        mock_api_instance = mock_api.return_value
        mock_api_instance.create_api.return_value = MagicMock(id=MagicMock())
        mock_api_instance.get_stage_name.return_value = MagicMock()
        mock_api_instance.get_api_endpoint.return_value = MagicMock()
        mock_api_instance.get_api_id.return_value = MagicMock()
        
        mock_sf_instance = mock_sf.return_value
        mock_sf_instance.create_processing_workflow.return_value = MagicMock(
            arn=MagicMock(), name=MagicMock()
        )
        
        with patch('tap_stack.pulumi_aws'):
            stack = TapStack('test-stack')
            
            self.assertIsNotNone(stack.config)
            self.assertIsNotNone(stack.provider_manager)
            
            self.assertGreaterEqual(mock_export.call_count, 20)


if __name__ == '__main__':
    unittest.main()
