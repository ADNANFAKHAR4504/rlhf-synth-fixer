"""Unit tests for TAP Stack."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from lib.tap_stack import TapStack


class TestStackStructure:
  """Test suite for Stack Structure."""

  def test_tap_stack_instantiates_successfully(self):
    """TapStack instantiates successfully."""
    # Test that the class can be imported and has expected attributes
    assert TapStack is not None
    assert hasattr(TapStack, '__init__')
    
    # Quick instantiation test
    from cdktf import App
    app = App()
    stack = TapStack(app, "TestTapStack", environment_suffix="test")

    # Verify that TapStack instantiates without errors
    assert stack is not None
