"""Unit tests for TAP Stack."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing

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
            environment_suffix="prod",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="us-west-2",
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None

        # Synthesize the stack to generate Terraform configuration
        synthesized = Testing.synth(stack)
        assert synthesized is not None

        # Parse synthesized JSON
        config = json.loads(synthesized)
        assert "resource" in config
        assert "terraform" in config

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None

        # Synthesize the stack to generate Terraform configuration
        synthesized = Testing.synth(stack)
        assert synthesized is not None

        # Parse synthesized JSON
        config = json.loads(synthesized)
        assert "resource" in config
        assert "terraform" in config

    def test_tap_stack_creates_vpc_resources(self):
        """TapStack creates VPC and networking resources."""
        app = App()
        stack = TapStack(
            app,
            "TestVpcStack",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
        )

        # Synthesize and verify VPC resources are created
        synthesized = Testing.synth(stack)
        assert synthesized is not None

        # Parse and verify stack has required resource types
        config = json.loads(synthesized)
        resources = config.get("resource", {})
        assert "aws_vpc" in resources
        assert "aws_subnet" in resources
        assert "aws_internet_gateway" in resources
        assert "aws_security_group" in resources

    def test_tap_stack_creates_ecs_resources(self):
        """TapStack creates ECS cluster and service resources."""
        app = App()
        stack = TapStack(
            app,
            "TestEcsStack",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
        )

        # Synthesize and verify ECS resources are created
        synthesized = Testing.synth(stack)
        assert synthesized is not None

        # Parse and verify ECS resources exist
        config = json.loads(synthesized)
        resources = config.get("resource", {})
        assert "aws_ecs_cluster" in resources
        assert "aws_ecs_service" in resources
        assert "aws_ecs_task_definition" in resources

    def test_tap_stack_creates_rds_resources(self):
        """TapStack creates RDS Aurora cluster resources."""
        app = App()
        stack = TapStack(
            app,
            "TestRdsStack",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
        )

        # Synthesize and verify RDS resources are created
        synthesized = Testing.synth(stack)
        assert synthesized is not None

        # Parse and verify RDS resources exist
        config = json.loads(synthesized)
        resources = config.get("resource", {})
        assert "aws_rds_cluster" in resources
        assert "aws_rds_cluster_instance" in resources
        assert "aws_db_subnet_group" in resources

    def test_tap_stack_creates_alb_resources(self):
        """TapStack creates Application Load Balancer resources."""
        app = App()
        stack = TapStack(
            app,
            "TestAlbStack",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
        )

        # Synthesize and verify ALB resources are created
        synthesized = Testing.synth(stack)
        assert synthesized is not None

        # Parse and verify ALB resources exist
        config = json.loads(synthesized)
        resources = config.get("resource", {})
        assert "aws_lb" in resources
        assert "aws_lb_target_group" in resources
        assert "aws_lb_listener" in resources

    def test_tap_stack_creates_cloudfront_distribution(self):
        """TapStack creates CloudFront distribution."""
        app = App()
        stack = TapStack(
            app,
            "TestCloudfrontStack",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
        )

        # Synthesize and verify CloudFront resources are created
        synthesized = Testing.synth(stack)
        assert synthesized is not None

        # Parse and verify CloudFront resources exist
        config = json.loads(synthesized)
        resources = config.get("resource", {})
        assert "aws_cloudfront_distribution" in resources

    def test_tap_stack_creates_iam_roles(self):
        """TapStack creates IAM roles and policies."""
        app = App()
        stack = TapStack(
            app,
            "TestIamStack",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
        )

        # Synthesize and verify IAM resources are created
        synthesized = Testing.synth(stack)
        assert synthesized is not None

        # Parse and verify IAM resources exist
        config = json.loads(synthesized)
        resources = config.get("resource", {})
        assert "aws_iam_role" in resources
        assert "aws_iam_policy" in resources
        assert "aws_iam_role_policy_attachment" in resources

    def test_tap_stack_creates_secrets_manager(self):
        """TapStack creates Secrets Manager secret."""
        app = App()
        stack = TapStack(
            app,
            "TestSecretsStack",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
        )

        # Synthesize and verify Secrets Manager resources are created
        synthesized = Testing.synth(stack)
        assert synthesized is not None

        # Parse and verify Secrets Manager resources exist
        config = json.loads(synthesized)
        resources = config.get("resource", {})
        assert "aws_secretsmanager_secret" in resources
        assert "aws_secretsmanager_secret_version" in resources

    def test_tap_stack_creates_autoscaling_resources(self):
        """TapStack creates auto-scaling resources."""
        app = App()
        stack = TapStack(
            app,
            "TestAutoscalingStack",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
        )

        # Synthesize and verify auto-scaling resources are created
        synthesized = Testing.synth(stack)
        assert synthesized is not None

        # Parse and verify auto-scaling resources exist
        config = json.loads(synthesized)
        resources = config.get("resource", {})
        assert "aws_appautoscaling_target" in resources
        assert "aws_appautoscaling_policy" in resources

    def test_tap_stack_creates_s3_and_cloudwatch(self):
        """TapStack creates S3 bucket and CloudWatch log group."""
        app = App()
        stack = TapStack(
            app,
            "TestS3CloudwatchStack",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
        )

        # Synthesize and verify S3 and CloudWatch resources are created
        synthesized = Testing.synth(stack)
        assert synthesized is not None

        # Parse and verify resources exist
        config = json.loads(synthesized)
        resources = config.get("resource", {})
        assert "aws_s3_bucket" in resources
        assert "aws_s3_bucket_lifecycle_configuration" in resources
        assert "aws_cloudwatch_log_group" in resources


# add more test suites and cases as needed
