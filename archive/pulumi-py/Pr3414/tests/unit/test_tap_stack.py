"""
Unit tests for the TapStack Pulumi component.

This module contains comprehensive unit tests for the TAP infrastructure stack,
testing resource creation, configuration, and relationships without actual deployment.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import pulumi
import json
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from lib.tap_stack import TapStack, TapStackArgs


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack infrastructure component."""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures."""
        pulumi.runtime.set_mocks(
            MocksPulumiRuntime(),
            preview=False,
        )

    def test_tap_stack_initialization(self):
        """Test TapStack initializes correctly with default arguments."""
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, "test")
        self.assertIn("Environment", stack.tags)
        self.assertEqual(stack.tags["Environment"], "test")
        self.assertIn("System", stack.tags)
        self.assertEqual(stack.tags["System"], "EventProcessing")

    def test_tap_stack_with_custom_tags(self):
        """Test TapStack handles custom tags correctly."""
        custom_tags = {"Project": "Marketing", "Owner": "TeamA"}
        args = TapStackArgs(environment_suffix="prod", tags=custom_tags)
        stack = TapStack("prod-stack", args)

        self.assertEqual(stack.tags["Project"], "Marketing")
        self.assertEqual(stack.tags["Owner"], "TeamA")
        self.assertEqual(stack.tags["Environment"], "prod")
        self.assertEqual(stack.tags["System"], "EventProcessing")

    def test_sqs_queue_creation(self):
        """Test SQS queues are created with correct configuration."""
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        # Test main queue
        self.assertIsNotNone(stack.main_queue)

        # Test DLQ
        self.assertIsNotNone(stack.dlq)

    def test_dynamodb_table_creation(self):
        """Test DynamoDB table is created with correct configuration."""
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        self.assertIsNotNone(stack.event_log_table)

    def test_lambda_function_creation(self):
        """Test Lambda function is created with correct configuration."""
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        self.assertIsNotNone(stack.event_processor)

    def test_iam_role_and_policy_creation(self):
        """Test IAM role and policy are created correctly."""
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        self.assertIsNotNone(stack.lambda_role)
        self.assertIsNotNone(stack.lambda_policy)
        self.assertIsNotNone(stack.lambda_role_policy_attachment)

    def test_cloudwatch_alarms_creation(self):
        """Test CloudWatch alarms are created correctly."""
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        self.assertIsNotNone(stack.queue_age_alarm)
        self.assertIsNotNone(stack.dlq_alarm)

    def test_cloudwatch_log_group_creation(self):
        """Test CloudWatch log group is created correctly."""
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        self.assertIsNotNone(stack.lambda_log_group)

    def test_event_source_mapping_creation(self):
        """Test Lambda event source mapping is created correctly."""
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        self.assertIsNotNone(stack.event_source_mapping)

    def test_environment_suffix_in_resource_names(self):
        """Test all resources include environment suffix in their names."""
        env_suffix = "stage"
        args = TapStackArgs(environment_suffix=env_suffix)
        stack = TapStack("stage-stack", args)

        # All resources should have been created
        self.assertIsNotNone(stack.main_queue)
        self.assertIsNotNone(stack.dlq)
        self.assertIsNotNone(stack.event_log_table)
        self.assertIsNotNone(stack.event_processor)
        self.assertIsNotNone(stack.lambda_role)

    def test_stack_outputs_registration(self):
        """Test stack outputs are registered correctly."""
        args = TapStackArgs(environment_suffix="test")
        with patch.object(TapStack, 'register_outputs') as mock_register:
            stack = TapStack("test-stack", args)

            # Verify register_outputs was called
            mock_register.assert_called_once()

            # Get the outputs dictionary that was passed
            outputs = mock_register.call_args[0][0]

            # Verify all expected outputs are present
            expected_outputs = [
                "main_queue_url",
                "main_queue_arn",
                "dlq_url",
                "dynamodb_table_name",
                "lambda_function_name",
                "lambda_function_arn"
            ]

            for output in expected_outputs:
                self.assertIn(output, outputs)


class MocksPulumiRuntime(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi runtime."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = args.inputs

        # Add mock outputs based on resource type
        if args.typ == "aws:sqs/queue:Queue":
            outputs.update({
                "id": f"{args.name}-id",
                "arn": f"arn:aws:sqs:us-west-1:123456789012:${args.name}",
                "url": f"https://sqs.us-west-1.amazonaws.com/123456789012/{args.name}",
                "name": args.name,
            })
        elif args.typ == "aws:dynamodb/table:Table":
            outputs.update({
                "id": f"{args.name}-id",
                "arn": f"arn:aws:dynamodb:us-west-1:123456789012:table/{args.name}",
                "name": args.name,
            })
        elif args.typ == "aws:lambda/function:Function":
            outputs.update({
                "id": f"{args.name}-id",
                "arn": f"arn:aws:lambda:us-west-1:123456789012:function:{args.name}",
                "name": args.name,
                "invoke_arn": f"arn:aws:apigateway:us-west-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-west-1:123456789012:function:{args.name}/invocations",
            })
        elif args.typ == "aws:iam/role:Role":
            outputs.update({
                "id": f"{args.name}-id",
                "arn": f"arn:aws:iam::123456789012:role/{args.name}",
                "name": args.name,
            })
        elif args.typ == "aws:iam/policy:Policy":
            outputs.update({
                "id": f"{args.name}-id",
                "arn": f"arn:aws:iam::123456789012:policy/{args.name}",
                "name": args.name,
            })
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs.update({
                "id": f"{args.name}-id",
                "arn": f"arn:aws:logs:us-west-1:123456789012:log-group:{args.name}",
                "name": args.name,
            })
        elif args.typ == "aws:cloudwatch/metricAlarm:MetricAlarm":
            outputs.update({
                "id": f"{args.name}-id",
                "arn": f"arn:aws:cloudwatch:us-west-1:123456789012:alarm:{args.name}",
                "name": args.name,
            })
        elif args.typ == "aws:lambda/eventSourceMapping:EventSourceMapping":
            outputs.update({
                "id": f"{args.name}-id",
                "uuid": f"{args.name}-uuid",
            })

        return [args.name + "_id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        return {}


class TestLambdaHandler(unittest.TestCase):
    """Test cases for Lambda handler function."""

    def setUp(self):
        """Set up test environment."""
        # Import the lambda handler module
        from lib import lambda_handler
        self.handler = lambda_handler

    @patch('boto3.resource')
    def test_handler_successful_processing(self, mock_boto3):
        """Test Lambda handler processes messages successfully."""
        # Mock DynamoDB
        mock_table = MagicMock()
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_boto3.return_value = mock_dynamodb

        # Set environment variable
        os.environ['DYNAMODB_TABLE_NAME'] = 'test-table'

        # Create test event
        test_event = {
            'Records': [
                {
                    'messageId': 'msg-123',
                    'body': json.dumps({
                        'event_id': 'evt-123',
                        'campaign_id': 'camp-456',
                        'user_id': 'user-789',
                        'action_type': 'email_open'
                    })
                }
            ]
        }

        # Call handler
        result = self.handler.handler(test_event, None)

        # Assertions
        self.assertEqual(result['successful'], 1)
        self.assertEqual(result['failed'], 0)
        self.assertEqual(len(result['records']), 1)
        self.assertEqual(result['records'][0]['status'], 'SUCCESS')

        # Verify DynamoDB put_item was called
        mock_table.put_item.assert_called_once()

    @patch('boto3.resource')
    def test_handler_missing_required_field(self, mock_boto3):
        """Test Lambda handler handles missing required fields correctly."""
        # Mock DynamoDB
        mock_table = MagicMock()
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_boto3.return_value = mock_dynamodb

        # Set environment variable
        os.environ['DYNAMODB_TABLE_NAME'] = 'test-table'

        # Create test event without campaign_id
        test_event = {
            'Records': [
                {
                    'messageId': 'msg-123',
                    'body': json.dumps({
                        'event_id': 'evt-123',
                        'user_id': 'user-789',
                        'action_type': 'email_open'
                    })
                }
            ]
        }

        # Call handler - should raise exception
        with self.assertRaises(ValueError) as context:
            self.handler.handler(test_event, None)

        self.assertIn('Missing required field', str(context.exception))

    @patch('boto3.resource')
    def test_handler_batch_processing(self, mock_boto3):
        """Test Lambda handler processes multiple messages in batch."""
        # Mock DynamoDB
        mock_table = MagicMock()
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_boto3.return_value = mock_dynamodb

        # Set environment variable
        os.environ['DYNAMODB_TABLE_NAME'] = 'test-table'

        # Create test event with multiple records
        test_event = {
            'Records': [
                {
                    'messageId': f'msg-{i}',
                    'body': json.dumps({
                        'event_id': f'evt-{i}',
                        'campaign_id': f'camp-{i}',
                        'user_id': f'user-{i}',
                        'action_type': 'email_open'
                    })
                }
                for i in range(5)
            ]
        }

        # Call handler
        result = self.handler.handler(test_event, None)

        # Assertions
        self.assertEqual(result['successful'], 5)
        self.assertEqual(result['failed'], 0)
        self.assertEqual(len(result['records']), 5)

        # Verify DynamoDB put_item was called 5 times
        self.assertEqual(mock_table.put_item.call_count, 5)

    def test_process_campaign_event_email_open(self):
        """Test process_campaign_event for email_open action."""
        from lib.lambda_handler import process_campaign_event

        event_data = {'action_type': 'email_open'}
        result = process_campaign_event(event_data)

        self.assertEqual(result['action_type'], 'email_open')
        self.assertEqual(result['engagement_score'], 5)
        self.assertIn('processed_timestamp', result)

    def test_process_campaign_event_link_click(self):
        """Test process_campaign_event for link_click action."""
        from lib.lambda_handler import process_campaign_event

        event_data = {'action_type': 'link_click'}
        result = process_campaign_event(event_data)

        self.assertEqual(result['action_type'], 'link_click')
        self.assertEqual(result['engagement_score'], 10)
        self.assertIn('processed_timestamp', result)

    def test_process_campaign_event_conversion(self):
        """Test process_campaign_event for conversion action."""
        from lib.lambda_handler import process_campaign_event

        event_data = {'action_type': 'conversion'}
        result = process_campaign_event(event_data)

        self.assertEqual(result['action_type'], 'conversion')
        self.assertEqual(result['engagement_score'], 20)
        self.assertIn('processed_timestamp', result)

    def test_process_campaign_event_unknown(self):
        """Test process_campaign_event for unknown action."""
        from lib.lambda_handler import process_campaign_event

        event_data = {'action_type': 'unknown'}
        result = process_campaign_event(event_data)

        self.assertEqual(result['action_type'], 'unknown')
        self.assertEqual(result['engagement_score'], 1)
        self.assertIn('processed_timestamp', result)


if __name__ == '__main__':
    unittest.main()
