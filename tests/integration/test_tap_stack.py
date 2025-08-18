"""Integration tests for TapStack."""
from cdktf import App
from lib.tap_stack import TapStack


class TestTurnAroundPromptAPIIntegrationTests:
  """Turn Around Prompt API Integration Tests."""

  def test_terraform_configuration_synthesis(self):
    """Test that stack instantiates properly."""
    app = App()
    stack = TapStack(app, "integration-test", environment_suffix="test")
    assert stack is not None
    assert hasattr(stack, 'bucket')

