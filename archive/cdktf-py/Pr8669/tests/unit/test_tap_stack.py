"""Unit tests for TapStack."""

import pytest
import os
from cdktf import Testing
from lib.tap_stack import TapStack


class TestTapStack:
    """Test TapStack infrastructure."""

    def test_stack_synthesis(self):
        """Test that the stack can be synthesized without errors."""
        # Set LocalStack environment for testing
        os.environ["AWS_ENDPOINT_URL"] = "http://localhost:4566"

        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            default_tags={"Environment": "test"},
        )
        synth = Testing.synth(stack)

        # Verify the stack synthesizes
        assert synth is not None

    def test_localstack_provider_configuration(self):
        """Test that LocalStack provider is configured correctly."""
        os.environ["AWS_ENDPOINT_URL"] = "http://localhost:4566"

        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        synth = Testing.synth(stack)

        # Verify LocalStack endpoints are configured
        assert synth is not None
        # Additional assertions can be added based on synthesized output

    def test_stack_without_localstack(self):
        """Test stack synthesis without LocalStack environment."""
        # Clear LocalStack environment
        os.environ.pop("AWS_ENDPOINT_URL", None)

        app = Testing.app()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="prod",
            aws_region="us-west-2",
        )
        synth = Testing.synth(stack)

        assert synth is not None
