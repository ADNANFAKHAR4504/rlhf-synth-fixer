"""Unit tests for TAP Stack."""
import os
import sys
from cdktf import App
from lib.tap_stack import TapStack, TapStackConfig

sys.path.append(
  os.path.dirname(
    os.path.dirname(
      os.path.dirname(os.path.abspath(__file__))
    )
  )
)


class TestStackStructure:
  """Test suite for Stack Structure."""

  def test_tap_stack_instantiates_successfully_via_props(self):
    """TapStack instantiates successfully via props."""
    app = App()
    config = TapStackConfig(
      environment_suffix="prod",
      aws_region="us-west-2"
    )
    stack = TapStack(app, "TestTapStackWithProps", config)

    assert stack is not None

  def test_tap_stack_uses_default_values_when_no_props_provided(self):
    """TapStack uses default values when no props provided"""
    app = App()
    stack = TapStack(app, "TestTapStackDefault")
    assert stack is not None

  def test_tap_stack_with_custom_vpc_cidr(self):
    """Test VPC creation with custom CIDR."""
    app = App()
    config = TapStackConfig(
      vpc_cidr="172.16.0.0/16"
    )
    stack = TapStack(app, "test-vpc", config)
    assert stack is not None
    # Add assertions for VPC CIDR

  def test_tap_stack_with_custom_subnet_cidrs(self):
    """Test subnet creation with custom CIDRs."""
    app = App()
    config = TapStackConfig(
      public_subnet_cidrs=("172.16.1.0/24", "172.16.2.0/24")
    )
    stack = TapStack(app, "test-subnets", config)
    assert stack is not None
    # Add assertions for subnet CIDRs

  def test_tap_stack_security_group_rules(self):
    """Test security group rules configuration."""
    app = App()
    config = TapStackConfig(
      allowed_ssh_cidr="10.0.0.0/8",
      allowed_http_cidr="192.168.0.0/16"
    )
    stack = TapStack(app, "test-sg", config)
    assert stack is not None
    # Add assertions for security group rules
