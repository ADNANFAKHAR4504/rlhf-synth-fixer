"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import json
import unittest
from unittest.mock import patch, MagicMock, Mock
import os
import sys

# Add the parent directory to path to import the module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


class MyMocks(pulumi.runtime.Mocks):
    """Mock class for Pulumi resources during testing."""

    def new_resource(self, args):
        """Create a new mock resource."""
        outputs = args.inputs
        if args.typ == "aws:s3/bucket:Bucket":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": f"arn:aws:s3:::{args.name}",
                "bucket": args.name,
            }
        elif args.typ == "aws:dynamodb/table:Table":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": f"arn:aws:dynamodb:us-east-2:123456789012:table/{args.name}",
                "name": args.name,
            }
        elif args.typ == "aws:sns/topic:Topic":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": f"arn:aws:sns:us-east-2:123456789012:{args.name}",
            }
        elif args.typ == "aws:dynamodb/table:Table":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": f"arn:aws:dynamodb:us-east-2:123456789012:table/{args.name}",
                "name": args.inputs.get("name", args.name),
            }
        elif args.typ == "aws:lambda/function:Function":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": f"arn:aws:lambda:us-east-2:123456789012:function:{args.name}",
                "invoke_arn": f"arn:aws:apigateway:us-east-2:lambda:path/2015-03-31/functions/{args.name}/invocations",
                "name": args.name,
            }
        elif args.typ == "aws:apigateway/restApi:RestApi":
            outputs = {
                **args.inputs,
                "id": "api123",
                "root_resource_id": "root123",
                "execution_arn": f"arn:aws:execute-api:us-east-2:123456789012:api123",
            }
        elif args.typ == "aws:apigateway/stage:Stage":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "stage_name": args.inputs.get("stage_name", "dev"),
                "invoke_url": f"https://api123.execute-api.us-east-2.amazonaws.com/dev",
            }
        elif args.typ == "aws:iam/role:Role":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": f"arn:aws:iam::123456789012:role/{args.name}",
                "name": args.name,
            }
        elif args.typ == "aws:iam/policy:Policy":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": f"arn:aws:iam::123456789012:policy/{args.name}",
            }
        else:
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
            }

        # Return the resource ID and outputs
        return [args.name + "_id", outputs]

    def call(self, args):
        """Mock function calls."""
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
        custom_tags = {"Project": "Test", "Environment": "prod"}
        args = TapStackArgs(environment_suffix="prod", tags=custom_tags)

        self.assertEqual(args.environment_suffix, "prod")
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_none_suffix(self):
        """Test TapStackArgs with None environment suffix."""
        args = TapStackArgs(environment_suffix=None)
        self.assertEqual(args.environment_suffix, 'dev')


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack Pulumi component."""

    @pulumi.runtime.test
    def test_tap_stack_initialization(self):
        """Test TapStack initialization."""
        def test_initialization():
            args = TapStackArgs(environment_suffix="test")
            stack = TapStack("test-stack", args)

            # Check basic attributes
            self.assertEqual(stack.environment_suffix, "test")
            self.assertIn("Project", stack.tags)
            self.assertIn("Environment", stack.tags)
            self.assertIn("ManagedBy", stack.tags)

        # Run test with mocks
        pulumi.runtime.set_mocks(MyMocks())
        test_initialization()

    @pulumi.runtime.test
    def test_s3_bucket_creation(self):
        """Test S3 bucket resources are created correctly."""
        def test_s3():
            args = TapStackArgs(environment_suffix="test")
            stack = TapStack("test-stack", args)

            # Verify S3 bucket exists
            self.assertIsNotNone(stack.metrics_export_bucket)
            self.assertIsNotNone(stack.metrics_bucket_public_access_block)
            self.assertIsNotNone(stack.metrics_bucket_versioning)
            self.assertIsNotNone(stack.metrics_bucket_encryption)

        pulumi.runtime.set_mocks(MyMocks())
        test_s3()

    @pulumi.runtime.test
    def test_dynamodb_table_creation(self):
        """Test DynamoDB table is created correctly."""
        def test_dynamodb():
            args = TapStackArgs(environment_suffix="test")
            stack = TapStack("test-stack", args)

            # Verify DynamoDB table exists
            self.assertIsNotNone(stack.alert_config_table)

        pulumi.runtime.set_mocks(MyMocks())
        test_dynamodb()

    @pulumi.runtime.test
    def test_sns_topic_creation(self):
        """Test SNS topic is created correctly."""
        def test_sns():
            args = TapStackArgs(environment_suffix="test")
            stack = TapStack("test-stack", args)

            # Verify SNS topic exists
            self.assertIsNotNone(stack.alert_topic)
            # Note: alert_subscription was removed for security (no dummy email endpoints)

        pulumi.runtime.set_mocks(MyMocks())
        test_sns()

    @pulumi.runtime.test
    def test_dynamodb_resources_creation(self):
        """Test DynamoDB tables are created correctly."""
        def test_dynamodb():
            args = TapStackArgs(environment_suffix="test")
            stack = TapStack("test-stack", args)

            # Verify DynamoDB resources exist
            self.assertIsNotNone(stack.metrics_table)
            self.assertIsNotNone(stack.alert_config_table)

        pulumi.runtime.set_mocks(MyMocks())
        test_dynamodb()

    @pulumi.runtime.test
    def test_lambda_function_creation(self):
        """Test Lambda function and related resources are created correctly."""
        def test_lambda():
            args = TapStackArgs(environment_suffix="test")
            stack = TapStack("test-stack", args)

            # Verify Lambda resources exist
            self.assertIsNotNone(stack.lambda_role)
            self.assertIsNotNone(stack.metrics_processor)
            self.assertIsNotNone(stack.lambda_log_group)

        pulumi.runtime.set_mocks(MyMocks())
        test_lambda()

    @pulumi.runtime.test
    def test_api_gateway_creation(self):
        """Test API Gateway resources are created correctly."""
        def test_api():
            args = TapStackArgs(environment_suffix="test")
            stack = TapStack("test-stack", args)

            # Verify API Gateway resources exist
            self.assertIsNotNone(stack.api)
            self.assertIsNotNone(stack.metrics_resource)
            self.assertIsNotNone(stack.metrics_method)
            self.assertIsNotNone(stack.metrics_integration)
            self.assertIsNotNone(stack.api_deployment)
            self.assertIsNotNone(stack.api_stage)
            
            # Verify API security resources exist
            self.assertIsNotNone(stack.api_key)
            self.assertIsNotNone(stack.usage_plan)
            self.assertIsNotNone(stack.usage_plan_key)

        pulumi.runtime.set_mocks(MyMocks())
        test_api()

    @pulumi.runtime.test
    def test_cloudwatch_alarms_creation(self):
        """Test CloudWatch alarms are created correctly."""
        def test_alarms():
            args = TapStackArgs(environment_suffix="test")
            stack = TapStack("test-stack", args)

            # Verify CloudWatch alarms exist
            self.assertIsNotNone(stack.lambda_error_alarm)
            self.assertIsNotNone(stack.lambda_throttle_alarm)

        pulumi.runtime.set_mocks(MyMocks())
        test_alarms()

    @pulumi.runtime.test
    def test_eventbridge_scheduler_creation(self):
        """Test EventBridge scheduler is created correctly."""
        def test_scheduler():
            args = TapStackArgs(environment_suffix="test")
            stack = TapStack("test-stack", args)

            # Verify EventBridge scheduler resources exist
            self.assertIsNotNone(stack.export_schedule_role)
            self.assertIsNotNone(stack.export_schedule)

        pulumi.runtime.set_mocks(MyMocks())
        test_scheduler()

    def test_get_lambda_code(self):
        """Test Lambda function code generation."""
        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        # Get Lambda code
        code = stack.get_lambda_code()

        # Verify code contains expected elements
        self.assertIn("import json", code)
        self.assertIn("import boto3", code)
        self.assertIn("def handler(event, context):", code)
        self.assertIn("write_to_dynamodb", code)
        self.assertIn("check_and_send_alerts", code)
        self.assertIn("export_metrics_to_s3", code)
        self.assertIn("aws_xray_sdk", code)

    @pulumi.runtime.test
    def test_custom_tags_propagation(self):
        """Test that custom tags are properly propagated."""
        def test_tags():
            custom_tags = {"CustomKey": "CustomValue", "Team": "DevOps"}
            args = TapStackArgs(environment_suffix="prod", tags=custom_tags)
            stack = TapStack("test-stack", args)

            # Verify tags include custom and default tags
            self.assertIn("CustomKey", stack.tags)
            self.assertIn("Team", stack.tags)
            self.assertIn("Project", stack.tags)
            self.assertIn("Environment", stack.tags)
            self.assertIn("ManagedBy", stack.tags)
            self.assertEqual(stack.tags["CustomKey"], "CustomValue")
            self.assertEqual(stack.tags["Team"], "DevOps")
            self.assertEqual(stack.tags["Environment"], "prod")

        pulumi.runtime.set_mocks(MyMocks())
        test_tags()

    @pulumi.runtime.test
    def test_environment_suffix_in_resource_names(self):
        """Test that environment suffix is included in resource names."""
        def test_naming():
            args = TapStackArgs(environment_suffix="staging")
            stack = TapStack("test-stack", args)

            # Check that environment suffix is part of the stack
            self.assertEqual(stack.environment_suffix, "staging")

        pulumi.runtime.set_mocks(MyMocks())
        test_naming()


class TestLambdaCodeIntegrity(unittest.TestCase):
    """Test Lambda code for completeness and correctness."""

    def test_lambda_code_has_required_functions(self):
        """Test that Lambda code contains all required functions."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        code = stack.get_lambda_code()

        # Check for required function definitions
        required_functions = [
            "def handler(event, context):",
            "def write_to_dynamodb(",
            "def check_and_send_alerts(",
            "def export_metrics_to_s3("
        ]

        for func in required_functions:
            self.assertIn(func, code, f"Lambda code missing required function: {func}")

    def test_lambda_code_environment_variables(self):
        """Test that Lambda code uses correct environment variables."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        code = stack.get_lambda_code()

        # Check for environment variable usage
        env_vars = [
            "METRICS_TABLE",
            "ALERT_CONFIG_TABLE",
            "ALERT_TOPIC_ARN",
            "METRICS_BUCKET"
        ]

        for var in env_vars:
            self.assertIn(f"os.environ['{var}']", code,
                         f"Lambda code not using environment variable: {var}")

    def test_lambda_code_aws_clients(self):
        """Test that Lambda code initializes required AWS clients."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        code = stack.get_lambda_code()

        # Check for AWS client initialization
        clients = [
            "boto3.resource('dynamodb'",
            "boto3.client('sns'",
            "boto3.client('s3'"
        ]

        for client in clients:
            self.assertIn(client, code, f"Lambda code missing AWS client: {client}")

    def test_lambda_code_xray_integration(self):
        """Test that Lambda code includes X-Ray tracing."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        code = stack.get_lambda_code()

        # Check for X-Ray integration
        self.assertIn("from aws_xray_sdk.core import xray_recorder", code)
        self.assertIn("from aws_xray_sdk.core import patch_all", code)
        self.assertIn("patch_all()", code)
        self.assertIn("with xray_recorder.in_subsegment", code)


if __name__ == '__main__':
    unittest.main()
