"""Integration tests for TAP Stack."""
from cdktf import App, Testing
from lib.tap_stack import TapStack


class TestTapStackIntegration:
  """Integration tests to validate synthesized Terraform configuration."""

  def setup_method(self):
    self.app = App()
    self.stack = TapStack(
      self.app,
      "IntegrationStack",
      environment_suffix="test",
      aws_region="us-east-1"
    )
    self.synth = Testing.synth(self.stack)

  def test_synth_contains_vpc(self):
    assert any(res["type"] == "aws_vpc" for res in self.synth["resource"])

  def test_synth_contains_igw(self):
    assert any(res["type"] == "aws_internet_gateway" for res in self.synth["resource"])

  def test_synth_contains_correct_subnet_count(self):
    subnet_resources = [res for res in self.synth["resource"] if res["type"] == "aws_subnet"]
    assert len(subnet_resources) == 4

  def test_synth_contains_route_table(self):
    rt_resources = [res for res in self.synth["resource"] if res["type"] == "aws_route_table"]
    assert len(rt_resources) >= 1

  def test_default_route_to_igw_exists(self):
    route_resources = [res for res in self.synth["resource"] if res["type"] == "aws_route"]
    has_igw_route = any("0.0.0.0/0" in res["values"].get("destination_cidr_block", "") for res in route_resources)
    assert has_igw_route

  def test_route_table_association_to_public_subnets(self):
    rt_assoc_resources = [res for res in self.synth["resource"] if res["type"] == "aws_route_table_association"]
    assert len(rt_assoc_resources) == 2

  # -------------- Edge Case Tests ----------------

  def test_resources_have_required_keys(self):
    """Ensure every resource has 'type' and 'name' keys."""
    for res in self.synth["resource"]:
      assert "type" in res
      assert "name" in res

  def test_no_empty_resources(self):
    """Stack should not generate empty resources list."""
    assert "resource" in self.synth
    assert isinstance(self.synth["resource"], list)
    assert len(self.synth["resource"]) > 0

  def test_no_duplicate_cidr_blocks(self):
    """Ensure no two subnets share the same CIDR block."""
    subnet_resources = [r for r in self.synth["resource"] if r["type"] == "aws_subnet"]
    cidrs = [r["values"]["cidr_block"] for r in subnet_resources]
    assert len(cidrs) == len(set(cidrs)), "Duplicate CIDR blocks detected in subnets"

  def test_all_subnets_in_valid_az(self):
    """Validate subnets are in us-east-1a or us-east-1b only."""
    subnet_resources = [r for r in self.synth["resource"] if r["type"] == "aws_subnet"]
    allowed_azs = {"us-east-1a", "us-east-1b"}
    for subnet in subnet_resources:
      az = subnet["values"].get("availability_zone", "")
      assert az in allowed_azs, f"Invalid AZ: {az}"

  def test_no_unexpected_resource_types(self):
    """Ensure only expected AWS resource types are defined."""
    expected_types = {
      "aws_vpc", "aws_subnet", "aws_internet_gateway", "aws_route_table",
      "aws_route", "aws_route_table_association"
    }
    for res in self.synth["resource"]:
      assert res["type"] in expected_types, f"Unexpected resource type: {res['type']}"
