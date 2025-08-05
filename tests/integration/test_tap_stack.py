"""Integration tests for TAP Stack module."""

import pytest
from cdktf import App

from lib.tap_stack import TapStack


class TestTapStackIntegration:
  """Integration test class for TapStack."""

  def test_full_stack_deployment_structure(self):
    """Test the full stack deployment structure."""
    app = App()
    stack = TapStack(
      app,
      "integration-test-stack",
      environment_suffix="integration",
      aws_region="us-east-1",
      default_tags={"Environment": "Integration", "Project": "TAP"}
    )
    
    # Synthesize and verify structure
    synth_result = app.synth()
    assert synth_result is not None
    assert len(synth_result.stacks) > 0
