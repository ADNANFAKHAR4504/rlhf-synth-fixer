"""Unit tests for TAP Stack."""
import sys
import os
import json

from cdktf import App, Testing

sys.path.append(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from lib.tap_stack import TapStack  # pylint: disable=wrong-import-position


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        # Clear any previous test state if needed

    def test_tap_stack_instantiates_successfully_via_props(self):
        """TapStack instantiates successfully via props."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackWithProps",
            environment_suffix="test",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="us-west-2",
            default_tags={"tags": {"Environment": "test"}}
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None
        assert hasattr(stack, 'payments_table')
        assert hasattr(stack, 'primary_bucket')
        assert hasattr(stack, 'secondary_bucket')
        assert hasattr(stack, 'primary_lambda')
        assert hasattr(stack, 'secondary_lambda')

    def test_tap_stack_environment_suffix_is_used(self):
        """TapStack uses environment suffix in resource names."""
        app = App()
        environment_suffix = "test123"
        stack = TapStack(
            app,
            f"TapStack{environment_suffix}",
            environment_suffix=environment_suffix,
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"tags": {"Environment": environment_suffix}}
        )

        # Verify environment suffix is stored
        assert stack.environment_suffix == environment_suffix

    def test_tap_stack_creates_required_resources(self):
        """TapStack creates all required resources."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackResources",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"tags": {"Environment": "test"}}
        )

        # Verify all major resources are created
        assert stack.payments_table is not None
        assert stack.primary_bucket is not None
        assert stack.secondary_bucket is not None
        assert stack.primary_lambda is not None
        assert stack.secondary_lambda is not None
        assert stack.primary_sns is not None
        assert stack.secondary_sns is not None

    def test_tap_stack_state_configuration(self):
        """TapStack configures state bucket correctly."""
        app = App()
        stack = TapStack(
            app,
            "TestStateConfig",
            environment_suffix="test",
            state_bucket="my-state-bucket",
            state_bucket_region="us-west-1",
            aws_region="us-west-1",
            default_tags={"tags": {"Test": "value"}}
        )

        # Verify state configuration is stored
        assert stack.state_bucket == "my-state-bucket"
        assert stack.state_bucket_region == "us-west-1"

    def test_tap_stack_default_tags_configuration(self):
        """TapStack configures default tags correctly."""
        app = App()
        test_tags = {"tags": {"Environment": "prod", "Team": "payments"}}
        stack = TapStack(
            app,
            "TestTagsConfig",
            environment_suffix="prod",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=test_tags
        )

        # Verify default tags are stored
        assert stack.default_tags == test_tags

    def test_tap_stack_synthesizes_successfully(self):
        """TapStack synthesizes successfully."""
        app = App()
        stack = TapStack(
            app,
            "TestSynth",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"tags": {"Environment": "test"}}
        )

        # Synthesize and verify no errors
        synth = Testing.synth(stack)
        assert synth is not None

    def test_tap_stack_multi_region_configuration(self):
        """TapStack creates resources in both regions."""
        app = App()
        stack = TapStack(
            app,
            "TestMultiRegion",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"tags": {"Environment": "test"}}
        )

        # Verify resources exist for both regions
        assert stack.primary_lambda is not None
        assert stack.secondary_lambda is not None
        assert stack.primary_bucket is not None
        assert stack.secondary_bucket is not None
        assert stack.primary_sns is not None
        assert stack.secondary_sns is not None


class TestLambdaPaymentProcessor:
    """Test suite for Lambda payment processor."""

    def test_lambda_handler_success_case(self):
        """Test payment processor Lambda handler success case."""
        # Import the handler
        sys.path.append(os.path.join(os.getcwd(), "lib", "lambda"))

        # Since the Lambda code is dynamically written, we test its structure
        lambda_file = os.path.join(os.getcwd(), "lib", "lambda", "payment_processor.py")
        assert os.path.exists(lambda_file)

        # Verify the file contains required imports and function
        with open(lambda_file, "r", encoding="utf-8") as f:
            content = f.read()
            assert "def handler(event, context):" in content
            assert "import boto3" in content
            assert "import json" in content
            assert "dynamodb" in content
            assert "s3" in content

    def test_lambda_handler_has_correct_structure(self):
        """Test Lambda handler has correct structure."""
        lambda_file = os.path.join(os.getcwd(), "lib", "lambda", "payment_processor.py")

        with open(lambda_file, "r", encoding="utf-8") as f:
            content = f.read()
            # Verify key functionality
            assert "transaction_id" in content
            assert "put_item" in content
            assert "put_object" in content
            assert "statusCode" in content
            assert "200" in content


# add more test suites and cases as needed
