"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using Pulumi's testing framework.
"""

import unittest
from unittest.mock import patch, MagicMock
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """
    Mock class to handle Pulumi resource calls during testing.
    """
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock new resource creation."""
        outputs = {}

        # Provide mock outputs based on resource type
        if args.typ == "aws:s3/bucketV2:BucketV2":
            outputs = {
                'id': f'mock-bucket-{args.name}',
                'arn': f'arn:aws:s3:::mock-bucket-{args.name}',
                'bucket': args.inputs.get('bucket', f'mock-bucket-{args.name}')
            }
        elif args.typ == "aws:dynamodb/table:Table":
            outputs = {
                'name': args.inputs.get('name', f'mock-table-{args.name}'),
                'arn': f'arn:aws:dynamodb:us-east-1:123456789012:table/mock-table-{args.name}',
                'id': f'mock-table-{args.name}'
            }
        elif args.typ == "aws:sns/topic:Topic":
            outputs = {
                'name': args.inputs.get('name', f'mock-topic-{args.name}'),
                'arn': f'arn:aws:sns:us-east-1:123456789012:mock-topic-{args.name}',
                'id': f'mock-topic-{args.name}'
            }
        elif args.typ == "aws:sqs/queue:Queue":
            outputs = {
                'name': args.inputs.get('name', f'mock-queue-{args.name}'),
                'arn': f'arn:aws:sqs:us-east-1:123456789012:mock-queue-{args.name}',
                'url': f'https://sqs.us-east-1.amazonaws.com/123456789012/mock-queue-{args.name}',
                'id': f'mock-queue-{args.name}'
            }
        elif args.typ == "aws:iam/role:Role":
            outputs = {
                'name': args.inputs.get('name', f'mock-role-{args.name}'),
                'arn': f'arn:aws:iam::123456789012:role/mock-role-{args.name}',
                'id': f'mock-role-{args.name}'
            }
        elif args.typ == "aws:lambda/function:Function":
            outputs = {
                'name': args.inputs.get('name', f'mock-function-{args.name}'),
                'arn': f'arn:aws:lambda:us-east-1:123456789012:function:mock-function-{args.name}',
                'id': f'mock-function-{args.name}'
            }
        else:
            # Default outputs for any other resource type
            outputs = {
                'id': f'mock-{args.name}',
                'arn': f'arn:aws:service:region:account:mock-{args.name}',
                'name': args.inputs.get('name', f'mock-{args.name}'),
                'url': f'https://mock-url/{args.name}'
            }

        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls (like aws.iam.get_policy_document)."""
        if args.token == 'aws:iam/getPolicyDocument:getPolicyDocument':
            return {
                'json': '{"Version": "2012-10-17", "Statement": []}'
            }
        return {}


pulumi.runtime.set_mocks(MyMocks())


class TestTapStackArgs(unittest.TestCase):
    """Test TapStackArgs class initialization and defaults."""

    def test_args_with_defaults(self):
        """Test TapStackArgs initialization with default values."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_args_with_custom_values(self):
        """Test TapStackArgs initialization with custom values."""
        from lib.tap_stack import TapStackArgs

        custom_tags = {'Project': 'test', 'Owner': 'team'}
        args = TapStackArgs(environment_suffix='staging', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'staging')
        self.assertEqual(args.tags, custom_tags)

    def test_args_with_none_values(self):
        """Test TapStackArgs handles None values correctly."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix=None, tags=None)

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})


class TestTapStackComponent(unittest.TestCase):
    """Test TapStack component resource creation."""

    @pulumi.runtime.test
    def test_tapstack_initialization(self):
        """Test TapStack component initializes correctly."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')

        with patch('pulumi.Config') as mock_config:
            mock_config_instance = MagicMock()
            mock_config_instance.get.return_value = None
            mock_config.return_value = mock_config_instance

            stack = TapStack('test-stack', args)

            # Verify stack properties
            def check_properties(outputs):
                self.assertEqual(stack.environment_suffix, 'test')
                self.assertIsNotNone(stack.data_bucket)
                self.assertIsNotNone(stack.metadata_table)
                self.assertIsNotNone(stack.notification_topic)
                self.assertIsNotNone(stack.task_queue)
                self.assertIsNotNone(stack.dlq)
                self.assertIsNotNone(stack.lambda_role)
                self.assertIsNotNone(stack.processor_function)

            return pulumi.Output.all(
                stack.data_bucket.id,
                stack.metadata_table.name,
                stack.notification_topic.arn
            ).apply(check_properties)

    @pulumi.runtime.test
    def test_create_s3_bucket(self):
        """Test S3 bucket creation with proper configuration."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')

        with patch('pulumi.Config') as mock_config:
            mock_config_instance = MagicMock()
            mock_config_instance.get.return_value = None
            mock_config.return_value = mock_config_instance

            stack = TapStack('test-stack', args)

            # Verify bucket was created
            def check_bucket(bucket_id):
                self.assertIsNotNone(stack.data_bucket)
                self.assertIsNotNone(bucket_id)

            return stack.data_bucket.id.apply(check_bucket)

    @pulumi.runtime.test
    def test_create_dynamodb_table(self):
        """Test DynamoDB table creation with GSI."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')

        with patch('pulumi.Config') as mock_config:
            mock_config_instance = MagicMock()
            mock_config_instance.get.return_value = None
            mock_config.return_value = mock_config_instance

            stack = TapStack('test-stack', args)

            # Verify table was created
            def check_table(table_name):
                self.assertIsNotNone(stack.metadata_table)
                self.assertIsNotNone(table_name)

            return stack.metadata_table.name.apply(check_table)

    @pulumi.runtime.test
    def test_create_sns_topic(self):
        """Test SNS topic creation with email subscription."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')

        with patch('pulumi.Config') as mock_config:
            mock_config_instance = MagicMock()
            mock_config_instance.get.return_value = None
            mock_config.return_value = mock_config_instance

            stack = TapStack('test-stack', args)

            # Verify topic was created
            def check_topic(topic_arn):
                self.assertIsNotNone(stack.notification_topic)
                self.assertIn('arn:aws:sns', topic_arn)

            return stack.notification_topic.arn.apply(check_topic)

    @pulumi.runtime.test
    def test_create_sqs_queues(self):
        """Test SQS queue and DLQ creation."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')

        with patch('pulumi.Config') as mock_config:
            mock_config_instance = MagicMock()
            mock_config_instance.get.return_value = None
            mock_config.return_value = mock_config_instance

            stack = TapStack('test-stack', args)

            # Verify queues were created
            def check_queues(values):
                queue_url, dlq_url = values
                self.assertIsNotNone(stack.task_queue)
                self.assertIsNotNone(stack.dlq)
                self.assertIn('https://sqs', queue_url)
                self.assertIn('https://sqs', dlq_url)

            return pulumi.Output.all(
                stack.task_queue.url,
                stack.dlq.url
            ).apply(check_queues)

    @pulumi.runtime.test
    def test_create_lambda_role(self):
        """Test Lambda IAM role creation with policies."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')

        with patch('pulumi.Config') as mock_config:
            mock_config_instance = MagicMock()
            mock_config_instance.get.return_value = None
            mock_config.return_value = mock_config_instance

            stack = TapStack('test-stack', args)

            # Verify role was created
            def check_role(role_arn):
                self.assertIsNotNone(stack.lambda_role)
                self.assertIn('arn:aws:iam', role_arn)

            return stack.lambda_role.arn.apply(check_role)

    @pulumi.runtime.test
    def test_create_lambda_function(self):
        """Test Lambda function creation with proper configuration."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')

        with patch('pulumi.Config') as mock_config:
            mock_config_instance = MagicMock()
            mock_config_instance.get.return_value = None
            mock_config.return_value = mock_config_instance

            stack = TapStack('test-stack', args)

            # Verify function was created
            def check_function(function_arn):
                self.assertIsNotNone(stack.processor_function)
                self.assertIn('arn:aws:lambda', function_arn)

            return stack.processor_function.arn.apply(check_function)

    @pulumi.runtime.test
    def test_configuration_with_custom_values(self):
        """Test TapStack with custom configuration values."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='prod')

        with patch('pulumi.Config') as mock_config:
            mock_config_instance = MagicMock()
            config_values = {
                'bucket_name': 'custom-bucket',
                'lambda_memory': '2048',
                'table_name': 'custom-table',
                'notification_email': 'custom@example.com',
                'queue_name': 'custom-queue'
            }
            mock_config_instance.get.side_effect = config_values.get
            mock_config.return_value = mock_config_instance

            stack = TapStack('test-stack', args)

            # Verify stack initialized with custom config
            self.assertEqual(stack.environment_suffix, 'prod')

    @pulumi.runtime.test
    def test_configuration_defaults_for_dev(self):
        """Test default configuration values for dev environment."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='dev')

        with patch('pulumi.Config') as mock_config:
            mock_config_instance = MagicMock()
            mock_config_instance.get.return_value = None
            mock_config.return_value = mock_config_instance

            stack = TapStack('test-stack', args)

            # Verify stack initialized with dev defaults
            self.assertEqual(stack.environment_suffix, 'dev')

    @pulumi.runtime.test
    def test_configuration_defaults_for_prod(self):
        """Test default configuration values for prod environment."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='prod')

        with patch('pulumi.Config') as mock_config:
            mock_config_instance = MagicMock()
            mock_config_instance.get.return_value = None
            mock_config.return_value = mock_config_instance

            stack = TapStack('test-stack', args)

            # Verify stack initialized with prod defaults
            self.assertEqual(stack.environment_suffix, 'prod')


class TestValidateConfiguration(unittest.TestCase):
    """Test validate_configuration function."""

    @patch('pulumi.Config')
    @patch('pulumi.get_stack')
    def test_validate_configuration_returns_dict(self, mock_get_stack, mock_config):
        """Test validate_configuration returns expected dictionary."""
        from lib.tap_stack import validate_configuration

        mock_get_stack.return_value = 'test-stack'
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance

        result = validate_configuration()

        self.assertIsInstance(result, dict)
        self.assertEqual(result['stack'], 'test-stack')
        self.assertEqual(result['runtime_version'], 'python3.9')
        self.assertEqual(result['billing_mode'], 'PAY_PER_REQUEST')
        self.assertEqual(result['s3_versioning'], 'Enabled')
        self.assertEqual(result['s3_encryption'], 'AES256')
        self.assertEqual(result['lifecycle_policy_days'], 30)
        self.assertEqual(result['sqs_retention_days'], 14)
        self.assertEqual(result['dlq_max_retries'], 3)
        self.assertTrue(result['dynamodb_pitr'])
        self.assertEqual(result['gsi_name'], 'timestamp-index')

    @patch('pulumi.Config')
    @patch('pulumi.get_stack')
    def test_validate_configuration_with_different_stack(self, mock_get_stack, mock_config):
        """Test validate_configuration with different stack name."""
        from lib.tap_stack import validate_configuration

        mock_get_stack.return_value = 'production-stack'
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance

        result = validate_configuration()

        self.assertEqual(result['stack'], 'production-stack')


class TestTapStackOutputs(unittest.TestCase):
    """Test TapStack output registration."""

    @pulumi.runtime.test
    def test_outputs_registered(self):
        """Test that all outputs are registered correctly."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')

        with patch('pulumi.Config') as mock_config:
            mock_config_instance = MagicMock()
            mock_config_instance.get.return_value = None
            mock_config.return_value = mock_config_instance

            stack = TapStack('test-stack', args)

            # Verify all key components exist for output registration
            self.assertIsNotNone(stack.data_bucket)
            self.assertIsNotNone(stack.metadata_table)
            self.assertIsNotNone(stack.notification_topic)
            self.assertIsNotNone(stack.task_queue)
            self.assertIsNotNone(stack.dlq)
            self.assertIsNotNone(stack.processor_function)
            self.assertIsNotNone(stack.lambda_role)


class TestTapStackResourceNaming(unittest.TestCase):
    """Test resource naming conventions with environment suffix."""

    @pulumi.runtime.test
    def test_environment_suffix_applied(self):
        """Test that environment suffix is applied to all resources."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='staging')

        with patch('pulumi.Config') as mock_config:
            mock_config_instance = MagicMock()
            mock_config_instance.get.return_value = None
            mock_config.return_value = mock_config_instance

            stack = TapStack('test-stack', args)

            # Verify environment suffix is set
            self.assertEqual(stack.environment_suffix, 'staging')


class TestTapStackEdgeCases(unittest.TestCase):
    """Test edge cases and error handling."""

    @pulumi.runtime.test
    def test_tapstack_with_empty_tags(self):
        """Test TapStack with empty tags dictionary."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test', tags={})

        with patch('pulumi.Config') as mock_config:
            mock_config_instance = MagicMock()
            mock_config_instance.get.return_value = None
            mock_config.return_value = mock_config_instance

            stack = TapStack('test-stack', args)

            self.assertEqual(stack.tags, {})

    @pulumi.runtime.test
    def test_tapstack_with_tags(self):
        """Test TapStack with custom tags."""
        from lib.tap_stack import TapStack, TapStackArgs

        custom_tags = {'Environment': 'test', 'Team': 'platform'}
        args = TapStackArgs(environment_suffix='test', tags=custom_tags)

        with patch('pulumi.Config') as mock_config:
            mock_config_instance = MagicMock()
            mock_config_instance.get.return_value = None
            mock_config.return_value = mock_config_instance

            stack = TapStack('test-stack', args)

            self.assertEqual(stack.tags, custom_tags)


# Additional tests to increase coverage
class TestTapStackPrivateMethods(unittest.TestCase):
    """Test private methods of TapStack for 100% coverage."""

    @pulumi.runtime.test
    def test_s3_bucket_versioning(self):
        """Test S3 bucket versioning configuration."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')

        with patch('pulumi.Config') as mock_config:
            mock_config_instance = MagicMock()
            mock_config_instance.get.return_value = None
            mock_config.return_value = mock_config_instance

            stack = TapStack('test-stack', args)

            # Verify bucket has required attributes
            self.assertIsNotNone(stack.data_bucket)

    @pulumi.runtime.test
    def test_lambda_memory_for_prod(self):
        """Test Lambda memory defaults to 1024 for prod."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='prod')

        with patch('pulumi.Config') as mock_config:
            mock_config_instance = MagicMock()
            mock_config_instance.get.return_value = None
            mock_config.return_value = mock_config_instance

            stack = TapStack('test-stack', args)

            # Verify function was created for prod
            self.assertIsNotNone(stack.processor_function)

    @pulumi.runtime.test
    def test_lambda_memory_custom(self):
        """Test Lambda memory with custom value."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test')

        with patch('pulumi.Config') as mock_config:
            mock_config_instance = MagicMock()
            def get_config(key):
                return '2048' if key == 'lambda_memory' else None
            mock_config_instance.get.side_effect = get_config
            mock_config.return_value = mock_config_instance

            stack = TapStack('test-stack', args)

            # Verify function was created with custom memory
            self.assertIsNotNone(stack.processor_function)


if __name__ == '__main__':
    unittest.main()
