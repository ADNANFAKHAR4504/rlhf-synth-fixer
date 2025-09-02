"""
Unit tests for the config module.
"""

import unittest
import os
from lib.config import (
    PROJECT_NAME, ENVIRONMENT, AWS_REGION, VPC_CIDR, PUBLIC_SUBNET_CIDRS,
    PRIVATE_SUBNET_CIDRS, INSTANCE_TYPE, RDS_INSTANCE_CLASS, COMMON_TAGS,
    ALLOWED_PORTS, SECURITY_GROUP_DESCRIPTIONS, get_config, validate_config,
    get_environment_config, is_valid_environment, get_tag_value, update_tag,
    get_network_config, get_compute_config
)


class TestConfig(unittest.TestCase):
    """Test cases for configuration module."""

    def test_project_configuration_constants(self):
        """Test project configuration constants."""
        self.assertEqual(PROJECT_NAME, "tap-infrastructure")
        self.assertEqual(ENVIRONMENT, "prod")
        self.assertEqual(AWS_REGION, "us-east-1")

    def test_network_configuration_constants(self):
        """Test network configuration constants."""
        self.assertEqual(VPC_CIDR, "10.0.0.0/16")
        self.assertEqual(len(PUBLIC_SUBNET_CIDRS), 3)
        self.assertEqual(len(PRIVATE_SUBNET_CIDRS), 3)
        
        # Test that all CIDRs start with 10.0
        self.assertTrue(VPC_CIDR.startswith("10.0"))
        self.assertTrue(all(cidr.startswith("10.0") for cidr in PUBLIC_SUBNET_CIDRS))
        self.assertTrue(all(cidr.startswith("10.0") for cidr in PRIVATE_SUBNET_CIDRS))

    def test_instance_configuration_constants(self):
        """Test instance configuration constants."""
        self.assertEqual(INSTANCE_TYPE, "t3.micro")
        self.assertEqual(RDS_INSTANCE_CLASS, "db.t3.micro")

    def test_common_tags_configuration(self):
        """Test common tags configuration."""
        required_tags = ["Environment", "Project", "ManagedBy", "CostCenter", "Owner"]
        for tag in required_tags:
            self.assertIn(tag, COMMON_TAGS)
        
        self.assertEqual(COMMON_TAGS["Environment"], "Production")
        self.assertEqual(COMMON_TAGS["Project"], PROJECT_NAME)
        self.assertEqual(COMMON_TAGS["ManagedBy"], "Pulumi")

    def test_security_configuration_constants(self):
        """Test security configuration constants."""
        self.assertEqual(len(ALLOWED_PORTS), 4)
        self.assertIn(22, ALLOWED_PORTS)  # SSH
        self.assertIn(80, ALLOWED_PORTS)  # HTTP
        self.assertIn(443, ALLOWED_PORTS)  # HTTPS
        self.assertIn(5432, ALLOWED_PORTS)  # PostgreSQL
        
        # Test security group descriptions
        expected_sg_types = ["bastion", "app", "load_balancer", "rds"]
        for sg_type in expected_sg_types:
            self.assertIn(sg_type, SECURITY_GROUP_DESCRIPTIONS)

    def test_get_config_function(self):
        """Test get_config function."""
        config = get_config()
        
        # Test that all expected keys are present
        expected_keys = [
            "project_name", "environment", "aws_region", "vpc_cidr",
            "public_subnet_cidrs", "private_subnet_cidrs", "instance_type",
            "rds_instance_class", "common_tags", "allowed_ports",
            "security_group_descriptions"
        ]
        
        for key in expected_keys:
            self.assertIn(key, config)
        
        # Test specific values
        self.assertEqual(config["project_name"], PROJECT_NAME)
        self.assertEqual(config["vpc_cidr"], VPC_CIDR)
        self.assertEqual(config["instance_type"], INSTANCE_TYPE)

    def test_validate_config_function(self):
        """Test validate_config function."""
        # Test that validation passes with current config
        self.assertTrue(validate_config())
        
        # Test validation with invalid CIDR (this would require mocking)
        # For now, we'll test that the function exists and returns a boolean
        result = validate_config()
        self.assertIsInstance(result, bool)

    def test_get_environment_config_function(self):
        """Test get_environment_config function."""
        # Test dev environment
        dev_config = get_environment_config("dev")
        self.assertEqual(dev_config["instance_type"], "t3.micro")
        self.assertEqual(dev_config["rds_instance_class"], "db.t3.micro")
        self.assertEqual(dev_config["common_tags"]["Environment"], "Development")
        
        # Test staging environment
        staging_config = get_environment_config("staging")
        self.assertEqual(staging_config["instance_type"], "t3.small")
        self.assertEqual(staging_config["rds_instance_class"], "db.t3.small")
        self.assertEqual(staging_config["common_tags"]["Environment"], "Staging")
        
        # Test prod environment
        prod_config = get_environment_config("prod")
        self.assertEqual(prod_config["instance_type"], "t3.medium")
        self.assertEqual(prod_config["rds_instance_class"], "db.t3.medium")
        self.assertEqual(prod_config["common_tags"]["Environment"], "Production")

    def test_is_valid_environment_function(self):
        """Test is_valid_environment function."""
        # Test valid environments
        self.assertTrue(is_valid_environment("dev"))
        self.assertTrue(is_valid_environment("staging"))
        self.assertTrue(is_valid_environment("prod"))
        
        # Test invalid environments
        self.assertFalse(is_valid_environment("invalid"))
        self.assertFalse(is_valid_environment(""))
        self.assertFalse(is_valid_environment(None))

    def test_get_tag_value_function(self):
        """Test get_tag_value function."""
        # Test existing tags
        self.assertEqual(get_tag_value("Environment"), "Production")
        self.assertEqual(get_tag_value("Project"), PROJECT_NAME)
        self.assertEqual(get_tag_value("ManagedBy"), "Pulumi")
        
        # Test non-existing tags
        self.assertIsNone(get_tag_value("NonExistentTag"))
        self.assertIsNone(get_tag_value(""))

    def test_update_tag_function(self):
        """Test update_tag function."""
        # Store original value
        original_value = COMMON_TAGS["Environment"]
        
        # Update tag
        update_tag("Environment", "TestEnvironment")
        self.assertEqual(COMMON_TAGS["Environment"], "TestEnvironment")
        
        # Restore original value
        update_tag("Environment", original_value)
        self.assertEqual(COMMON_TAGS["Environment"], original_value)

    def test_get_network_config_function(self):
        """Test get_network_config function."""
        network_config = get_network_config()
        
        expected_keys = ["vpc_cidr", "public_subnet_cidrs", "private_subnet_cidrs", "region"]
        for key in expected_keys:
            self.assertIn(key, network_config)
        
        self.assertEqual(network_config["vpc_cidr"], VPC_CIDR)
        self.assertEqual(network_config["public_subnet_cidrs"], PUBLIC_SUBNET_CIDRS)
        self.assertEqual(network_config["private_subnet_cidrs"], PRIVATE_SUBNET_CIDRS)
        self.assertEqual(network_config["region"], AWS_REGION)

    def test_get_compute_config_function(self):
        """Test get_compute_config function."""
        compute_config = get_compute_config()
        
        expected_keys = ["instance_type", "rds_instance_class", "allowed_ports"]
        for key in expected_keys:
            self.assertIn(key, compute_config)
        
        self.assertEqual(compute_config["instance_type"], INSTANCE_TYPE)
        self.assertEqual(compute_config["rds_instance_class"], RDS_INSTANCE_CLASS)
        self.assertEqual(compute_config["allowed_ports"], ALLOWED_PORTS)

    def test_environment_variable_handling(self):
        """Test environment variable handling."""
        # Test that environment variables are properly handled
        self.assertIsInstance(ENVIRONMENT, str)
        self.assertIsInstance(AWS_REGION, str)
        
        # Test that they have reasonable values
        self.assertGreater(len(ENVIRONMENT), 0)
        self.assertGreater(len(AWS_REGION), 0)

    def test_cidr_block_validation(self):
        """Test CIDR block validation."""
        # Test VPC CIDR format
        self.assertTrue(VPC_CIDR.count('.') == 3)  # Should have 3 dots
        self.assertTrue('/' in VPC_CIDR)  # Should have subnet mask
        
        # Test subnet CIDR formats
        for cidr in PUBLIC_SUBNET_CIDRS + PRIVATE_SUBNET_CIDRS:
            self.assertTrue(cidr.count('.') == 3)
            self.assertTrue('/' in cidr)

    def test_port_validation(self):
        """Test port validation."""
        # Test that all ports are within valid range
        for port in ALLOWED_PORTS:
            self.assertIsInstance(port, int)
            self.assertGreaterEqual(port, 1)
            self.assertLessEqual(port, 65535)

    def test_instance_type_validation(self):
        """Test instance type validation."""
        # Test that instance types follow expected pattern
        self.assertTrue(INSTANCE_TYPE.startswith('t3.'))
        self.assertTrue(RDS_INSTANCE_CLASS.startswith('db.t3.'))

    def test_configuration_consistency(self):
        """Test configuration consistency."""
        # Test that all configurations are consistent
        config = get_config()
        network_config = get_network_config()
        compute_config = get_compute_config()
        
        # Test that network config values match main config
        self.assertEqual(config["vpc_cidr"], network_config["vpc_cidr"])
        self.assertEqual(config["public_subnet_cidrs"], network_config["public_subnet_cidrs"])
        
        # Test that compute config values match main config
        self.assertEqual(config["instance_type"], compute_config["instance_type"])
        self.assertEqual(config["rds_instance_class"], compute_config["rds_instance_class"])


if __name__ == '__main__':
    unittest.main()
