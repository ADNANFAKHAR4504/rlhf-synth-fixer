"""Integration tests for TAP Stack."""
import os
import sys
import pytest
from cdktf import Testing, App
from lib.tap_stack import TapStack

sys.path.append(
  os.path.dirname(
    os.path.dirname(
      os.path.dirname(os.path.abspath(__file__))
    )
  )
)


class TestTapStackIntegration:
  """Integration test suite for TapStack."""

  @pytest.fixture
  def stack(self):
    """Create a test stack."""
    app = App()
    return TapStack(app, "test")

  def test_synthesizes_successfully(self, stack):
    """Test if stack synthesizes without errors."""
    synthesized = Testing.synth(stack)
    assert len(synthesized) > 0

  def test_has_required_resources(self, stack):
    """Test if all required resources are present."""
    synthesized = Testing.synth(stack)
    
    # Check for VPC
    assert Testing.to_have_resource(synthesized, "aws_vpc")
    
    # Check for Subnets
    assert Testing.to_have_resource(synthesized, "aws_subnet")
    
    # Check for Security Group
    assert Testing.to_have_resource(synthesized, "aws_security_group")
