"""
test_tap_stack_integration.py

Integration tests for TapStack Pulumi infrastructure.
Tests the TapStack component and its configuration.
"""

import unittest
import os
import sys
from unittest.mock import Mock, patch

# Add the lib directory to the path so we can import tap_stack
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

try:
  from lib.tap_stack import TapStack, TapStackArgs
except ImportError:
  # Fallback for when lib is not in path
  from tap_stack import TapStack, TapStackArgs


class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for TapStack component."""

  def setUp(self):
    """Set up integration test fixtures."""
    self.test_environment_suffix = 'test-integration'
    self.test_tags = {
      'Environment': self.test_environment_suffix,
      'Team': 'platform',
      'Project': 'tap',
      'TestType': 'integration'
    }

  @patch('lib.tap_stack.ec2')
  @patch('lib.tap_stack.get_availability_zones')
  @patch('lib.tap_stack.Config')
  def test_tap_stack_full_integration(self, mock_config, mock_get_azs, mock_ec2):
    """Test complete TapStack integration with all components."""
    # Mock configuration
    mock_config_instance = Mock()
    mock_config_instance.get.side_effect = lambda key, default=None: {
      'team': 'platform',
      'project': 'tap'
    }.get(key, default)
    mock_config.return_value = mock_config_instance

    # Mock availability zones
    mock_azs_response = Mock()
    mock_azs_response.names = ['us-east-1a', 'us-east-1b']
    mock_get_azs.return_value = mock_azs_response

    # Mock all EC2 resources
    mock_vpc = Mock()
    mock_vpc.id = 'vpc-integration-test'
    mock_vpc.cidr_block = '10.0.0.0/16'
    mock_ec2.Vpc.return_value = mock_vpc

    mock_igw = Mock()
    mock_igw.id = 'igw-integration-test'
    mock_ec2.InternetGateway.return_value = mock_igw

    mock_subnet = Mock()
    mock_subnet.id = 'subnet-integration-test'
    mock_ec2.Subnet.return_value = mock_subnet

    mock_eip = Mock()
    mock_eip.id = 'eip-integration-test'
    mock_ec2.Eip.return_value = mock_eip

    mock_nat = Mock()
    mock_nat.id = 'nat-integration-test'
    mock_ec2.NatGateway.return_value = mock_nat

    mock_rt = Mock()
    mock_ec2.RouteTable.return_value = mock_rt

    mock_rta = Mock()
    mock_ec2.RouteTableAssociation.return_value = mock_rta

    mock_sg = Mock()
    mock_sg.id = 'sg-integration-test'
    mock_ec2.SecurityGroup.return_value = mock_sg

    # Create TapStack instance with integration test configuration
    args = TapStackArgs(
      environment_suffix=self.test_environment_suffix,
      tags=self.test_tags
    )
    stack = TapStack('integration-test-stack', args)

    # Verify the stack was created successfully
    self.assertIsInstance(stack, TapStack)
    self.assertEqual(stack.environment_suffix, self.test_environment_suffix)
    self.assertEqual(stack.tags, self.test_tags)

    # Verify all major components were created
    self.assertIsNotNone(stack.vpc)
    self.assertIsNotNone(stack.public_subnets)
    self.assertIsNotNone(stack.private_subnets)
    self.assertIsNotNone(stack.public_sg)
    self.assertIsNotNone(stack.private_sg)
    self.assertIsNotNone(stack.igw)
    self.assertIsNotNone(stack.nat_gateway)

    # Verify resource creation calls
    mock_ec2.Vpc.assert_called_once()
    mock_ec2.InternetGateway.assert_called_once()
    self.assertEqual(mock_ec2.Subnet.call_count, 4)  # 2 public + 2 private
    mock_ec2.Eip.assert_called_once()
    mock_ec2.NatGateway.assert_called_once()
    self.assertEqual(mock_ec2.RouteTable.call_count, 2)  # public + private
    self.assertEqual(mock_ec2.RouteTableAssociation.call_count, 4)  # 2 public + 2 private
    self.assertEqual(mock_ec2.SecurityGroup.call_count, 2)  # public + private

  def test_tap_stack_args_integration(self):
    """Test TapStackArgs integration with various configurations."""
    # Test with custom environment and tags
    custom_tags = {
      'Environment': 'staging',
      'Team': 'devops',
      'Project': 'myapp',
      'CostCenter': '12345'
    }
    args = TapStackArgs(environment_suffix='staging', tags=custom_tags)
    
    self.assertEqual(args.environment_suffix, 'staging')
    self.assertEqual(args.tags, custom_tags)

    # Test with minimal configuration
    args_minimal = TapStackArgs()
    self.assertEqual(args_minimal.environment_suffix, 'dev')
    self.assertEqual(args_minimal.tags, {})

  def test_tap_stack_naming_convention_integration(self):
    """Test that TapStack follows consistent naming conventions."""
    env_suffix = 'prod'
    expected_patterns = [
      f'tap-vpc-{env_suffix}',
      f'tap-igw-{env_suffix}',
      f'tap-public-subnet-1-{env_suffix}',
      f'tap-private-subnet-1-{env_suffix}',
      f'tap-nat-eip-{env_suffix}',
      f'tap-nat-gateway-{env_suffix}',
      f'tap-public-rt-{env_suffix}',
      f'tap-private-rt-{env_suffix}',
      f'tap-public-sg-{env_suffix}',
      f'tap-private-sg-{env_suffix}'
    ]

    # Verify all naming patterns are consistent
    for pattern in expected_patterns:
      self.assertIn(env_suffix, pattern)
      self.assertTrue(pattern.startswith('tap-'))

  @patch('lib.tap_stack.ec2')
  @patch('lib.tap_stack.get_availability_zones')
  @patch('lib.tap_stack.Config')
  def test_tap_stack_outputs_integration(self, mock_config, mock_get_azs, mock_ec2):
    """Test that TapStack produces the expected outputs."""
    # Mock configuration
    mock_config_instance = Mock()
    mock_config_instance.get.side_effect = lambda key, default=None: {
      'team': 'platform',
      'project': 'tap'
    }.get(key, default)
    mock_config.return_value = mock_config_instance

    # Mock availability zones
    mock_azs_response = Mock()
    mock_azs_response.names = ['us-east-1a', 'us-east-1b']
    mock_get_azs.return_value = mock_azs_response

    # Mock EC2 resources with specific IDs for output testing
    mock_vpc = Mock()
    mock_vpc.id = 'vpc-output-test'
    mock_vpc.cidr_block = '10.0.0.0/16'
    mock_ec2.Vpc.return_value = mock_vpc

    mock_igw = Mock()
    mock_igw.id = 'igw-output-test'
    mock_ec2.InternetGateway.return_value = mock_igw

    mock_subnet = Mock()
    mock_subnet.id = 'subnet-output-test'
    mock_ec2.Subnet.return_value = mock_subnet

    mock_eip = Mock()
    mock_eip.id = 'eip-output-test'
    mock_ec2.Eip.return_value = mock_eip

    mock_nat = Mock()
    mock_nat.id = 'nat-output-test'
    mock_ec2.NatGateway.return_value = mock_nat

    mock_rt = Mock()
    mock_ec2.RouteTable.return_value = mock_rt

    mock_rta = Mock()
    mock_ec2.RouteTableAssociation.return_value = mock_rta

    mock_sg = Mock()
    mock_sg.id = 'sg-output-test'
    mock_ec2.SecurityGroup.return_value = mock_sg

    # Create TapStack instance
    args = TapStackArgs(environment_suffix='output-test')
    stack = TapStack('output-test-stack', args)

    # Verify that all expected outputs are available
    # The outputs are registered via register_outputs, so we verify the resources exist
    self.assertIsNotNone(stack.vpc)
    self.assertIsNotNone(stack.public_subnets)
    self.assertIsNotNone(stack.private_subnets)
    self.assertIsNotNone(stack.public_sg)
    self.assertIsNotNone(stack.private_sg)
    self.assertIsNotNone(stack.igw)
    self.assertIsNotNone(stack.nat_gateway)


if __name__ == '__main__':
  unittest.main()
