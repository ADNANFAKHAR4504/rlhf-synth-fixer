"""
test_tap_stack.py

Unit tests for the enhanced multi-region Pulumi infrastructure script.
Tests the infrastructure configuration and resource creation.
"""

import unittest
from unittest.mock import Mock, patch
import sys
import os

# Add the lib directory to the path so we can import tap_stack
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

# Import the function to test
from tap_stack import create_infrastructure


class TestTapStackConfiguration(unittest.TestCase):
  """Test cases for configuration and setup."""

  @patch('tap_stack.get_availability_zones')
  @patch('tap_stack.ec2')
  @patch('tap_stack.Config')
  def test_configuration_defaults(self, mock_config, mock_ec2, mock_get_azs):
    """Test that configuration uses proper defaults."""
    # Mock the config
    mock_config_instance = Mock()
    mock_config_instance.get.side_effect = lambda key, default=None: {
      'environment': 'dev',
      'team': 'platform',
      'project': 'tap'
    }.get(key, default)
    mock_config_instance.get_object.return_value = ["us-east-1"]  # Mock regions
    mock_config_instance.get_bool.return_value = False  # Mock enable_ha_nat
    mock_config.return_value = mock_config_instance

    # Mock availability zones
    mock_azs_response = Mock()
    mock_azs_response.names = ['us-east-1a', 'us-east-1b']
    mock_get_azs.return_value = mock_azs_response

    # Mock all resources
    mock_resource = Mock()
    mock_resource.id = 'resource-test-id'
    mock_ec2.Vpc.return_value = mock_resource
    mock_ec2.InternetGateway.return_value = mock_resource
    mock_ec2.Subnet.return_value = mock_resource
    mock_ec2.Eip.return_value = mock_resource
    mock_ec2.NatGateway.return_value = mock_resource
    mock_ec2.RouteTable.return_value = mock_resource
    mock_ec2.RouteTableAssociation.return_value = mock_resource
    mock_ec2.SecurityGroup.return_value = mock_resource

    # Call the function
    result = create_infrastructure(export_outputs=False)

    # Verify the configuration is set correctly by checking resource calls
    vpc_call = mock_ec2.Vpc.call_args
    self.assertIn('vpc-us-east-1-dev', vpc_call[0][0])  # Name contains region and environment
    self.assertEqual(vpc_call[1]['tags']['Environment'], 'dev')
    self.assertEqual(vpc_call[1]['tags']['Team'], 'platform')
    self.assertEqual(vpc_call[1]['tags']['Project'], 'tap')
    
    # Verify result structure (multi-region)
    self.assertIn('us-east-1', result)
    self.assertIn('vpc', result['us-east-1'])

  @patch('tap_stack.get_availability_zones')
  @patch('tap_stack.ec2')
  @patch('tap_stack.Config')
  def test_configuration_custom_values(self, mock_config, mock_ec2, mock_get_azs):
    """Test that configuration accepts custom values."""
    # Mock the config with custom values
    mock_config_instance = Mock()
    mock_config_instance.get.side_effect = lambda key, default=None: {
      'environment': 'prod',
      'team': 'devops',
      'project': 'myapp'
    }.get(key, default)
    mock_config_instance.get_object.return_value = ["us-east-1"]  # Mock regions
    mock_config_instance.get_bool.return_value = False  # Mock enable_ha_nat
    mock_config.return_value = mock_config_instance

    # Mock availability zones
    mock_azs_response = Mock()
    mock_azs_response.names = ['us-east-1a', 'us-east-1b']
    mock_get_azs.return_value = mock_azs_response

    # Mock all resources
    mock_resource = Mock()
    mock_resource.id = 'resource-test-id'
    mock_ec2.Vpc.return_value = mock_resource
    mock_ec2.InternetGateway.return_value = mock_resource
    mock_ec2.Subnet.return_value = mock_resource
    mock_ec2.Eip.return_value = mock_resource
    mock_ec2.NatGateway.return_value = mock_resource
    mock_ec2.RouteTable.return_value = mock_resource
    mock_ec2.RouteTableAssociation.return_value = mock_resource
    mock_ec2.SecurityGroup.return_value = mock_resource

    # Call the function
    result = create_infrastructure(export_outputs=False)

    # Verify the configuration is set correctly
    vpc_call = mock_ec2.Vpc.call_args
    self.assertIn('vpc-us-east-1-prod', vpc_call[0][0])  # Name contains region and environment
    self.assertEqual(vpc_call[1]['tags']['Environment'], 'prod')
    self.assertEqual(vpc_call[1]['tags']['Team'], 'devops')
    self.assertEqual(vpc_call[1]['tags']['Project'], 'myapp')
    
    # Verify result structure (multi-region)
    self.assertIn('us-east-1', result)
    self.assertIn('vpc', result['us-east-1'])


class TestTapStackResources(unittest.TestCase):
  """Test cases for resource creation and configuration."""

  @patch('tap_stack.get_availability_zones')
  @patch('tap_stack.ec2')
  @patch('tap_stack.Config')
  def test_vpc_creation(self, mock_config, mock_ec2, mock_get_azs):
    """Test VPC creation with proper configuration."""
    # Mock configuration
    mock_config_instance = Mock()
    mock_config_instance.get.side_effect = lambda key, default=None: {
      'environment': 'test',
      'team': 'platform',
      'project': 'tap'
    }.get(key, default)
    mock_config_instance.get_object.return_value = ["us-east-1"]  # Mock regions
    mock_config_instance.get_bool.return_value = False  # Mock enable_ha_nat
    mock_config.return_value = mock_config_instance

    # Mock availability zones
    mock_azs_response = Mock()
    mock_azs_response.names = ['us-east-1a', 'us-east-1b']
    mock_get_azs.return_value = mock_azs_response

    # Mock VPC
    mock_vpc = Mock()
    mock_vpc.id = 'vpc-test-id'
    mock_vpc.cidr_block = '10.0.0.0/16'
    mock_ec2.Vpc.return_value = mock_vpc

    # Mock other resources
    mock_resource = Mock()
    mock_ec2.InternetGateway.return_value = mock_resource
    mock_ec2.Subnet.return_value = mock_resource
    mock_ec2.Eip.return_value = mock_resource
    mock_ec2.NatGateway.return_value = mock_resource
    mock_ec2.RouteTable.return_value = mock_resource
    mock_ec2.RouteTableAssociation.return_value = mock_resource
    mock_ec2.SecurityGroup.return_value = mock_resource

    # Call the function
    result = create_infrastructure(export_outputs=False)

    # Verify VPC was created with correct parameters
    mock_ec2.Vpc.assert_called_once()
    call_args = mock_ec2.Vpc.call_args
    self.assertIn('vpc-us-east-1-test', call_args[0][0])  # Name contains region and environment
    self.assertEqual(call_args[1]['cidr_block'], '10.0.0.0/16')
    self.assertTrue(call_args[1]['enable_dns_hostnames'])
    self.assertTrue(call_args[1]['enable_dns_support'])
    
    # Verify result structure
    self.assertIn('us-east-1', result)
    self.assertIn('vpc', result['us-east-1'])

  @patch('tap_stack.get_availability_zones')
  @patch('tap_stack.ec2')
  @patch('tap_stack.Config')
  def test_subnet_creation(self, mock_config, mock_ec2, mock_get_azs):
    """Test subnet creation across availability zones."""
    # Mock configuration
    mock_config_instance = Mock()
    mock_config_instance.get.side_effect = lambda key, default=None: {
      'environment': 'test',
      'team': 'platform',
      'project': 'tap'
    }.get(key, default)
    mock_config_instance.get_object.return_value = ["us-east-1"]  # Mock regions
    mock_config_instance.get_bool.return_value = False  # Mock enable_ha_nat
    mock_config.return_value = mock_config_instance

    # Mock availability zones
    mock_azs_response = Mock()
    mock_azs_response.names = ['us-east-1a', 'us-east-1b']
    mock_get_azs.return_value = mock_azs_response

    # Mock resources
    mock_vpc = Mock()
    mock_vpc.id = 'vpc-test-id'
    mock_ec2.Vpc.return_value = mock_vpc

    mock_subnet = Mock()
    mock_subnet.id = 'subnet-test-id'
    mock_ec2.Subnet.return_value = mock_subnet

    # Mock other resources
    mock_resource = Mock()
    mock_ec2.InternetGateway.return_value = mock_resource
    mock_ec2.Eip.return_value = mock_resource
    mock_ec2.NatGateway.return_value = mock_resource
    mock_ec2.RouteTable.return_value = mock_resource
    mock_ec2.RouteTableAssociation.return_value = mock_resource
    mock_ec2.SecurityGroup.return_value = mock_resource

    # Call the function
    result = create_infrastructure(export_outputs=False)

    # Verify subnets were created (2 public + 2 private per AZ = 8 total)
    self.assertEqual(mock_ec2.Subnet.call_count, 8)  # 2 public + 2 private per AZ (2 AZs)
    
    # Verify result structure
    self.assertIn('us-east-1', result)
    self.assertIn('public_subnets', result['us-east-1'])
    self.assertIn('private_subnets', result['us-east-1'])
    self.assertEqual(len(result['us-east-1']['public_subnets']), 4)  # 2 per AZ
    self.assertEqual(len(result['us-east-1']['private_subnets']), 4)  # 2 per AZ

  @patch('tap_stack.get_availability_zones')
  @patch('tap_stack.ec2')
  @patch('tap_stack.Config')
  def test_security_group_creation(self, mock_config, mock_ec2, mock_get_azs):
    """Test security group creation with proper rules."""
    # Mock configuration
    mock_config_instance = Mock()
    mock_config_instance.get.side_effect = lambda key, default=None: {
      'environment': 'test',
      'team': 'platform',
      'project': 'tap'
    }.get(key, default)
    mock_config_instance.get_object.return_value = ["us-east-1"]  # Mock regions
    mock_config_instance.get_bool.return_value = False  # Mock enable_ha_nat
    mock_config.return_value = mock_config_instance

    # Mock availability zones
    mock_azs_response = Mock()
    mock_azs_response.names = ['us-east-1a', 'us-east-1b']
    mock_get_azs.return_value = mock_azs_response

    # Mock resources
    mock_vpc = Mock()
    mock_vpc.id = 'vpc-test-id'
    mock_vpc.cidr_block = '10.0.0.0/16'
    mock_ec2.Vpc.return_value = mock_vpc

    mock_subnet = Mock()
    mock_subnet.id = 'subnet-test-id'
    mock_ec2.Subnet.return_value = mock_subnet

    mock_sg = Mock()
    mock_sg.id = 'sg-test-id'
    mock_ec2.SecurityGroup.return_value = mock_sg

    # Mock other resources
    mock_resource = Mock()
    mock_ec2.InternetGateway.return_value = mock_resource
    mock_ec2.Eip.return_value = mock_resource
    mock_ec2.NatGateway.return_value = mock_resource
    mock_ec2.RouteTable.return_value = mock_resource
    mock_ec2.RouteTableAssociation.return_value = mock_resource

    # Call the function
    result = create_infrastructure(export_outputs=False)

    # Verify security groups were created (3 tiers: web, app, db)
    self.assertEqual(mock_ec2.SecurityGroup.call_count, 3)  # web + app + db
    
    # Verify result structure
    self.assertIn('us-east-1', result)
    self.assertIn('security_groups', result['us-east-1'])
    self.assertIn('web', result['us-east-1']['security_groups'])
    self.assertIn('app', result['us-east-1']['security_groups'])
    self.assertIn('db', result['us-east-1']['security_groups'])

  @patch('tap_stack.get_availability_zones')
  @patch('tap_stack.ec2')
  @patch('tap_stack.Config')
  def test_resource_tagging(self, mock_config, mock_ec2, mock_get_azs):
    """Test that resources are properly tagged."""
    # Mock configuration
    mock_config_instance = Mock()
    mock_config_instance.get.side_effect = lambda key, default=None: {
      'environment': 'test',
      'team': 'platform',
      'project': 'tap'
    }.get(key, default)
    mock_config_instance.get_object.return_value = ["us-east-1"]  # Mock regions
    mock_config_instance.get_bool.return_value = False  # Mock enable_ha_nat
    mock_config.return_value = mock_config_instance

    # Mock availability zones
    mock_azs_response = Mock()
    mock_azs_response.names = ['us-east-1a', 'us-east-1b']
    mock_get_azs.return_value = mock_azs_response

    # Mock resources
    mock_resource = Mock()
    mock_resource.id = 'resource-test-id'
    mock_ec2.Vpc.return_value = mock_resource
    mock_ec2.InternetGateway.return_value = mock_resource
    mock_ec2.Subnet.return_value = mock_resource
    mock_ec2.Eip.return_value = mock_resource
    mock_ec2.NatGateway.return_value = mock_resource
    mock_ec2.RouteTable.return_value = mock_resource
    mock_ec2.RouteTableAssociation.return_value = mock_resource
    mock_ec2.SecurityGroup.return_value = mock_resource

    # Call the function
    result = create_infrastructure(export_outputs=False)

    # Verify VPC tagging
    vpc_call = mock_ec2.Vpc.call_args
    vpc_tags = vpc_call[1]['tags']
    self.assertEqual(vpc_tags['Environment'], 'test')
    self.assertEqual(vpc_tags['Team'], 'platform')
    self.assertEqual(vpc_tags['Project'], 'tap')
    self.assertIn('Name', vpc_tags)
    self.assertIn('Region', vpc_tags)
    
    # Verify result structure
    self.assertIn('us-east-1', result)
    self.assertIn('vpc', result['us-east-1'])


if __name__ == '__main__':
  unittest.main()
