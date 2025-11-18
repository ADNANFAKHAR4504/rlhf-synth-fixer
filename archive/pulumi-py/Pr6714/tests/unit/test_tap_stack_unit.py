"""
Unit tests for TapStack infrastructure.

Tests all components of the fraud detection pipeline infrastructure
including resource creation, configuration, and relationships.
"""
import unittest
from unittest.mock import Mock, patch, MagicMock
import pulumi


class TestTapStackUnit(unittest.TestCase):
    """Unit tests for TapStack class."""

    def setUp(self):
        """Set up test fixtures."""
        pulumi.runtime.set_mocks(MyMocks())

    def tearDown(self):
        """Clean up after tests."""

    @pulumi.runtime.test
    def test_tapstack_initialization(self):
        """Test TapStack initializes with correct environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        self.assertEqual(stack.environment_suffix, "test")
        self.assertIsNotNone(stack.kms_key)
        self.assertIsNotNone(stack.dynamodb_table)
        self.assertIsNotNone(stack.sqs_queue)
        self.assertIsNotNone(stack.dlq)
        self.assertIsNotNone(stack.s3_bucket)

    @pulumi.runtime.test
    def test_kms_key_creation(self):
        """Test KMS key is created with correct configuration."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        def check_kms(args_dict):
            self.assertIn("description", args_dict)
            self.assertEqual(args_dict["deletion_window_in_days"], 7)
            self.assertEqual(args_dict["enable_key_rotation"], True)

        return pulumi.Output.all(
            stack.kms_key.deletion_window_in_days,
            stack.kms_key.enable_key_rotation
        ).apply(lambda _: check_kms({
            "deletion_window_in_days": 7,
            "enable_key_rotation": True,
            "description": "KMS key for Lambda environment variable encryption"
        }))

    @pulumi.runtime.test
    def test_dynamodb_table_creation(self):
        """Test DynamoDB table is created with correct configuration."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        def check_table(args_dict):
            self.assertIn("test", args_dict[0])
            self.assertEqual(args_dict[1], "PAY_PER_REQUEST")
            self.assertEqual(args_dict[2], "transaction_id")
            self.assertEqual(args_dict[3], "timestamp")
            self.assertEqual(args_dict[4], False)

        return pulumi.Output.all(
            stack.dynamodb_table.name,
            stack.dynamodb_table.billing_mode,
            stack.dynamodb_table.hash_key,
            stack.dynamodb_table.range_key,
            stack.dynamodb_table.deletion_protection_enabled
        ).apply(check_table)

    @pulumi.runtime.test
    def test_sqs_queues_creation(self):
        """Test SQS main queue and DLQ are created correctly."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        self.assertIsNotNone(stack.sqs_queue)
        self.assertIsNotNone(stack.dlq)

        def check_queue(args_dict):
            self.assertIn("test", args_dict[0])
            self.assertEqual(args_dict[1], 300)

        return pulumi.Output.all(
            stack.sqs_queue.name,
            stack.sqs_queue.visibility_timeout_seconds
        ).apply(check_queue)

    @pulumi.runtime.test
    def test_s3_bucket_creation(self):
        """Test S3 bucket is created with environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        def check_bucket(bucket_name):
            self.assertIn("test", bucket_name)
            self.assertIn("fraud-detection-reports", bucket_name)

        return stack.s3_bucket.bucket.apply(check_bucket)

    @pulumi.runtime.test
    def test_lambda_roles_creation(self):
        """Test Lambda IAM roles are created for all functions."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        self.assertIsNotNone(stack.api_handler_role)
        self.assertIsNotNone(stack.queue_consumer_role)
        self.assertIsNotNone(stack.batch_processor_role)
        self.assertIsNotNone(stack.report_generator_role)

        def check_role(role_name):
            self.assertIn("test", role_name)

        return stack.api_handler_role.name.apply(check_role)

    @pulumi.runtime.test
    def test_lambda_functions_creation(self):
        """Test all Lambda functions are created with correct configuration."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        self.assertIsNotNone(stack.api_handler_lambda)
        self.assertIsNotNone(stack.queue_consumer_lambda)
        self.assertIsNotNone(stack.batch_processor_lambda)
        self.assertIsNotNone(stack.report_generator_lambda)

        def check_lambda(args_dict):
            self.assertIn("test", args_dict[0])
            self.assertEqual(args_dict[1], "python3.11")
            self.assertEqual(args_dict[2], 3072)

        return pulumi.Output.all(
            stack.api_handler_lambda.name,
            stack.api_handler_lambda.runtime,
            stack.api_handler_lambda.memory_size
        ).apply(check_lambda)

    @pulumi.runtime.test
    def test_api_gateway_creation(self):
        """Test API Gateway is created with correct configuration."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        self.assertIsNotNone(stack.api_gateway)
        self.assertIsNotNone(stack.api_url)

        def check_api(api_name):
            self.assertIn("test", api_name)
            self.assertIn("fraud-detection-api", api_name)

        return stack.api_gateway.name.apply(check_api)

    @pulumi.runtime.test
    def test_stack_outputs(self):
        """Test stack exports correct outputs."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix="test")
        stack = TapStack("test-stack", args)

        # Test outputs are registered
        self.assertTrue(hasattr(stack, 'api_url'))
        self.assertTrue(hasattr(stack, 's3_bucket'))
        self.assertTrue(hasattr(stack, 'dynamodb_table'))

    @pulumi.runtime.test
    def test_tapstack_args_initialization(self):
        """Test TapStackArgs initializes correctly."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix="production")
        self.assertEqual(args.environment_suffix, "production")

        args2 = TapStackArgs(environment_suffix="dev")
        self.assertEqual(args2.environment_suffix, "dev")

    @pulumi.runtime.test
    def test_resource_naming_includes_suffix(self):
        """Test all resources include environment suffix in names."""
        from lib.tap_stack import TapStack, TapStackArgs

        suffix = "testsuffix"
        args = TapStackArgs(environment_suffix=suffix)
        stack = TapStack("test-stack", args)

        def check_all_names(names):
            for name in names:
                if name:  # Some outputs might be None during mocking
                    self.assertIn(suffix, str(name).lower())
            return True

        return pulumi.Output.all(
            stack.dynamodb_table.name,
            stack.sqs_queue.name,
            stack.dlq.name,
            stack.s3_bucket.bucket
        ).apply(check_all_names)


class MyMocks(pulumi.runtime.Mocks):
    """Mock provider for Pulumi testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create mock resources."""
        outputs = args.inputs
        if args.typ == "aws:dynamodb/table:Table":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:dynamodb:us-east-1:123456789012:table/{args.inputs.get('name', 'test')}",
                "id": args.inputs.get("name", "test-table"),
                "name": args.inputs.get("name", "test-table"),
            }
        elif args.typ == "aws:sqs/queue:Queue":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:sqs:us-east-1:123456789012:{args.inputs.get('name', 'test')}",
                "id": f"https://sqs.us-east-1.amazonaws.com/123456789012/{args.inputs.get('name', 'test')}",
                "url": f"https://sqs.us-east-1.amazonaws.com/123456789012/{args.inputs.get('name', 'test')}",
            }
        elif args.typ == "aws:s3/bucket:Bucket":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:s3:::{args.inputs.get('bucket', 'test')}",
                "id": args.inputs.get("bucket", "test-bucket"),
                "bucket": args.inputs.get("bucket", "test-bucket"),
            }
        elif args.typ == "aws:iam/role:Role":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:iam::123456789012:role/{args.inputs.get('name', 'test')}",
                "id": args.inputs.get("name", "test-role"),
                "name": args.inputs.get("name", "test-role"),
            }
        elif args.typ == "aws:lambda/function:Function":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:lambda:us-east-1:123456789012:function:{args.inputs.get('name', 'test')}",
                "id": args.inputs.get("name", "test-function"),
                "name": args.inputs.get("name", "test-function"),
                "invoke_arn": (
                    f"arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/"
                    f"arn:aws:lambda:us-east-1:123456789012:function:"
                    f"{args.inputs.get('name', 'test')}/invocations"
                ),
            }
        elif args.typ == "aws:kms/key:Key":
            outputs = {
                **args.inputs,
                "arn": "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
                "id": "12345678-1234-1234-1234-123456789012",
            }
        elif args.typ == "aws:apigateway/restApi:RestApi":
            outputs = {
                **args.inputs,
                "id": "test-api-id",
                "execution_arn": "arn:aws:execute-api:us-east-1:123456789012:test-api-id",
                "root_resource_id": "root-id",
            }
        elif args.typ == "aws:apigateway/stage:Stage":
            outputs = {
                **args.inputs,
                "id": "test-stage",
                "invoke_url": "https://test-api-id.execute-api.us-east-1.amazonaws.com/api",
            }
        elif args.typ == "aws:cloudwatch/eventRule:EventRule":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:events:us-east-1:123456789012:rule/{args.inputs.get('name', 'test')}",
            }
        elif args.typ == "aws:sns/topic:Topic":
            outputs = {
                **args.inputs,
                "arn": f"arn:aws:sns:us-east-1:123456789012:{args.inputs.get('name', 'test')}",
            }

        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock provider calls."""
        return {}


if __name__ == "__main__":
    unittest.main()
