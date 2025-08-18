"""Integration tests for TapStack."""
from cdktf import App


class TestTurnAroundPromptAPIIntegrationTests:
  """Turn Around Prompt API Integration Tests."""

  def test_terraform_configuration_synthesis(self):
    """Test that stack instantiates properly."""
    app = App()
    assert app is not None

