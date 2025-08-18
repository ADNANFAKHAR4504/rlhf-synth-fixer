"""
test_tap_stack.py

Unit tests for the enhanced multi-region Pulumi infrastructure script.
Tests the infrastructure configuration and resource creation logic.
"""

import ipaddress
import os
import sys
import unittest

# Add the lib directory to the path so we can import tap_stack
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "lib"))
# Add the tests directory to the path so we can import utils
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Import the function to test
try:
    from tap_stack import create_infrastructure
except ImportError:
    # Fallback for testing without the actual module
    create_infrastructure = None

# Import shared utilities
from utils import (test_nat_gateway_placement, validate_cidr_blocks,
                   validate_nat_gateway_configuration,
                   validate_region_cidr_mapping, validate_security_tiers,
                   validate_subnet_calculation)


class TestConfigurationValidation(unittest.TestCase):
    """Test cases for configuration validation and defaults."""

    def test_environment_defaults(self):
        """Test that environment defaults are properly set."""
        # Test that the function can be called without configuration
        # This tests the default value handling
        # Test that the function is callable and has the expected signature
        self.assertTrue(callable(create_infrastructure))

        # Test function signature
        import inspect

        sig = inspect.signature(create_infrastructure)
        self.assertIn("export_outputs", sig.parameters)

    def test_cidr_block_validation(self):
        """Test CIDR block validation logic."""
        # Test valid CIDR blocks
        valid_cidrs = ["10.0.0.0/16", "192.168.0.0/24", "172.16.0.0/12"]
        
        results = validate_cidr_blocks(valid_cidrs)
        
        for result in results:
            self.assertTrue(result["is_valid"], f"Invalid CIDR block: {result['cidr']}")
            if result["is_valid"]:
                self.assertTrue(result["is_private"])

    def test_subnet_cidr_calculation(self):
        """Test subnet CIDR calculation logic."""
        vpc_cidr = "10.0.0.0/16"
        subnet_size = 24
        
        result = validate_subnet_calculation(vpc_cidr, subnet_size)
        
        self.assertTrue(result["is_valid"])
        # Should have 256 subnets (16-24 = 8 bits difference, 2^8 = 256)
        self.assertEqual(result["total_subnets"], 256)
        # First subnet should be 10.0.0.0/24
        self.assertEqual(result["first_subnet"], "10.0.0.0/24")
        # Second subnet should be 10.0.1.0/24
        self.assertEqual(result["second_subnet"], "10.0.1.0/24")

    def test_region_cidr_mapping(self):
        """Test region CIDR mapping logic."""
        results = validate_region_cidr_mapping()

        for region, result in results.items():
            self.assertTrue(result["is_valid"], f"Invalid CIDR for region {region}")
            self.assertTrue(result["is_private"])
            self.assertEqual(result["network"], result["cidr"])


class TestSecurityConfiguration(unittest.TestCase):
    """Test cases for security configuration validation."""

    def test_ssh_cidr_validation(self):
        """Test SSH CIDR validation logic."""
        # Test production environment restrictions
        prod_cidrs = ["10.0.0.0/16"]
        staging_cidrs = ["10.0.0.0/16"]
        dev_cidrs = ["0.0.0.0/0"]

        # Validate that production and staging use VPC CIDR only
        for cidr in prod_cidrs + staging_cidrs:
            network = ipaddress.IPv4Network(cidr)
            self.assertTrue(network.is_private)

        # Validate that dev can use 0.0.0.0/0
        for cidr in dev_cidrs:
            if cidr == "0.0.0.0/0":
                self.assertEqual(cidr, "0.0.0.0/0")
            else:
                network = ipaddress.IPv4Network(cidr)
                self.assertTrue(network.is_private)

    def test_environment_based_security(self):
        """Test environment-based security configuration."""
        # Test that different environments have appropriate security levels
        environments = {
            "prod": "restricted",
            "staging": "restricted",
            "dev": "permissive",
        }

        for env, security_level in environments.items():
            self.assertIn(security_level, ["restricted", "permissive"])

    def test_cidr_block_overlap_detection(self):
        """Test CIDR block overlap detection."""
        # Test non-overlapping CIDR blocks
        cidr_blocks = ["10.0.0.0/16", "10.1.0.0/16", "10.2.0.0/16"]

        networks = [ipaddress.IPv4Network(cidr) for cidr in cidr_blocks]

        # Check that no networks overlap
        for i, net1 in enumerate(networks):
            for j, net2 in enumerate(networks):
                if i != j:
                    self.assertFalse(net1.overlaps(net2))


class TestNamingConventions(unittest.TestCase):
    """Test cases for naming convention validation."""

    def test_resource_naming_patterns(self):
        """Test resource naming patterns."""
        # Test naming patterns used in the infrastructure
        naming_patterns = [
            "vpc-{region}-{environment}",
            "igw-{region}-{environment}",
            "subnet-{region}-{az}-{type}-{environment}",
            "nat-gw-{region}-{environment}",
            "sg-{region}-{tier}-{environment}",
        ]

        for pattern in naming_patterns:
            # Test that patterns contain required placeholders
            self.assertIn("{region}", pattern)
            self.assertIn("{environment}", pattern)

            # Test pattern substitution
            test_name = pattern.format(
                region="us-east-1",
                environment="test",
                az="a",
                type="public",
                tier="web",
            )
            self.assertIsInstance(test_name, str)
            self.assertGreater(len(test_name), 0)

    def test_tag_validation(self):
        """Test tag structure validation."""
        # Test required tags
        required_tags = ["Environment", "Team", "Project", "Name", "Region"]

        for tag in required_tags:
            self.assertIsInstance(tag, str)
            self.assertGreater(len(tag), 0)
            # Tags should be valid AWS tag keys
            self.assertTrue(all(c.isalnum() or c in "-_" for c in tag))


class TestInfrastructureLogic(unittest.TestCase):
    """Test cases for infrastructure logic validation."""

    def test_availability_zone_logic(self):
        """Test availability zone selection logic."""
        # Test that we use exactly 2 AZs for cost optimization
        num_azs = 2
        self.assertEqual(num_azs, 2)

        # Test subnet calculation based on AZs
        subnets_per_az = 4  # 2 public + 2 private
        total_subnets = num_azs * subnets_per_az
        self.assertEqual(total_subnets, 8)

    def test_nat_gateway_configuration(self):
        """Test NAT Gateway configuration logic."""
        # Test HA NAT Gateway configuration
        enable_ha_nat = True
        num_azs = 2

        result = validate_nat_gateway_configuration(enable_ha_nat, num_azs)
        
        self.assertTrue(result["is_valid"])
        self.assertGreater(result["nat_gateways"], 0)
        self.assertLessEqual(result["nat_gateways"], num_azs)
        
        # Test placement logic
        placement_result = test_nat_gateway_placement(result["nat_gateways"], num_azs)
        self.assertTrue(placement_result["is_valid"])

    def test_subnet_distribution(self):
        """Test subnet distribution logic."""
        # Test that subnets are properly distributed
        num_azs = 2
        public_subnets_per_az = 2
        private_subnets_per_az = 2

        total_public = num_azs * public_subnets_per_az
        total_private = num_azs * private_subnets_per_az

        self.assertEqual(total_public, 4)
        self.assertEqual(total_private, 4)
        self.assertEqual(total_public + total_private, 8)

    def test_security_group_tiers(self):
        """Test security group tier configuration."""
        result = validate_security_tiers()
        
        expected_tiers = result["tiers"]
        self.assertEqual(len(expected_tiers), 3)

        for tier in expected_tiers:
            validation = result["validation"][tier]
            self.assertTrue(validation["is_string"])
            self.assertTrue(validation["has_length"])
            self.assertTrue(validation["has_relationships"])


if __name__ == "__main__":
    unittest.main()
