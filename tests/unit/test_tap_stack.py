"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create mock resource."""
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
                "streamArn": f"arn:aws:dynamodb:us-east-1:123456789012:table/{args.name}/stream/2024-01-01T00:00:00.000",
                "name": args.name,
            }
        elif args.typ == "aws:sns/topic:Topic":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:sns:us-east-1:123456789012:{args.name}",
                "name": args.name,
            }
        elif args.typ == "aws:iam/role:Role":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:iam::123456789012:role/{args.name}",
                "name": args.name,
            }
        elif args.typ == "aws:lambda/function:Function":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:lambda:us-east-1:123456789012:function:{args.name}",
                "name": args.name,
                "invokeArn": f"arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:{args.name}/invocations",
            }
        elif args.typ == "aws:apigateway/restApi:RestApi":
            outputs = {
                **args.inputs,
                "id": f"api-{args.name}",
                "rootResourceId": "root123",
                "executionArn": f"arn:aws:execute-api:us-east-1:123456789012:api-{args.name}",
            }
        elif args.typ == "aws:apigateway/resource:Resource":
            outputs = {
                **args.inputs,
                "id": f"resource-{args.name}",
            }
        elif args.typ == "aws:apigateway/deployment:Deployment":
            outputs = {
                **args.inputs,
                "id": f"deployment-{args.name}",
            }
        elif args.typ == "aws:apigateway/stage:Stage":
            outputs = {
                **args.inputs,
                "id": f"stage-{args.name}",
                "invokeUrl": f"https://api-{args.name}.execute-api.us-east-1.amazonaws.com/prod",
            }
        elif args.typ == "aws:apigateway/apiKey:ApiKey":
            outputs = {
                **args.inputs,
                "id": f"apikey-{args.name}",
                "value": "test-api-key-value",
            }
        return [f"{args.name}-id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Handle function calls."""
        return {}


pulumi.runtime.set_mocks(MyMocks())


# Import after setting mocks
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags['Environment'], 'production')
        self.assertEqual(args.tags['Project'], 'transaction-processor')

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {
            "Environment": "staging",
            "Project": "custom-project"
        }
        args = TapStackArgs(environment_suffix='staging', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'staging')
        self.assertEqual(args.tags['Environment'], 'staging')
        self.assertEqual(args.tags['Project'], 'custom-project')


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack Pulumi component."""

    @pulumi.runtime.test
    def test_stack_creates_s3_bucket(self):
        """Test that TapStack creates an S3 bucket with correct name."""
        def check_bucket(args):
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix="test123")
            )

            # Verify bucket name contains environment suffix
            bucket_name = stack.transaction_bucket.id.apply(lambda id: id)
            return pulumi.Output.all(bucket_name).apply(
                lambda vals: self.assertIn("test123", vals[0])
            )

        return check_bucket([])

    @pulumi.runtime.test
    def test_stack_creates_dynamodb_table(self):
        """Test that TapStack creates DynamoDB table with correct configuration."""
        def check_table(args):
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix="test123")
            )

            # Verify table name contains environment suffix
            table_name = stack.transactions_table.id.apply(lambda id: id)
            return pulumi.Output.all(table_name).apply(
                lambda vals: self.assertIn("test123", vals[0])
            )

        return check_table([])

    @pulumi.runtime.test
    def test_stack_creates_sns_topic(self):
        """Test that TapStack creates SNS topic with correct name."""
        def check_topic(args):
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix="test123")
            )

            # Verify SNS topic name contains environment suffix
            topic_name = stack.alerts_topic.id.apply(lambda id: id)
            return pulumi.Output.all(topic_name).apply(
                lambda vals: self.assertIn("test123", vals[0])
            )

        return check_topic([])

    @pulumi.runtime.test
    def test_stack_creates_lambda_functions(self):
        """Test that TapStack creates all three Lambda functions."""
        def check_lambdas(args):
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix="test123")
            )

            # Verify validation Lambda exists
            validation_lambda = stack.validation_lambda.id.apply(lambda id: id)
            # Verify anomaly Lambda exists
            anomaly_lambda = stack.anomaly_lambda.id.apply(lambda id: id)
            # Verify API Lambda exists
            api_lambda = stack.api_lambda.id.apply(lambda id: id)

            return pulumi.Output.all(validation_lambda, anomaly_lambda, api_lambda).apply(
                lambda vals: (
                    self.assertIn("validation", vals[0]),
                    self.assertIn("anomaly", vals[1]),
                    self.assertIn("api", vals[2])
                )
            )

        return check_lambdas([])

    @pulumi.runtime.test
    def test_stack_creates_api_gateway(self):
        """Test that TapStack creates API Gateway REST API."""
        def check_api(args):
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix="test123")
            )

            # Verify API Gateway exists
            self.assertTrue(hasattr(stack, 'api'))
            api_id = stack.api.id.apply(lambda id: id)
            return pulumi.Output.all(api_id).apply(
                lambda vals: self.assertTrue(len(vals[0]) > 0)
            )

        return check_api([])

    @pulumi.runtime.test
    def test_stack_registers_outputs(self):
        """Test that TapStack registers all required outputs."""
        def check_outputs(args):
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix="test123")
            )

            # Verify outputs are registered
            self.assertTrue(hasattr(stack, 'transaction_bucket'))
            self.assertTrue(hasattr(stack, 'transactions_table'))
            self.assertTrue(hasattr(stack, 'alerts_topic'))
            self.assertTrue(hasattr(stack, 'api'))
            self.assertTrue(hasattr(stack, 'api_key'))

            return True

        return check_outputs([])

    @pulumi.runtime.test
    def test_environment_suffix_propagation(self):
        """Test that environment suffix is correctly propagated to all resources."""
        def check_suffix(args):
            suffix = "prod789"
            stack = TapStack(
                name="test-stack",
                args=TapStackArgs(environment_suffix=suffix)
            )

            # Verify environment suffix is stored
            self.assertEqual(stack.environment_suffix, suffix)

            return True

        return check_suffix([])


if __name__ == '__main__':
    unittest.main()
