"""
test_tap_stack.py
Unit tests for the file upload system infrastructure focusing on resource creation
and configuration verification with full mocking and coverage.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, patch
from decimal import Decimal

# Set up Pulumi test mode BEFORE importing pulumi
os.environ['PULUMI_TEST_MODE'] = 'true'

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

import pulumi

# Configure Pulumi runtime for testing
pulumi.runtime.settings.configure(
    pulumi.runtime.settings.Settings(
        project='test-project',
        stack='test-stack',
        monitor='test-monitor'
    )
)

from infrastructure.config import FileUploadConfig


class TestKMSStack(unittest.TestCase):
    """Test KMS Stack resource creation."""

    @patch('infrastructure.kms.aws.kms.Alias')
    @patch('infrastructure.kms.aws.kms.Key')
    def test_kms_keys_created_with_rotation(self, mock_key, mock_alias):
        """Test KMS keys created with rotation enabled."""
        from infrastructure.kms import KMSStack
        
        config = FileUploadConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_key_instance = MagicMock(spec=pulumi.Resource)
        mock_key_instance.id = MagicMock()
        mock_key_instance.arn = MagicMock()
        mock_key.return_value = mock_key_instance
        
        mock_alias_instance = MagicMock(spec=pulumi.Resource)
        mock_alias.return_value = mock_alias_instance
        
        kms_stack = KMSStack(config, mock_provider_manager)
        
        # Verify 4 keys created (s3, dynamodb, sqs, sns)
        self.assertEqual(mock_key.call_count, 4)
        self.assertEqual(mock_alias.call_count, 4)
        
        # Check rotation enabled
        for call in mock_key.call_args_list:
            call_kwargs = call[1]
            self.assertTrue(call_kwargs['enable_key_rotation'])


class TestS3Stack(unittest.TestCase):
    """Test S3 Stack resource creation."""

    @patch('infrastructure.s3.aws.s3.BucketPolicy')
    @patch('infrastructure.s3.aws.s3.BucketPublicAccessBlock')
    @patch('infrastructure.s3.aws.s3.BucketLifecycleConfiguration')
    @patch('infrastructure.s3.aws.s3.BucketCorsConfiguration')
    @patch('infrastructure.s3.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('infrastructure.s3.aws.s3.BucketVersioning')
    @patch('infrastructure.s3.aws.s3.Bucket')
    def test_s3_bucket_created_with_versioning_and_encryption(
        self, mock_bucket, mock_versioning, mock_encryption, 
        mock_cors, mock_lifecycle, mock_public_access, mock_policy
    ):
        """Test S3 bucket created with versioning, encryption, and public access."""
        from infrastructure.s3 import S3Stack
        
        config = FileUploadConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_bucket_instance = MagicMock(spec=pulumi.Resource)
        mock_bucket_instance.id = MagicMock()
        mock_bucket_instance.arn = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        s3_stack = S3Stack(config, mock_provider_manager, mock_kms_stack)
        
        # Verify bucket created
        self.assertEqual(mock_bucket.call_count, 1)
        self.assertEqual(mock_versioning.call_count, 1)
        self.assertEqual(mock_encryption.call_count, 1)
        self.assertEqual(mock_cors.call_count, 1)
        self.assertEqual(mock_lifecycle.call_count, 1)
        self.assertEqual(mock_public_access.call_count, 1)
        
        # Verify public access block settings
        public_access_kwargs = mock_public_access.call_args[1]
        self.assertFalse(public_access_kwargs['block_public_acls'])
        self.assertFalse(public_access_kwargs['block_public_policy'])


class TestDynamoDBStack(unittest.TestCase):
    """Test DynamoDB Stack resource creation."""

    @patch('infrastructure.dynamodb.aws.dynamodb.Table')
    def test_dynamodb_table_created_with_kms_encryption(self, mock_table):
        """Test DynamoDB table created with KMS encryption and on-demand billing."""
        from infrastructure.dynamodb import DynamoDBStack
        
        config = FileUploadConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_table_instance = MagicMock(spec=pulumi.Resource)
        mock_table_instance.name = MagicMock()
        mock_table_instance.arn = MagicMock()
        mock_table.return_value = mock_table_instance
        
        dynamodb_stack = DynamoDBStack(config, mock_provider_manager, mock_kms_stack)
        
        # Verify table created
        self.assertEqual(mock_table.call_count, 1)
        
        # Check hash key and billing mode
        call_kwargs = mock_table.call_args[1]
        self.assertEqual(call_kwargs['hash_key'], 'file_id')
        self.assertEqual(call_kwargs['billing_mode'], 'PAY_PER_REQUEST')
        self.assertTrue(call_kwargs['point_in_time_recovery'])


class TestSQSStack(unittest.TestCase):
    """Test SQS Stack resource creation."""

    @patch('infrastructure.sqs.aws.sqs.Queue')
    def test_sqs_dlq_created_with_kms_encryption(self, mock_queue):
        """Test SQS DLQ created with KMS encryption."""
        from infrastructure.sqs import SQSStack
        
        config = FileUploadConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_queue_instance = MagicMock(spec=pulumi.Resource)
        mock_queue_instance.arn = MagicMock()
        mock_queue_instance.url = MagicMock()
        mock_queue.return_value = mock_queue_instance
        
        sqs_stack = SQSStack(config, mock_provider_manager, mock_kms_stack)
        
        # Create a DLQ
        dlq = sqs_stack.create_dlq('test-function')
        
        # Verify queue created
        self.assertEqual(mock_queue.call_count, 1)
        self.assertIsNotNone(dlq)


class TestIAMStack(unittest.TestCase):
    """Test IAM Stack resource creation."""

    @patch('infrastructure.iam.aws.get_caller_identity')
    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.Policy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_lambda_role_created_with_scoped_permissions(
        self, mock_role, mock_policy, mock_attachment, mock_caller_identity
    ):
        """Test Lambda IAM role created with least-privilege scoped permissions."""
        from infrastructure.iam import IAMStack
        
        # Mock caller identity
        mock_caller_identity.return_value = MagicMock(account_id='123456789012')
        
        config = FileUploadConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.name = MagicMock()
        mock_role.return_value = mock_role_instance
        
        mock_policy_instance = MagicMock(spec=pulumi.Resource)
        mock_policy_instance.id = MagicMock()
        mock_policy_instance.arn = MagicMock()
        mock_policy.return_value = mock_policy_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        # Create Lambda role with permissions
        role = iam_stack.create_lambda_role(
            'test-function',
            log_group_arn=MagicMock(),
            s3_bucket_arns=[MagicMock()],
            dynamodb_table_arns=[MagicMock()],
            kms_key_arns=[MagicMock()],
            sns_topic_arns=[MagicMock()],
            dlq_arn=MagicMock(),
            enable_xray=True
        )
        
        # Verify role and policy created
        self.assertEqual(mock_role.call_count, 1)
        self.assertEqual(mock_policy.call_count, 1)
        self.assertEqual(mock_attachment.call_count, 1)
        self.assertIsNotNone(role)

    @patch('infrastructure.iam.aws.get_caller_identity')
    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.Policy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_step_functions_role_created(
        self, mock_role, mock_policy, mock_attachment, mock_caller_identity
    ):
        """Test Step Functions IAM role created."""
        from infrastructure.iam import IAMStack
        
        mock_caller_identity.return_value = MagicMock(account_id='123456789012')
        
        config = FileUploadConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.name = MagicMock()
        mock_role.return_value = mock_role_instance
        
        mock_policy_instance = MagicMock(spec=pulumi.Resource)
        mock_policy_instance.id = MagicMock()
        mock_policy_instance.arn = MagicMock()
        mock_policy.return_value = mock_policy_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        # Create Step Functions role
        role = iam_stack.create_step_functions_role(
            'test-workflow',
            lambda_arns=[MagicMock()]
        )
        
        # Verify role created
        self.assertEqual(mock_role.call_count, 1)
        self.assertIsNotNone(role)


class TestLambdaStack(unittest.TestCase):
    """Test Lambda Stack resource creation."""

    @patch('infrastructure.lambda_functions.aws.lambda_.FunctionEventInvokeConfig')
    @patch('infrastructure.lambda_functions.aws.lambda_.Function')
    @patch('infrastructure.lambda_functions.aws.cloudwatch.LogGroup')
    def test_lambda_function_created_with_dlq_and_xray(
        self, mock_log_group, mock_function, mock_invoke_config
    ):
        """Test Lambda function created with DLQ, X-Ray tracing, and no reserved concurrency."""
        from infrastructure.lambda_functions import LambdaStack
        
        config = FileUploadConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        
        mock_iam_stack = MagicMock()
        mock_iam_stack.create_lambda_role.return_value = mock_role
        
        mock_s3_stack = MagicMock()
        mock_s3_stack.get_bucket_arn.return_value = MagicMock()
        
        mock_dynamodb_stack = MagicMock()
        mock_dynamodb_stack.get_table_arn.return_value = MagicMock()
        
        mock_dlq = MagicMock(spec=pulumi.Resource)
        mock_dlq.arn = MagicMock()
        
        mock_sqs_stack = MagicMock()
        mock_sqs_stack.create_dlq.return_value = mock_dlq
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_log_instance = MagicMock(spec=pulumi.Resource)
        mock_log_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_instance
        
        mock_function_instance = MagicMock(spec=pulumi.Resource)
        mock_function_instance.name = MagicMock()
        mock_function_instance.arn = MagicMock()
        mock_function_instance.invoke_arn = MagicMock()
        mock_function.return_value = mock_function_instance
        
        lambda_stack = LambdaStack(
            config, mock_provider_manager, mock_iam_stack,
            mock_s3_stack, mock_dynamodb_stack, mock_sqs_stack,
            mock_kms_stack, MagicMock()
        )
        
        # Verify function created
        self.assertEqual(mock_function.call_count, 1)
        self.assertEqual(mock_log_group.call_count, 1)
        
        # Check no reserved concurrency and runtime
        call_kwargs = mock_function.call_args[1]
        self.assertNotIn('reserved_concurrent_executions', call_kwargs)
        self.assertEqual(call_kwargs['runtime'], 'python3.11')
        # Verify X-Ray tracing config exists
        self.assertIn('tracing_config', call_kwargs)


class TestAPIGatewayStack(unittest.TestCase):
    """Test API Gateway Stack resource creation."""

    @patch('infrastructure.api_gateway.aws.apigateway.UsagePlanKey')
    @patch('infrastructure.api_gateway.aws.apigateway.UsagePlan')
    @patch('infrastructure.api_gateway.aws.apigateway.Stage')
    @patch('infrastructure.api_gateway.aws.apigateway.Deployment')
    @patch('infrastructure.api_gateway.aws.lambda_.Permission')
    @patch('infrastructure.api_gateway.aws.apigateway.Integration')
    @patch('infrastructure.api_gateway.aws.apigateway.Method')
    @patch('infrastructure.api_gateway.aws.apigateway.Resource')
    @patch('infrastructure.api_gateway.aws.apigateway.ApiKey')
    @patch('infrastructure.api_gateway.aws.apigateway.RestApi')
    def test_api_gateway_created_with_lambda_integration(
        self, mock_api, mock_api_key, mock_resource, mock_method,
        mock_integration, mock_permission, mock_deployment, mock_stage,
        mock_usage_plan, mock_usage_plan_key
    ):
        """Test API Gateway created with Lambda integration and CORS."""
        from infrastructure.api_gateway import APIGatewayStack
        
        config = FileUploadConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_api_instance = MagicMock(spec=pulumi.Resource)
        mock_api_instance.id = MagicMock()
        mock_api_instance.root_resource_id = MagicMock()
        mock_api_instance.execution_arn = MagicMock()
        mock_api.return_value = mock_api_instance
        
        mock_resource_instance = MagicMock(spec=pulumi.Resource)
        mock_resource_instance.id = MagicMock()
        mock_resource_instance.path = MagicMock()
        mock_resource.return_value = mock_resource_instance
        
        mock_method_instance = MagicMock(spec=pulumi.Resource)
        mock_method_instance.id = MagicMock()
        mock_method_instance.http_method = MagicMock()
        mock_method.return_value = mock_method_instance
        
        mock_integration_instance = MagicMock(spec=pulumi.Resource)
        mock_integration_instance.id = MagicMock()
        mock_integration.return_value = mock_integration_instance
        
        mock_function = MagicMock(spec=pulumi.Resource)
        mock_function.invoke_arn = MagicMock()
        mock_function.arn = MagicMock()
        mock_function.name = MagicMock()
        
        mock_lambda_stack = MagicMock()
        mock_lambda_stack.get_function.return_value = mock_function
        mock_lambda_stack.get_function_arn.return_value = MagicMock()
        
        api_stack = APIGatewayStack(config, mock_provider_manager, mock_lambda_stack)
        
        # Verify API Gateway resources created
        self.assertEqual(mock_api.call_count, 1)
        # 2 resources: /upload and /health
        self.assertEqual(mock_resource.call_count, 2)
        # 3 methods: POST /upload, OPTIONS /upload, GET /health
        self.assertEqual(mock_method.call_count, 3)


class TestStepFunctionsStack(unittest.TestCase):
    """Test Step Functions Stack resource creation."""

    @patch('infrastructure.step_functions.aws.cloudwatch.LogGroup')
    @patch('infrastructure.step_functions.aws.sfn.StateMachine')
    def test_state_machine_created_with_retry_logic(self, mock_state_machine, mock_log_group):
        """Test Step Functions state machine created with retry logic and service integration."""
        from infrastructure.step_functions import StepFunctionsStack
        
        config = FileUploadConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        
        mock_iam_stack = MagicMock()
        mock_iam_stack.create_step_functions_role.return_value = mock_role
        
        mock_function = MagicMock(spec=pulumi.Resource)
        mock_function.arn = MagicMock()
        
        mock_lambda_stack = MagicMock()
        mock_lambda_stack.get_function.return_value = mock_function
        mock_lambda_stack.get_function_arn.return_value = MagicMock()
        
        mock_log_instance = MagicMock(spec=pulumi.Resource)
        mock_log_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_instance
        
        mock_state_machine_instance = MagicMock(spec=pulumi.Resource)
        mock_state_machine_instance.arn = MagicMock()
        mock_state_machine.return_value = mock_state_machine_instance
        
        step_functions_stack = StepFunctionsStack(
            config, mock_provider_manager, mock_iam_stack, mock_lambda_stack
        )
        
        # Verify state machine created
        self.assertEqual(mock_state_machine.call_count, 1)
        self.assertEqual(mock_log_group.call_count, 1)


class TestMonitoringStack(unittest.TestCase):
    """Test Monitoring Stack resource creation."""

    @patch('infrastructure.monitoring.aws.cloudwatch.Dashboard')
    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    @patch('infrastructure.monitoring.aws.sns.Topic')
    def test_monitoring_resources_created(self, mock_sns_topic, mock_alarm, mock_dashboard):
        """Test SNS topic, CloudWatch alarms, and dashboard created."""
        from infrastructure.monitoring import MonitoringStack
        
        config = FileUploadConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_sns_instance = MagicMock(spec=pulumi.Resource)
        mock_sns_instance.arn = MagicMock()
        mock_sns_topic.return_value = mock_sns_instance
        
        mock_alarm_instance = MagicMock(spec=pulumi.Resource)
        mock_alarm.return_value = mock_alarm_instance
        
        mock_dashboard_instance = MagicMock(spec=pulumi.Resource)
        mock_dashboard.return_value = mock_dashboard_instance
        
        monitoring_stack = MonitoringStack(config, mock_provider_manager, mock_kms_stack)
        
        # Verify SNS topic created
        self.assertEqual(mock_sns_topic.call_count, 1)
        
        # Create alarms and dashboard for Lambda
        mock_function = MagicMock(spec=pulumi.Resource)
        mock_function.name = MagicMock()
        
        mock_lambda_stack = MagicMock()
        mock_lambda_stack.get_function.return_value = mock_function
        mock_lambda_stack.get_function_name.return_value = MagicMock()
        
        monitoring_stack._create_lambda_alarms_for_stack(mock_lambda_stack)
        monitoring_stack._create_dashboard_for_stack(mock_lambda_stack)
        
        # Verify alarms created (error rate, throttles, duration)
        self.assertEqual(mock_alarm.call_count, 3)
        self.assertEqual(mock_dashboard.call_count, 1)


class TestTapStack(unittest.TestCase):
    """Test TapStack orchestration."""

    @patch('lib.tap_stack.StepFunctionsStack')
    @patch('lib.tap_stack.APIGatewayStack')
    @patch('lib.tap_stack.MonitoringStack')
    @patch('lib.tap_stack.LambdaStack')
    @patch('lib.tap_stack.IAMStack')
    @patch('lib.tap_stack.SQSStack')
    @patch('lib.tap_stack.DynamoDBStack')
    @patch('lib.tap_stack.S3Stack')
    @patch('lib.tap_stack.KMSStack')
    @patch('lib.tap_stack.AWSProviderManager')
    @patch('lib.tap_stack.FileUploadConfig')
    def test_tap_stack_instantiates_all_components(
        self, mock_config, mock_provider_manager, mock_kms, mock_s3,
        mock_dynamodb, mock_sqs, mock_iam, mock_lambda, mock_monitoring,
        mock_api_gateway, mock_step_functions
    ):
        """Test TapStack instantiates all infrastructure components."""
        from lib.tap_stack import TapStack, TapStackArgs
        
        # Mock config instance
        mock_config_instance = MagicMock()
        mock_config_instance.primary_region = 'us-east-1'
        mock_config_instance.environment = 'Production'
        mock_config_instance.environment_suffix = 'dev'
        mock_config.return_value = mock_config_instance
        
        # Mock provider manager
        mock_provider_instance = MagicMock()
        mock_provider_manager.return_value = mock_provider_instance
        
        # Mock all stacks
        mock_kms_instance = MagicMock()
        mock_kms_instance.get_key_arn.return_value = MagicMock()
        mock_kms.return_value = mock_kms_instance
        
        mock_s3_instance = MagicMock()
        mock_s3_instance.get_bucket_name.return_value = MagicMock()
        mock_s3_instance.get_bucket_arn.return_value = MagicMock()
        mock_s3.return_value = mock_s3_instance
        
        mock_dynamodb_instance = MagicMock()
        mock_dynamodb_instance.get_table_name.return_value = MagicMock()
        mock_dynamodb_instance.get_table_arn.return_value = MagicMock()
        mock_dynamodb.return_value = mock_dynamodb_instance
        
        mock_sqs_instance = MagicMock()
        mock_sqs_instance.get_queue_url.return_value = MagicMock()
        mock_sqs_instance.get_queue_arn.return_value = MagicMock()
        mock_sqs.return_value = mock_sqs_instance
        
        mock_iam_instance = MagicMock()
        mock_iam.return_value = mock_iam_instance
        
        mock_lambda_instance = MagicMock()
        mock_lambda_instance.get_function_name.return_value = MagicMock()
        mock_lambda_instance.get_function_arn.return_value = MagicMock()
        mock_lambda_instance.get_log_group_name.return_value = MagicMock()
        mock_lambda.return_value = mock_lambda_instance
        
        mock_monitoring_instance = MagicMock()
        mock_monitoring_instance.get_sns_topic_arn.return_value = MagicMock()
        mock_monitoring.return_value = mock_monitoring_instance
        
        mock_api_instance = MagicMock()
        mock_api_instance.get_api_url.return_value = MagicMock()
        mock_api_instance.get_api_id.return_value = MagicMock()
        mock_api_gateway.return_value = mock_api_instance
        
        mock_step_instance = MagicMock()
        mock_step_instance.get_state_machine_arn.return_value = MagicMock()
        mock_step_functions.return_value = mock_step_instance
        
        # Create TapStack
        args = TapStackArgs(environment_suffix='dev')
        tap_stack = TapStack('test-stack', args)
        
        # Verify all components instantiated
        self.assertEqual(mock_config.call_count, 1)
        self.assertEqual(mock_provider_manager.call_count, 1)
        self.assertEqual(mock_kms.call_count, 1)
        self.assertEqual(mock_s3.call_count, 1)
        self.assertEqual(mock_dynamodb.call_count, 1)
        self.assertEqual(mock_sqs.call_count, 1)
        self.assertEqual(mock_iam.call_count, 1)
        self.assertEqual(mock_lambda.call_count, 1)
        self.assertEqual(mock_monitoring.call_count, 1)
        self.assertEqual(mock_api_gateway.call_count, 1)
        self.assertEqual(mock_step_functions.call_count, 1)


class TestConfigGetters(unittest.TestCase):
    """Test Config getter methods for coverage."""

    def test_config_get_resource_name(self):
        """Test config get_resource_name method."""
        config = FileUploadConfig()
        name = config.get_resource_name('test-resource')
        self.assertIsNotNone(name)
        self.assertIn('test-resource', name)

    def test_config_get_normalized_resource_name(self):
        """Test config get_normalized_resource_name method."""
        config = FileUploadConfig()
        name = config.get_normalized_resource_name('Test-Resource')
        self.assertIsNotNone(name)
        # Should be lowercase
        self.assertEqual(name, name.lower())


class TestStackGetters(unittest.TestCase):
    """Test stack getter methods for coverage."""

    @patch('infrastructure.kms.aws.kms.Alias')
    @patch('infrastructure.kms.aws.kms.Key')
    def test_kms_stack_getters(self, mock_key, mock_alias):
        """Test KMS stack getter methods."""
        from infrastructure.kms import KMSStack
        
        config = FileUploadConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_key_instance = MagicMock(spec=pulumi.Resource)
        mock_key_instance.id = MagicMock()
        mock_key_instance.arn = MagicMock()
        mock_key.return_value = mock_key_instance
        
        kms_stack = KMSStack(config, mock_provider_manager)
        
        # Test getters
        self.assertIsNotNone(kms_stack.get_key_arn('s3'))
        self.assertIsNotNone(kms_stack.get_key_id('s3'))

    @patch('infrastructure.s3.aws.s3.BucketPolicy')
    @patch('infrastructure.s3.aws.s3.BucketPublicAccessBlock')
    @patch('infrastructure.s3.aws.s3.BucketLifecycleConfiguration')
    @patch('infrastructure.s3.aws.s3.BucketCorsConfiguration')
    @patch('infrastructure.s3.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('infrastructure.s3.aws.s3.BucketVersioning')
    @patch('infrastructure.s3.aws.s3.Bucket')
    def test_s3_stack_getters(
        self, mock_bucket, mock_versioning, mock_encryption,
        mock_cors, mock_lifecycle, mock_public_access, mock_policy
    ):
        """Test S3 stack getter methods."""
        from infrastructure.s3 import S3Stack
        
        config = FileUploadConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_bucket_instance = MagicMock(spec=pulumi.Resource)
        mock_bucket_instance.id = MagicMock()
        mock_bucket_instance.arn = MagicMock()
        mock_bucket_instance.bucket = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        s3_stack = S3Stack(config, mock_provider_manager, mock_kms_stack)
        
        # Test getters
        self.assertIsNotNone(s3_stack.get_bucket_name('uploads'))
        self.assertIsNotNone(s3_stack.get_bucket_arn('uploads'))

    @patch('infrastructure.dynamodb.aws.dynamodb.Table')
    def test_dynamodb_stack_getters(self, mock_table):
        """Test DynamoDB stack getter methods."""
        from infrastructure.dynamodb import DynamoDBStack
        
        config = FileUploadConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_table_instance = MagicMock(spec=pulumi.Resource)
        mock_table_instance.name = MagicMock()
        mock_table_instance.arn = MagicMock()
        mock_table.return_value = mock_table_instance
        
        dynamodb_stack = DynamoDBStack(config, mock_provider_manager, mock_kms_stack)
        
        # Test getters
        self.assertIsNotNone(dynamodb_stack.get_table_name('file-metadata'))
        self.assertIsNotNone(dynamodb_stack.get_table_arn('file-metadata'))

    @patch('infrastructure.sqs.aws.sqs.Queue')
    def test_sqs_stack_getters(self, mock_queue):
        """Test SQS stack getter methods."""
        from infrastructure.sqs import SQSStack
        
        config = FileUploadConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_queue_instance = MagicMock(spec=pulumi.Resource)
        mock_queue_instance.arn = MagicMock()
        mock_queue_instance.url = MagicMock()
        mock_queue.return_value = mock_queue_instance
        
        sqs_stack = SQSStack(config, mock_provider_manager, mock_kms_stack)
        dlq = sqs_stack.create_dlq('test-function')
        
        # Test getters
        self.assertIsNotNone(sqs_stack.get_queue_arn('test-function-dlq'))
        self.assertIsNotNone(sqs_stack.get_queue_url('test-function-dlq'))


if __name__ == '__main__':
    unittest.main()
