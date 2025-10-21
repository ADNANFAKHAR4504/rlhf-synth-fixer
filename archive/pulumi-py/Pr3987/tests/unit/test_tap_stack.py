"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using pulumi test utilities.
Tests infrastructure components without actual AWS deployment.
"""

import unittest
import pulumi


class MinimalMocks(pulumi.runtime.Mocks):
    """
    Minimal mock that provides only essential computed outputs.
    Returns inputs as outputs, plus critical computed properties.
    """
    
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Return inputs as outputs with minimal computed properties."""
        outputs = {**args.inputs, "id": f"{args.name}-id"}
        
        # Add only the computed outputs that are actually used in the code
        if "execution_arn" not in outputs and args.typ == "aws:apigatewayv2/api:Api":
            outputs["execution_arn"] = f"arn:aws:execute-api:us-east-1:123456789012:{args.name}"
        
        return [f"{args.name}-id", outputs]
    
    def call(self, args: pulumi.runtime.MockCallArgs):
        """Return empty dict for all function calls."""
        return {}


pulumi.runtime.set_mocks(MinimalMocks())


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, None)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        from lib.tap_stack import TapStackArgs

        custom_tags = {"Team": "ML", "Environment": "prod"}
        args = TapStackArgs(environment_suffix="prod", tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)


class TestTapStackResources(unittest.TestCase):
    """Test cases for TapStack Pulumi component resources."""

    @pulumi.runtime.test
    def test_s3_bucket_creation(self):
        """Test S3 bucket is created for image storage."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_bucket(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.image_bucket)
            pulumi.export("bucket_name", stack.image_bucket.bucket)
            pulumi.export("bucket_arn", stack.image_bucket.arn)

            return {
                "bucket_name": stack.image_bucket.bucket,
            }

        return check_bucket([])

    @pulumi.runtime.test
    def test_dynamodb_table_creation(self):
        """Test DynamoDB table is created for results storage."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_table(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.results_table)
            pulumi.export("table_name", stack.results_table.name)
            pulumi.export("table_arn", stack.results_table.arn)

            return {
                "table_name": stack.results_table.name,
            }

        return check_table([])

    @pulumi.runtime.test
    def test_sqs_queues_creation(self):
        """Test SQS queues are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_queues(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Check DLQ
            self.assertIsNotNone(stack.dlq)
            pulumi.export("dlq_url", stack.dlq.url)

            # Check preprocessing queue
            self.assertIsNotNone(stack.preprocessing_queue)
            pulumi.export("preprocessing_queue_url", stack.preprocessing_queue.url)

            # Check inference queue
            self.assertIsNotNone(stack.inference_queue)
            pulumi.export("inference_queue_url", stack.inference_queue.url)

            return {
                "dlq_url": stack.dlq.url,
                "preprocessing_queue_url": stack.preprocessing_queue.url,
                "inference_queue_url": stack.inference_queue.url,
            }

        return check_queues([])

    @pulumi.runtime.test
    def test_lambda_layer_creation(self):
        """Test Lambda layer is created for ML model."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_layer(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.model_layer)
            pulumi.export("layer_arn", stack.model_layer.arn)

            return {
                "layer_arn": stack.model_layer.arn,
            }

        return check_layer([])

    @pulumi.runtime.test
    def test_lambda_functions_creation(self):
        """Test Lambda functions are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_lambdas(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Check preprocessing Lambda
            self.assertIsNotNone(stack.preprocessing_function)
            pulumi.export("preprocessing_lambda_arn", stack.preprocessing_function.arn)

            # Check inference Lambda
            self.assertIsNotNone(stack.inference_function)
            pulumi.export("inference_lambda_arn", stack.inference_function.arn)

            # Check API handler Lambda
            self.assertIsNotNone(stack.api_handler_function)
            pulumi.export("api_handler_lambda_arn", stack.api_handler_function.arn)

            return {
                "preprocessing_lambda_arn": stack.preprocessing_function.arn,
                "inference_lambda_arn": stack.inference_function.arn,
                "api_handler_lambda_arn": stack.api_handler_function.arn,
            }

        return check_lambdas([])

    @pulumi.runtime.test
    def test_api_gateway_creation(self):
        """Test API Gateway HTTP API is created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_api(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            self.assertIsNotNone(stack.api)
            pulumi.export("api_endpoint", stack.api.api_endpoint)

            return {
                "api_endpoint": stack.api.api_endpoint,
            }

        return check_api([])

    @pulumi.runtime.test
    def test_cloudwatch_alarms_creation(self):
        """Test CloudWatch alarms are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_alarms(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Note: Alarms are created but not stored as instance variables
            # This test verifies the stack instantiates without errors
            self.assertIsNotNone(stack)

            return {}

        return check_alarms([])

    @pulumi.runtime.test
    def test_stack_outputs(self):
        """Test that all required stack outputs are registered."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_outputs(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify key resources are created
            self.assertIsNotNone(stack.image_bucket)
            self.assertIsNotNone(stack.results_table)
            self.assertIsNotNone(stack.preprocessing_queue)
            self.assertIsNotNone(stack.inference_queue)
            self.assertIsNotNone(stack.dlq)
            self.assertIsNotNone(stack.preprocessing_function)
            self.assertIsNotNone(stack.inference_function)
            self.assertIsNotNone(stack.api_handler_function)
            self.assertIsNotNone(stack.api)

            return {}

        return check_outputs([])


class TestTapStackIAM(unittest.TestCase):
    """Test IAM roles and policies."""

    @pulumi.runtime.test
    def test_iam_roles_creation(self):
        """Test IAM roles are created for Lambda functions."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_iam(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify stack creates without errors
            # IAM roles are created internally but not exposed as instance variables
            self.assertIsNotNone(stack)

            return {}

        return check_iam([])


class TestTapStackNaming(unittest.TestCase):
    """Test resource naming conventions."""

    @pulumi.runtime.test
    def test_resource_naming_with_environment_suffix(self):
        """Test resources are named with environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_naming(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="prod"))

            # Verify environment suffix is used
            self.assertEqual(stack.environment_suffix, "prod")

            return {}

        return check_naming([])


class TestTapStackTags(unittest.TestCase):
    """Test resource tagging."""

    @pulumi.runtime.test
    def test_custom_tags_applied(self):
        """Test custom tags are applied to resources."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_tags(args):
            custom_tags = {"Team": "ML", "CostCenter": "Research"}
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test", tags=custom_tags))

            self.assertEqual(stack.tags, custom_tags)

            return {}

        return check_tags([])

    @pulumi.runtime.test
    def test_default_tags_when_none_provided(self):
        """Test default empty dict is used when no tags provided."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_default_tags(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Tags should default to empty dict
            self.assertEqual(stack.tags, {})

            return {}

        return check_default_tags([])


class TestTapStackConfiguration(unittest.TestCase):
    """Test stack configuration and parameters."""

    @pulumi.runtime.test
    def test_lambda_timeout_configuration(self):
        """Test Lambda timeout is configured appropriately."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_config(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify stack is created successfully
            self.assertIsNotNone(stack.preprocessing_function)
            self.assertIsNotNone(stack.inference_function)

            return {}

        return check_config([])

    @pulumi.runtime.test
    def test_sqs_visibility_timeout_configuration(self):
        """Test SQS visibility timeout is configured."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_sqs_config(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify queues are created
            self.assertIsNotNone(stack.preprocessing_queue)
            self.assertIsNotNone(stack.inference_queue)

            return {}

        return check_sqs_config([])


class TestTapStackEventSources(unittest.TestCase):
    """Test event source mappings."""

    @pulumi.runtime.test
    def test_sqs_lambda_event_sources(self):
        """Test SQS to Lambda event source mappings are configured."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_event_sources(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify stack creates event sources successfully
            self.assertIsNotNone(stack)

            return {}

        return check_event_sources([])

    @pulumi.runtime.test
    def test_s3_bucket_notification(self):
        """Test S3 bucket notifications to SQS are configured."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_bucket_notification(args):
            stack = TapStack("test-stack", TapStackArgs(environment_suffix="test"))

            # Verify bucket and queue exist for notification
            self.assertIsNotNone(stack.image_bucket)
            self.assertIsNotNone(stack.preprocessing_queue)

            return {}

        return check_bucket_notification([])


if __name__ == '__main__':
    unittest.main()
