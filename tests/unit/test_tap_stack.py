import unittest
from cdktf import App
from lib.tap_stack import TapStack

class TestTapStack(unittest.TestCase):
  """Simple unit tests for TapStack class."""

  def setUp(self):
    self.app = App()
    self.stack = TapStack(
      scope=self.app,
      construct_id="test-stack",
      environment_suffix="test",
      aws_region="us-east-1",
      state_bucket="test-bucket",
      state_bucket_region="us-east-1",
      default_tags={"Project": "TAP"}
    )

  def test_stack_initialization(self):
    """Test basic stack initialization."""
    self.assertEqual(self.stack.node.id, "test-stack")
    self.assertIsInstance(self.stack, TapStack)

  def test_vpc_creation(self):
    """Test VPC is created with correct settings."""
    vpc_constructs = [c for c in self.stack.node.children if c.node.id == "tap_vpc"]
    self.assertEqual(len(vpc_constructs), 1)

  def test_internet_gateway_creation(self):
    """Test IGW is created."""
    igw_constructs = [c for c in self.stack.node.children if c.node.id == "tap_igw"]
    self.assertEqual(len(igw_constructs), 1)

  def test_route_table_creation(self):
    """Test route table is created."""
    rt_constructs = [c for c in self.stack.node.children if c.node.id == "tap_public_rt"]
    self.assertEqual(len(rt_constructs), 1)

  def test_default_route_creation(self):
    """Test default route is created."""
    route_constructs = [c for c in self.stack.node.children if c.node.id == "tap_default_route"]
    self.assertEqual(len(route_constructs), 1)

  def test_route_table_associations(self):
    """Test route table associations are created."""
    assoc_constructs = [c for c in self.stack.node.children if "tap_rt_assoc" in c.node.id]
    self.assertEqual(len(assoc_constructs), 2)

if __name__ == "__main__":
  unittest.main()
