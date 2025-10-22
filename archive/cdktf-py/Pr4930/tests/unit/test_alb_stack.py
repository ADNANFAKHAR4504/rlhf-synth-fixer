"""Unit tests for ALB stack."""

import pytest
from cdktf import Testing, TerraformStack
from lib.alb_stack import AlbStack


class TestAlbStack:
    """Test ALB stack creation and configuration."""

    @pytest.fixture
    def synth_stack(self):
        """Create a synthesized stack for testing."""
        app = Testing.app()
        stack = TerraformStack(app, "test-stack")
        alb_stack = AlbStack(
            stack,
            "test-alb",
            vpc_id="vpc-12345",
            public_subnet_ids=["subnet-1", "subnet-2"],
            alb_security_group_id="sg-12345",
            environment_suffix="test"
        )
        return Testing.synth(stack)

    def test_alb_created(self, synth_stack):
        """Test that ALB is created."""
        alb = Testing.to_have_resource_with_properties(
            synth_stack,
            "aws_lb",
            {
                "name": "pc-alb-test",
                "internal": False,
                "load_balancer_type": "application",
                "enable_deletion_protection": False
            }
        )
        assert alb is not None

    def test_target_group_created(self, synth_stack):
        """Test that target group is created."""
        tg = Testing.to_have_resource_with_properties(
            synth_stack,
            "aws_lb_target_group",
            {
                "name": "pc-tg-test",
                "port": 80,
                "protocol": "HTTP",
                "target_type": "ip"
            }
        )
        assert tg is not None

    def test_listener_created(self, synth_stack):
        """Test that ALB listener is created."""
        listener = Testing.to_have_resource_with_properties(
            synth_stack,
            "aws_lb_listener",
            {
                "port": 80,
                "protocol": "HTTP"
            }
        )
        assert listener is not None

    def test_stack_properties(self):
        """Test that stack properties are accessible."""
        app = Testing.app()
        stack = TerraformStack(app, "test-stack")
        alb_stack = AlbStack(
            stack,
            "test-alb",
            vpc_id="vpc-12345",
            public_subnet_ids=["subnet-1", "subnet-2"],
            alb_security_group_id="sg-12345",
            environment_suffix="test"
        )

        # Test that properties exist
        assert alb_stack.target_group_arn is not None
        assert alb_stack.alb_dns_name is not None
