"""Unit tests for ECR Stack."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, TerraformStack  # noqa: E402
from lib.ecr_stack import ECRStack  # noqa: E402


class TestECRStack:
    """Test suite for ECR Stack."""

    def test_ecr_repository_created_successfully(self):
        """Test ECR repository is created successfully."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = ECRStack(parent_stack, environment_suffix="test")

        # Check that stack was created
        assert stack is not None

        # Check that repository attributes exist
        assert hasattr(stack, "repository")
        assert hasattr(stack, "repository_arn")
        assert hasattr(stack, "repository_name")

        # Check repository properties
        assert stack.repository is not None
        # Note: properties are tokens until synthesis, so we can't assert actual values

    def test_stack_exports(self):
        """Test stack exports the required outputs."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = ECRStack(parent_stack, environment_suffix="test")

        assert hasattr(stack, "repository_arn")
        assert hasattr(stack, "repository_name")
        assert stack.repository_arn is not None
        assert stack.repository_name is not None
