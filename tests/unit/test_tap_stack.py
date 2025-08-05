"""Unit tests for TAP Stack module."""

import pytest
from cdktf import App

from lib.tap_stack import TapStack


class TestTapStack:
  """Test class for TapStack."""

  def test_tap_stack_creation(self):
    """Test that TapStack can be created successfully."""
    app = App()
    stack = TapStack(
      app,
      "test-stack",
      environment_suffix="test",
      aws_region="us-east-1",
      default_tags={"Project": "Test"}
    )
    assert stack is not None

  def test_tap_stack_with_defaults(self):
    """Test TapStack creation with default parameters."""
    app = App()
    stack = TapStack(app, "test-stack-defaults")
    assert stack is not None

  def test_tap_stack_synth(self):
    """Test that TapStack can be synthesized."""
    app = App()
    TapStack(
      app,
      "test-stack-synth",
      environment_suffix="test",
      aws_region="us-west-2"
    )
    # Test that synthesis completes without errors
    synth_result = app.synth()
    assert synth_result is not None
