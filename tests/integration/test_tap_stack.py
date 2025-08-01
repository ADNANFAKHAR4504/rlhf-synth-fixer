"""Integration tests for TAP stack."""

from cdktf import App

from lib.tap_stack import TapStack


class TestTapStackIntegration:
  """Integration test cases for TapStack class."""

  def test_stack_synthesis(self):
    """Test that the entire stack can be synthesized."""
    app = App()
    TapStack(
      app,
      "integration-test-stack",
      environment_suffix="integration",
      aws_region="us-east-1",
      default_tags={
        "Environment": "integration",
        "Project": "tap",
      },
    )

    # This should not raise any exceptions
    synth = app.synth()
    assert synth is not None
