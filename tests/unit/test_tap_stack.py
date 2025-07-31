"""Unit tests for TAP stack."""

from cdktf import App

from lib.tap_stack import TapStack


class TestTapStack:
  """Test cases for TapStack class."""

  def test_tap_stack_creation(self):
    """Test that TAP stack can be created without errors."""
    app = App()
    TapStack(
      app,
      "test-stack",
      environment_suffix="test",
      aws_region="us-west-2",
      default_tags={
        "Environment": "test",
        "Project": "tap"
      }
    )
    
    # Synthesize the stack to ensure no errors
    synth = app.synth()
    stack_artifact = synth.get_stack_by_name("test-stack")
    assert stack_artifact is not None

  def test_stack_has_required_resources(self):
    """Test that the stack contains required resources."""
    app = App()
    TapStack(
      app,
      "test-stack",
      environment_suffix="test"
    )
    
    # This would test for specific resources in the synthesized output
    synth = app.synth()
    stack_artifact = synth.get_stack_by_name("test-stack")
    assert stack_artifact is not None
    # Add more specific assertions as needed
