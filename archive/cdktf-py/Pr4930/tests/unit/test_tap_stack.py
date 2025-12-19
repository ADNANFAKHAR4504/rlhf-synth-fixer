"""Unit tests for TAP stack."""

import pytest
from cdktf import Testing
from lib.tap_stack import TapStack


class TestTapStack:
    """Test TAP stack creation and configuration."""

    @pytest.fixture
    def synth_stack(self):
        """Create a synthesized stack for testing."""
        app = Testing.app()
        stack = TapStack(
            app,
            "test-tap",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket_region="us-east-1",
            state_bucket="test-bucket",
            default_tags={"Environment": "test"}
        )
        return Testing.synth(stack)

    def test_vpc_resources_created(self, synth_stack):
        """Test that VPC resources are created."""
        vpc = Testing.to_have_resource(synth_stack, "aws_vpc")
        assert vpc is not None

    def test_security_groups_created(self, synth_stack):
        """Test that security groups are created."""
        sg = Testing.to_have_resource(synth_stack, "aws_security_group")
        assert sg is not None

    def test_secrets_created(self, synth_stack):
        """Test that secrets are created."""
        secret = Testing.to_have_resource(synth_stack, "aws_secretsmanager_secret")
        assert secret is not None

    def test_cache_resources_created(self, synth_stack):
        """Test that ElastiCache resources are created."""
        cache = Testing.to_have_resource(synth_stack, "aws_elasticache_replication_group")
        assert cache is not None

    def test_alb_resources_created(self, synth_stack):
        """Test that ALB resources are created."""
        alb = Testing.to_have_resource(synth_stack, "aws_lb")
        assert alb is not None

    def test_ecs_resources_created(self, synth_stack):
        """Test that ECS resources are created."""
        cluster = Testing.to_have_resource(synth_stack, "aws_ecs_cluster")
        assert cluster is not None

        service = Testing.to_have_resource(synth_stack, "aws_ecs_service")
        assert service is not None

    def test_iam_resources_created(self, synth_stack):
        """Test that IAM resources are created."""
        role = Testing.to_have_resource(synth_stack, "aws_iam_role")
        assert role is not None

    def test_networking_resources_created(self, synth_stack):
        """Test that networking resources are created."""
        # Subnets
        subnet = Testing.to_have_resource(synth_stack, "aws_subnet")
        assert subnet is not None

        # Internet Gateway
        igw = Testing.to_have_resource(synth_stack, "aws_internet_gateway")
        assert igw is not None

        # NAT Gateway
        nat = Testing.to_have_resource(synth_stack, "aws_nat_gateway")
        assert nat is not None
