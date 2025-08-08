"""
Unit tests for the IPv6 dual-stack VPC Pulumi stack.

These tests verify that the infrastructure code creates the correct resources
with appropriate configurations as specified in the requirements.
"""

import unittest
from unittest.mock import Mock, patch
import sys
import os

# Add project root to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


class MockOutput:
    """Mock Pulumi Output for testing."""
    def __init__(self, value):
        self._value = value
    
    def apply(self, func):
        return MockOutput(func(self._value))
    
    @property
    def value(self):
        return self._value


class TestIPv6DualStackVPC(unittest.TestCase):
    """Test cases for IPv6 dual-stack VPC infrastructure."""

    def setUp(self):
        """Set up test fixtures."""
        # Mock availability zones
        self.mock_azs = Mock()
        self.mock_azs.names = ["us-east-1a", "us-east-1b", "us-east-1c"]
        
        # Mock AMI data
        self.mock_ami = Mock()
        self.mock_ami.id = "ami-0123456789abcdef0"

    def test_code_structure_and_imports(self):
        """Test that the tap.py module can be imported without errors."""
        try:
            import tap
            self.assertTrue(True, "tap.py imports successfully")
        except ImportError as e:
            self.fail(f"Failed to import tap.py: {e}")

    def test_vpc_configuration_in_source(self):
        """Test VPC configuration by examining source code."""
        with open('tap.py', 'r') as f:
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

    def test_subnet_ipv6_configuration_in_source(self):
        """Test subnet IPv6 configuration by examining source code."""
        with open('tap.py', 'r') as f:
            source_code = f.read()
        
        # Check public subnet
        self.assertIn('aws.ec2.Subnet("public-subnet"', source_code)
        self.assertIn('ipv6_cidr_block=vpc.ipv6_cidr_block.apply', source_code)
        self.assertIn('assign_ipv6_address_on_creation=True', source_code)
        self.assertIn('map_public_ip_on_launch=True', source_code)
        
        # Check private subnet
        self.assertIn('aws.ec2.Subnet("private-subnet"', source_code)

    def test_security_group_ipv6_rules_in_source(self):
        """Test security group IPv6 rules by examining source code."""
        with open('tap.py', 'r') as f:
            source_code = f.read()
        
        # Check security group
        self.assertIn('aws.ec2.SecurityGroup("sec-group"', source_code)
        self.assertIn('ipv6_cidr_blocks=["2001:db8::/32"]', source_code)
        self.assertIn('from_port=22', source_code)
        self.assertIn('to_port=22', source_code)
        self.assertIn('protocol="tcp"', source_code)

    def test_ipv6_routes_in_source(self):
        """Test IPv6 routes configuration by examining source code."""
        with open('tap.py', 'r') as f:
            source_code = f.read()
        
        # Check IPv6 routes
        self.assertIn('ipv6_cidr_block="::/0"', source_code)
        self.assertIn('aws.ec2.EgressOnlyInternetGateway("egress-igw"', source_code)
        self.assertIn('egress_only_gateway_id=egress_igw.id', source_code)

    def test_ec2_instances_static_ipv6_in_source(self):
        """Test EC2 instances with static IPv6 by examining source code."""
        with open('tap.py', 'r') as f:
            source_code = f.read()
        
        # Check EC2 instances
        self.assertIn('aws.ec2.Instance("web-server-1"', source_code)
        self.assertIn('aws.ec2.Instance("web-server-2"', source_code)
        self.assertIn('ipv6_address_count=1', source_code)
        self.assertIn('instance_type="t3.micro"', source_code)

    def test_launch_template_configuration_in_source(self):
        """Test launch template configuration by examining source code."""
        with open('tap.py', 'r') as f:
            source_code = f.read()
        
        # Check launch template
        self.assertIn('aws.ec2.LaunchTemplate("web-server-lt"', source_code)
        self.assertIn('vpc_security_group_ids=[security_group.id]', source_code)
        self.assertIn('user_data=pulumi.Output.from_input(user_data).apply', source_code)

    def test_auto_scaling_group_configuration_in_source(self):
        """Test auto-scaling group configuration by examining source code."""
        with open('tap.py', 'r') as f:
            source_code = f.read()
        
        # Check ASG
        self.assertIn('aws.autoscaling.Group("web-server-asg"', source_code)
        self.assertIn('min_size=1', source_code)
        self.assertIn('max_size=2', source_code)
        self.assertIn('desired_capacity=1', source_code)
        self.assertIn('launch_template=aws.autoscaling.GroupLaunchTemplateArgs', source_code)

    def test_nat_gateway_configuration_in_source(self):
        """Test NAT gateway configuration by examining source code."""
        with open('tap.py', 'r') as f:
            source_code = f.read()
        
        # Check NAT gateway
        self.assertIn('aws.ec2.NatGateway("nat-gateway"', source_code)
        self.assertIn('aws.ec2.Eip("nat-eip"', source_code)
        self.assertIn('allocation_id=eip.id', source_code)

    def test_resource_tagging_in_source(self):
        """Test all resources are properly tagged by examining source code."""
        with open('tap.py', 'r') as f:
            source_code = f.read()
        
        # Count tags - should appear multiple times for different resources
        env_tag_count = source_code.count('"Environment": "Production"')
        project_tag_count = source_code.count('"Project": "IPv6StaticTest"')
        
        self.assertGreaterEqual(env_tag_count, 8, "Environment tag should appear on multiple resources")
        self.assertGreaterEqual(project_tag_count, 8, "Project tag should appear on multiple resources")

    def test_pulumi_exports_in_source(self):
        """Test that all required outputs are exported by examining source code."""
        with open('tap.py', 'r') as f:
            source_code = f.read()
        
        expected_exports = [
            'pulumi.export("vpc_id"',
            'pulumi.export("vpc_ipv6_cidr_block"',
            'pulumi.export("public_subnet_id"',
            'pulumi.export("public_subnet_ipv6_cidr_block"',
            'pulumi.export("private_subnet_id"',
            'pulumi.export("private_subnet_ipv6_cidr_block"',
            'pulumi.export("security_group_id"',
            'pulumi.export("instance1_id"',
            'pulumi.export("instance1_ipv6_addresses"',
            'pulumi.export("instance2_id"',
            'pulumi.export("instance2_ipv6_addresses"',
            'pulumi.export("nat_gateway_id"',
            'pulumi.export("egress_igw_id"'
        ]
        
        for export in expected_exports:
            self.assertIn(export, source_code, f"Missing export: {export}")

    def test_no_retain_policies(self):
        """Test that no resources have retain deletion policies."""
        with open('tap.py', 'r') as f:
            source_code = f.read()
        
        # Ensure no protect=True is used (Pulumi's retention mechanism)
        self.assertNotIn('protect=True', source_code)
        self.assertNotIn('protect = True', source_code)
        
        # Ensure no deletion_policy is set to retain
        self.assertNotIn('deletion_policy', source_code.lower())
        self.assertNotIn('retain', source_code.lower())

    def test_availability_zones_usage_in_source(self):
        """Test that availability zones are properly used by examining source code."""
        with open('tap.py', 'r') as f:
            source_code = f.read()
        
        # Check AZ usage
        self.assertIn('aws.get_availability_zones().names[0]', source_code)
        self.assertIn('aws.get_availability_zones().names[1]', source_code)

    def test_user_data_script_in_source(self):
        """Test user data script configuration by examining source code."""
        with open('tap.py', 'r') as f:
            source_code = f.read()
        
        # Check user data
        self.assertIn('user_data = """#!/bin/bash', source_code)
        self.assertIn('python3 -m http.server 80', source_code)
        self.assertIn('base64', source_code)  # User data should be base64 encoded

    def test_ami_selection_in_source(self):
        """Test AMI selection configuration by examining source code."""
        with open('tap.py', 'r') as f:
            source_code = f.read()
        
        # Check AMI selection
        self.assertIn('aws.ec2.get_ami(most_recent=True', source_code)
        self.assertIn('owners=["amazon"]', source_code)
        self.assertIn('amzn2-ami-hvm-*-x86_64-gp2', source_code)

    def test_comprehensive_ipv6_networking(self):
        """Test comprehensive IPv6 networking implementation."""
        with open('tap.py', 'r') as f:
            source_code = f.read()
        
        # Verify IPv6 dual-stack components are all present
        ipv6_components = [
            'assign_generated_ipv6_cidr_block=True',  # VPC IPv6 CIDR
            'ipv6_cidr_block=vpc.ipv6_cidr_block.apply',  # Subnet IPv6 CIDR
            'assign_ipv6_address_on_creation=True',  # Subnet IPv6 auto-assign
            'ipv6_cidr_block="::/0"',  # IPv6 default route
            'EgressOnlyInternetGateway',  # Egress-only for private subnet
            'ipv6_cidr_blocks=["2001:db8::/32"]',  # Security group IPv6 rules
            'ipv6_address_count=1'  # EC2 static IPv6
        ]
        
        for component in ipv6_components:
            self.assertIn(component, source_code, f"Missing IPv6 component: {component}")


if __name__ == '__main__':
    unittest.main()