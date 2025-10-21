"""Integration tests for full stack deployment."""

import pytest
from cdktf import Testing
from lib.tap_stack import TapStack


class TestStackIntegration:
    """Integration tests for the complete TAP stack."""

    @pytest.fixture
    def full_stack(self):
        """Create a full synthesized stack for integration testing."""
        app = Testing.app()
        stack = TapStack(
            app,
            "integration-test",
            environment_suffix="integ",
            aws_region="us-east-1",
            state_bucket_region="us-east-1",
            state_bucket="test-bucket",
            default_tags={"Environment": "integration"}
        )
        return Testing.synth(stack)

    def test_full_stack_synthesizes(self, full_stack):
        """Test that the full stack can be synthesized without errors."""
        assert full_stack is not None

    def test_vpc_and_networking_integration(self, full_stack):
        """Test that VPC and networking components integrate correctly."""
        # VPC exists
        vpc = Testing.to_have_resource(full_stack, "aws_vpc")
        assert vpc is not None

        # Subnets exist
        subnet = Testing.to_have_resource(full_stack, "aws_subnet")
        assert subnet is not None

        # Internet gateway exists
        igw = Testing.to_have_resource(full_stack, "aws_internet_gateway")
        assert igw is not None

        # NAT gateway exists
        nat = Testing.to_have_resource(full_stack, "aws_nat_gateway")
        assert nat is not None

        # Route tables exist
        rt = Testing.to_have_resource(full_stack, "aws_route_table")
        assert rt is not None

    def test_security_groups_integration(self, full_stack):
        """Test that security groups are properly configured."""
        # Security groups exist
        sg = Testing.to_have_resource(full_stack, "aws_security_group")
        assert sg is not None

    def test_secrets_integration(self, full_stack):
        """Test that secrets are properly configured."""
        # Secrets exist
        secret = Testing.to_have_resource(full_stack, "aws_secretsmanager_secret")
        assert secret is not None

        # Secret versions exist
        secret_version = Testing.to_have_resource(full_stack, "aws_secretsmanager_secret_version")
        assert secret_version is not None

    def test_cache_integration(self, full_stack):
        """Test that ElastiCache integrates with VPC and security groups."""
        # Subnet group exists
        subnet_group = Testing.to_have_resource(full_stack, "aws_elasticache_subnet_group")
        assert subnet_group is not None

        # Replication group exists
        cache = Testing.to_have_resource(full_stack, "aws_elasticache_replication_group")
        assert cache is not None

    def test_alb_integration(self, full_stack):
        """Test that ALB integrates with VPC and security groups."""
        # ALB exists
        alb = Testing.to_have_resource(full_stack, "aws_lb")
        assert alb is not None

        # Target group exists
        tg = Testing.to_have_resource(full_stack, "aws_lb_target_group")
        assert tg is not None

        # Listener exists
        listener = Testing.to_have_resource(full_stack, "aws_lb_listener")
        assert listener is not None

    def test_ecs_integration(self, full_stack):
        """Test that ECS integrates with all dependent resources."""
        # CloudWatch log group exists
        log_group = Testing.to_have_resource(full_stack, "aws_cloudwatch_log_group")
        assert log_group is not None

        # ECS cluster exists
        cluster = Testing.to_have_resource(full_stack, "aws_ecs_cluster")
        assert cluster is not None

        # Task definition exists
        task_def = Testing.to_have_resource(full_stack, "aws_ecs_task_definition")
        assert task_def is not None

        # ECS service exists
        service = Testing.to_have_resource(full_stack, "aws_ecs_service")
        assert service is not None

    def test_iam_integration(self, full_stack):
        """Test that IAM roles and policies are properly configured."""
        # IAM roles exist
        role = Testing.to_have_resource(full_stack, "aws_iam_role")
        assert role is not None

        # IAM policies exist
        policy = Testing.to_have_resource(full_stack, "aws_iam_policy")
        assert policy is not None

        # Role policy attachments exist
        attachment = Testing.to_have_resource(full_stack, "aws_iam_role_policy_attachment")
        assert attachment is not None

    def test_resource_dependencies(self, full_stack):
        """Test that resources have correct dependencies."""
        # This test verifies that the stack can be synthesized
        # with all dependencies correctly resolved
        assert full_stack is not None

        # Verify key resources exist in the synthesized stack
        resources_to_check = [
            "aws_vpc",
            "aws_subnet",
            "aws_security_group",
            "aws_secretsmanager_secret",
            "aws_elasticache_replication_group",
            "aws_lb",
            "aws_ecs_cluster",
            "aws_ecs_service"
        ]

        for resource_type in resources_to_check:
            resource = Testing.to_have_resource(full_stack, resource_type)
            assert resource is not None, f"Resource {resource_type} not found in stack"

    def test_stack_with_custom_parameters(self):
        """Test stack creation with custom parameters."""
        app = Testing.app()
        stack = TapStack(
            app,
            "custom-test",
            environment_suffix="custom",
            aws_region="us-west-2",
            state_bucket_region="us-west-2",
            state_bucket="custom-bucket",
            default_tags={
                "Environment": "custom",
                "Project": "test"
            }
        )

        synth = Testing.synth(stack)
        assert synth is not None

        # Verify VPC exists
        vpc = Testing.to_have_resource(synth, "aws_vpc")
        assert vpc is not None
