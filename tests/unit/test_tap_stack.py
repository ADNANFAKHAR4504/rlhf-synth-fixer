"""
Unit tests for the IPv6 dual-stack VPC infrastructure.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, Mock, patch

# Mock AWS and Pulumi before importing
mock_pulumi = Mock()
mock_pulumi.export = Mock()
mock_pulumi.ResourceOptions = Mock()
mock_pulumi.Output = Mock()
mock_pulumi.Output.from_input = Mock(return_value=Mock(apply=Mock(return_value='mocked')))

mock_aws = Mock()
mock_aws.ec2 = Mock()
mock_aws.autoscaling = Mock()
mock_aws.get_availability_zones = Mock(return_value=Mock(names=['us-east-1a', 'us-east-1b']))
mock_aws.ec2.get_ami = Mock(return_value=Mock(id='ami-12345'))

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

    @patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': 'test'})
    def test_infrastructure_code_execution(self):
        """Test that infrastructure code can be executed without errors"""
        import lib.tap_stack
        self.assertTrue(mock_aws.ec2.Vpc.called)
        self.assertTrue(mock_pulumi.export.called)

    @patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': 'prod'})
    def test_infrastructure_with_prod_suffix(self):
        """Test infrastructure with prod environment suffix"""
        import importlib

        import lib.tap_stack
        importlib.reload(lib.tap_stack)
        self.assertTrue(mock_aws.ec2.Vpc.called)

    def test_derive_ipv6_subnet_cidr_function(self):
        """Test the derive_ipv6_subnet_cidr helper function"""
        # Import the function
        spec = importlib.util.spec_from_file_location("tap_stack", "lib/tap_stack.py")
        module = importlib.util.module_from_spec(spec)
        
        # Mock the dependencies before execution
        module.pulumi = mock_pulumi
        module.aws = mock_aws
        module.os = Mock()
        module.os.environ.get = Mock(return_value='test')
        
        with patch.dict('sys.modules', {'pulumi': mock_pulumi, 'pulumi_aws': mock_aws}):
            spec.loader.exec_module(module)
            
        # Test the function exists
        self.assertTrue(hasattr(module, 'derive_ipv6_subnet_cidr'))
        
        # Test the function logic
        result = module.derive_ipv6_subnet_cidr('2001:db8::/56', 1)
        self.assertIn('2001:db8', result)
        self.assertTrue(result.endswith('/64'))

    def test_vpc_configuration(self):
        """Test VPC configuration parameters"""
        with open('lib/tap_stack.py', 'r', encoding='utf-8') as f:
            source_code = f.read()
        
        self.assertIn('cidr_block="10.0.0.0/16"', source_code)
        self.assertIn('enable_dns_support=True', source_code)
        self.assertIn('enable_dns_hostnames=True', source_code)
        self.assertIn('assign_generated_ipv6_cidr_block=True', source_code)

    def test_subnet_configuration(self):
        """Test subnet configuration"""
        with open('lib/tap_stack.py', 'r', encoding='utf-8') as f:
            source_code = f.read()
        
        self.assertIn('public-subnet', source_code)
        self.assertIn('private-subnet', source_code)
        self.assertIn('cidr_block="10.0.11.0/24"', source_code)
        self.assertIn('cidr_block="10.0.12.0/24"', source_code)

    def test_security_group_configuration(self):
        """Test security group configuration"""
        with open('lib/tap_stack.py', 'r', encoding='utf-8') as f:
            source_code = f.read()
        
        self.assertIn('SecurityGroup', source_code)
        self.assertIn('from_port=22', source_code)
        self.assertIn('to_port=22', source_code)
        self.assertIn('protocol="tcp"', source_code)

    def test_ec2_instances_configuration(self):
        """Test EC2 instances configuration"""
        with open('lib/tap_stack.py', 'r', encoding='utf-8') as f:
            source_code = f.read()
        
        self.assertIn('web-server-1', source_code)
        self.assertIn('web-server-2', source_code)
        self.assertIn('instance_type="t3.micro"', source_code)
        self.assertIn('ipv6_address_count=1', source_code)

    def test_auto_scaling_group(self):
        """Test auto-scaling group configuration"""
        with open('lib/tap_stack.py', 'r', encoding='utf-8') as f:
            source_code = f.read()
        
        self.assertIn('autoscaling.Group', source_code)
        self.assertIn('min_size=1', source_code)
        self.assertIn('max_size=2', source_code)
        self.assertIn('desired_capacity=1', source_code)

    def test_networking_components(self):
        """Test networking components"""
        with open('lib/tap_stack.py', 'r', encoding='utf-8') as f:
            source_code = f.read()
        
        self.assertIn('InternetGateway', source_code)
        self.assertIn('NatGateway', source_code)
        self.assertIn('EgressOnlyInternetGateway', source_code)
        self.assertIn('RouteTable', source_code)

    def test_tags_configuration(self):
        """Test resource tagging"""
        with open('lib/tap_stack.py', 'r', encoding='utf-8') as f:
            source_code = f.read()
        
        self.assertIn('"Environment": "Production"', source_code)
        self.assertIn('"Project": "IPv6StaticTest"', source_code)

    def test_exports_configuration(self):
        """Test Pulumi exports"""
        with open('lib/tap_stack.py', 'r', encoding='utf-8') as f:
            source_code = f.read()
        
        exports = ['vpc_id', 'vpc_ipv6_cidr_block', 'public_subnet_id', 
                  'private_subnet_id', 'security_group_id', 'nat_gateway_id']
        for export in exports:
            self.assertIn(f'pulumi.export("{export}"', source_code)

    def test_tap_py_structure(self):
        """Test tap.py file structure"""
        with open('tap.py', 'r', encoding='utf-8') as f:
            source_code = f.read()
        
        self.assertIn('#!/usr/bin/env python3', source_code)
        self.assertIn('import lib.tap_stack', source_code)
        self.assertEqual(len(source_code.strip().split('\n')), 2)

    def test_ipv6_specific_features(self):
        """Test IPv6 specific configurations"""
        with open('lib/tap_stack.py', 'r', encoding='utf-8') as f:
            source_code = f.read()
        
        self.assertIn('ipv6_cidr_block', source_code)
        self.assertIn('assign_ipv6_address_on_creation=True', source_code)
        self.assertIn('ipv6_cidr_blocks=["::/0"]', source_code)
        self.assertIn('EgressOnlyInternetGateway', source_code)

    def test_resource_replacement_options(self):
        """Test resource replacement configurations"""
        with open('lib/tap_stack.py', 'r', encoding='utf-8') as f:
            source_code = f.read()
        
        self.assertIn('replace_on_changes', source_code)
        self.assertIn('depends_on', source_code)
        self.assertIn('ResourceOptions', source_code)


if __name__ == '__main__':
    unittest.main()