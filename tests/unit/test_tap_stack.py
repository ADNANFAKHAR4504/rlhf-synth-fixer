"""
test_tap_stack.py

Unit tests for the single-file Pulumi infrastructure script.
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
    self.assertIn('vpc-dev', vpc_call[0][0])  # Name contains environment
    self.assertEqual(vpc_call[1]['tags']['Environment'], 'dev')
    self.assertEqual(vpc_call[1]['tags']['Team'], 'platform')
    self.assertEqual(vpc_call[1]['tags']['Project'], 'tap')

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
    self.assertIn('vpc-prod', vpc_call[0][0])  # Name contains environment
    self.assertEqual(vpc_call[1]['tags']['Environment'], 'prod')
    self.assertEqual(vpc_call[1]['tags']['Team'], 'devops')
    self.assertEqual(vpc_call[1]['tags']['Project'], 'myapp')


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
    self.assertIn('vpc-test', call_args[0][0])  # Name contains environment
    self.assertEqual(call_args[1]['cidr_block'], '10.0.0.0/16')
    self.assertTrue(call_args[1]['enable_dns_hostnames'])
    self.assertTrue(call_args[1]['enable_dns_support'])

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

    # Verify subnets were created
    self.assertEqual(mock_ec2.Subnet.call_count, 4)  # 2 public + 2 private

    # Check that public subnets have map_public_ip_on_launch=True
    public_subnet_calls = [call for call in mock_ec2.Subnet.call_args_list 
                          if 'public-subnet' in call[0][0]]
    for call in public_subnet_calls:
      self.assertTrue(call[1]['map_public_ip_on_launch'])

    # Check that private subnets have map_public_ip_on_launch=False
    private_subnet_calls = [call for call in mock_ec2.Subnet.call_args_list 
                           if 'private-subnet' in call[0][0]]
    for call in private_subnet_calls:
      self.assertFalse(call[1]['map_public_ip_on_launch'])

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

    # Verify security groups were created
    self.assertEqual(mock_ec2.SecurityGroup.call_count, 2)  # public + private

    # Check public security group has SSH, HTTP, HTTPS rules
    public_sg_call = [call for call in mock_ec2.SecurityGroup.call_args_list 
                     if 'public-sg' in call[0][0]][0]
    ingress_rules = public_sg_call[1]['ingress']
    # Since we're using SecurityGroupIngressArgs objects, we need to check the call arguments
    self.assertEqual(len(ingress_rules), 3)  # SSH, HTTP, HTTPS

  @patch('tap_stack.get_availability_zones')
  @patch('tap_stack.ec2')
  @patch('tap_stack.Config')
  def test_resource_tagging(self, mock_config, mock_ec2, mock_get_azs):
    """Test that all resources have proper tagging."""
    # Mock configuration
    mock_config_instance = Mock()
    mock_config_instance.get.side_effect = lambda key, default=None: {
      'environment': 'test',
      'team': 'platform',
      'project': 'tap'
    }.get(key, default)
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

    # Verify all resources have proper tags
    for call in mock_ec2.Vpc.call_args_list + mock_ec2.InternetGateway.call_args_list + \
                mock_ec2.Subnet.call_args_list + mock_ec2.Eip.call_args_list + \
                mock_ec2.NatGateway.call_args_list + mock_ec2.RouteTable.call_args_list + \
                mock_ec2.SecurityGroup.call_args_list:
      tags = call[1]['tags']
      self.assertIn('Environment', tags)
      self.assertIn('Team', tags)
      self.assertIn('Project', tags)
      self.assertIn('Name', tags)
      self.assertEqual(tags['Environment'], 'test')
      self.assertEqual(tags['Team'], 'platform')
      self.assertEqual(tags['Project'], 'tap')


if __name__ == '__main__':
  unittest.main()
