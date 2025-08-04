import unittest
import json
from cdktf import App, Testing as CDKTesting
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
    self.expected_public_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
    self.expected_private_cidrs = ["10.0.3.0/24", "10.0.4.0/24"]
    self.synth_output = json.loads(CDKTesting.synth(self.stack))

  def test_stack_initialization(self):
    self.assertEqual(self.stack.node.id, "test-stack")
    self.assertIsInstance(self.stack, TapStack)

  def test_vpc_creation(self):
    vpc_constructs = [c for c in self.stack.node.children if c.node.id == "tap_vpc"]
    self.assertEqual(len(vpc_constructs), 1)

  def test_internet_gateway_creation(self):
    igw_constructs = [c for c in self.stack.node.children if c.node.id == "tap_igw"]
    self.assertEqual(len(igw_constructs), 1)

  def test_route_table_creation(self):
    rt_constructs = [c for c in self.stack.node.children if c.node.id == "tap_public_rt"]
    self.assertEqual(len(rt_constructs), 1)

  def test_default_route_creation(self):
    route_constructs = [c for c in self.stack.node.children if c.node.id == "tap_default_route"]
    self.assertEqual(len(route_constructs), 1)

  def test_route_table_associations(self):
    assoc_constructs = [c for c in self.stack.node.children if "tap_rt_assoc" in c.node.id]
    self.assertEqual(len(assoc_constructs), 2)
  def test_public_subnet_cidrs(self):
    """Test public subnets have correct CIDR ranges."""
    subnets = self.synth_output["resource"]["aws_subnet"]
    public_subnets = [
      s for s in subnets.values() 
      if "public" in s["tags"]["Name"]
    ]
    actual_cidrs = [s["cidr_block"] for s in public_subnets]
    self.assertCountEqual(actual_cidrs, self.expected_public_cidrs,
                       "Public subnet CIDR ranges do not match expected")

  def test_private_subnet_cidrs(self):
    """Test private subnets have correct CIDR ranges."""
    subnets = self.synth_output["resource"]["aws_subnet"]
    private_subnets = [
      s for s in subnets.values()
      if "private" in s["tags"]["Name"]
    ]
    actual_cidrs = [s["cidr_block"] for s in private_subnets]
    self.assertCountEqual(actual_cidrs, self.expected_private_cidrs,
                       "Private subnet CIDR ranges do not match expected")

if __name__ == "__main__":
  unittest.main()
