"""Unit tests for TAP CDK stack."""
import pytest
from aws_cdk import App
from lib.tap_stack import TapStack


def test_tap_stack_creation():
    """Test that TapStack can be instantiated."""
    app = App()
    stack = TapStack(
        app,
        "test-tap-stack",
        env={"account": "000000000000", "region": "us-east-1"}
    )
    assert stack is not None
