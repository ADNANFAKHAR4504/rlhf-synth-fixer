"""Unit tests for TAP Stack."""

import os
import sys
from cdktf import App
from lib.tap_stack import TapStack

if __name__ == "__main__":
  PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
  sys.path.append(PROJECT_ROOT)
  sys.path.append(os.path.join(PROJECT_ROOT, ".gen"))


class TestTapStackUnit:
  """Unit tests for TAP Stack structure."""

  def __init__(self):
    self.app = None
    self.stack = None

  def setup_method(self):
    """Setup for each test."""
    self.app = App()
    self.stack = TapStack(
      self.app,
      "TestStackUnit",
      environment_suffix="unittest",
      aws_region="us-east-1"
    )

  def test_stack_instantiates(self):
    assert self.stack is not None

  def test_public_subnet_count(self):
    assert hasattr(self.stack, 'public_subnets')
    assert len(self.stack.public_subnets) == 2

  def test_private_subnet_count(self):
    assert hasattr(self.stack, 'private_subnets')
    assert len(self.stack.private_subnets) == 2

  def test_public_subnet_cidrs(self):
    expected = ["10.0.1.0/24", "10.0.2.0/24"]
    actual = [s.cidr_block for s in self.stack.public_subnets]
    assert actual == expected

  def test_private_subnet_cidrs(self):
    expected = ["10.0.3.0/24", "10.0.4.0/24"]
    actual = [s.cidr_block for s in self.stack.private_subnets]
    assert actual == expected

  def test_resource_naming_convention(self):
    for subnet in self.stack.public_subnets + self.stack.private_subnets:
      assert subnet.tags["Name"].startswith("iac-task-unittest-")
