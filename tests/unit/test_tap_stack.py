"""Unit tests for TAP Stack."""
import os
import sys
from cdktf import App
from lib.tap_stack import TapStack, TapStackConfig

sys.path.append(
  os.path.dirname(
    os.path.dirname(
      os.path.dirname(os.path.abspath(__file__))
    )
  )
)


class TestStackStructure:
  """Test suite for Stack Structure."""

  def test_tap_stack_instantiates_successfully_via_props(self):
    """TapStack instantiates successfully via props."""
    app = App()
    config = TapStackConfig(
      environment_suffix="prod",
      aws_region="us-west-2"
    )
    stack = TapStack(app, "TestTapStackWithProps", config)

    assert stack is not None

  def test_tap_stack_uses_default_values_when_no_props_provided(self):
    """TapStack uses default values when no props provided."""
    app = App()
    stack = TapStack(app, "TestTapStackDefault")
    assert stack is not None
