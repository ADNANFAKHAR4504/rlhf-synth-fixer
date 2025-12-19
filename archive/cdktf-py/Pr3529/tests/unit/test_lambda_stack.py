"""Unit tests for Lambda Stack."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, TerraformStack  # noqa: E402
from lib.lambda_stack import LambdaStack  # noqa: E402


class TestLambdaStack:
    """Test suite for Lambda Stack."""

    def test_lambda_stack_created_successfully(self):
        """Test Lambda stack is created successfully."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = LambdaStack(
            parent_stack,
            environment_suffix="test",
            ecr_repository_arn="arn:aws:ecr:us-east-2:123456789012:repository/test",
            dynamodb_table_name="test-table",
            dynamodb_table_arn="arn:aws:dynamodb:us-east-2:123456789012:table/test"
        )

        # Check that stack was created
        assert stack is not None

        # Check that attributes exist
        assert hasattr(stack, "sns_topic")
        assert hasattr(stack, "lambda_function")
        assert hasattr(stack, "function_arn")
        assert hasattr(stack, "function_name")
        assert hasattr(stack, "sns_topic_arn")

    def test_stack_exports(self):
        """Test stack exports the required outputs."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = LambdaStack(
            parent_stack,
            environment_suffix="test",
            ecr_repository_arn="arn:aws:ecr:us-east-2:123456789012:repository/test",
            dynamodb_table_name="test-table",
            dynamodb_table_arn="arn:aws:dynamodb:us-east-2:123456789012:table/test"
        )

        assert hasattr(stack, "function_arn")
        assert hasattr(stack, "function_name")
        assert hasattr(stack, "sns_topic_arn")
        assert stack.function_arn is not None
        assert stack.function_name is not None
        assert stack.sns_topic_arn is not None
