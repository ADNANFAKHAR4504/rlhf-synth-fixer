"""
test_tap_stack.py

Integration tests for the enhanced multi-region Pulumi infrastructure script.
Tests complete infrastructure integration and end-to-end functionality.
"""

import unittest
from unittest.mock import Mock, patch
import sys
import os

# Add the lib directory to the path so we can import tap_stack
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

# Import the function to test
from tap_stack import create_infrastructure


class TestTapStackIntegration(unittest.TestCase):
  """Integration test cases for complete infrastructure."""

  def setUp(self):
    """Set up test environment."""
    self.test_environment = 'test-integration'
    self.test_team = 'platform'
    self.test_project = 'tap'

  @patch('tap_stack.get_availability_zones')
  @patch('tap_stack.ec2')
  @patch('tap_stack.Config')
  def test_complete_infrastructure_integration(self, mock_config, mock_ec2, mock_get_azs):
    """Test complete infrastructure integration with all components."""
    # Mock configuration
    mock_config_instance = Mock()
    mock_config_instance.get.side_effect = lambda key, default=None: {
      'environment': self.test_environment,
      'team': self.test_team,
      'project': self.test_project
    }.get(key, default)
    mock_config_instance.get_object.return_value = ["us-east-1"]  # Mock regions
    mock_config_instance.get_bool.return_value = False  # Mock enable_ha_nat
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

    # Call the function
    result = create_infrastructure(export_outputs=False)

    # Verify the configuration is set correctly by checking resource calls
    vpc_call = mock_ec2.Vpc.call_args
    self.assertIn(f'vpc-us-east-1-{self.test_environment}', vpc_call[0][0])
    
    # Verify result structure
    self.assertIn('us-east-1', result)
    self.assertIn('vpc', result['us-east-1'])
    self.assertIn('igw', result['us-east-1'])
    self.assertIn('public_subnets', result['us-east-1'])
    self.assertIn('private_subnets', result['us-east-1'])
    self.assertIn('nat_gateways', result['us-east-1'])
    self.assertIn('security_groups', result['us-east-1'])

  def test_configuration_integration(self):
    """Test configuration integration with various values."""
    # Test with custom environment and team
    custom_environment = 'staging'
    custom_team = 'devops'
    custom_project = 'myapp'

    with patch('tap_stack.get_availability_zones') as mock_get_azs, \
         patch('tap_stack.ec2') as mock_ec2, \
         patch('tap_stack.Config') as mock_config:

      mock_config_instance = Mock()
      mock_config_instance.get.side_effect = lambda key, default=None: {
        'environment': custom_environment,
        'team': custom_team,
        'project': custom_project
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

      # Verify configuration
      vpc_call = mock_ec2.Vpc.call_args
      self.assertIn(f'vpc-us-east-1-{custom_environment}', vpc_call[0][0])
      
      # Verify result structure
      self.assertIn('us-east-1', result)
      self.assertIn('vpc', result['us-east-1'])

  @patch('tap_stack.get_availability_zones')
  @patch('tap_stack.ec2')
  @patch('tap_stack.Config')
  def test_naming_convention_integration(self, mock_config, mock_ec2, mock_get_azs):
    """Test that naming conventions are consistent across all resources."""
    # Mock configuration
    mock_config_instance = Mock()
    mock_config_instance.get.side_effect = lambda key, default=None: {
      'environment': 'naming-test',
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

    # Verify naming conventions
    vpc_call = mock_ec2.Vpc.call_args
    self.assertIn('vpc-us-east-1-naming-test', vpc_call[0][0])
    
    # Verify result structure
    self.assertIn('us-east-1', result)
    self.assertIn('vpc', result['us-east-1'])

  @patch('tap_stack.get_availability_zones')
  @patch('tap_stack.ec2')
  @patch('tap_stack.Config')
  def test_outputs_integration(self, mock_config, mock_ec2, mock_get_azs):
    """Test that the infrastructure produces the expected outputs."""
    # Mock configuration
    mock_config_instance = Mock()
    mock_config_instance.get.side_effect = lambda key, default=None: {
      'environment': 'output-test',
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

    # Call the function
    result = create_infrastructure(export_outputs=False)

    # Verify that all expected resources were created
    mock_ec2.Vpc.assert_called_once()
    mock_ec2.InternetGateway.assert_called_once()
    self.assertEqual(mock_ec2.Subnet.call_count, 8)  # 2 public + 2 private per AZ (2 AZs)
    
    # Verify result structure
    self.assertIn('us-east-1', result)
    self.assertIn('vpc', result['us-east-1'])
    self.assertIn('igw', result['us-east-1'])
    self.assertIn('public_subnets', result['us-east-1'])
    self.assertIn('private_subnets', result['us-east-1'])
    self.assertIn('nat_gateways', result['us-east-1'])
    self.assertIn('security_groups', result['us-east-1'])

  @patch('tap_stack.get_availability_zones')
  @patch('tap_stack.ec2')
  @patch('tap_stack.Config')
  def test_security_integration(self, mock_config, mock_ec2, mock_get_azs):
    """Test security configuration integration."""
    # Mock configuration
    mock_config_instance = Mock()
    mock_config_instance.get.side_effect = lambda key, default=None: {
      'environment': 'security-test',
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
    mock_vpc.id = 'vpc-security-test'
    mock_vpc.cidr_block = '10.0.0.0/16'
    mock_ec2.Vpc.return_value = mock_vpc

    mock_subnet = Mock()
    mock_subnet.id = 'subnet-security-test'
    mock_ec2.Subnet.return_value = mock_subnet

    mock_sg = Mock()
    mock_sg.id = 'sg-security-test'
    mock_ec2.SecurityGroup.return_value = mock_sg

    # Mock other required resources
    mock_ec2.InternetGateway.return_value = Mock()
    mock_ec2.Eip.return_value = Mock()
    mock_ec2.NatGateway.return_value = Mock()
    mock_ec2.RouteTable.return_value = Mock()
    mock_ec2.RouteTableAssociation.return_value = Mock()

    # Call the function
    result = create_infrastructure(export_outputs=False)

    # Verify security groups were created with proper rules
    self.assertEqual(mock_ec2.SecurityGroup.call_count, 3)  # web + app + db
    
    # Verify result structure
    self.assertIn('us-east-1', result)
    self.assertIn('security_groups', result['us-east-1'])
    self.assertIn('web', result['us-east-1']['security_groups'])
    self.assertIn('app', result['us-east-1']['security_groups'])
    self.assertIn('db', result['us-east-1']['security_groups'])


if __name__ == '__main__':
  unittest.main()
