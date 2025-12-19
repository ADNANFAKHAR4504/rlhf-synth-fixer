"""
test_tap_stack.py

Unit tests for the TAP infrastructure Pulumi stack.
Tests infrastructure resource creation using Pulumi test utilities.
"""

import os
import unittest
from unittest.mock import patch, MagicMock, ANY
import pulumi


class PulumiMocks(pulumi.runtime.Mocks):
    """Mock Pulumi runtime for unit testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = args.inputs
        if args.typ == "aws:s3/bucket:Bucket":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": f"arn:aws:s3:::{args.name}",
                "bucket": args.inputs.get("bucket", args.name),
            }
        elif args.typ == "aws:dynamodb/table:Table":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": f"arn:aws:dynamodb:us-east-2:123456789012:table/{args.name}",
                "stream_arn": f"arn:aws:dynamodb:us-east-2:123456789012:table/{args.name}/stream/2024-01-01T00:00:00.000",
            }
        elif args.typ == "aws:lambda/function:Function":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": f"arn:aws:lambda:us-east-2:123456789012:function:{args.name}",
                "invoke_arn": f"arn:aws:apigateway:us-east-2:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-2:123456789012:function:{args.name}/invocations",
            }
        elif args.typ == "aws:iam/role:Role":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": f"arn:aws:iam::123456789012:role/{args.name}",
            }
        elif args.typ == "aws:apigateway/restApi:RestApi":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "root_resource_id": "root123",
                "execution_arn": f"arn:aws:execute-api:us-east-2:123456789012:{args.name}",
            }
        elif args.typ == "aws:sqs/queue:Queue":
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": f"arn:aws:sqs:us-east-2:123456789012:{args.name}",
            }
        else:
            outputs = {
                **args.inputs,
                "id": f"{args.name}-id",
                "arn": f"arn:aws::{args.name}",
            }
        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        if args.token == "aws:index/getRegion:getRegion":
            return {"name": "us-east-2"}
        return {}


pulumi.runtime.set_mocks(PulumiMocks())


class TestTapStack(unittest.TestCase):
    """Test cases for TAP infrastructure stack."""

    @classmethod
    def setUpClass(cls):
        """Set up test environment."""
        os.environ["ENVIRONMENT_SUFFIX"] = "test"

    @pulumi.runtime.test
    def test_dynamodb_table_created(self):
        """Test that DynamoDB table is created with correct configuration."""
        import lib.tap_stack as stack

        # Verify table has correct name with environment suffix
        def check_name(name):
            self.assertIn("test", name)
            return name

        stack.transactions_table.name.apply(check_name)

    @pulumi.runtime.test
    def test_lambda_functions_created(self):
        """Test that all three Lambda functions are created."""
        import lib.tap_stack as stack

        # Verify webhook lambda
        self.assertIsNotNone(stack.webhook_lambda)

        def check_webhook_name(name):
            self.assertIn("test", name)
            return name
        stack.webhook_lambda.name.apply(check_webhook_name)

        # Verify analytics lambda
        self.assertIsNotNone(stack.analytics_lambda)

        def check_analytics_name(name):
            self.assertIn("test", name)
            return name
        stack.analytics_lambda.name.apply(check_analytics_name)

        # Verify archival lambda
        self.assertIsNotNone(stack.archival_lambda)

        def check_archival_name(name):
            self.assertIn("test", name)
            return name
        stack.archival_lambda.name.apply(check_archival_name)

    @pulumi.runtime.test
    def test_s3_bucket_created(self):
        """Test that S3 audit bucket is created."""
        import lib.tap_stack as stack

        # Verify bucket exists
        self.assertIsNotNone(stack.audit_bucket)

        def check_bucket_name(name):
            self.assertIn("test", name)
            return name
        stack.audit_bucket.bucket.apply(check_bucket_name)

    @pulumi.runtime.test
    def test_api_gateway_created(self):
        """Test that API Gateway is created."""
        import lib.tap_stack as stack

        # Verify API Gateway
        self.assertIsNotNone(stack.api)

        def check_api_name(name):
            self.assertIn("test", name)
            return name
        stack.api.name.apply(check_api_name)

        # Verify API key required
        self.assertIsNotNone(stack.api_key)

    @pulumi.runtime.test
    def test_sqs_dlqs_created(self):
        """Test that SQS dead letter queues are created."""
        import lib.tap_stack as stack

        # Verify webhook DLQ
        self.assertIsNotNone(stack.webhook_dlq)

        def check_webhook_dlq(name):
            self.assertIn("test", name)
            return name
        stack.webhook_dlq.name.apply(check_webhook_dlq)

        # Verify analytics DLQ
        self.assertIsNotNone(stack.analytics_dlq)

        def check_analytics_dlq(name):
            self.assertIn("test", name)
            return name
        stack.analytics_dlq.name.apply(check_analytics_dlq)

        # Verify archival DLQ
        self.assertIsNotNone(stack.archival_dlq)

        def check_archival_dlq(name):
            self.assertIn("test", name)
            return name
        stack.archival_dlq.name.apply(check_archival_dlq)

    @pulumi.runtime.test
    def test_cloudwatch_alarms_created(self):
        """Test that CloudWatch alarms are created for all Lambdas."""
        import lib.tap_stack as stack

        # Verify alarms exist
        self.assertIsNotNone(stack.webhook_error_alarm)
        self.assertIsNotNone(stack.analytics_error_alarm)
        self.assertIsNotNone(stack.archival_error_alarm)

    @pulumi.runtime.test
    def test_iam_roles_created(self):
        """Test that IAM roles are created for all Lambdas."""
        import lib.tap_stack as stack

        # Verify roles exist
        self.assertIsNotNone(stack.webhook_lambda_role)
        self.assertIsNotNone(stack.analytics_lambda_role)
        self.assertIsNotNone(stack.archival_lambda_role)

    @pulumi.runtime.test
    def test_environment_suffix_used(self):
        """Test that environment suffix is applied to resource names."""
        import lib.tap_stack as stack

        # Verify environment suffix in configuration
        self.assertEqual(stack.environment_suffix, "test")

        # Verify tags include environment
        self.assertEqual(stack.common_tags["Environment"], "test")
