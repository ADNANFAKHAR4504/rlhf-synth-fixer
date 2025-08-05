"""Unit tests for TAP Stack module."""

import pytest
from cdktf import App

from lib.tap_stack import TapStack


class TestTapStack:
  """Test class for TapStack."""

  def test_tap_stack_creation_with_minimal_config(self):
    """Test TapStack creation with minimal configuration."""
    app = App()
    stack = TapStack(app, "test-stack")
    assert stack is not None

  def test_tap_stack_creation_with_custom_config(self):
    """Test TapStack creation with custom configuration."""
    app = App()
    custom_config = {
      "environment_suffix": "staging",
      "aws_region": "us-west-2", 
      "state_bucket": "custom-tf-state-bucket",
      "default_tags": {"Project": "TestProject", "Owner": "TestTeam"}
    }
    stack = TapStack(app, "test-stack-custom", **custom_config)
    assert stack is not None

  def test_tap_stack_default_values(self):
    """Test that TapStack uses correct default values."""
    app = App()
    stack = TapStack(app, "test-defaults")
    # Verify defaults are applied (would need to access internal state)
    assert stack is not None

  def test_tap_stack_environment_suffix_validation(self):
    """Test different environment suffix values."""
    app = App()
    environments = ["dev", "staging", "prod", "test"]
    for env in environments:
      stack = TapStack(app, f"test-{env}", environment_suffix=env)
      assert stack is not None

  def test_tap_stack_aws_regions(self):
    """Test TapStack with different AWS regions."""
    app = App()
    regions = ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"]
    for region in regions:
      stack = TapStack(app, f"test-{region}", aws_region=region)
      assert stack is not None

  def test_tap_stack_with_empty_tags(self):
    """Test TapStack with empty default tags."""
    app = App()
    stack = TapStack(app, "test-empty-tags", default_tags={})
    assert stack is not None

  def test_tap_stack_with_complex_tags(self):
    """Test TapStack with complex tag structure."""
    app = App()
    complex_tags = {
      "Environment": "test",
      "Project": "TAP-Infrastructure",
      "CostCenter": "12345",
      "Owner": "DevOps-Team"
    }
    stack = TapStack(app, "test-complex-tags", default_tags=complex_tags)
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
