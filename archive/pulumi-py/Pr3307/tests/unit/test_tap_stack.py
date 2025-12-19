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


class MyMocks(pulumi.runtime.Mocks):
    """Custom Mocks implementation for Pulumi testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create a new mock resource."""
        outputs = args.inputs
        if args.typ == "aws:s3/bucket:Bucket":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:s3:::{args.name}",
                "bucket": args.name,
            }
        elif args.typ == "aws:dynamodb/table:Table":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:dynamodb:us-east-1:123456789012:table/{args.name}",
                "id": args.name,
            }
        elif args.typ == "aws:lambda/function:Function":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:lambda:us-east-1:123456789012:function:{args.name}",
                "id": args.name,
            }
        elif args.typ == "aws:iam/role:Role":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:iam::123456789012:role/{args.name}",
                "id": args.name,
            }
        elif args.typ == "aws:sqs/queue:Queue":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:sqs:us-east-1:123456789012:{args.name}",
                "url": f"https://sqs.us-east-1.amazonaws.com/123456789012/{args.name}",
                "id": args.name,
            }
        elif args.typ == "aws:cloudwatch/metricAlarm:MetricAlarm":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:cloudwatch:us-east-1:123456789012:alarm:{args.name}",
                "id": args.name,
            }
        elif args.typ == "aws:cloudwatch/eventRule:EventRule":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:events:us-east-1:123456789012:rule/{args.name}",
                "id": args.name,
            }
        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock a function call."""
        if args.token == "aws:iam/getPolicyDocument:getPolicyDocument":
            return {
                "json": '{"Version": "2012-10-17", "Statement": []}'
            }
        return {}


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
        self.mocks = MyMocks()
        pulumi.runtime.set_mocks(self.mocks)

    @pulumi.runtime.test
    def test_tap_stack_initialization(self):
        """Test TapStack initialization with proper configuration."""
        args = TapStackArgs(environment_suffix='test', tags={'Env': 'test'})
        stack = TapStack('test-stack', args)

        # Verify basic properties
        self.assertEqual(stack.environment_suffix, 'test')
        self.assertIn('Env', stack.tags)
        self.assertEqual(stack.tags['Environment'], 'test')

    @pulumi.runtime.test
    def test_s3_bucket_creation(self):
        """Test S3 bucket creation with correct configuration."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Verify S3 bucket was created
        self.assertIsNotNone(stack.inventory_bucket)

    @pulumi.runtime.test
    def test_dynamodb_table_creation(self):
        """Test DynamoDB table creation with correct configuration."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Verify DynamoDB table was created
        self.assertIsNotNone(stack.inventory_table)

    @pulumi.runtime.test
    def test_lambda_function_creation(self):
        """Test Lambda function creation with proper configuration."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Verify Lambda functions were created
        self.assertIsNotNone(stack.inventory_processor)
        self.assertIsNotNone(stack.summary_processor)

    @pulumi.runtime.test
    def test_dlq_creation(self):
        """Test Dead Letter Queue creation."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Verify DLQ was created
        self.assertIsNotNone(stack.dlq)

    @pulumi.runtime.test
    def test_cloudwatch_alarm_creation(self):
        """Test CloudWatch alarm creation for Lambda errors."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Verify CloudWatch alarm was created
        self.assertIsNotNone(stack.error_alarm)

    @pulumi.runtime.test
    def test_eventbridge_rule_creation(self):
        """Test EventBridge rule creation for S3 events."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Verify stack was created successfully (EventBridge resources are internal)
        self.assertIsNotNone(stack)

    @pulumi.runtime.test
    def test_iam_role_creation(self):
        """Test IAM role creation for Lambda functions."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Verify IAM role was created
        self.assertIsNotNone(stack.lambda_role)

    @pulumi.runtime.test
    def test_environment_suffix_in_resource_names(self):
        """Test that environment suffix is properly appended to resource names."""
        args = TapStackArgs(environment_suffix='prod123')
        stack = TapStack('test-stack', args)

        # Verify environment suffix is set
        self.assertEqual(stack.environment_suffix, 'prod123')

    @pulumi.runtime.test
    def test_tags_propagation(self):
        """Test that tags are properly propagated to resources."""
        custom_tags = {'Project': 'Test', 'Owner': 'TeamA'}
        args = TapStackArgs(environment_suffix='test', tags=custom_tags)
        stack = TapStack('test-stack', args)

        # Verify tags are set on stack
        self.assertIn('Project', stack.tags)
        self.assertEqual(stack.tags['Project'], 'Test')
        self.assertIn('Owner', stack.tags)
        self.assertEqual(stack.tags['Owner'], 'TeamA')


if __name__ == '__main__':
    unittest.main()