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

  def test_vpc_configuration(self, stack):
    """Test VPC resource configuration."""
    synthesized = Testing.synth(stack)
    assert Testing.to_have_resource_with_properties(synthesized, "aws_vpc", {
      "enable_dns_hostnames": True,
      "enable_dns_support": True
    })

  def test_subnet_configurations(self, stack):
    """Test subnet resource configurations."""
    synthesized = Testing.synth(stack)
    # Check first subnet
    assert Testing.to_have_resource_with_properties(synthesized, "aws_subnet", {
      "map_public_ip_on_launch": True
    })
    # Check second subnet
    assert Testing.to_have_resource_with_properties(synthesized, "aws_subnet", {
      "map_public_ip_on_launch": True
    })

  def test_security_group_rules(self, stack):
    """Test security group rules configuration."""
    synthesized = Testing.synth(stack)
    # Check SSH rule
    assert Testing.to_have_resource_with_properties(synthesized, "aws_security_group_rule", {
      "type": "ingress",
      "from_port": 22,
      "to_port": 22,
      "protocol": "tcp"
    })
    # Check HTTP rule
    assert Testing.to_have_resource_with_properties(synthesized, "aws_security_group_rule", {
      "type": "ingress",
      "from_port": 80,
      "to_port": 80,
      "protocol": "tcp"
    })
    # Check egress rule
    assert Testing.to_have_resource_with_properties(synthesized, "aws_security_group_rule", {
      "type": "egress",
      "from_port": 0,
      "to_port": 0,
      "protocol": "-1"
    })
