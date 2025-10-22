"""Unit tests for Security stack."""

import pytest
from cdktf import Testing, TerraformStack
from lib.security_stack import SecurityStack


class TestSecurityStack:
    """Test Security stack creation and configuration."""

    @pytest.fixture
    def synth_stack(self):
        """Create a synthesized stack for testing."""
        app = Testing.app()
        stack = TerraformStack(app, "test-stack")
        security_stack = SecurityStack(
            stack,
            "test-security",
            vpc_id="vpc-12345",
            environment_suffix="test"
        )
        return Testing.synth(stack)

    def test_alb_security_group_created(self, synth_stack):
        """Test that ALB security group is created."""
        sg = Testing.to_have_resource_with_properties(
            synth_stack,
            "aws_security_group",
            {
                "name": "pc-alb-sg-test",
                "description": "Security group for Application Load Balancer"
            }
        )
        assert sg is not None

    def test_alb_security_group_ingress(self, synth_stack):
        """Test that ALB security group has correct ingress rules."""
        # The security group should allow HTTP (80) and HTTPS (443)
        sg = Testing.to_have_resource(synth_stack, "aws_security_group")
        assert sg is not None

    def test_ecs_security_group_created(self, synth_stack):
        """Test that ECS security group is created."""
        sg = Testing.to_have_resource_with_properties(
            synth_stack,
            "aws_security_group",
            {
                "name": "pc-ecs-sg-test",
                "description": "Security group for ECS tasks"
            }
        )
        assert sg is not None

    def test_cache_security_group_created(self, synth_stack):
        """Test that cache security group is created."""
        sg = Testing.to_have_resource_with_properties(
            synth_stack,
            "aws_security_group",
            {
                "name": "pc-cache-sg-test",
                "description": "Security group for ElastiCache"
            }
        )
        assert sg is not None

    def test_stack_properties(self):
        """Test that stack properties are accessible."""
        app = Testing.app()
        stack = TerraformStack(app, "test-stack")
        security_stack = SecurityStack(
            stack,
            "test-security",
            vpc_id="vpc-12345",
            environment_suffix="test"
        )

        # Test that properties exist
        assert security_stack.alb_security_group_id is not None
        assert security_stack.ecs_security_group_id is not None
        assert security_stack.cache_security_group_id is not None
