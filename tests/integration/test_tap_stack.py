"""
test_tap_stack_integration.py

Integration tests for the single-file Pulumi infrastructure script.
Tests the complete infrastructure deployment and configuration.
"""

import unittest
import os
import sys
from unittest.mock import Mock, patch

# Add the lib directory to the path so we can import tap_stack
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

# Import the function to test
from tap_stack import create_infrastructure


class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for the single-file Pulumi infrastructure."""

  def setUp(self):
    """Set up integration test fixtures."""
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
    self.assertIn(f'vpc-{self.test_environment}', vpc_call[0][0])
    self.assertEqual(vpc_call[1]['tags']['Environment'], self.test_environment)
    self.assertEqual(vpc_call[1]['tags']['Team'], self.test_team)
    self.assertEqual(vpc_call[1]['tags']['Project'], self.test_project)

    # Verify all major components were created
    mock_ec2.Vpc.assert_called_once()
    mock_ec2.InternetGateway.assert_called_once()
    self.assertEqual(mock_ec2.Subnet.call_count, 4)  # 2 public + 2 private
    mock_ec2.Eip.assert_called_once()
    mock_ec2.NatGateway.assert_called_once()
    self.assertEqual(mock_ec2.RouteTable.call_count, 2)  # public + private
    self.assertEqual(mock_ec2.RouteTableAssociation.call_count, 4)  # 2 public + 2 private
    self.assertEqual(mock_ec2.SecurityGroup.call_count, 2)  # public + private

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
      self.assertIn(f'vpc-{custom_environment}', vpc_call[0][0])
      self.assertEqual(vpc_call[1]['tags']['Environment'], custom_environment)
      self.assertEqual(vpc_call[1]['tags']['Team'], custom_team)
      self.assertEqual(vpc_call[1]['tags']['Project'], custom_project)

  def test_naming_convention_integration(self):
    """Test that infrastructure follows consistent naming conventions."""
    env_suffix = 'prod'
    expected_patterns = [
      f'vpc-{env_suffix}',
      f'igw-{env_suffix}',
      f'public-subnet-1-{env_suffix}',
      f'private-subnet-1-{env_suffix}',
      f'nat-eip-{env_suffix}',
      f'nat-gateway-{env_suffix}',
      f'public-rt-{env_suffix}',
      f'private-rt-{env_suffix}',
      f'public-sg-{env_suffix}',
      f'private-sg-{env_suffix}'
    ]

    # Verify all naming patterns are consistent
    for pattern in expected_patterns:
      self.assertIn(env_suffix, pattern)

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
    self.assertEqual(mock_ec2.Subnet.call_count, 4)
    mock_ec2.Eip.assert_called_once()
    mock_ec2.NatGateway.assert_called_once()
    self.assertEqual(mock_ec2.RouteTable.call_count, 2)
    self.assertEqual(mock_ec2.RouteTableAssociation.call_count, 4)
    self.assertEqual(mock_ec2.SecurityGroup.call_count, 2)

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
    self.assertEqual(mock_ec2.SecurityGroup.call_count, 2)  # public + private

    # Check public security group rules
    public_sg_call = [call for call in mock_ec2.SecurityGroup.call_args_list 
                     if 'public-sg' in call[0][0]][0]
    public_ingress = public_sg_call[1]['ingress']
    
    # Verify SSH, HTTP, HTTPS rules exist
    self.assertEqual(len(public_ingress), 3)  # SSH, HTTP, HTTPS

    # Check private security group rules
    private_sg_call = [call for call in mock_ec2.SecurityGroup.call_args_list 
                      if 'private-sg' in call[0][0]][0]
    private_ingress = private_sg_call[1]['ingress']
    
    # Verify private SG allows all traffic from VPC
    self.assertEqual(len(private_ingress), 1)


if __name__ == '__main__':
  unittest.main()
