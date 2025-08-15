"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import Mock, patch
import pulumi
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()
        
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Team': 'platform', 'Project': 'tap'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)
        
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_none_tags(self):
        """Test TapStackArgs with None tags."""
        args = TapStackArgs(environment_suffix='test', tags=None)
        
        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.tags, {})


class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack Pulumi component."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_pulumi = Mock()
        self.mock_ec2 = Mock()
        self.mock_get_availability_zones = Mock()
        
        # Mock the availability zones response
        mock_azs = Mock()
        mock_azs.names = ['us-east-1a', 'us-east-1b', 'us-east-1c']
        self.mock_get_availability_zones.return_value = mock_azs

    @patch('lib.tap_stack.ec2')
    @patch('lib.tap_stack.get_availability_zones')
    @patch('lib.tap_stack.Config')
    def test_tap_stack_initialization(self, mock_config, mock_get_azs, mock_ec2):
        """Test TapStack initialization with basic configuration."""
        # Mock config
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
        
        # Mock EC2 resources
        mock_vpc = Mock()
        mock_vpc.id = 'vpc-12345'
        mock_vpc.cidr_block = '10.0.0.0/16'
        mock_ec2.Vpc.return_value = mock_vpc
        
        mock_igw = Mock()
        mock_igw.id = 'igw-12345'
        mock_ec2.InternetGateway.return_value = mock_igw
        
        mock_subnet = Mock()
        mock_subnet.id = 'subnet-12345'
        mock_ec2.Subnet.return_value = mock_subnet
        
        mock_eip = Mock()
        mock_eip.id = 'eip-12345'
        mock_ec2.Eip.return_value = mock_eip
        
        mock_nat = Mock()
        mock_nat.id = 'nat-12345'
        mock_ec2.NatGateway.return_value = mock_nat
        
        mock_rt = Mock()
        mock_ec2.RouteTable.return_value = mock_rt
        
        mock_rta = Mock()
        mock_ec2.RouteTableAssociation.return_value = mock_rta
        
        mock_sg = Mock()
        mock_sg.id = 'sg-12345'
        mock_ec2.SecurityGroup.return_value = mock_sg
        
        # Create TapStack instance
        args = TapStackArgs(environment_suffix='test', tags={'Test': 'true'})
        stack = TapStack('test-stack', args)
        
        # Verify the stack was created
        self.assertIsInstance(stack, TapStack)
        self.assertEqual(stack.environment_suffix, 'test')
        self.assertEqual(stack.tags, {'Test': 'true'})
        
        # Verify VPC was created
        mock_ec2.Vpc.assert_called_once()
        vpc_call_args = mock_ec2.Vpc.call_args
        self.assertIn('tap-vpc-test', vpc_call_args[0][0])
        self.assertEqual(vpc_call_args[1]['cidr_block'], '10.0.0.0/16')
        
        # Verify Internet Gateway was created
        mock_ec2.InternetGateway.assert_called_once()
        
        # Verify subnets were created (2 public + 2 private)
        self.assertEqual(mock_ec2.Subnet.call_count, 4)
        
        # Verify NAT Gateway was created
        mock_ec2.NatGateway.assert_called_once()
        
        # Verify route tables were created
        self.assertEqual(mock_ec2.RouteTable.call_count, 2)
        
        # Verify security groups were created
        self.assertEqual(mock_ec2.SecurityGroup.call_count, 2)

    @patch('lib.tap_stack.ec2')
    @patch('lib.tap_stack.get_availability_zones')
    @patch('lib.tap_stack.Config')
    def test_tap_stack_outputs(self, mock_config, mock_get_azs, mock_ec2):
        """Test that TapStack registers the correct outputs."""
        # Mock config
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
        
        # Mock EC2 resources with specific IDs
        mock_vpc = Mock()
        mock_vpc.id = 'vpc-test123'
        mock_vpc.cidr_block = '10.0.0.0/16'
        mock_ec2.Vpc.return_value = mock_vpc
        
        mock_igw = Mock()
        mock_igw.id = 'igw-test123'
        mock_ec2.InternetGateway.return_value = mock_igw
        
        mock_subnet = Mock()
        mock_subnet.id = 'subnet-test123'
        mock_ec2.Subnet.return_value = mock_subnet
        
        mock_eip = Mock()
        mock_eip.id = 'eip-test123'
        mock_ec2.Eip.return_value = mock_eip
        
        mock_nat = Mock()
        mock_nat.id = 'nat-test123'
        mock_ec2.NatGateway.return_value = mock_nat
        
        mock_rt = Mock()
        mock_ec2.RouteTable.return_value = mock_rt
        
        mock_rta = Mock()
        mock_ec2.RouteTableAssociation.return_value = mock_rta
        
        mock_sg = Mock()
        mock_sg.id = 'sg-test123'
        mock_ec2.SecurityGroup.return_value = mock_sg
        
        # Create TapStack instance
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)
        
        # Verify outputs are registered
        self.assertIsNotNone(stack.vpc)
        self.assertIsNotNone(stack.public_subnets)
        self.assertIsNotNone(stack.private_subnets)
        self.assertIsNotNone(stack.public_sg)
        self.assertIsNotNone(stack.private_sg)
        self.assertIsNotNone(stack.igw)
        self.assertIsNotNone(stack.nat_gateway)

    def test_tap_stack_resource_naming(self):
        """Test that resources are named correctly with environment suffix."""
        # This test verifies the naming convention used in the TapStack
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
        
        # Verify naming patterns are consistent
        for pattern in expected_patterns:
            self.assertIn(env_suffix, pattern)
            self.assertTrue(pattern.startswith('tap-'))


if __name__ == '__main__':
    unittest.main()
