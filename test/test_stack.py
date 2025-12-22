"""
Tests for TapStack CDKTF infrastructure.
"""
import os
import pytest


def test_imports():
    """Test that all required modules can be imported."""
    # pylint: disable=import-outside-toplevel,unused-import
    from lib.tap_stack import TapStack
    from cdktf import App
    assert TapStack is not None
    assert App is not None


def test_stack_creation():
    """Test basic stack creation."""
    # pylint: disable=import-outside-toplevel
    from lib.tap_stack import TapStack
    from cdktf import App, Testing

    app = App()
    stack = TapStack(
        app,
        "TestStack",
        environment_suffix="test",
        aws_region="us-east-1",
        default_tags={"tags": {"Test": "true"}}
    )

    assert stack is not None

    # Synthesize to verify configuration
    synth = Testing.synth(stack)
    assert synth is not None


def test_localstack_detection():
    """Test LocalStack endpoint detection."""
    # pylint: disable=import-outside-toplevel
    from lib.tap_stack import TapStack
    from cdktf import App

    # Set LocalStack environment variable
    os.environ["AWS_ENDPOINT_URL"] = "http://localhost:4566"

    app = App()
    stack = TapStack(
        app,
        "LocalStackTest",
        environment_suffix="test",
        aws_region="us-east-1"
    )

    assert stack is not None

    # Cleanup
    del os.environ["AWS_ENDPOINT_URL"]
