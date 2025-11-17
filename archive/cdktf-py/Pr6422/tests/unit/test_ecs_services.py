"""Unit tests for ECS Services Stack."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, TerraformStack  # noqa: E402
from lib.ecs_services import EcsServicesStack  # noqa: E402


class TestEcsServicesStack:
    """Test suite for ECS Services Stack."""

    def test_ecs_services_stack_instantiates_successfully(self):
        """ECS services stack instantiates successfully."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        log_group_names = {
            "payment-api": "/ecs/payment-api-test",
            "fraud-detection": "/ecs/fraud-detection-test",
            "notification-service": "/ecs/notification-service-test",
        }
        stack = EcsServicesStack(
            parent_stack,
            "test_services",
            environment_suffix="test",
            aws_region="us-east-1",
            cluster_id="cluster-123",
            cluster_name="test-cluster",
            private_subnet_ids=["subnet-1", "subnet-2", "subnet-3"],
            task_execution_role_arn="arn:aws:iam::123456789012:role/exec-role",
            task_role_arn="arn:aws:iam::123456789012:role/task-role",
            alb_target_group_arn="arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test/123",
            alb_security_group_id="sg-alb123",
            vpc_id="vpc-12345",
            log_group_names=log_group_names,
        )

        assert stack is not None
        assert hasattr(stack, 'services_config')
        assert hasattr(stack, 'ecs_sg')

    def test_ecs_services_stack_creates_security_group(self):
        """ECS services stack creates security group."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        log_group_names = {
            "payment-api": "/ecs/payment-api-test",
            "fraud-detection": "/ecs/fraud-detection-test",
            "notification-service": "/ecs/notification-service-test",
        }
        stack = EcsServicesStack(
            parent_stack,
            "test_services",
            environment_suffix="test",
            aws_region="us-east-1",
            cluster_id="cluster-123",
            cluster_name="test-cluster",
            private_subnet_ids=["subnet-1", "subnet-2", "subnet-3"],
            task_execution_role_arn="arn:aws:iam::123456789012:role/exec-role",
            task_role_arn="arn:aws:iam::123456789012:role/task-role",
            alb_target_group_arn="arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test/123",
            alb_security_group_id="sg-alb123",
            vpc_id="vpc-12345",
            log_group_names=log_group_names,
        )

        assert stack.ecs_sg is not None
        assert hasattr(stack.ecs_sg, 'id')

    def test_ecs_services_stack_has_three_services_config(self):
        """ECS services stack has configuration for 3 services."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        log_group_names = {
            "payment-api": "/ecs/payment-api-test",
            "fraud-detection": "/ecs/fraud-detection-test",
            "notification-service": "/ecs/notification-service-test",
        }
        stack = EcsServicesStack(
            parent_stack,
            "test_services",
            environment_suffix="test",
            aws_region="us-east-1",
            cluster_id="cluster-123",
            cluster_name="test-cluster",
            private_subnet_ids=["subnet-1", "subnet-2", "subnet-3"],
            task_execution_role_arn="arn:aws:iam::123456789012:role/exec-role",
            task_role_arn="arn:aws:iam::123456789012:role/task-role",
            alb_target_group_arn="arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test/123",
            alb_security_group_id="sg-alb123",
            vpc_id="vpc-12345",
            log_group_names=log_group_names,
        )

        assert len(stack.services_config) == 3
        assert "payment-api" in stack.services_config
        assert "fraud-detection" in stack.services_config
        assert "notification-service" in stack.services_config

    def test_ecs_services_stack_payment_api_attached_to_alb(self):
        """ECS services stack configures payment-api to attach to ALB."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        log_group_names = {
            "payment-api": "/ecs/payment-api-test",
            "fraud-detection": "/ecs/fraud-detection-test",
            "notification-service": "/ecs/notification-service-test",
        }
        stack = EcsServicesStack(
            parent_stack,
            "test_services",
            environment_suffix="test",
            aws_region="us-east-1",
            cluster_id="cluster-123",
            cluster_name="test-cluster",
            private_subnet_ids=["subnet-1", "subnet-2", "subnet-3"],
            task_execution_role_arn="arn:aws:iam::123456789012:role/exec-role",
            task_role_arn="arn:aws:iam::123456789012:role/task-role",
            alb_target_group_arn="arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test/123",
            alb_security_group_id="sg-alb123",
            vpc_id="vpc-12345",
            log_group_names=log_group_names,
        )

        payment_api_config = stack.services_config["payment-api"]
        assert payment_api_config["attach_alb"] is True

        fraud_config = stack.services_config["fraud-detection"]
        assert fraud_config["attach_alb"] is False

        notif_config = stack.services_config["notification-service"]
        assert notif_config["attach_alb"] is False

    def test_ecs_services_stack_with_different_region(self):
        """ECS services stack works with different AWS region."""
        app = App()
        parent_stack = TerraformStack(app, "TestParent")
        log_group_names = {
            "payment-api": "/ecs/payment-api-test",
            "fraud-detection": "/ecs/fraud-detection-test",
            "notification-service": "/ecs/notification-service-test",
        }
        stack = EcsServicesStack(
            parent_stack,
            "test_services",
            environment_suffix="prod",
            aws_region="us-west-2",
            cluster_id="cluster-456",
            cluster_name="prod-cluster",
            private_subnet_ids=["subnet-4", "subnet-5", "subnet-6"],
            task_execution_role_arn="arn:aws:iam::123456789012:role/exec-role",
            task_role_arn="arn:aws:iam::123456789012:role/task-role",
            alb_target_group_arn="arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/prod/456",
            alb_security_group_id="sg-alb456",
            vpc_id="vpc-67890",
            log_group_names=log_group_names,
        )

        assert stack is not None
        # Verify image is configured (using public ECR for now)
        assert "nginx" in stack.services_config["payment-api"]["image"]
