"""Unit tests for ALB Stack."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, TerraformStack  # noqa: E402
from lib.alb import AlbStack  # noqa: E402


class TestAlbStack:
    """Test suite for ALB Stack."""

    def test_alb_stack_instantiates_successfully(self):
        """ALB stack instantiates successfully."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = AlbStack(
            parent_stack,
            "test_alb",
            environment_suffix="test",
            vpc_id="vpc-12345",
            public_subnet_ids=["subnet-1", "subnet-2", "subnet-3"],
        )

        assert stack is not None
        assert hasattr(stack, 'alb_sg')
        assert hasattr(stack, 'alb')
        assert hasattr(stack, 'target_group')

    def test_alb_stack_creates_security_group(self):
        """ALB stack creates security group."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = AlbStack(
            parent_stack,
            "test_alb",
            environment_suffix="test",
            vpc_id="vpc-12345",
            public_subnet_ids=["subnet-1", "subnet-2", "subnet-3"],
        )

        assert stack.alb_sg is not None
        assert hasattr(stack.alb_sg, 'id')

    def test_alb_stack_creates_load_balancer(self):
        """ALB stack creates Application Load Balancer."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = AlbStack(
            parent_stack,
            "test_alb",
            environment_suffix="test",
            vpc_id="vpc-12345",
            public_subnet_ids=["subnet-1", "subnet-2", "subnet-3"],
        )

        assert stack.alb is not None
        assert hasattr(stack.alb, 'arn')

    def test_alb_stack_creates_target_group(self):
        """ALB stack creates target group."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = AlbStack(
            parent_stack,
            "test_alb",
            environment_suffix="test",
            vpc_id="vpc-12345",
            public_subnet_ids=["subnet-1", "subnet-2", "subnet-3"],
        )

        assert stack.target_group is not None
        assert hasattr(stack.target_group, 'arn')

    def test_alb_stack_exports_target_group_arn(self):
        """ALB stack exports target group ARN."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = AlbStack(
            parent_stack,
            "test_alb",
            environment_suffix="test",
            vpc_id="vpc-12345",
            public_subnet_ids=["subnet-1", "subnet-2", "subnet-3"],
        )

        tg_arn = stack.target_group_arn
        assert tg_arn is not None
        # Tokens are synthesized references, just verify it exists
        assert isinstance(tg_arn, str)

    def test_alb_stack_exports_alb_security_group_id(self):
        """ALB stack exports ALB security group ID."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = AlbStack(
            parent_stack,
            "test_alb",
            environment_suffix="test",
            vpc_id="vpc-12345",
            public_subnet_ids=["subnet-1", "subnet-2", "subnet-3"],
        )

        sg_id = stack.alb_security_group_id
        assert sg_id is not None
        # Tokens are synthesized references, just verify it exists
        assert isinstance(sg_id, str)

    def test_alb_stack_with_different_suffix(self):
        """ALB stack works with different environment suffix."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        stack = AlbStack(
            parent_stack,
            "test_alb",
            environment_suffix="prod",
            vpc_id="vpc-67890",
            public_subnet_ids=["subnet-4", "subnet-5", "subnet-6"],
        )

        assert stack is not None
        assert stack.alb is not None
