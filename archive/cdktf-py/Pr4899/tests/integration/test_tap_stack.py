"""Integration tests for TapStack."""

import pytest
from cdktf import Testing
from lib.tap_stack import TapStack


class TestTapStackIntegration:
    """Integration test suite for TapStack."""

    @pytest.fixture
    def stack(self):
        """Create a test stack instance."""
        app = Testing.app()
        return TapStack(
            app,
            "integration-test-stack",
            environment_suffix="inttest",
            aws_region="sa-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            default_tags={"tags": {"Environment": "integration-test"}}
        )

    def test_stack_synthesis_complete(self, stack):
        """Test that the complete stack synthesizes correctly."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        assert len(synthesized) > 1000  # Ensure substantial content

    def test_multi_az_configuration(self, stack):
        """Test that resources are configured for Multi-AZ."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        # Check that Multi-AZ is enabled for ElastiCache
        assert '"multi_az_enabled": true' in synthesized
        # Check that multiple AZs are used for subnets
        assert "sa-east-1a" in synthesized
        assert "sa-east-1b" in synthesized
        assert "sa-east-1c" in synthesized

    def test_encryption_configuration(self, stack):
        """Test that encryption is enabled for all data stores."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        # Check ElastiCache encryption
        assert '"at_rest_encryption_enabled": "true"' in synthesized
        assert '"transit_encryption_enabled": true' in synthesized
        # Check RDS encryption
        assert '"storage_encrypted": true' in synthesized
        # Check Kinesis encryption
        assert '"encryption_type": "KMS"' in synthesized

    def test_high_availability_setup(self, stack):
        """Test that HA components are properly configured."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        # Check automatic failover is enabled
        assert '"automatic_failover_enabled": true' in synthesized
        # Check multiple Aurora instances
        assert "aurora_instance_writer" in synthesized
        assert "aurora_instance_reader_0" in synthesized
        assert "aurora_instance_reader_1" in synthesized
        # Check ECS desired count for redundancy
        assert '"desired_count": 3' in synthesized

    def test_networking_configuration(self, stack):
        """Test that networking is properly configured."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        # Check VPC configuration
        assert "aws_vpc" in synthesized
        assert "aws_internet_gateway" in synthesized
        assert "aws_nat_gateway" in synthesized
        # Check subnets
        assert "aws_subnet" in synthesized
        assert "public_subnet" in synthesized
        assert "private_subnet" in synthesized

    def test_monitoring_setup(self, stack):
        """Test that monitoring and alarms are configured."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        # Check CloudWatch alarms exist
        assert "aws_cloudwatch_metric_alarm" in synthesized
        assert "ecs_cpu_alarm" in synthesized
        assert "ecs_memory_alarm" in synthesized
        assert "aurora_cpu_alarm" in synthesized
        assert "redis_cpu_alarm" in synthesized
        assert "kinesis_iterator_alarm" in synthesized

    def test_auto_scaling_configuration(self, stack):
        """Test that auto-scaling is configured for ECS."""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        # Check AppAutoScaling resources
        assert "aws_appautoscaling_target" in synthesized
        assert "aws_appautoscaling_policy" in synthesized
        # Check CPU and Memory scaling policies
        assert "ecs_autoscaling_policy_cpu" in synthesized
        assert "ecs_autoscaling_policy_memory" in synthesized
        # Check target tracking configuration
        assert "ECSServiceAverageCPUUtilization" in synthesized
        assert "ECSServiceAverageMemoryUtilization" in synthesized
