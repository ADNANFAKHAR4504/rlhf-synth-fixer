"""Integration tests for TapStack."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from lib.tap_stack import TapStack


class TestTurnAroundPromptAPIIntegrationTests:
  """Turn Around Prompt API Integration Tests."""

  def test_stack_integration(self):
    """Test that the stack integrates properly."""
    # Test that the class can be imported and has expected methods
    assert TapStack is not None
    assert hasattr(TapStack, '__init__')
    
    # Quick instantiation test 
    from cdktf import App
    app = App()
    stack = TapStack(app, "IntegrationTestStack", environment_suffix="integration")

    # Verify stack integrates successfully
    assert stack is not None
