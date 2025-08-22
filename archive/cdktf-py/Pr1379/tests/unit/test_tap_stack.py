"""Unit tests for Python TAP Stack (S3 bucket component only)."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing
from lib.tap_stack import TapStack


class TestTapStackStructure:
  """Test suite for Python TAP Stack (S3 bucket component)."""

  def test_tap_stack_creation(self):
    """Test TapStack basic creation."""
    app = App()
    stack = TapStack(app, "test-stack", environment_suffix="test")
    assert stack is not None
    assert hasattr(stack, 'bucket')

  def test_tap_stack_with_custom_config(self):
    """Test TapStack with custom configuration."""
    app = App()
    stack = TapStack(
        app,
        "test-stack-custom",
        environment_suffix="prod",
        aws_region="us-west-2"
    )
    assert stack is not None
    assert hasattr(stack, 'bucket')

  def test_tap_stack_synthesis(self):
    """Test TapStack synthesizes valid Terraform."""
    app = Testing.app()
    stack = TapStack(app, "synth-test", environment_suffix="test")
    synthesized = Testing.synth(stack)
    
    assert 'aws_s3_bucket' in synthesized
    assert 'versioning' in synthesized
    assert 'server_side_encryption_configuration' in synthesized