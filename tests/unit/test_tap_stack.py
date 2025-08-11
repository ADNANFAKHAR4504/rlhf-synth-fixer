"""
Unit tests for the IPv6 dual-stack VPC infrastructure.

These tests verify that the infrastructure code creates the correct resources
with appropriate configurations as specified in the requirements.
"""

import os
import unittest


class TestTapStack(unittest.TestCase):
    """Test cases for tap infrastructure."""

    def test_tap_py_imports_lib_tap_stack(self):
        """Test that tap.py correctly imports lib.tap_stack"""
        with open('tap.py', 'r', encoding='utf-8') as f:
            source_code = f.read()
        
        self.assertIn('import lib.tap_stack', source_code)

    def test_lib_tap_stack_has_infrastructure(self):
        """Test that lib/tap_stack.py contains infrastructure code"""
        with open('lib/tap_stack.py', 'r', encoding='utf-8') as f:
            source_code = f.read()
        
        # Check VPC creation
        self.assertIn('aws.ec2.Vpc(', source_code)
        self.assertIn('pulumi.export(', source_code)
        self.assertIn('environment_suffix', source_code)

    def test_infrastructure_has_ipv6_support(self):
        """Test that infrastructure includes IPv6 support"""
        with open('lib/tap_stack.py', 'r', encoding='utf-8') as f:
            source_code = f.read()
        
        self.assertIn('assign_generated_ipv6_cidr_block=True', source_code)
        self.assertIn('ipv6_cidr_block', source_code)

    def test_required_exports_present(self):
        """Test that all required exports are present"""
        with open('lib/tap_stack.py', 'r', encoding='utf-8') as f:
            source_code = f.read()
        
        exports = ['vpc_id', 'public_subnet_id', 'private_subnet_id']
        for export in exports:
            self.assertIn(f'pulumi.export("{export}"', source_code)


if __name__ == '__main__':
    unittest.main()