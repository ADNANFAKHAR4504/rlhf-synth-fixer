"""Unit tests for TapStack."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pytest
from cdktf import Testing
from lib.tap_stack import TapStack


class TestTapStack:
    """Test suite for TapStack."""

    @pytest.fixture
    def stack(self):
        """Create a test stack instance."""
        app = Testing.app()
        return TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="sa-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            default_tags={"tags": {"Environment": "test"}}
        )

    def test_stack_synthesis(self, stack):
        """Test that the stack can be synthesized without errors."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_vpc_created(self, stack):
        """Test that VPC is created with correct configuration."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "aws_vpc" in synthesized
        assert "streaming_vpc" in synthesized

    def test_kinesis_stream_created(self, stack):
        """Test that Kinesis stream is created."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "aws_kinesis_stream" in synthesized
        assert "streaming_analytics" in synthesized

    def test_elasticache_cluster_created(self, stack):
        """Test that ElastiCache cluster is created with Multi-AZ."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "aws_elasticache_replication_group" in synthesized
        assert "redis_cluster" in synthesized
        assert '"multi_az_enabled": true' in synthesized

    def test_aurora_cluster_created(self, stack):
        """Test that Aurora cluster is created."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "aws_rds_cluster" in synthesized
        assert "aurora_cluster" in synthesized

    def test_ecs_cluster_created(self, stack):
        """Test that ECS cluster is created."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "aws_ecs_cluster" in synthesized
        assert "ecs_cluster" in synthesized

    def test_api_gateway_created(self, stack):
        """Test that API Gateway is created."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "aws_api_gateway_rest_api" in synthesized
        assert "content_api" in synthesized

    def test_security_groups_created(self, stack):
        """Test that all security groups are created."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "aws_security_group" in synthesized
        assert "alb_security_group" in synthesized
        assert "ecs_security_group" in synthesized

    def test_cloudwatch_alarms_created(self, stack):
        """Test that CloudWatch alarms are created."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "aws_cloudwatch_metric_alarm" in synthesized
        assert "ecs_cpu_alarm" in synthesized

    def test_secrets_manager_created(self, stack):
        """Test that Secrets Manager secrets are created."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "aws_secretsmanager_secret" in synthesized
        assert "drm_keys" in synthesized
        assert "db_credentials" in synthesized

    def test_iam_roles_created(self, stack):
        """Test that IAM roles are created."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "aws_iam_role" in synthesized
        assert "ecs_task_execution_role" in synthesized
        assert "ecs_task_role" in synthesized

    def test_multi_az_subnets(self, stack):
        """Test that subnets are created across multiple AZs."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "aws_subnet" in synthesized
        # Verify multiple subnets
        assert "public_subnet_0" in synthesized
        assert "public_subnet_1" in synthesized
        assert "public_subnet_2" in synthesized
        assert "private_subnet_0" in synthesized
        assert "private_subnet_1" in synthesized
        assert "private_subnet_2" in synthesized

    def test_nat_gateway_created(self, stack):
        """Test that NAT gateway is created."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "aws_nat_gateway" in synthesized
        assert "nat_gateway" in synthesized

    def test_load_balancer_created(self, stack):
        """Test that Application Load Balancer is created."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "aws_lb" in synthesized
        assert "application_load_balancer" in synthesized

    def test_ecs_service_created(self, stack):
        """Test that ECS service is created."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "aws_ecs_service" in synthesized
        assert "ecs_service" in synthesized

    def test_autoscaling_configured(self, stack):
        """Test that autoscaling is configured for ECS."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "aws_appautoscaling_target" in synthesized
        assert "aws_appautoscaling_policy" in synthesized
        assert "ecs_autoscaling_policy_cpu" in synthesized
        assert "ecs_autoscaling_policy_memory" in synthesized

    def test_encryption_enabled(self, stack):
        """Test that encryption is enabled for data stores."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        # Check Aurora encryption
        assert '"storage_encrypted": true' in synthesized
        # Check Kinesis encryption
        assert '"encryption_type": "KMS"' in synthesized
        # Check ElastiCache encryption
        assert '"at_rest_encryption_enabled": "true"' in synthesized

    def test_aurora_instances_created(self, stack):
        """Test that Aurora cluster instances are created."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "aws_rds_cluster_instance" in synthesized
        assert "aurora_instance_writer" in synthesized
        assert "aurora_instance_reader_0" in synthesized
        assert "aurora_instance_reader_1" in synthesized

    def test_cloudwatch_log_groups_created(self, stack):
        """Test that CloudWatch log groups are created."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "aws_cloudwatch_log_group" in synthesized
        assert "ecs_log_group" in synthesized
        assert "api_log_group" in synthesized

    def test_api_gateway_integration(self, stack):
        """Test that API Gateway is properly integrated."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "aws_api_gateway_resource" in synthesized
        assert "aws_api_gateway_method" in synthesized
        assert "aws_api_gateway_integration" in synthesized
        assert "aws_api_gateway_deployment" in synthesized
        assert "aws_api_gateway_stage" in synthesized

    def test_stack_outputs(self, stack):
        """Test that stack outputs are defined."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert '"output"' in synthesized
        assert '"vpc_id"' in synthesized
        assert '"kinesis_stream_name"' in synthesized
        assert '"alb_dns_name"' in synthesized

    def test_redis_configuration(self, stack):
        """Test Redis cluster configuration."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert '"automatic_failover_enabled": true' in synthesized
        assert '"multi_az_enabled": true' in synthesized
        assert '"engine": "redis"' in synthesized

    def test_iam_policies(self, stack):
        """Test that IAM policies are created."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "aws_iam_policy" in synthesized
        assert "aws_iam_role_policy_attachment" in synthesized
        assert "ecs_task_policy" in synthesized

    def test_target_group_health_check(self, stack):
        """Test that target group has health check configured."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert "aws_lb_target_group" in synthesized
        assert '"health_check"' in synthesized
        assert '"/health"' in synthesized
