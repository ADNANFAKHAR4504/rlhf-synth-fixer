"""
test_tap_stack.py
Unit tests for the Multi-Environment Infrastructure TapStack focusing on resource creation
and configuration verification with full mocking and coverage.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from infrastructure.config import MultiEnvConfig


class TestMultiEnvConfig(unittest.TestCase):
    """Test MultiEnvConfig resource configuration."""

    def test_config_default_values(self):
        """Test configuration with default values."""
        with patch.dict('os.environ', {}, clear=True):
            config = MultiEnvConfig()
            self.assertIsInstance(config.project_name, str)
            self.assertIsInstance(config.environment, str)
            self.assertIsInstance(config.primary_region, str)
            self.assertGreater(config.lambda_timeout, 0)
            self.assertGreater(config.lambda_memory_size, 0)

    @patch.dict('os.environ', {
        'PROJECT_NAME': 'custom-multienv',
        'ENVIRONMENT': 'staging',
        'AWS_REGION': 'us-west-2',
        'LAMBDA_TIMEOUT': '120',
        'LAMBDA_MEMORY_SIZE': '1024'
    })
    def test_config_custom_values(self):
        """Test configuration with custom environment variables."""
        config = MultiEnvConfig()
        self.assertEqual(config.project_name, 'custom-multienv')
        self.assertEqual(config.environment, 'staging')
        self.assertEqual(config.primary_region, 'us-west-2')
        self.assertEqual(config.lambda_timeout, 120)
        self.assertEqual(config.lambda_memory_size, 1024)

    def test_normalize_region(self):
        """Test region normalization."""
        config = MultiEnvConfig()
        self.assertEqual(config._normalize_region('us-east-1'), 'useast1')
        self.assertEqual(config._normalize_region('eu-west-2'), 'euwest2')

    def test_get_resource_name(self):
        """Test resource name generation includes region and suffix."""
        config = MultiEnvConfig()
        name = config.get_resource_name('data')
        self.assertIn('data', name)
        self.assertIn(config.normalized_region, name)
        self.assertIn(config.environment_suffix, name)

    def test_get_common_tags(self):
        """Test common tags generation."""
        config = MultiEnvConfig()
        tags = config.get_common_tags()
        self.assertIn('Environment', tags)
        self.assertIn('Project', tags)
        self.assertIn('ManagedBy', tags)

    def test_config_validation_versioning_mismatch(self):
        """Test validation detects S3 versioning mismatch."""
        from infrastructure.config import validate_environment_configs
        
        with patch.dict('os.environ', {'ENVIRONMENT': 'dev'}):
            config1 = MultiEnvConfig()
        
        with patch.dict('os.environ', {'ENVIRONMENT': 'prod'}):
            config2 = MultiEnvConfig()
            config2.s3_versioning_enabled = False
        
        with self.assertRaises(ValueError) as context:
            validate_environment_configs({'dev': config1, 'prod': config2})
        self.assertIn('versioning', str(context.exception).lower())

    def test_config_validation_encryption_mismatch(self):
        """Test validation detects S3 encryption mismatch."""
        from infrastructure.config import validate_environment_configs
        
        with patch.dict('os.environ', {'ENVIRONMENT': 'dev'}):
            config1 = MultiEnvConfig()
        
        with patch.dict('os.environ', {'ENVIRONMENT': 'prod'}):
            config2 = MultiEnvConfig()
            config2.s3_encryption_algorithm = 'aws:kms'
        
        with self.assertRaises(ValueError) as context:
            validate_environment_configs({'dev': config1, 'prod': config2})
        self.assertIn('encryption', str(context.exception).lower())

    @patch.dict('os.environ', {'ENVIRONMENT': 'prod'})
    def test_config_validation_global_tables_prod(self):
        """Test validation requires global tables for prod."""
        from infrastructure.config import validate_environment_configs
        
        with patch.dict('os.environ', {'ENVIRONMENT': 'prod'}):
            prod_config = MultiEnvConfig()
            prod_config.dynamodb_enable_global_tables = False
        
        with patch.dict('os.environ', {'ENVIRONMENT': 'staging'}):
            staging_config = MultiEnvConfig()
        
        with self.assertRaises(ValueError) as context:
            validate_environment_configs({'prod': prod_config, 'staging': staging_config})
        self.assertIn('global tables', str(context.exception).lower())

    def test_config_validation_tags_mismatch(self):
        """Test validation detects tag mismatch across environments."""
        from infrastructure.config import validate_environment_configs
        
        with patch.dict('os.environ', {'ENVIRONMENT': 'dev', 'TEAM': 'team-a'}):
            config1 = MultiEnvConfig()
        
        with patch.dict('os.environ', {'ENVIRONMENT': 'prod', 'TEAM': 'team-b'}):
            config2 = MultiEnvConfig()
        
        with self.assertRaises(ValueError) as context:
            validate_environment_configs({'dev': config1, 'prod': config2})
        self.assertIn('tags', str(context.exception).lower())


class TestAWSProviderManager(unittest.TestCase):
    """Test AWS Provider Manager."""

    @patch('infrastructure.aws_provider.aws.Provider')
    def test_provider_creation(self, mock_provider):
        """Test provider is created with correct region and tags."""
        from infrastructure.aws_provider import AWSProviderManager
        config = MultiEnvConfig()
        manager = AWSProviderManager(config)
        
        provider = manager.get_provider()
        self.assertIsNotNone(provider)
        mock_provider.assert_called_once()


class TestSQSStack(unittest.TestCase):
    """Test SQS Stack resource creation."""

    @patch('infrastructure.sqs.aws.sqs.Queue')
    def test_dlq_created(self, mock_queue):
        """Test SQS DLQ is created for EventBridge."""
        import pulumi
        from infrastructure.sqs import SQSStack
        
        config = MultiEnvConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_queue_instance = MagicMock(spec=pulumi.Resource)
        mock_queue_instance.arn = MagicMock()
        mock_queue_instance.url = MagicMock()
        mock_queue.return_value = mock_queue_instance
        
        sqs_stack = SQSStack(config, mock_provider_manager)
        
        mock_queue.assert_called_once()
        self.assertIsNotNone(sqs_stack.get_dlq_arn('eventbridge'))
        self.assertIsNotNone(sqs_stack.get_dlq_url('eventbridge'))
        self.assertIsNotNone(sqs_stack.get_dlq('eventbridge'))


class TestIAMStack(unittest.TestCase):
    """Test IAM Stack resource creation."""

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_lambda_role_with_policies(self, mock_role, mock_attachment, mock_role_policy):
        """Test Lambda IAM role is created with S3, DynamoDB, and SQS policies."""
        import pulumi
        from infrastructure.iam import IAMStack
        
        config = MultiEnvConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.name = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        s3_arns = [pulumi.Output.from_input('arn:aws:s3:::bucket')]
        dynamodb_arns = [pulumi.Output.from_input('arn:aws:dynamodb:us-east-1:123:table/table')]
        sqs_arns = [pulumi.Output.from_input('arn:aws:sqs:us-east-1:123:queue')]
        
        role = iam_stack.create_lambda_role(
            'process-data',
            s3_arns,
            dynamodb_arns,
            sqs_arns
        )
        
        self.assertIsNotNone(role)
        mock_role.assert_called_once()
        mock_attachment.assert_called_once()

    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_eventbridge_role_creation(self, mock_role, mock_role_policy):
        """Test EventBridge IAM role is created with invoke policies."""
        import pulumi
        from infrastructure.iam import IAMStack
        
        config = MultiEnvConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.name = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        target_arns = [
            pulumi.Output.from_input('arn:aws:lambda:us-east-1:123:function:func'),
            pulumi.Output.from_input('arn:aws:sqs:us-east-1:123:queue')
        ]
        
        role = iam_stack.create_eventbridge_role('eventbridge-sqs', target_arns)
        
        self.assertIsNotNone(role)
        mock_role.assert_called_once()

    def test_iam_get_role_methods(self):
        """Test IAM getter methods."""
        import pulumi
        from infrastructure.iam import IAMStack
        
        config = MultiEnvConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = pulumi.Output.from_input('arn:aws:iam::123:role/test')
        iam_stack.roles['test'] = mock_role
        
        self.assertIsNotNone(iam_stack.get_role('test'))
        self.assertIsNotNone(iam_stack.get_role_arn('test'))


class TestStorageStack(unittest.TestCase):
    """Test Storage Stack resource creation."""

    @patch('infrastructure.storage.aws.s3.BucketNotification')
    @patch('infrastructure.storage.aws.s3.BucketLifecycleConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketPublicAccessBlock')
    @patch('infrastructure.storage.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('infrastructure.storage.aws.s3.BucketVersioning')
    @patch('infrastructure.storage.aws.s3.Bucket')
    def test_data_bucket_created(self, mock_bucket, mock_versioning,
                                 mock_encryption, mock_public_access,
                                 mock_lifecycle, mock_notification):
        """Test S3 data bucket is created with all configurations."""
        import pulumi
        from infrastructure.storage import StorageStack
        
        config = MultiEnvConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_bucket_instance = MagicMock(spec=pulumi.Resource)
        mock_bucket_instance.id = MagicMock()
        mock_bucket_instance.arn = MagicMock()
        mock_bucket_instance.bucket = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        storage_stack = StorageStack(config, mock_provider_manager)
        
        mock_bucket.assert_called_once()
        mock_versioning.assert_called_once()
        mock_encryption.assert_called_once()
        mock_public_access.assert_called_once()
        mock_lifecycle.assert_called_once()
        mock_notification.assert_called_once()
        
        self.assertIsNotNone(storage_stack.get_bucket('data'))
        self.assertIsNotNone(storage_stack.get_bucket_name('data'))
        self.assertIsNotNone(storage_stack.get_bucket_arn('data'))


class TestDynamoDBStack(unittest.TestCase):
    """Test DynamoDB Stack resource creation."""

    @patch('infrastructure.dynamodb.aws.dynamodb.Table')
    def test_items_table_created(self, mock_table):
        """Test DynamoDB items table is created."""
        import pulumi
        from infrastructure.dynamodb import DynamoDBStack
        
        config = MultiEnvConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_table_instance = MagicMock(spec=pulumi.Resource)
        mock_table_instance.name = MagicMock()
        mock_table_instance.arn = MagicMock()
        mock_table.return_value = mock_table_instance
        
        dynamodb_stack = DynamoDBStack(config, mock_provider_manager)
        
        mock_table.assert_called_once()
        self.assertIsNotNone(dynamodb_stack.get_table_name())
        self.assertIsNotNone(dynamodb_stack.get_table_arn())
        self.assertIsNotNone(dynamodb_stack.get_table('items'))

    @patch('infrastructure.dynamodb.aws.appautoscaling.Policy')
    @patch('infrastructure.dynamodb.aws.appautoscaling.Target')
    @patch('infrastructure.dynamodb.aws.dynamodb.Table')
    @patch.dict('os.environ', {'ENVIRONMENT': 'prod'})
    def test_autoscaling_for_prod(self, mock_table, mock_target, mock_policy):
        """Test DynamoDB autoscaling is configured for prod environment."""
        import pulumi
        from infrastructure.dynamodb import DynamoDBStack
        
        config = MultiEnvConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_table_instance = MagicMock(spec=pulumi.Resource)
        mock_table_instance.name = MagicMock()
        mock_table_instance.arn = MagicMock()
        mock_table.return_value = mock_table_instance
        
        dynamodb_stack = DynamoDBStack(config, mock_provider_manager)
        
        self.assertEqual(mock_target.call_count, 2)
        self.assertEqual(mock_policy.call_count, 2)


class TestLambdaStack(unittest.TestCase):
    """Test Lambda Stack resource creation."""

    @patch('infrastructure.lambda_functions.aws.lambda_.Function')
    def test_process_function_created(self, mock_function):
        """Test process Lambda function is created."""
        import pulumi
        from infrastructure.lambda_functions import LambdaStack
        
        config = MultiEnvConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_iam_stack = MagicMock()
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        mock_iam_stack.create_lambda_role.return_value = mock_role
        
        mock_storage_stack = MagicMock()
        mock_storage_stack.get_bucket_arn.return_value = MagicMock()
        
        mock_dynamodb_stack = MagicMock()
        mock_dynamodb_stack.get_table_name.return_value = MagicMock()
        mock_dynamodb_stack.get_table_arn.return_value = MagicMock()
        
        mock_sqs_stack = MagicMock()
        mock_sqs_stack.get_dlq_arn.return_value = MagicMock()
        
        mock_function_instance = MagicMock(spec=pulumi.Resource)
        mock_function_instance.arn = MagicMock()
        mock_function_instance.name = MagicMock()
        mock_function.return_value = mock_function_instance
        
        lambda_stack = LambdaStack(
            config, mock_provider_manager, mock_iam_stack,
            mock_storage_stack, mock_dynamodb_stack, mock_sqs_stack
        )
        
        mock_function.assert_called_once()
        self.assertIsNotNone(lambda_stack.get_function('process-data'))


class TestEventBridgeStack(unittest.TestCase):
    """Test EventBridge Stack resource creation."""

    @patch('infrastructure.eventbridge.aws.cloudwatch.EventTarget')
    @patch('infrastructure.eventbridge.aws.lambda_.Permission')
    @patch('infrastructure.eventbridge.aws.cloudwatch.EventRule')
    def test_s3_event_rule_created(self, mock_rule, mock_permission, mock_target):
        """Test EventBridge rule for S3 events is created."""
        import pulumi
        from infrastructure.eventbridge import EventBridgeStack
        
        config = MultiEnvConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        
        mock_iam_stack = MagicMock()
        
        mock_lambda_stack = MagicMock()
        mock_function = MagicMock(spec=pulumi.Resource)
        mock_function.arn = MagicMock()
        mock_function.name = MagicMock()
        mock_lambda_stack.get_function.return_value = mock_function
        mock_lambda_stack.get_function_arn.return_value = MagicMock()
        
        mock_sqs_stack = MagicMock()
        mock_sqs_stack.get_dlq_arn.return_value = MagicMock()
        
        mock_storage_stack = MagicMock()
        mock_storage_stack.get_bucket_name.return_value = pulumi.Output.from_input('bucket-name')
        
        mock_rule_instance = MagicMock(spec=pulumi.Resource)
        mock_rule_instance.arn = MagicMock()
        mock_rule_instance.name = MagicMock()
        mock_rule.return_value = mock_rule_instance
        
        eventbridge_stack = EventBridgeStack(
            config, mock_provider_manager, mock_iam_stack,
            mock_lambda_stack, mock_sqs_stack, mock_storage_stack
        )
        
        mock_rule.assert_called_once()
        mock_permission.assert_called_once()
        mock_target.assert_called_once()


class TestTapStack(unittest.TestCase):
    """Test TapStack orchestration and outputs."""

    @patch('tap_stack.EventBridgeStack')
    @patch('tap_stack.LambdaStack')
    @patch('tap_stack.DynamoDBStack')
    @patch('tap_stack.StorageStack')
    @patch('tap_stack.SQSStack')
    @patch('tap_stack.IAMStack')
    @patch('tap_stack.AWSProviderManager')
    @patch('tap_stack.MultiEnvConfig')
    def test_tap_stack_initialization(self, mock_config, mock_provider,
                                     mock_iam, mock_sqs, mock_storage,
                                     mock_dynamodb, mock_lambda, mock_eventbridge):
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
        mock_sqs.assert_called_once()
        mock_storage.assert_called_once()
        mock_dynamodb.assert_called_once()
        mock_lambda.assert_called_once()
        mock_eventbridge.assert_called_once()

    @patch('tap_stack.pulumi.export')
    @patch('tap_stack.EventBridgeStack')
    @patch('tap_stack.LambdaStack')
    @patch('tap_stack.DynamoDBStack')
    @patch('tap_stack.StorageStack')
    @patch('tap_stack.SQSStack')
    @patch('tap_stack.IAMStack')
    @patch('tap_stack.AWSProviderManager')
    @patch('tap_stack.MultiEnvConfig')
    def test_tap_stack_outputs(self, mock_config, mock_provider, mock_iam,
                              mock_sqs, mock_storage, mock_dynamodb,
                              mock_lambda, mock_eventbridge, mock_export):
        """Test TapStack output registration."""
        from tap_stack import TapStack, TapStackArgs
        
        mock_config_instance = MagicMock()
        mock_config_instance.environment = 'dev'
        mock_config_instance.environment_suffix = 'dev'
        mock_config_instance.primary_region = 'us-east-1'
        mock_config_instance.normalized_region = 'useast1'
        mock_config_instance.project_name = 'multienv'
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
        
        mock_eventbridge_instance = MagicMock()
        mock_eventbridge_instance.get_rule_arn.return_value = MagicMock()
        mock_eventbridge.return_value = mock_eventbridge_instance
        
        args = TapStackArgs(environment_suffix='test')
        
        with patch('tap_stack.pulumi.ComponentResource.__init__'):
            stack = TapStack('test-stack', args)
            
            bucket_name = stack.get_bucket_name()
            self.assertIsNotNone(bucket_name)
            
            table_name = stack.get_table_name()
            self.assertIsNotNone(table_name)
            
            lambda_arn = stack.get_lambda_function_arn()
            self.assertIsNotNone(lambda_arn)


if __name__ == '__main__':
    unittest.main()
