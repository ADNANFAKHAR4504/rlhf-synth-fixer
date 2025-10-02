"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import os
import sys
import pulumi
from pulumi import ResourceOptions

# Add the parent directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs

class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Project': 'Inventory', 'Owner': 'Team'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)

class TestTapStack(unittest.TestCase):
    """Test cases for TapStack Pulumi component."""

    def setUp(self):
        """Set up test fixtures."""
        self.mocks = pulumi.runtime.Mocks()
        pulumi.runtime.set_mocks(self.mocks)

    def test_tap_stack_initialization(self):
        """Test TapStack initialization with proper configuration."""
        # Mock Pulumi runtime
        with patch('pulumi.ComponentResource.__init__') as mock_init:
            mock_init.return_value = None

            args = TapStackArgs(environment_suffix='test', tags={'Env': 'test'})
            stack = TapStack('test-stack', args)

            # Verify basic properties
            self.assertEqual(stack.environment_suffix, 'test')
            self.assertIn('Env', stack.tags)
            self.assertEqual(stack.tags['Environment'], 'test')

    @patch('lib.tap_stack.s3')
    def test_s3_bucket_creation(self, mock_s3):
        """Test S3 bucket creation with correct configuration."""
        # Mock the S3 bucket creation
        mock_bucket = MagicMock()
        mock_s3.Bucket.return_value = mock_bucket

        with patch('pulumi.ComponentResource.__init__'):
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            # Verify S3 bucket was created with correct parameters
            mock_s3.Bucket.assert_called()
            call_args = mock_s3.Bucket.call_args
            self.assertIn('inventory-uploads-test', call_args[0])

    @patch('lib.tap_stack.dynamodb')
    def test_dynamodb_table_creation(self, mock_dynamodb):
        """Test DynamoDB table creation with correct configuration."""
        # Mock the DynamoDB table creation
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table

        with patch('pulumi.ComponentResource.__init__'):
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            # Verify DynamoDB table was created
            mock_dynamodb.Table.assert_called()
            call_args = mock_dynamodb.Table.call_args
            self.assertIn('inventory-data-test', call_args[0])

    @patch('lib.tap_stack.lambda_')
    def test_lambda_function_creation(self, mock_lambda):
        """Test Lambda function creation with proper configuration."""
        # Mock Lambda function creation
        mock_function = MagicMock()
        mock_lambda.Function.return_value = mock_function

        with patch('pulumi.ComponentResource.__init__'):
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            # Verify Lambda functions were created
            self.assertEqual(mock_lambda.Function.call_count, 2)  # processor and summary

    @patch('lib.tap_stack.sqs')
    def test_dlq_creation(self, mock_sqs):
        """Test Dead Letter Queue creation."""
        # Mock SQS queue creation
        mock_queue = MagicMock()
        mock_sqs.Queue.return_value = mock_queue

        with patch('pulumi.ComponentResource.__init__'):
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            # Verify DLQ was created
            mock_sqs.Queue.assert_called()
            call_args = mock_sqs.Queue.call_args
            self.assertIn('inventory-processing-dlq-test', call_args[0])

    @patch('lib.tap_stack.cloudwatch')
    def test_cloudwatch_alarm_creation(self, mock_cloudwatch):
        """Test CloudWatch alarm creation for Lambda errors."""
        # Mock CloudWatch alarm creation
        mock_alarm = MagicMock()
        mock_cloudwatch.MetricAlarm.return_value = mock_alarm

        with patch('pulumi.ComponentResource.__init__'):
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            # Verify CloudWatch alarm was created
            mock_cloudwatch.MetricAlarm.assert_called()

    @patch('lib.tap_stack.events')
    def test_eventbridge_rule_creation(self, mock_events):
        """Test EventBridge rule creation for S3 events."""
        # Mock EventBridge rule creation
        mock_rule = MagicMock()
        mock_events.Rule.return_value = mock_rule

        with patch('pulumi.ComponentResource.__init__'):
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            # Verify EventBridge rule was created
            mock_events.Rule.assert_called()

    @patch('lib.tap_stack.iam')
    def test_iam_role_creation(self, mock_iam):
        """Test IAM role creation for Lambda functions."""
        # Mock IAM role creation
        mock_role = MagicMock()
        mock_iam.Role.return_value = mock_role

        # Mock get_policy_document
        mock_policy_doc = MagicMock()
        mock_policy_doc.json = '{"Version": "2012-10-17"}'
        mock_iam.get_policy_document.return_value = mock_policy_doc

        with patch('pulumi.ComponentResource.__init__'):
            args = TapStackArgs(environment_suffix='test')
            stack = TapStack('test-stack', args)

            # Verify IAM roles were created
            self.assertTrue(mock_iam.Role.call_count >= 1)

    def test_environment_suffix_in_resource_names(self):
        """Test that environment suffix is properly appended to resource names."""
        with patch('pulumi.ComponentResource.__init__'):
            with patch('lib.tap_stack.s3.Bucket') as mock_bucket:
                with patch('lib.tap_stack.dynamodb.Table') as mock_table:
                    args = TapStackArgs(environment_suffix='prod123')
                    stack = TapStack('test-stack', args)

                    # Check S3 bucket name includes suffix
                    bucket_call = mock_bucket.call_args[0][0]
                    self.assertIn('prod123', bucket_call)

                    # Check DynamoDB table name includes suffix
                    table_call = mock_table.call_args[0][0]
                    self.assertIn('prod123', table_call)

    def test_tags_propagation(self):
        """Test that tags are properly propagated to resources."""
        custom_tags = {'Project': 'Test', 'Owner': 'TeamA'}

        with patch('pulumi.ComponentResource.__init__'):
            with patch('lib.tap_stack.s3.Bucket') as mock_bucket:
                args = TapStackArgs(environment_suffix='test', tags=custom_tags)
                stack = TapStack('test-stack', args)

                # Verify tags are passed to resources
                call_kwargs = mock_bucket.call_args[1]
                self.assertIn('tags', call_kwargs)
                self.assertIn('Project', call_kwargs['tags'])
                self.assertEqual(call_kwargs['tags']['Project'], 'Test')


if __name__ == '__main__':
    unittest.main()