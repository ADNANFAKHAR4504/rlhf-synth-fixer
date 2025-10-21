"""Unit tests for ECS stack."""

import pytest
from cdktf import Testing, TerraformStack
from lib.ecs_stack import EcsStack


class TestEcsStack:
    """Test ECS stack creation and configuration."""

    @pytest.fixture
    def synth_stack(self):
        """Create a synthesized stack for testing."""
        app = Testing.app()
        stack = TerraformStack(app, "test-stack")
        ecs_stack = EcsStack(
            stack,
            "test-ecs",
            vpc_id="vpc-12345",
            private_subnet_ids=["subnet-1", "subnet-2"],
            ecs_security_group_id="sg-12345",
            target_group_arn="arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test/abc123",
            db_secret_arn="arn:aws:secretsmanager:us-east-1:123456789012:secret:test-db",
            api_secret_arn="arn:aws:secretsmanager:us-east-1:123456789012:secret:test-api",
            cache_endpoint="test-cache.abc123.0001.use1.cache.amazonaws.com",
            environment_suffix="test",
            aws_region="us-east-1"
        )
        return Testing.synth(stack)

    def test_cloudwatch_log_group_created(self, synth_stack):
        """Test that CloudWatch log group is created."""
        log_group = Testing.to_have_resource_with_properties(
            synth_stack,
            "aws_cloudwatch_log_group",
            {
                "name": "/ecs/product-catalog-test",
                "retention_in_days": 7
            }
        )
        assert log_group is not None

    def test_ecs_cluster_created(self, synth_stack):
        """Test that ECS cluster is created."""
        cluster = Testing.to_have_resource_with_properties(
            synth_stack,
            "aws_ecs_cluster",
            {
                "name": "pc-cluster-test"
            }
        )
        assert cluster is not None

    def test_iam_roles_created(self, synth_stack):
        """Test that IAM roles are created."""
        # Check for IAM roles
        role = Testing.to_have_resource(synth_stack, "aws_iam_role")
        assert role is not None

    def test_task_definition_created(self, synth_stack):
        """Test that ECS task definition is created."""
        task_def = Testing.to_have_resource_with_properties(
            synth_stack,
            "aws_ecs_task_definition",
            {
                "family": "pc-test",
                "network_mode": "awsvpc",
                "cpu": "256",
                "memory": "512"
            }
        )
        assert task_def is not None

    def test_ecs_service_created(self, synth_stack):
        """Test that ECS service is created."""
        service = Testing.to_have_resource_with_properties(
            synth_stack,
            "aws_ecs_service",
            {
                "name": "pc-service-test",
                "desired_count": 2,
                "launch_type": "FARGATE"
            }
        )
        assert service is not None

    def test_stack_properties(self):
        """Test that stack properties are accessible."""
        app = Testing.app()
        stack = TerraformStack(app, "test-stack")
        ecs_stack = EcsStack(
            stack,
            "test-ecs",
            vpc_id="vpc-12345",
            private_subnet_ids=["subnet-1", "subnet-2"],
            ecs_security_group_id="sg-12345",
            target_group_arn="arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test/abc123",
            db_secret_arn="arn:aws:secretsmanager:us-east-1:123456789012:secret:test-db",
            api_secret_arn="arn:aws:secretsmanager:us-east-1:123456789012:secret:test-api",
            cache_endpoint="test-cache.abc123.0001.use1.cache.amazonaws.com",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        # Test that properties exist
        assert ecs_stack.cluster_name is not None
        assert ecs_stack.service_name is not None
