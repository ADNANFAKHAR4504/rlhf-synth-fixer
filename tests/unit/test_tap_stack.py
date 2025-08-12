"""
Unit tests for the IPv6 dual-stack VPC infrastructure.
"""

import sys
import unittest
from unittest.mock import Mock

# Mock AWS and Pulumi before importing
mock_pulumi = Mock()
mock_pulumi.export = Mock()
mock_pulumi.ResourceOptions = Mock()
mock_pulumi.ComponentResource = Mock()
mock_pulumi.Output = Mock()
mock_pulumi.Output.from_input = Mock(
  return_value=Mock(apply=Mock(return_value='mocked')))

mock_aws = Mock()
mock_aws.ec2 = Mock()
mock_aws.autoscaling = Mock()
mock_aws.get_availability_zones = Mock(
  return_value=Mock(names=['us-east-1a', 'us-east-1b']))
mock_aws.ec2.get_ami = Mock(
  return_value=Mock(id='ami-12345'))

# Mock VPC and subnet objects
mock_vpc = Mock()
mock_vpc.id = 'vpc-12345'
mock_vpc.ipv6_cidr_block = Mock()
mock_vpc.ipv6_cidr_block.apply = Mock(return_value='2001:db8::/64')

mock_subnet = Mock()
mock_subnet.id = 'subnet-12345'

mock_aws.ec2.Vpc.return_value = mock_vpc
mock_aws.ec2.Subnet.return_value = mock_subnet
mock_aws.ec2.InternetGateway.return_value = Mock(id='igw-12345')
mock_aws.ec2.SecurityGroup.return_value = Mock(id='sg-12345')

sys.modules['pulumi'] = mock_pulumi
sys.modules['pulumi_aws'] = mock_aws


class TestTapStack(unittest.TestCase):
  """Test cases for tap infrastructure."""

  def test_tap_stack_classes_exist(self):
    """Test that TapStack and TapStackArgs classes exist"""
    from lib.tap_stack import TapStack, TapStackArgs

    # Test TapStackArgs
    args = TapStackArgs(environment_suffix='test')
    self.assertEqual(args.environment_suffix, 'test')
    
    # Test TapStack class exists
    self.assertTrue(hasattr(TapStack, '__init__'))

  def test_tap_py_structure(self):
    """Test tap.py file structure"""
    with open('tap.py', 'r', encoding='utf-8') as file:
      source_code = file.read()
    
    self.assertIn('#!/usr/bin/env python3', source_code)
    self.assertIn('from lib.tap_stack import TapStack, TapStackArgs', source_code)
    self.assertIn('TapStack(', source_code)

  def test_tap_stack_py_structure(self):
    """Test lib/tap_stack.py file structure"""
    with open('lib/tap_stack.py', 'r', encoding='utf-8') as file:
      source_code = file.read()
    
    self.assertIn('class TapStack', source_code)
    self.assertIn('class TapStackArgs', source_code)
    self.assertIn('pulumi.ComponentResource', source_code)

  def test_infrastructure_code_in_class(self):
    """Test that infrastructure code is inside TapStack class"""
    with open('lib/tap_stack.py', 'r', encoding='utf-8') as file:
      source_code = file.read()
    
    # Check VPC creation inside class
    self.assertIn('self.vpc = aws.ec2.Vpc(', source_code)
    self.assertIn('cidr_block="10.0.0.0/16"', source_code)
    self.assertIn('assign_generated_ipv6_cidr_block=True', source_code)

  def test_subnet_configuration(self):
    """Test subnet configuration"""
    with open('lib/tap_stack.py', 'r', encoding='utf-8') as file:
      source_code = file.read()

    self.assertIn('self.public_subnet', source_code)
    self.assertIn('self.private_subnet', source_code)
    self.assertIn('cidr_block="10.0.11.0/24"', source_code)
    self.assertIn('cidr_block="10.0.12.0/24"', source_code)

  def test_security_group_configuration(self):
    """Test security group configuration"""
    with open('lib/tap_stack.py', 'r', encoding='utf-8') as file:
      source_code = file.read()

    self.assertIn('self.security_group', source_code)
    self.assertIn('from_port=22', source_code)
    self.assertIn('to_port=22', source_code)
    self.assertIn('protocol="tcp"', source_code)

  def test_ec2_instances_configuration(self):
    """Test EC2 instances configuration"""
    with open('lib/tap_stack.py', 'r', encoding='utf-8') as file:
      source_code = file.read()

    self.assertIn('self.instance1', source_code)
    self.assertIn('self.instance2', source_code)
    self.assertIn('instance_type="t3.micro"', source_code)
    self.assertIn('ipv6_address_count=1', source_code)

  def test_auto_scaling_group(self):
    """Test auto-scaling group configuration"""
    with open('lib/tap_stack.py', 'r', encoding='utf-8') as file:
      source_code = file.read()

    self.assertIn('self.asg', source_code)
    self.assertIn('min_size=1', source_code)
    self.assertIn('max_size=2', source_code)
    self.assertIn('desired_capacity=1', source_code)

  def test_networking_components(self):
    """Test networking components"""
    with open('lib/tap_stack.py', 'r', encoding='utf-8') as file:
      source_code = file.read()

    self.assertIn('self.igw', source_code)
    self.assertIn('self.nat_gateway', source_code)
    self.assertIn('self.egress_igw', source_code)
    self.assertIn('self.public_rt', source_code)

  def test_tags_configuration(self):
    """Test resource tagging"""
    with open('lib/tap_stack.py', 'r', encoding='utf-8') as file:
      source_code = file.read()

    self.assertIn('"Environment": "Production"', source_code)
    self.assertIn('"Project": "IPv6StaticTest"', source_code)

  def test_exports_configuration(self):
    """Test Pulumi exports"""
    with open('lib/tap_stack.py', 'r', encoding='utf-8') as file:
      source_code = file.read()

    exports = ['vpc_id', 'vpc_ipv6_cidr_block', 'public_subnet_id',
        'private_subnet_id', 'security_group_id', 'nat_gateway_id']
    for export in exports:
      self.assertIn(f'pulumi.export("{export}"', source_code)

  def test_ipv6_specific_features(self):
    """Test IPv6 specific configurations"""
    with open('lib/tap_stack.py', 'r', encoding='utf-8') as file:
      source_code = file.read()

    self.assertIn('ipv6_cidr_block', source_code)
    self.assertIn('assign_ipv6_address_on_creation=True', source_code)
    self.assertIn('ipv6_cidr_blocks=["::/0"]', source_code)
    self.assertIn('EgressOnlyInternetGateway', source_code)

  def test_resource_replacement_options(self):
    """Test resource replacement configurations"""
    with open('lib/tap_stack.py', 'r', encoding='utf-8') as file:
      source_code = file.read()

    self.assertIn('replace_on_changes', source_code)
    self.assertIn('depends_on', source_code)
    self.assertIn('ResourceOptions(parent=self)', source_code)

  def test_derive_ipv6_function_exists(self):
    """Test that derive_ipv6_subnet_cidr helper function exists"""
    with open('lib/tap_stack.py', 'r', encoding='utf-8') as file:
      source_code = file.read()

    self.assertIn('def derive_ipv6_subnet_cidr', source_code)
    self.assertIn("replace('/56', '')", source_code)
    self.assertIn("'/64'", source_code)


if __name__ == '__main__':
  unittest.main()
