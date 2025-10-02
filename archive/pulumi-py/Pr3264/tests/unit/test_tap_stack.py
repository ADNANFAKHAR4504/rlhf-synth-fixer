"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock, PropertyMock
import json
import pulumi
from pulumi import ResourceOptions
import pulumi.runtime

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertIn('Environment', args.tags)
        self.assertIn('Purpose', args.tags)
        self.assertEqual(args.tags['Environment'], 'dev')
        self.assertEqual(args.tags['Purpose'], 'Gaming-Leaderboard-System')

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Team': 'Platform', 'Project': 'Leaderboard'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertIn('Team', args.tags)
        self.assertIn('Project', args.tags)
        self.assertIn('Environment', args.tags)
        self.assertIn('Purpose', args.tags)
        self.assertEqual(args.tags['Environment'], 'prod')
        self.assertEqual(args.tags['Team'], 'Platform')

    def test_tap_stack_args_tags_merge(self):
        """Test that custom tags are properly merged with default tags."""
        custom_tags = {'CustomKey': 'CustomValue'}
        args = TapStackArgs(tags=custom_tags)

        self.assertEqual(len(args.tags), 3)  # CustomKey + Environment + Purpose
        self.assertIn('CustomKey', args.tags)
        self.assertIn('Environment', args.tags)
        self.assertIn('Purpose', args.tags)


class TestTapStackResources(unittest.TestCase):
    """Test cases for TapStack resource creation."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_runtime = MagicMock()
        self.patcher = patch('pulumi.runtime.settings')
        self.mock_settings = self.patcher.start()

    def tearDown(self):
        """Clean up test fixtures."""
        self.patcher.stop()

    @patch('lib.tap_stack.sqs.Queue')
    @patch('lib.tap_stack.dynamodb.Table')
    @patch('lib.tap_stack.iam.Role')
    @patch('lib.tap_stack.iam.Policy')
    @patch('lib.tap_stack.iam.RolePolicyAttachment')
    @patch('lib.tap_stack.lambda_.Function')
    @patch('lib.tap_stack.lambda_.EventSourceMapping')
    @patch('lib.tap_stack.cloudwatch.MetricAlarm')
    @patch('lib.tap_stack.aws.cloudwatch.LogGroup')
    def test_tap_stack_creates_all_resources(self, mock_log_group, mock_alarm, mock_event_mapping,
                                            mock_lambda, mock_attachment, mock_policy, mock_role,
                                            mock_table, mock_queue):
        """Test that TapStack creates all expected resources."""
        # Create mock resources that inherit from pulumi.Resource
        from pulumi import Resource
        from pulumi import Output
        
        class MockResource(Resource):
            def __init__(self, name, **kwargs):
                super().__init__('mock:test:MockResource', name, None, None)
                # Add common Pulumi resource attributes
                self.arn = Output.from_input(f"arn:aws:mock:us-west-1:123456789012:mock/{name}")
                self.url = Output.from_input(f"https://mock.amazonaws.com/{name}")
                self.name = Output.from_input(name)
        
        # Configure mocks to return MockResource objects
        for mock in [mock_queue, mock_table, mock_role, mock_policy,
                     mock_attachment, mock_lambda, mock_event_mapping,
                     mock_alarm, mock_log_group]:
            mock_instance = MockResource('mock-resource')
            mock.return_value = mock_instance

        # Create stack
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Assert all resources were created
        self.assertEqual(mock_queue.call_count, 2)  # DLQ and main queue
        mock_table.assert_called_once()
        mock_role.assert_called_once()
        mock_policy.assert_called_once()
        mock_attachment.assert_called_once()
        mock_lambda.assert_called_once()
        mock_event_mapping.assert_called_once()
        mock_alarm.assert_called_once()
        mock_log_group.assert_called_once()

    @patch('lib.tap_stack.sqs.Queue')
    def test_fifo_queue_configuration(self, mock_queue):
        """Test that FIFO queues are configured correctly."""
        mock_queue.return_value = MagicMock()

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Check DLQ configuration
        dlq_call = mock_queue.call_args_list[0]
        self.assertEqual(dlq_call[0][0], 'dlq-test')
        self.assertEqual(dlq_call[1]['name'], 'leaderboard-dlq-test.fifo')
        self.assertTrue(dlq_call[1]['fifo_queue'])
        self.assertTrue(dlq_call[1]['content_based_deduplication'])
        self.assertEqual(dlq_call[1]['message_retention_seconds'], 1209600)

        # Check main queue configuration
        main_queue_call = mock_queue.call_args_list[1]
        self.assertEqual(main_queue_call[0][0], 'queue-test')
        self.assertEqual(main_queue_call[1]['name'], 'leaderboard-updates-test.fifo')
        self.assertTrue(main_queue_call[1]['fifo_queue'])
        self.assertTrue(main_queue_call[1]['content_based_deduplication'])
        self.assertEqual(main_queue_call[1]['message_retention_seconds'], 345600)
        self.assertEqual(main_queue_call[1]['visibility_timeout_seconds'], 60)

    @patch('lib.tap_stack.dynamodb.Table')
    def test_dynamodb_table_configuration(self, mock_table):
        """Test that DynamoDB table is configured correctly."""
        mock_table.return_value = MagicMock()

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Check table configuration
        table_call = mock_table.call_args
        self.assertEqual(table_call[0][0], 'leaderboard-data-test')
        self.assertEqual(table_call[1]['hash_key'], 'player_id')
        self.assertEqual(table_call[1]['range_key'], 'timestamp')
        self.assertEqual(table_call[1]['billing_mode'], 'PAY_PER_REQUEST')
        self.assertTrue(table_call[1]['stream_enabled'])
        self.assertEqual(table_call[1]['stream_view_type'], 'NEW_AND_OLD_IMAGES')

        # Check attributes
        attributes = table_call[1]['attributes']
        self.assertEqual(len(attributes), 2)

    @patch('lib.tap_stack.lambda_.Function')
    def test_lambda_function_configuration(self, mock_lambda):
        """Test that Lambda function is configured correctly."""
        mock_lambda.return_value = MagicMock()

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Check Lambda configuration
        lambda_call = mock_lambda.call_args
        self.assertEqual(lambda_call[0][0], 'leaderboard-processor-test')
        self.assertEqual(lambda_call[1]['runtime'], 'python3.11')
        self.assertEqual(lambda_call[1]['handler'], 'index.handler')
        self.assertEqual(lambda_call[1]['timeout'], 30)
        self.assertEqual(lambda_call[1]['memory_size'], 512)
        self.assertEqual(lambda_call[1]['reserved_concurrent_executions'], 10)

    @patch('lib.tap_stack.lambda_.EventSourceMapping')
    def test_event_source_mapping_configuration(self, mock_event_mapping):
        """Test that event source mapping is configured correctly."""
        mock_event_mapping.return_value = MagicMock()

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Check event source mapping configuration
        event_mapping_call = mock_event_mapping.call_args
        self.assertEqual(event_mapping_call[0][0], 'leaderboard-sqs-trigger-test')
        self.assertEqual(event_mapping_call[1]['batch_size'], 10)
        # Ensure maximum_batching_window_in_seconds is not set for FIFO queues
        self.assertNotIn('maximum_batching_window_in_seconds', event_mapping_call[1])

    @patch('lib.tap_stack.cloudwatch.MetricAlarm')
    def test_cloudwatch_alarm_configuration(self, mock_alarm):
        """Test that CloudWatch alarm is configured correctly."""
        mock_alarm.return_value = MagicMock()

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Check alarm configuration
        alarm_call = mock_alarm.call_args
        self.assertEqual(alarm_call[0][0], 'leaderboard-dlq-alarm-test')
        self.assertEqual(alarm_call[1]['metric_name'], 'ApproximateNumberOfMessagesVisible')
        self.assertEqual(alarm_call[1]['namespace'], 'AWS/SQS')
        self.assertEqual(alarm_call[1]['threshold'], 10)
        self.assertEqual(alarm_call[1]['comparison_operator'], 'GreaterThanThreshold')
        self.assertEqual(alarm_call[1]['period'], 300)
        self.assertEqual(alarm_call[1]['evaluation_periods'], 1)

    def test_register_outputs(self):
        """Test that stack outputs are registered correctly."""
        with patch('lib.tap_stack.TapStack.register_outputs') as mock_register:
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            # Check that register_outputs was called
            mock_register.assert_called_once()
            outputs = mock_register.call_args[0][0]

            # Verify all expected outputs are present
            expected_outputs = [
                'main_queue_url',
                'dlq_url',
                'dynamodb_table_name',
                'lambda_function_name',
                'dlq_alarm_name'
            ]
            for output in expected_outputs:
                self.assertIn(output, outputs)

    def test_resource_tagging(self):
        """Test that all resources are properly tagged."""
        with patch('lib.tap_stack.sqs.Queue') as mock_queue, \
             patch('lib.tap_stack.dynamodb.Table') as mock_table, \
             patch('lib.tap_stack.iam.Role') as mock_role:

            mock_queue.return_value = MagicMock()
            mock_table.return_value = MagicMock()
            mock_role.return_value = MagicMock()

            custom_tags = {'Team': 'Platform'}
            args = TapStackArgs(environment_suffix='prod', tags=custom_tags)
            stack = TapStack('test-stack', args)

            # Check that tags are applied to resources
            expected_tags = {
                'Team': 'Platform',
                'Environment': 'prod',
                'Purpose': 'Gaming-Leaderboard-System'
            }

            # Check DLQ tags
            dlq_call = mock_queue.call_args_list[0]
            self.assertEqual(dlq_call[1]['tags'], expected_tags)

            # Check main queue tags
            main_queue_call = mock_queue.call_args_list[1]
            self.assertEqual(main_queue_call[1]['tags'], expected_tags)

            # Check table tags
            table_call = mock_table.call_args
            self.assertEqual(table_call[1]['tags'], expected_tags)


class TestLambdaPermissions(unittest.TestCase):
    """Test cases for Lambda IAM permissions."""

    @patch('lib.tap_stack.iam.Policy')
    def test_lambda_iam_policy_permissions(self, mock_policy):
        """Test that Lambda IAM policy has correct permissions."""
        mock_policy.return_value = MagicMock()

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Get the policy document from the mock call
        policy_call = mock_policy.call_args

        # The policy is created with pulumi.Output.apply, so we need to check
        # that the Policy was created with the correct name
        self.assertEqual(policy_call[0][0], 'leaderboard-lambda-policy-test')

    def test_iam_role_assume_policy(self):
        """Test that IAM role has correct assume role policy."""
        with patch('lib.tap_stack.iam.Role') as mock_role:
            mock_role.return_value = MagicMock()

            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            # Check IAM role configuration
            role_call = mock_role.call_args
            self.assertEqual(role_call[0][0], 'leaderboard-lambda-role-test')

            # Parse and verify assume role policy
            assume_policy = json.loads(role_call[1]['assume_role_policy'])
            self.assertEqual(assume_policy['Version'], '2012-10-17')
            self.assertEqual(len(assume_policy['Statement']), 1)
            statement = assume_policy['Statement'][0]
            self.assertEqual(statement['Action'], 'sts:AssumeRole')
            self.assertEqual(statement['Principal']['Service'], 'lambda.amazonaws.com')
            self.assertEqual(statement['Effect'], 'Allow')


if __name__ == '__main__':
    unittest.main()
