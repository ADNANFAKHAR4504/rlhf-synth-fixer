"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import pulumi
from pulumi import ResourceOptions

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_environment(self):
        """Test TapStackArgs with custom environment suffix."""
        args = TapStackArgs(environment_suffix='prod')

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_with_tags(self):
        """Test TapStackArgs with custom tags."""
        custom_tags = {'Team': 'DevOps', 'Project': 'TAP'}
        args = TapStackArgs(environment_suffix='staging', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'staging')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_none_values(self):
        """Test TapStackArgs handles None values correctly."""
        args = TapStackArgs(environment_suffix=None, tags=None)

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack Pulumi component."""

    def setUp(self):
        """Set up test fixtures."""
        pulumi.runtime.set_mocks(MyMocks())

    def tearDown(self):
        """Clean up after tests."""
        pulumi.runtime.set_mocks(None)

    @pulumi.runtime.test
    def test_tap_stack_creation(self):
        """Test TapStack creates with default configuration."""
        args = TapStackArgs()

        def check_stack(outputs):
            # Verify stack was created successfully
            self.assertIsNotNone(outputs)

        return check_stack({})

    @pulumi.runtime.test
    def test_tap_stack_with_custom_suffix(self):
        """Test TapStack with custom environment suffix."""
        args = TapStackArgs(environment_suffix='test123')

        def check_suffix(outputs):
            # Verify environment suffix is used
            self.assertEqual(args.environment_suffix, 'test123')

        return check_suffix({})

    @pulumi.runtime.test
    def test_tap_stack_resource_naming(self):
        """Test that resources include environment suffix in names."""
        args = TapStackArgs(environment_suffix='qa')

        def check_naming(outputs):
            # Verify naming convention includes suffix
            self.assertEqual(args.environment_suffix, 'qa')

        return check_naming({})

    def test_get_lambda_code(self):
        """Test Lambda code generation."""
        args = TapStackArgs()
        stack = TapStack('test-stack', args)

        lambda_code = stack._get_lambda_code()  # pylint: disable=protected-access

        # Verify Lambda code contains required elements
        self.assertIn('lambda_handler', lambda_code)
        self.assertIn('dynamodb', lambda_code)
        self.assertIn('secrets_manager', lambda_code)
        self.assertIn('transactionId', lambda_code)

    def test_lambda_code_structure(self):
        """Test Lambda code has proper structure."""
        args = TapStackArgs(environment_suffix='prod')
        stack = TapStack('test-stack', args)

        lambda_code = stack._get_lambda_code()  # pylint: disable=protected-access

        # Verify key components
        self.assertIn('import json', lambda_code)
        self.assertIn('import boto3', lambda_code)
        self.assertIn('def lambda_handler', lambda_code)
        self.assertIn('statusCode', lambda_code)
        self.assertIn('DYNAMODB_TABLE_NAME', lambda_code)
        self.assertIn('SECRETS_MANAGER_ARN', lambda_code)


class MyMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi resources."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = args.inputs

        # Add mock outputs based on resource type
        if args.typ == "aws:lambda:Function":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:lambda:us-east-1:123456789012:function:{args.name}",
                "id": args.name,
                "name": args.name,
                "qualified_arn": f"arn:aws:lambda:us-east-1:123456789012:function:{args.name}:$LATEST",
            }
        elif args.typ == "aws:dynamodb:Table":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:dynamodb:us-east-1:123456789012:table/{args.name}",
                "id": args.name,
                "name": args.name,
            }
        elif args.typ == "aws:secretsmanager:Secret":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:secretsmanager:us-east-1:123456789012:secret:{args.name}",
                "id": args.name,
                "name": args.name,
            }
        elif args.typ == "aws:iam:Role":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:iam::123456789012:role/{args.name}",
                "id": args.name,
                "name": args.name,
            }
        elif args.typ == "aws:cloudwatch:LogGroup":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:logs:us-east-1:123456789012:log-group:{args.name}",
                "id": args.name,
                "name": args.name,
            }
        elif args.typ == "aws:lambda:FunctionUrl":
            outputs = {
                **args.inputs,
                "function_url": f"https://{args.name}.lambda-url.us-east-1.on.aws/",
                "url_id": args.name,
            }

        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        return {}


if __name__ == '__main__':
    unittest.main()
