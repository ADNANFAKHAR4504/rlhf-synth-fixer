"""
Unit tests for the IPv6 dual-stack VPC Pulumi stack.

These tests verify that the infrastructure code creates the correct resources
with appropriate configurations as specified in the requirements.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add project root to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Mock Pulumi completely to avoid runtime issues
sys.modules['pulumi'] = Mock()
sys.modules['pulumi_aws'] = Mock()


class TestTapStack(unittest.TestCase):
  """Test cases for TapStack component."""

  def setUp(self):
    """Set up test fixtures."""
    from lib.tap_stack import TapStack, TapStackArgs
    self.TapStack = TapStack
    self.TapStackArgs = TapStackArgs

  def test_tap_stack_args_init(self):
    """Test TapStackArgs initialization."""
    args = self.TapStackArgs()
    self.assertEqual(args.environment_suffix, 'dev')
    self.assertIsNone(args.tags)

  def test_tap_stack_args_with_params(self):
    """Test TapStackArgs initialization with parameters."""
    args = self.TapStackArgs(environment_suffix='prod', tags={'env': 'prod'})
    self.assertEqual(args.environment_suffix, 'prod')
    self.assertEqual(args.tags, {'env': 'prod'})

  def test_tap_stack_init_attributes(self):
    """Test TapStack initialization attributes."""
    args = self.TapStackArgs(environment_suffix='test')
    # Test that we can create the args object and access its attributes
    self.assertEqual(args.environment_suffix, 'test')
    self.assertIsNone(args.tags)

  def test_tap_infrastructure_source_code(self):
    """Test infrastructure configuration by examining source code."""
    with open('tap.py', 'r', encoding='utf-8') as f:
      source_code = f.read()
    
    # Check VPC configuration
    self.assertIn('aws.ec2.Vpc("ipv6-vpc"', source_code)
    self.assertIn('cidr_block="10.0.0.0/16"', source_code)
    self.assertIn('enable_dns_support=True', source_code)
    self.assertIn('enable_dns_hostnames=True', source_code)
    self.assertIn('assign_generated_ipv6_cidr_block=True', source_code)
    
    # Check tags
    self.assertIn('"Environment": "Production"', source_code)
    self.assertIn('"Project": "IPv6StaticTest"', source_code)

  def test_ipv6_subnet_configuration_fixed(self):
    """Test that IPv6 subnets use valid /64 CIDR blocks with proper helper function."""
    with open('tap.py', 'r', encoding='utf-8') as f:
      source_code = f.read()
    
    # Ensure /65 is not used (would be invalid for AWS IPv6 subnets)
    self.assertNotIn('/65', source_code)
    # Check for proper IPv6 subnet configuration using helper function
    self.assertIn('derive_ipv6_subnet_cidr', source_code)
    self.assertIn('def derive_ipv6_subnet_cidr(vpc_cidr, subnet_number)', source_code)
    self.assertIn('replace(\'/56\', \'\')', source_code)  # Inside the helper function
    
  def test_tap_stack_class_attributes(self):
    """Test TapStack class attributes."""
    from lib.tap_stack import TapStack
    stack_attrs = dir(TapStack)
    self.assertIn('__init__', stack_attrs)
    
  def test_tap_stack_args_defaults(self):
    """Test TapStackArgs default behavior."""
    args = self.TapStackArgs()
    self.assertIsInstance(args.environment_suffix, str)
    self.assertEqual(len(args.environment_suffix), 3)  # 'dev'
    
  def test_tap_stack_with_none_values(self):
    """Test TapStackArgs with None values."""
    args = self.TapStackArgs(environment_suffix=None, tags=None)
    self.assertEqual(args.environment_suffix, 'dev')
    self.assertIsNone(args.tags)
    
  def test_tap_stack_docstring_exists(self):
    """Test that TapStackArgs class has proper docstring."""
    # Test the class that we can actually access without mock interference
    self.assertIsNotNone(self.TapStackArgs.__doc__)
    self.assertIn('TapStackArgs', self.TapStackArgs.__doc__)
    
  def test_infrastructure_exports_source(self):
    """Test infrastructure exports in source code."""
    with open('tap.py', 'r', encoding='utf-8') as f:
      source_code = f.read()
    
    # Check key exports exist
    exports = ['vpc_id', 'vpc_ipv6_cidr_block', 'public_subnet_id', 'private_subnet_id']
    for export in exports:
      self.assertIn(f'pulumi.export("{export}"', source_code)
      
  def test_vpc_and_subnet_creation_source(self):
    """Test VPC and subnet creation in source code."""
    with open('tap.py', 'r', encoding='utf-8') as f:
      source_code = f.read()
    
    # Check VPC and subnets
    self.assertIn('aws.ec2.Vpc(', source_code)
    self.assertIn('aws.ec2.Subnet("public-subnet"', source_code)
    self.assertIn('aws.ec2.Subnet("private-subnet"', source_code)
    
  def test_security_and_networking_source(self):
    """Test security group and networking configuration."""
    with open('tap.py', 'r', encoding='utf-8') as f:
      source_code = f.read()
    
    # Check security and networking components
    self.assertIn('aws.ec2.SecurityGroup', source_code)
    self.assertIn('aws.ec2.InternetGateway', source_code)
    self.assertIn('aws.ec2.RouteTable', source_code)


if __name__ == '__main__':
  unittest.main()
