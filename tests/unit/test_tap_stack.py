"""Unit tests for TAP Stack."""
import os
import sys
import pytest
from cdktf import Testing

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from lib.tap_stack import TapStack  # pylint: disable=wrong-import-position


def test_tap_stack_creates_resources():
    """Test that TAP stack creates expected resources."""
    app = Testing.app()
    stack = TapStack(
        app,
        "test-stack",
        environment_suffix="test",
        aws_region="eu-central-1",
        state_bucket="test-bucket",
        state_bucket_region="us-east-1",
        default_tags={"Environment": "test"}
    )

    synthesized = Testing.synth(stack)
    assert synthesized is not None


def test_stack_has_aws_provider():
    """Test that stack configures AWS provider."""
    app = Testing.app()
    stack = TapStack(
        app,
        "test-stack",
        environment_suffix="test",
        aws_region="eu-central-1"
    )

    synthesized = Testing.synth(stack)
    # Verify provider configuration exists
    assert "provider" in synthesized


def test_stack_uses_environment_suffix():
    """Test that resources use environment suffix."""
    app = Testing.app()
    suffix = "test123"
    stack = TapStack(
        app,
        "test-stack",
        environment_suffix=suffix,
        aws_region="eu-central-1"
    )

    synthesized = Testing.synth(stack)
    # Verify environment suffix is used in resource names
    assert suffix in str(synthesized)


def test_stack_configures_encryption():
    """Test that encryption is configured for resources."""
    app = Testing.app()
    stack = TapStack(
        app,
        "test-stack",
        environment_suffix="test",
        aws_region="eu-central-1"
    )

    synthesized = Testing.synth(stack)
    # Verify KMS and encryption settings
    assert "kms" in str(synthesized).lower() or "encryption" in str(synthesized).lower()


def test_stack_has_s3_backend():
    """Test that S3 backend is configured."""
    app = Testing.app()
    stack = TapStack(
        app,
        "test-stack",
        environment_suffix="test",
        aws_region="eu-central-1",
        state_bucket="test-state-bucket"
    )

    synthesized = Testing.synth(stack)
    # Verify backend configuration
    assert "backend" in str(synthesized).lower()


def test_stack_creates_kinesis_stream():
    """Test that Kinesis stream is created."""
    app = Testing.app()
    stack = TapStack(
        app,
        "test-stack",
        environment_suffix="test",
        aws_region="eu-central-1"
    )

    synthesized = Testing.synth(stack)
    # Verify Kinesis stream exists
    assert "kinesis" in str(synthesized).lower()


def test_stack_creates_timestream_resources():
    """Test that Timestream database and table are created."""
    app = Testing.app()
    stack = TapStack(
        app,
        "test-stack",
        environment_suffix="test",
        aws_region="eu-central-1"
    )

    synthesized = Testing.synth(stack)
    # Verify Timestream resources exist
    assert "timestream" in str(synthesized).lower()


def test_stack_creates_s3_buckets():
    """Test that S3 buckets are created."""
    app = Testing.app()
    stack = TapStack(
        app,
        "test-stack",
        environment_suffix="test",
        aws_region="eu-central-1"
    )

    synthesized = Testing.synth(stack)
    # Verify S3 buckets exist
    assert "s3_bucket" in str(synthesized).lower()


def test_stack_creates_lambda_function():
    """Test that Lambda function is created."""
    app = Testing.app()
    stack = TapStack(
        app,
        "test-stack",
        environment_suffix="test",
        aws_region="eu-central-1"
    )

    synthesized = Testing.synth(stack)
    # Verify Lambda function exists
    assert "lambda" in str(synthesized).lower()


def test_stack_creates_secrets_manager():
    """Test that Secrets Manager secret is created."""
    app = Testing.app()
    stack = TapStack(
        app,
        "test-stack",
        environment_suffix="test",
        aws_region="eu-central-1"
    )

    synthesized = Testing.synth(stack)
    # Verify Secrets Manager secret exists
    assert "secretsmanager" in str(synthesized).lower()
