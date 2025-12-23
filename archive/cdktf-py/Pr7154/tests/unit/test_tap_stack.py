"""Unit tests for TapStack."""

import os
import pytest
from cdktf import Testing
from lib.tap_stack import TapStack


class TestTapStack:
    """Test cases for TapStack."""

    def test_tap_stack_initialization(self):
        """Test stack initialization."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            default_tags={'Environment': 'test'}
        )

        assert stack is not None

    def test_tap_stack_with_default_values(self):
        """Test stack with default parameter values."""
        app = Testing.app()
        stack = TapStack(app, "TestStack")

        assert stack is not None

    def test_tap_stack_synthesis(self):
        """Test stack synthesis."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-west-2",
            state_bucket="test-bucket",
            state_bucket_region="us-west-2",
            default_tags={'Environment': 'test'}
        )

        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_compliance_validator_created(self):
        """Test that ComplianceValidator is created in stack."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test"
        )

        assert hasattr(stack, 'compliance_validator')
        assert stack.compliance_validator is not None

    def test_custom_aws_region(self):
        """Test stack with custom AWS region."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="prod",
            aws_region="eu-west-1"
        )

        assert stack is not None

    def test_custom_environment_suffix(self):
        """Test stack with custom environment suffix."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="staging"
        )

        assert stack is not None
