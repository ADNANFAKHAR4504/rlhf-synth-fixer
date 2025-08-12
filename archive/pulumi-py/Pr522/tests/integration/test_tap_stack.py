"""
Integration tests for IPv6 dual-stack VPC Pulumi stack.

These tests validate the deployed infrastructure using real AWS outputs
stored in cfn-outputs/flat-outputs.json (no mocking).
"""

import unittest
import json
import os
import ipaddress


class TestIPv6DualStackVPCIntegration(unittest.TestCase):
  """Integration tests using real AWS deployment outputs."""

  def setUp(self):
    """Set up integration test with deployment outputs."""
    self.outputs_file = "cfn-outputs/flat-outputs.json"
    self.outputs = self._load_outputs()

  def _load_outputs(self):
    """Load deployment outputs from JSON file."""
    if not os.path.exists(self.outputs_file):
      self.skipTest(f"Outputs file {self.outputs_file} not found. Deploy infrastructure first.")
    
    with open(self.outputs_file, 'r', encoding='utf-8') as f:
      outputs = json.load(f)
    
    # Process outputs to handle string representations of lists (common with some IaC tools)
    processed_outputs = {}
    for key, value in outputs.items():
      if isinstance(value, str):
        # Try to parse as JSON if it looks like a JSON array
        if value.strip().startswith('[') and value.strip().endswith(']'):
          try:
            processed_outputs[key] = json.loads(value)
          except json.JSONDecodeError:
            processed_outputs[key] = value
        else:
          processed_outputs[key] = value
      else:
        processed_outputs[key] = value
    
    return processed_outputs

  def test_vpc_exists_with_correct_attributes(self):
    """Test VPC exists with correct ID format and IPv4/IPv6 CIDR blocks."""
    vpc_id = self.outputs.get("vpc_id")
    vpc_ipv6_cidr = self.outputs.get("vpc_ipv6_cidr_block")
    
    # Validate VPC ID format
    self.assertIsNotNone(vpc_id)
    self.assertRegex(vpc_id, r'^vpc-[a-f0-9]{17}$', "VPC ID should match AWS format")
    
    # Validate IPv6 CIDR block
    self.assertIsNotNone(vpc_ipv6_cidr)
    try:
      ipv6_network = ipaddress.IPv6Network(vpc_ipv6_cidr, strict=False)
      self.assertTrue(ipv6_network.prefixlen <= 56, "VPC IPv6 CIDR should be /56 or larger")
    except ValueError:
      self.fail(f"Invalid IPv6 CIDR block: {vpc_ipv6_cidr}")

  def test_public_subnet_ipv6_configuration(self):
    """Test public subnet has correct IPv6 CIDR configuration."""
    public_subnet_id = self.outputs.get("public_subnet_id")
    public_subnet_ipv6_cidr = self.outputs.get("public_subnet_ipv6_cidr_block")
    vpc_ipv6_cidr = self.outputs.get("vpc_ipv6_cidr_block")
    
    # Validate subnet ID
    self.assertIsNotNone(public_subnet_id)
    self.assertRegex(public_subnet_id, r'^subnet-[a-f0-9]{17}$',
                     "Subnet ID should match AWS format")
    
    # Validate IPv6 CIDR is within VPC CIDR range
    self.assertIsNotNone(public_subnet_ipv6_cidr)
    try:
      vpc_network = ipaddress.IPv6Network(vpc_ipv6_cidr, strict=False)
      subnet_network = ipaddress.IPv6Network(public_subnet_ipv6_cidr, strict=False)
      self.assertTrue(subnet_network.subnet_of(vpc_network), 
                      "Public subnet IPv6 CIDR should be within VPC IPv6 CIDR")
      self.assertEqual(subnet_network.prefixlen, 64, "Subnet should have /64 prefix")
    except ValueError as e:
      self.fail(f"Invalid IPv6 CIDR configuration: {e}")

  def test_private_subnet_ipv6_configuration(self):
    """Test private subnet has correct IPv6 CIDR configuration."""
    private_subnet_id = self.outputs.get("private_subnet_id")
    private_subnet_ipv6_cidr = self.outputs.get("private_subnet_ipv6_cidr_block")
    vpc_ipv6_cidr = self.outputs.get("vpc_ipv6_cidr_block")
    
    # Validate subnet ID
    self.assertIsNotNone(private_subnet_id)
    self.assertRegex(private_subnet_id, r'^subnet-[a-f0-9]{17}$',
                     "Subnet ID should match AWS format")
    
    # Validate IPv6 CIDR is within VPC CIDR range
    self.assertIsNotNone(private_subnet_ipv6_cidr)
    try:
      vpc_network = ipaddress.IPv6Network(vpc_ipv6_cidr, strict=False)
      subnet_network = ipaddress.IPv6Network(private_subnet_ipv6_cidr, strict=False)
      self.assertTrue(subnet_network.subnet_of(vpc_network), 
                      "Private subnet IPv6 CIDR should be within VPC IPv6 CIDR")
      self.assertEqual(subnet_network.prefixlen, 64, "Subnet should have /64 prefix")
    except ValueError as e:
      self.fail(f"Invalid IPv6 CIDR configuration: {e}")

  def test_security_group_configuration(self):
    """Test security group exists with correct format."""
    sg_id = self.outputs.get("security_group_id")
    
    self.assertIsNotNone(sg_id)
    self.assertRegex(sg_id, r'^sg-[a-f0-9]{17}$', "Security Group ID should match AWS format")

  def _ensure_ipv6_list(self, ipv6_data, instance_name):
    """Convert IPv6 address data to list format if needed."""
    if ipv6_data is None:
      return None
    
    # If it's already a list, return it
    if isinstance(ipv6_data, list):
      return ipv6_data
    
    # If it's a string, try to parse it
    if isinstance(ipv6_data, str):
      # Handle comma-separated values
      if ',' in ipv6_data:
        return [addr.strip() for addr in ipv6_data.split(',')]
      # Handle single address
      else:
        return [ipv6_data.strip()]
    
    # If it's some other type, convert to string and try
    return [str(ipv6_data)]

  def test_ec2_instances_static_ipv6_addresses(self):
    """Test EC2 instances have static IPv6 addresses assigned."""
    instance1_id = self.outputs.get("instance1_id")
    instance1_ipv6_raw = self.outputs.get("instance1_ipv6_addresses")
    instance2_id = self.outputs.get("instance2_id")
    instance2_ipv6_raw = self.outputs.get("instance2_ipv6_addresses")
    
    # Validate instance IDs
    self.assertIsNotNone(instance1_id)
    self.assertRegex(instance1_id, r'^i-[a-f0-9]{17}$', "Instance ID should match AWS format")
    self.assertIsNotNone(instance2_id)
    self.assertRegex(instance2_id, r'^i-[a-f0-9]{17}$', "Instance ID should match AWS format")
    
    # Convert IPv6 addresses to list format
    instance1_ipv6 = self._ensure_ipv6_list(instance1_ipv6_raw, "instance1")
    instance2_ipv6 = self._ensure_ipv6_list(instance2_ipv6_raw, "instance2")
    
    # Validate IPv6 addresses
    self.assertIsNotNone(instance1_ipv6)
    self.assertIsInstance(instance1_ipv6, list)
    self.assertGreater(len(instance1_ipv6), 0, "Instance1 should have at least one IPv6 address")
    
    self.assertIsNotNone(instance2_ipv6)
    self.assertIsInstance(instance2_ipv6, list)
    self.assertGreater(len(instance2_ipv6), 0, "Instance2 should have at least one IPv6 address")
    
    # Validate IPv6 address format
    for ipv6_addr in instance1_ipv6:
      try:
        ipaddress.IPv6Address(ipv6_addr)
      except ValueError:
        self.fail(f"Invalid IPv6 address for instance1: {ipv6_addr}")
    
    for ipv6_addr in instance2_ipv6:
      try:
        ipaddress.IPv6Address(ipv6_addr)
      except ValueError:
        self.fail(f"Invalid IPv6 address for instance2: {ipv6_addr}")

  def test_nat_gateway_exists(self):
    """Test NAT Gateway exists for private subnet IPv4 connectivity."""
    nat_id = self.outputs.get("nat_gateway_id")
    
    self.assertIsNotNone(nat_id)
    self.assertRegex(nat_id, r'^nat-[a-f0-9]{17}$', "NAT Gateway ID should match AWS format")

  def test_egress_only_internet_gateway_exists(self):
    """Test Egress-Only Internet Gateway exists for private subnet IPv6 connectivity."""
    eigw_id = self.outputs.get("egress_igw_id")
    
    self.assertIsNotNone(eigw_id)
    self.assertRegex(eigw_id, r'^eigw-[a-f0-9]{17}$', "Egress-Only IGW ID should match AWS format")

  def test_subnet_ipv6_cidrs_are_different(self):
    """Test that public and private subnets have different IPv6 CIDR blocks."""
    public_ipv6_cidr = self.outputs.get("public_subnet_ipv6_cidr_block")
    private_ipv6_cidr = self.outputs.get("private_subnet_ipv6_cidr_block")
    
    self.assertIsNotNone(public_ipv6_cidr)
    self.assertIsNotNone(private_ipv6_cidr)
    self.assertNotEqual(public_ipv6_cidr, private_ipv6_cidr, 
                        "Public and private subnets should have different IPv6 CIDR blocks")

  def test_ipv6_addresses_within_subnet_cidr(self):
    """Test that instance IPv6 addresses are within their subnet CIDR blocks."""
    public_subnet_ipv6_cidr = self.outputs.get("public_subnet_ipv6_cidr_block")
    instance1_ipv6_raw = self.outputs.get("instance1_ipv6_addresses")
    instance2_ipv6_raw = self.outputs.get("instance2_ipv6_addresses")
    
    # Convert IPv6 addresses to list format
    instance1_ipv6 = self._ensure_ipv6_list(instance1_ipv6_raw, "instance1")
    instance2_ipv6 = self._ensure_ipv6_list(instance2_ipv6_raw, "instance2")
    
    if not (public_subnet_ipv6_cidr and instance1_ipv6 and instance2_ipv6):
      self.skipTest("Required IPv6 configuration not available")
    
    try:
      subnet_network = ipaddress.IPv6Network(public_subnet_ipv6_cidr, strict=False)
      
      # Check instance1 IPv6 addresses
      for ipv6_addr in instance1_ipv6:
        ipv6_address = ipaddress.IPv6Address(ipv6_addr)
        self.assertIn(ipv6_address, subnet_network, 
                      f"Instance1 IPv6 address {ipv6_addr} should be within subnet CIDR "
                      f"{public_subnet_ipv6_cidr}")
      
      # Check instance2 IPv6 addresses
      for ipv6_addr in instance2_ipv6:
        ipv6_address = ipaddress.IPv6Address(ipv6_addr)
        self.assertIn(ipv6_address, subnet_network, 
                      f"Instance2 IPv6 address {ipv6_addr} should be within subnet CIDR "
                      f"{public_subnet_ipv6_cidr}")
    
    except ValueError as e:
      self.fail(f"IPv6 address validation failed: {e}")

  def test_all_required_outputs_present(self):
    """Test that all required infrastructure outputs are present."""
    required_outputs = [
      "vpc_id", "vpc_ipv6_cidr_block",
      "public_subnet_id", "public_subnet_ipv6_cidr_block",
      "private_subnet_id", "private_subnet_ipv6_cidr_block",
      "security_group_id", "instance1_id", "instance1_ipv6_addresses",
      "instance2_id", "instance2_ipv6_addresses",
      "nat_gateway_id", "egress_igw_id"
    ]
    
    for output_key in required_outputs:
      self.assertIn(output_key, self.outputs, f"Missing required output: {output_key}")
      self.assertIsNotNone(self.outputs[output_key], f"Output {output_key} should not be None")

  def test_ipv6_dual_stack_completeness(self):
    """Test that the infrastructure implements complete IPv6 dual-stack networking."""
    # Verify dual-stack components
    vpc_ipv6_cidr = self.outputs.get("vpc_ipv6_cidr_block")
    public_subnet_ipv6_cidr = self.outputs.get("public_subnet_ipv6_cidr_block")
    private_subnet_ipv6_cidr = self.outputs.get("private_subnet_ipv6_cidr_block")
    instance1_ipv6_raw = self.outputs.get("instance1_ipv6_addresses")
    instance2_ipv6_raw = self.outputs.get("instance2_ipv6_addresses")
    eigw_id = self.outputs.get("egress_igw_id")
    
    # Convert IPv6 addresses to list format
    instance1_ipv6 = self._ensure_ipv6_list(instance1_ipv6_raw, "instance1")
    instance2_ipv6 = self._ensure_ipv6_list(instance2_ipv6_raw, "instance2")
    
    # All IPv6 components should be present
    ipv6_components = [vpc_ipv6_cidr, public_subnet_ipv6_cidr, private_subnet_ipv6_cidr, 
                       instance1_ipv6, instance2_ipv6, eigw_id]
    
    for component in ipv6_components:
      self.assertIsNotNone(component, "All IPv6 dual-stack components should be configured")
    
    # Verify static IPv6 addresses are assigned
    self.assertTrue(len(instance1_ipv6) > 0, "Instance1 should have static IPv6 addresses")
    self.assertTrue(len(instance2_ipv6) > 0, "Instance2 should have static IPv6 addresses")

  def test_requirements_compliance(self):
    """Test compliance with all requirements from PROMPT.md."""
    # Requirement 1: VPC with both IPv4 and IPv6 CIDR blocks
    vpc_id = self.outputs.get("vpc_id")
    vpc_ipv6_cidr = self.outputs.get("vpc_ipv6_cidr_block")
    self.assertIsNotNone(vpc_id, "VPC should exist")
    self.assertIsNotNone(vpc_ipv6_cidr, "VPC should have IPv6 CIDR block")
    
    # Requirement 2: One public and one private subnet, both with IPv6 CIDR blocks
    public_subnet_id = self.outputs.get("public_subnet_id")
    public_subnet_ipv6_cidr = self.outputs.get("public_subnet_ipv6_cidr_block")
    private_subnet_id = self.outputs.get("private_subnet_id")
    private_subnet_ipv6_cidr = self.outputs.get("private_subnet_ipv6_cidr_block")
    
    self.assertIsNotNone(public_subnet_id, "Public subnet should exist")
    self.assertIsNotNone(public_subnet_ipv6_cidr, "Public subnet should have IPv6 CIDR")
    self.assertIsNotNone(private_subnet_id, "Private subnet should exist")
    self.assertIsNotNone(private_subnet_ipv6_cidr, "Private subnet should have IPv6 CIDR")
    
    # Requirement 3: EC2 instances in public subnet with static IPv6 addresses
    instance1_id = self.outputs.get("instance1_id")
    instance1_ipv6_raw = self.outputs.get("instance1_ipv6_addresses")
    instance2_id = self.outputs.get("instance2_id")
    instance2_ipv6_raw = self.outputs.get("instance2_ipv6_addresses")
    
    # Convert IPv6 addresses to list format
    instance1_ipv6 = self._ensure_ipv6_list(instance1_ipv6_raw, "instance1")
    instance2_ipv6 = self._ensure_ipv6_list(instance2_ipv6_raw, "instance2")
    
    self.assertIsNotNone(instance1_id, "EC2 instance1 should exist")
    self.assertIsNotNone(instance1_ipv6, "Instance1 should have IPv6 addresses")
    self.assertIsNotNone(instance2_id, "EC2 instance2 should exist")
    self.assertIsNotNone(instance2_ipv6, "Instance2 should have IPv6 addresses")
    
    # Requirement 4: NAT gateway with IPv6 support for private subnet internet access
    nat_id = self.outputs.get("nat_gateway_id")
    eigw_id = self.outputs.get("egress_igw_id")
    self.assertIsNotNone(nat_id, "NAT Gateway should exist for IPv4 traffic")
    self.assertIsNotNone(eigw_id, "Egress-Only IGW should exist for IPv6 traffic")
    
    # Requirement 5: Security group allowing SSH access from specific IPv6 range
    sg_id = self.outputs.get("security_group_id")
    self.assertIsNotNone(sg_id, "Security group should exist")
    
    # Requirements 6 & 7 are validated by resource existence and tagging
    # (Auto-scaling group and proper tagging are validated via source code tests)


if __name__ == '__main__':
  unittest.main()
