"""Unit tests for TapStack."""

import os
import sys
import json
import pytest
from cdktf import App, Testing

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from lib.tap_stack import TapStack


class TestTapStack:
    """Test TapStack infrastructure."""

    def test_stack_creation(self):
        """Test that TapStack can be created with default parameters."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            default_tags={"tags": {"Environment": "test"}},
        )
        assert stack is not None

    def test_stack_with_custom_environment_suffix(self):
        """Test stack creation with custom environment suffix."""
        app = App()
        environment_suffix = "customtest123"
        stack = TapStack(
            app,
            f"TapStack{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region="us-west-2",
        )
        assert stack is not None

    def test_stack_with_custom_region(self):
        """Test stack creation with custom AWS region."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="eu-west-1",
        )
        assert stack is not None

    def test_stack_synthesizes_successfully(self):
        """Test that the stack synthesizes without errors."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_stack_has_required_outputs(self):
        """Test that stack defines all required outputs."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        # Check that outputs are defined
        outputs = manifest.get("output", {})
        expected_outputs = [
            "api_gateway_endpoint",
            "data_bucket_name",
            "dynamodb_table_name",
            "kms_key_arn",
            "cloudwatch_dashboard_url",
        ]

        for output_name in expected_outputs:
            assert output_name in outputs, f"Missing output: {output_name}"

    def test_stack_has_aws_provider(self):
        """Test that AWS provider is configured."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-west-2",
        )
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        # Check AWS provider configuration
        assert "provider" in manifest
        assert "aws" in manifest["provider"]

    def test_stack_has_s3_backend(self):
        """Test that S3 backend is configured."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="my-state-bucket",
            state_bucket_region="us-east-1",
        )
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        # Check S3 backend configuration
        assert "terraform" in manifest
        assert "backend" in manifest["terraform"]
        assert "s3" in manifest["terraform"]["backend"]

    def test_stack_resources_created(self):
        """Test that major resources are created."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        # Check that resources are defined
        assert "resource" in manifest
        resources = manifest["resource"]

        # Check for key resource types
        assert "aws_vpc" in resources
        assert "aws_s3_bucket" in resources
        assert "aws_lambda_function" in resources
        assert "aws_api_gateway_rest_api" in resources
        assert "aws_dynamodb_table" in resources
        assert "aws_kms_key" in resources

    def test_stack_with_default_tags(self):
        """Test that default tags are applied."""
        app = App()
        default_tags = {
            "tags": {
                "Environment": "test",
                "Repository": "test-repo",
                "Author": "test-author",
            }
        }
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1",
            default_tags=default_tags,
        )
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        # Check that provider has default_tags
        provider_config = manifest["provider"]["aws"][0]
        assert "default_tags" in provider_config

    def test_stack_networking_component(self):
        """Test that networking resources are created."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        resources = manifest["resource"]

        # Check networking resources
        assert "aws_vpc" in resources
        assert "aws_subnet" in resources
        assert "aws_security_group" in resources
        assert "aws_internet_gateway" in resources

    def test_stack_storage_component(self):
        """Test that storage resources are created."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        resources = manifest["resource"]

        # Check storage resources
        assert "aws_s3_bucket" in resources
        assert "aws_dynamodb_table" in resources
        assert "aws_kms_key" in resources

    def test_stack_compute_component(self):
        """Test that compute resources are created."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        resources = manifest["resource"]

        # Check compute resources
        assert "aws_lambda_function" in resources
        assert "aws_iam_role" in resources

    def test_stack_api_component(self):
        """Test that API Gateway resources are created."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        resources = manifest["resource"]

        # Check API Gateway resources
        assert "aws_api_gateway_rest_api" in resources
        assert "aws_api_gateway_deployment" in resources

    def test_stack_monitoring_component(self):
        """Test that monitoring resources are created."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        resources = manifest["resource"]

        # Check monitoring resources
        assert "aws_cloudwatch_metric_alarm" in resources
        assert "aws_sns_topic" in resources

    def test_stack_backup_component(self):
        """Test that backup resources are created."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        resources = manifest["resource"]

        # Check backup resources
        assert "aws_backup_vault" in resources
        assert "aws_backup_plan" in resources
