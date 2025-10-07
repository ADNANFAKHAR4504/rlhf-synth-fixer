"""Unit tests for Database Stack."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, TerraformStack  # noqa: E402
from lib.database_stack import DatabaseStack  # noqa: E402


class TestDatabaseStack:
    """Test suite for Database Stack."""

    def test_dynamodb_table_created_successfully(self):
        """Test DynamoDB table is created successfully."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = DatabaseStack(parent_stack, environment_suffix="test")

        # Check that stack was created
        assert stack is not None

        # Check that table attributes exist
        assert hasattr(stack, "table")
        assert hasattr(stack, "table_name")
        assert hasattr(stack, "table_arn")

        # Check table properties
        assert stack.table is not None
        # Note: properties are tokens until synthesis, so we can't assert actual values

    def test_stack_exports(self):
        """Test stack exports the required outputs."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = DatabaseStack(parent_stack, environment_suffix="test")

        assert hasattr(stack, "table_name")
        assert hasattr(stack, "table_arn")
        assert stack.table_name is not None
        assert stack.table_arn is not None
