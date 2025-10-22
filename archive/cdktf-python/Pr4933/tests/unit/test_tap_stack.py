"""Unit tests for TAP Stack."""
import os
import sys
from cdktf import App, Testing

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from lib.tap_stack import TapStack


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        # Clear any previous test state if needed

    def test_tap_stack_instantiates_successfully_via_props(self):
        """TapStack instantiates successfully via props."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackWithProps",
            environment_suffix="test",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="eu-central-1",
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None

    def test_stack_creates_networking_infrastructure(self):
        """Test that networking infrastructure is created."""
        app = App()
        stack = TapStack(
            app,
            "TestNetworking",
            environment_suffix="test",
            aws_region="eu-central-1",
        )

        synth = Testing.synth(stack)

        # Verify VPC is created
        assert "aws_vpc" in synth

    def test_stack_creates_kinesis_stream(self):
        """Test that Kinesis stream is created."""
        app = App()
        stack = TapStack(
            app,
            "TestKinesis",
            environment_suffix="test",
            aws_region="eu-central-1",
        )

        synth = Testing.synth(stack)

        # Verify Kinesis stream is created
        assert "aws_kinesis_stream" in synth

    def test_stack_creates_rds_cluster(self):
        """Test that RDS Aurora cluster is created."""
        app = App()
        stack = TapStack(
            app,
            "TestRDS",
            environment_suffix="test",
            aws_region="eu-central-1",
        )

        synth = Testing.synth(stack)

        # Verify RDS cluster is created
        assert "aws_rds_cluster" in synth

    def test_stack_creates_ecs_cluster(self):
        """Test that ECS cluster is created."""
        app = App()
        stack = TapStack(
            app,
            "TestECS",
            environment_suffix="test",
            aws_region="eu-central-1",
        )

        synth = Testing.synth(stack)

        # Verify ECS cluster is created
        assert "aws_ecs_cluster" in synth

    def test_stack_creates_secrets_manager_secret(self):
        """Test that Secrets Manager secret is created."""
        app = App()
        stack = TapStack(
            app,
            "TestSecrets",
            environment_suffix="test",
            aws_region="eu-central-1",
        )

        synth = Testing.synth(stack)

        # Verify Secrets Manager secret is created
        assert "aws_secretsmanager_secret" in synth

    def test_stack_creates_monitoring_infrastructure(self):
        """Test that monitoring infrastructure is created."""
        app = App()
        stack = TapStack(
            app,
            "TestMonitoring",
            environment_suffix="test",
            aws_region="eu-central-1",
        )

        synth = Testing.synth(stack)

        # Verify SNS topic and CloudWatch alarms are created
        assert "aws_sns_topic" in synth
        assert "aws_cloudwatch_metric_alarm" in synth


# add more test suites and cases as needed
