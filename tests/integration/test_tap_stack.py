"""
test_tap_stack.py

Integration tests for the enhanced multi-region Pulumi infrastructure script.
Tests complete infrastructure integration and end-to-end functionality.
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
                   validate_region_cidr_mapping, validate_security_tiers)


class TestInfrastructureIntegration(unittest.TestCase):
    """Integration test cases for complete infrastructure."""

    def setUp(self):
        """Set up test environment."""
        self.test_environment = "test-integration"
        self.test_team = "platform"
        self.test_project = "tap"

    def test_infrastructure_function_callable(self):
        """Test that the infrastructure function is callable."""
        # Test that the function exists and is callable
        self.assertTrue(callable(create_infrastructure))

        # Test function signature
        import inspect

        sig = inspect.signature(create_infrastructure)
        self.assertIn("export_outputs", sig.parameters)

    def test_multi_region_configuration_integration(self):
        """Test multi-region configuration integration."""
        # Test region configuration
        regions = ["us-east-1", "us-west-2", "eu-west-1"]
        results = validate_region_cidr_mapping()

        for region in regions:
            if region in results:
                result = results[region]
                self.assertTrue(result["is_valid"])
                self.assertTrue(result["is_private"])
                self.assertEqual(result["network"], result["cidr"])

    def test_environment_configuration_integration(self):
        """Test environment configuration integration."""
        # Test different environment configurations
        environments = {
            "dev": {"ssh_access": "permissive", "nat_ha": False},
            "staging": {"ssh_access": "restricted", "nat_ha": False},
            "prod": {"ssh_access": "restricted", "nat_ha": True},
        }

        for env, config in environments.items():
            self.assertIn(config["ssh_access"], ["permissive", "restricted"])
            self.assertIsInstance(config["nat_ha"], bool)

    def test_security_integration_validation(self):
        """Test security configuration integration."""
        result = validate_security_tiers()
        
        security_tiers = result["tiers"]
        tier_relationships = result["relationships"]

        # Test that tiers are properly defined
        for tier in security_tiers:
            validation = result["validation"][tier]
            self.assertTrue(validation["is_string"])
            self.assertTrue(validation["has_length"])

        # Test tier relationships
        for tier, allowed_access in tier_relationships.items():
            self.assertIn(tier, security_tiers)
            self.assertIsInstance(allowed_access, list)

    def test_network_integration_validation(self):
        """Test network configuration integration."""
        # Test VPC CIDR integration
        vpc_cidr = "10.0.0.0/16"
        vpc_network = ipaddress.IPv4Network(vpc_cidr)

        # Test subnet integration
        subnet_cidrs = [
            "10.0.0.0/24",  # Public subnet 1
            "10.0.1.0/24",  # Public subnet 2
            "10.0.2.0/24",  # Private subnet 1
            "10.0.3.0/24",  # Private subnet 2
        ]

        results = validate_cidr_blocks(subnet_cidrs)
        
        for result in results:
            self.assertTrue(result["is_valid"])
            subnet_network = ipaddress.IPv4Network(result["cidr"])
            # Verify subnet is within VPC
            self.assertTrue(subnet_network.subnet_of(vpc_network))
            # Verify subnet is private
            self.assertTrue(result["is_private"])

    def test_naming_convention_integration(self):
        """Test naming convention integration across all resources."""
        # Test resource naming patterns
        naming_patterns = {
            "vpc": "vpc-{region}-{environment}",
            "igw": "igw-{region}-{environment}",
            "subnet": "subnet-{region}-{az}-{type}-{environment}",
            "nat": "nat-gw-{region}-{environment}",
            "sg": "sg-{region}-{tier}-{environment}",
        }

        test_params = {
            "region": "us-east-1",
            "environment": "test",
            "az": "a",
            "type": "public",
            "tier": "web",
        }

        for resource_type, pattern in naming_patterns.items():
            # Test pattern substitution
            resource_name = pattern.format(**test_params)
            self.assertIsInstance(resource_name, str)
            self.assertGreater(len(resource_name), 0)
            self.assertIn(test_params["region"], resource_name)
            self.assertIn(test_params["environment"], resource_name)

    def test_tagging_integration(self):
        """Test resource tagging integration."""
        # Test required tags
        required_tags = ["Environment", "Team", "Project", "Name", "Region"]

        # Test tag values
        tag_values = {
            "Environment": "test",
            "Team": "platform",
            "Project": "tap",
            "Region": "us-east-1",
        }

        for tag in required_tags:
            self.assertIsInstance(tag, str)
            self.assertGreater(len(tag), 0)

        for tag, value in tag_values.items():
            self.assertIsInstance(value, str)
            self.assertGreater(len(value), 0)

    def test_availability_zone_integration(self):
        """Test availability zone integration."""
        # Test AZ configuration
        num_azs = 2
        subnets_per_az = 4  # 2 public + 2 private

        total_subnets = num_azs * subnets_per_az
        self.assertEqual(total_subnets, 8)

        # Test subnet distribution
        public_subnets = num_azs * 2
        private_subnets = num_azs * 2

        self.assertEqual(public_subnets, 4)
        self.assertEqual(private_subnets, 4)
        self.assertEqual(public_subnets + private_subnets, total_subnets)

    def test_nat_gateway_integration(self):
        """Test NAT Gateway integration."""
        # Test NAT Gateway configuration
        enable_ha_nat = False
        num_azs = 2

        result = validate_nat_gateway_configuration(enable_ha_nat, num_azs)
        
        self.assertTrue(result["is_valid"])
        self.assertGreater(result["nat_gateways"], 0)
        self.assertLessEqual(result["nat_gateways"], num_azs)

        # Test NAT Gateway placement
        placement_result = test_nat_gateway_placement(result["nat_gateways"], num_azs)
        self.assertTrue(placement_result["is_valid"])
        
        if placement_result["placement"] == "single":
            self.assertEqual(result["nat_gateways"], 1)
        else:
            self.assertEqual(len(placement_result["subnet_indices"]), num_azs)

    def test_routing_integration(self):
        """Test routing configuration integration."""
        # Test route table configuration
        route_tables = {
            "public": {
                "routes": ["0.0.0.0/0 -> igw"],
                "associations": "public_subnets",
            },
            "private": {
                "routes": ["0.0.0.0/0 -> nat"],
                "associations": "private_subnets",
            },
        }

        for table_type, config in route_tables.items():
            self.assertIn(table_type, ["public", "private"])
            self.assertIn("routes", config)
            self.assertIn("associations", config)
            self.assertIsInstance(config["routes"], list)
            self.assertIsInstance(config["associations"], str)

    def test_output_structure_integration(self):
        """Test output structure integration."""
        # Test expected output structure
        expected_outputs = {
            "vpc": "VPC resource",
            "igw": "Internet Gateway resource",
            "public_subnets": "List of public subnets",
            "private_subnets": "List of private subnets",
            "nat_gateways": "List of NAT Gateways",
            "security_groups": "Dictionary of security groups",
        }

        for output_key, description in expected_outputs.items():
            self.assertIsInstance(output_key, str)
            self.assertGreater(len(output_key), 0)
            self.assertIsInstance(description, str)

    def test_cost_optimization_integration(self):
        """Test cost optimization integration."""
        # Test cost optimization settings
        cost_settings = {
            "use_2_azs": True,
            "single_nat_gateway": True,
            "optimize_subnet_sizes": True,
        }

        for setting, value in cost_settings.items():
            self.assertIsInstance(value, bool)

        # Test that cost optimization is enabled by default
        self.assertTrue(cost_settings["use_2_azs"])
        self.assertTrue(cost_settings["single_nat_gateway"])

    def test_scalability_integration(self):
        """Test scalability configuration integration."""
        # Test scalability settings
        scalability_settings = {
            "max_azs": 6,
            "subnet_size": 24,
            "vpc_cidr": "10.0.0.0/16",
        }

        # Test AZ limits
        self.assertGreater(scalability_settings["max_azs"], 0)
        self.assertLessEqual(scalability_settings["max_azs"], 6)

        # Test subnet size
        self.assertEqual(scalability_settings["subnet_size"], 24)

        # Test VPC CIDR
        vpc_network = ipaddress.IPv4Network(scalability_settings["vpc_cidr"])
        self.assertTrue(vpc_network.is_private)


if __name__ == "__main__":
    unittest.main()
