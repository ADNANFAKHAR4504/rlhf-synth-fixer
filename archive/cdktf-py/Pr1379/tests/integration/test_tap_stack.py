"""Integration tests for Python TAP Stack (S3 bucket component only)."""
import os
import sys
from cdktf import App, Testing

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from lib.tap_stack import TapStack


class TestTapStackIntegration:
  """Integration tests for Python TAP Stack (S3 bucket component)."""

  def test_tap_stack_terraform_synthesis(self):
    """Test TapStack synthesizes valid Terraform."""
    app = Testing.app()
    stack = TapStack(app, "integration-test", environment_suffix="test")
    synthesized = Testing.synth(stack)
    
    assert 'terraform' in synthesized
    assert 'aws_s3_bucket' in synthesized

  def test_tap_stack_s3_encryption(self):
    """Test S3 bucket has encryption configured."""
    app = Testing.app()
    stack = TapStack(app, "encryption-test", environment_suffix="test")
    synthesized = Testing.synth(stack)
    
    assert 'server_side_encryption_configuration' in synthesized
    assert 'AES256' in synthesized