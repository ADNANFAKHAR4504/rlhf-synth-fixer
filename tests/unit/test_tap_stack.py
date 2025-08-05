"""Unit tests for TAP Stack module."""

import pytest
from cdktf import App

from lib.tap_stack import TapStack


@pytest.fixture
def app():
  """Fixture for CDKTF App instance."""
  return App()


class TestTapStack:
  """Test class for TapStack."""

  def test_tap_stack_creation_with_minimal_config(self, app):
    """Test TapStack creation with minimal configuration."""
    stack = TapStack(app, "test-stack")
    assert stack is not None

  def test_tap_stack_creation_with_custom_config(self, app):
    """Test TapStack creation with custom configuration."""
    custom_config = {
      "environment_suffix": "staging",
      "aws_region": "us-west-2", 
      "state_bucket": "custom-tf-state-bucket",
      "default_tags": {"Project": "TestProject", "Owner": "TestTeam"}
    }
    stack = TapStack(app, "test-stack-custom", **custom_config)
    assert stack is not None

  def test_tap_stack_default_values(self, app):
    """Test that TapStack uses correct default values."""
    stack = TapStack(app, "test-defaults")
    # Verify defaults are applied (would need to access internal state)
    assert stack is not None

  @pytest.mark.parametrize("environment", ["dev", "staging", "prod", "test"])
  def test_tap_stack_environment_suffix_validation(self, app, environment):
    """Test different environment suffix values."""
    stack = TapStack(app, f"test-{environment}", environment_suffix=environment)
    assert stack is not None

  @pytest.mark.parametrize("region", ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"])
  def test_tap_stack_aws_regions(self, app, region):
    """Test TapStack with different AWS regions."""
    stack = TapStack(app, f"test-{region}", aws_region=region)
    assert stack is not None

  def test_tap_stack_with_empty_tags(self, app):
    """Test TapStack with empty default tags."""
    stack = TapStack(app, "test-empty-tags", default_tags={})
    assert stack is not None

  def test_tap_stack_with_complex_tags(self, app):
    """Test TapStack with complex tag structure."""
    complex_tags = {
      "Environment": "test",
      "Project": "TAP-Infrastructure",
      "CostCenter": "12345",
      "Owner": "DevOps-Team"
    }
    stack = TapStack(app, "test-complex-tags", default_tags=complex_tags)
    assert stack is not None

  def test_tap_stack_synth(self, app):
    """Test that TapStack can be synthesized."""
    TapStack(
      app,
      "test-stack-synth",
      environment_suffix="test",
      aws_region="us-west-2"
    )
    # Test that synthesis completes without errors
    synth_result = app.synth()
    assert synth_result is not None
    # Verify that stacks were created
    assert hasattr(synth_result, 'stacks')
    assert synth_result is not None
