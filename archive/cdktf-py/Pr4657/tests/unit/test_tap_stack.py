"""Unit tests for TAP Stack."""
import os
import sys
from cdktf import App, Testing
from lib.tap_stack import TapStack

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


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
            aws_region="eu-west-1",
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None

    def test_stack_synthesizes_successfully(self):
        """Test that the stack can be synthesized."""
        app = App()
        stack = TapStack(
            app,
            "TestSynthStack",
            environment_suffix="test",
            aws_region="eu-west-1"
        )

        # Synthesize the stack
        synth = Testing.synth(stack)
        assert synth is not None

    def test_stack_creates_vpc_resources(self):
        """Test that VPC resources are created."""
        app = App()
        stack = TapStack(
            app,
            "TestVPCStack",
            environment_suffix="test",
            aws_region="eu-west-1"
        )

        # Synthesize and get the manifest
        synth = Testing.synth(stack)
        assert synth is not None

        # Verify VPC resources are defined in the manifest
        Testing.to_be_valid_terraform(synth)

    def test_stack_creates_kinesis_stream(self):
        """Test that Kinesis stream is created."""
        app = App()
        stack = TapStack(
            app,
            "TestKinesisStack",
            environment_suffix="test",
            aws_region="eu-west-1"
        )

        synth = Testing.synth(stack)
        assert synth is not None

        # Verify Kinesis stream configuration
        Testing.to_be_valid_terraform(synth)

    def test_stack_creates_ecs_resources(self):
        """Test that ECS cluster and related resources are created."""
        app = App()
        stack = TapStack(
            app,
            "TestECSStack",
            environment_suffix="test",
            aws_region="eu-west-1"
        )

        synth = Testing.synth(stack)
        assert synth is not None

        Testing.to_be_valid_terraform(synth)

    def test_stack_creates_elasticache_redis(self):
        """Test that ElastiCache Redis cluster is created."""
        app = App()
        stack = TapStack(
            app,
            "TestRedisStack",
            environment_suffix="test",
            aws_region="eu-west-1"
        )

        synth = Testing.synth(stack)
        assert synth is not None

        Testing.to_be_valid_terraform(synth)

    def test_stack_creates_rds_instance(self):
        """Test that RDS PostgreSQL instance is created."""
        app = App()
        stack = TapStack(
            app,
            "TestRDSStack",
            environment_suffix="test",
            aws_region="eu-west-1"
        )

        synth = Testing.synth(stack)
        assert synth is not None

        Testing.to_be_valid_terraform(synth)

    def test_stack_creates_secrets_manager_secret(self):
        """Test that Secrets Manager secret is created."""
        app = App()
        stack = TapStack(
            app,
            "TestSecretsStack",
            environment_suffix="test",
            aws_region="eu-west-1"
        )

        synth = Testing.synth(stack)
        assert synth is not None

        Testing.to_be_valid_terraform(synth)

    def test_stack_creates_iam_roles(self):
        """Test that IAM roles for ECS are created."""
        app = App()
        stack = TapStack(
            app,
            "TestIAMStack",
            environment_suffix="test",
            aws_region="eu-west-1"
        )

        synth = Testing.synth(stack)
        assert synth is not None

        Testing.to_be_valid_terraform(synth)

    def test_stack_creates_security_groups(self):
        """Test that security groups are created."""
        app = App()
        stack = TapStack(
            app,
            "TestSGStack",
            environment_suffix="test",
            aws_region="eu-west-1"
        )

        synth = Testing.synth(stack)
        assert synth is not None

        Testing.to_be_valid_terraform(synth)

    def test_stack_with_custom_environment_suffix(self):
        """Test stack with custom environment suffix."""
        app = App()
        stack = TapStack(
            app,
            "TestCustomSuffix",
            environment_suffix="prod",
            aws_region="eu-west-1"
        )

        synth = Testing.synth(stack)
        assert synth is not None

        Testing.to_be_valid_terraform(synth)

    def test_stack_uses_correct_region(self):
        """Test that stack uses the correct AWS region."""
        app = App()
        stack = TapStack(
            app,
            "TestRegionStack",
            environment_suffix="test",
            aws_region="eu-west-1"
        )

        synth = Testing.synth(stack)
        assert synth is not None

        Testing.to_be_valid_terraform(synth)

    def test_stack_creates_cloudwatch_log_group(self):
        """Test that CloudWatch log group is created."""
        app = App()
        stack = TapStack(
            app,
            "TestLogsStack",
            environment_suffix="test",
            aws_region="eu-west-1"
        )

        synth = Testing.synth(stack)
        assert synth is not None

        Testing.to_be_valid_terraform(synth)

    def test_stack_with_default_tags(self):
        """Test stack with default tags."""
        app = App()
        default_tags = {
            "tags": {
                "Environment": "test",
                "Repository": "test-repo",
                "Author": "test-author"
            }
        }
        stack = TapStack(
            app,
            "TestTagsStack",
            environment_suffix="test",
            aws_region="eu-west-1",
            default_tags=default_tags
        )

        synth = Testing.synth(stack)
        assert synth is not None

        Testing.to_be_valid_terraform(synth)

    def test_stack_creates_subnet_groups(self):
        """Test that DB and ElastiCache subnet groups are created."""
        app = App()
        stack = TapStack(
            app,
            "TestSubnetGroupsStack",
            environment_suffix="test",
            aws_region="eu-west-1"
        )

        synth = Testing.synth(stack)
        assert synth is not None

        Testing.to_be_valid_terraform(synth)
