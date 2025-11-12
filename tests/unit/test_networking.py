"""Unit tests for Networking Stack."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, TerraformStack  # noqa: E402
from lib.networking import NetworkingStack  # noqa: E402


class TestNetworkingStack:
    """Test suite for Networking Stack."""

    def test_networking_stack_instantiates_successfully(self):
        """Networking stack instantiates successfully."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = NetworkingStack(
            parent_stack,
            "test_networking",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        assert stack is not None
        assert hasattr(stack, 'vpc')
        assert hasattr(stack, 'public_subnets')
        assert hasattr(stack, 'private_subnets')

    def test_networking_stack_creates_vpc(self):
        """Networking stack creates VPC."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = NetworkingStack(
            parent_stack,
            "test_networking",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        assert stack.vpc is not None
        assert hasattr(stack.vpc, 'id')

    def test_networking_stack_creates_three_public_subnets(self):
        """Networking stack creates 3 public subnets."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = NetworkingStack(
            parent_stack,
            "test_networking",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        assert len(stack.public_subnets) == 3
        for subnet in stack.public_subnets:
            assert subnet is not None
            assert hasattr(subnet, 'id')

    def test_networking_stack_creates_three_private_subnets(self):
        """Networking stack creates 3 private subnets."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = NetworkingStack(
            parent_stack,
            "test_networking",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        assert len(stack.private_subnets) == 3
        for subnet in stack.private_subnets:
            assert subnet is not None
            assert hasattr(subnet, 'id')

    def test_networking_stack_exports_vpc_id(self):
        """Networking stack exports VPC ID."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = NetworkingStack(
            parent_stack,
            "test_networking",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        assert stack.vpc_id is not None
        # Tokens are synthesized references, just verify it exists
        assert isinstance(stack.vpc_id, str)

    def test_networking_stack_exports_public_subnet_ids(self):
        """Networking stack exports public subnet IDs."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = NetworkingStack(
            parent_stack,
            "test_networking",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        subnet_ids = stack.public_subnet_ids
        assert len(subnet_ids) == 3
        for subnet_id in subnet_ids:
            assert subnet_id is not None

    def test_networking_stack_exports_private_subnet_ids(self):
        """Networking stack exports private subnet IDs."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = NetworkingStack(
            parent_stack,
            "test_networking",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        subnet_ids = stack.private_subnet_ids
        assert len(subnet_ids) == 3
        for subnet_id in subnet_ids:
            assert subnet_id is not None

    def test_networking_stack_with_different_region(self):
        """Networking stack works with different AWS region."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = NetworkingStack(
            parent_stack,
            "test_networking",
            environment_suffix="prod",
            aws_region="us-west-2",
        )

        assert stack is not None
        assert stack.vpc is not None

    def test_networking_stack_with_different_suffix(self):
        """Networking stack works with different environment suffix."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = NetworkingStack(
            parent_stack,
            "test_networking",
            environment_suffix="staging",
            aws_region="us-east-1",
        )

        assert stack is not None
        assert stack.vpc is not None
