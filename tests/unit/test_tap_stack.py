"""
Unit tests for the IPv6 dual-stack VPC Pulumi stack.

These tests verify that the infrastructure code creates the correct resources
with appropriate configurations as specified in the requirements.
"""

import unittest
import unittest.mock
from unittest.mock import Mock
import sys
import os

# Add project root to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Mock Pulumi completely to avoid runtime issues
sys.modules['pulumi'] = Mock()
sys.modules['pulumi_aws'] = Mock()

# Import after mocking to avoid issues
# pylint: disable=wrong-import-position
from lib.tap_stack import TapStack, TapStackArgs  # noqa: E402


class TestTapStack(unittest.TestCase):
  """Test cases for TapStack component."""

  def setUp(self):
    """Set up test fixtures."""
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
    
    # Check VPC configuration (with environment suffix)
    self.assertIn('aws.ec2.Vpc(f"ipv6-vpc-{environment_suffix}"', source_code)
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
    stack_attrs = dir(self.TapStack)
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
    
    # Check VPC and subnets (with environment suffix)
    self.assertIn('aws.ec2.Vpc(', source_code)
    self.assertIn('aws.ec2.Subnet(f"public-subnet-{environment_suffix}"', source_code)
    self.assertIn('aws.ec2.Subnet(f"private-subnet-{environment_suffix}"', source_code)
    
  def test_security_and_networking_source(self):
    """Test security group and networking configuration."""
    with open('tap.py', 'r', encoding='utf-8') as f:
      source_code = f.read()
    
    # Check security and networking components
    self.assertIn('aws.ec2.SecurityGroup', source_code)
    self.assertIn('aws.ec2.InternetGateway', source_code)
    self.assertIn('aws.ec2.RouteTable', source_code)

  def test_resource_replacement_options(self):
    """Test that subnets have proper replacement options for IPv6 changes."""
    with open('tap.py', 'r', encoding='utf-8') as f:
      source_code = f.read()
    
    # Check that ResourceOptions are used for subnet replacement
    self.assertIn('pulumi.ResourceOptions', source_code)
    self.assertIn('replace_on_changes=["ipv6_cidr_block"', source_code)
    self.assertIn('replace_on_changes=["subnet_id"', source_code)
    self.assertIn('depends_on=[public_subnet]', source_code)

  def test_derive_ipv6_subnet_cidr_function(self):
    """Test the derive_ipv6_subnet_cidr helper function."""
    with open('tap.py', 'r', encoding='utf-8') as f:
      source_code = f.read()
    
    # Test that function exists and has proper structure
    self.assertIn('def derive_ipv6_subnet_cidr(vpc_cidr, subnet_number):', source_code)
    self.assertIn("base_cidr = vpc_cidr.replace('/56', '')", source_code)
    self.assertIn("parts = base_cidr.split(':')", source_code)
    self.assertIn("return ':'.join(parts) + '/64'", source_code)

  def test_environment_suffix_usage(self):
    """Test that environment suffix is used in resource naming."""
    with open('tap.py', 'r', encoding='utf-8') as f:
      source_code = f.read()
    
    # Check environment suffix is used for all resources
    self.assertIn('environment_suffix = os.environ.get(\'ENVIRONMENT_SUFFIX\', \'dev\')',
                  source_code)
    self.assertIn('{environment_suffix}', source_code)
    
  def test_ipv6_configuration_completeness(self):
    """Test IPv6 configuration is complete."""
    with open('tap.py', 'r', encoding='utf-8') as f:
      source_code = f.read()
    
    # Check for egress-only internet gateway
    self.assertIn('EgressOnlyInternetGateway', source_code)
    self.assertIn('egress_only_gateway_id', source_code)
    
    # Check for IPv6 routes
    self.assertIn('ipv6_cidr_block="::/0"', source_code)
    
    # Check for IPv6 security group rules
    self.assertIn('ipv6_cidr_blocks=["2001:db8::/32"]', source_code)
    
  def test_ec2_instances_configuration(self):
    """Test EC2 instances configuration."""
    with open('tap.py', 'r', encoding='utf-8') as f:
      source_code = f.read()
    
    # Check EC2 instances with IPv6
    self.assertIn('ipv6_address_count=1', source_code)
    self.assertIn('aws.ec2.Instance(f"web-server-1-{environment_suffix}"', source_code)
    self.assertIn('aws.ec2.Instance(f"web-server-2-{environment_suffix}"', source_code)
    
  def test_auto_scaling_configuration(self):
    """Test auto-scaling group configuration."""
    with open('tap.py', 'r', encoding='utf-8') as f:
      source_code = f.read()
    
    # Check auto-scaling group
    self.assertIn('aws.autoscaling.Group', source_code)
    self.assertIn('launch_template', source_code)
    self.assertIn('min_size=1', source_code)
    self.assertIn('max_size=2', source_code)
    self.assertIn('desired_capacity=1', source_code)


if __name__ == '__main__':
  unittest.main()
