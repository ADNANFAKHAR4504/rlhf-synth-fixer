"""Unit tests for TAP Stack."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App
from lib.tap_stack import TapStack


class TestStackStructure:
  """Test suite for Stack Structure."""

  def setup_method(self):
    """Reset mocks before each test."""
    # Clear any previous test state if needed
    pass

  def test_tap_stack_creation(self):
    """Test TapStack creation."""
    app = App()
    stack = TapStack(app, "test-stack", environment_suffix="test")
    assert stack is not None
    assert hasattr(stack, 'bucket')

  def test_tap_stack_with_custom_config(self):
    """Test TapStack with custom configuration."""
    app = App()
    stack = TapStack(
        app,
        "test-stack-custom",
        environment_suffix="prod",
        aws_region="us-west-2"
    )
    assert stack is not None
    assert hasattr(stack, 'bucket')
