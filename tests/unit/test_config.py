"""
Unit tests for the config module.
"""

import unittest
import os
from unittest.mock import patch
from lib.config import (
    PROJECT_NAME, ENVIRONMENT, AWS_REGION, VPC_CIDR, PUBLIC_SUBNET_CIDRS,
    INSTANCE_TYPE, AMI_ID, COMMON_TAGS, get_config, validate_config,
    get_environment_config, is_valid_environment, get_tag_value,
    update_tag, get_network_config, get_compute_config
)


class TestConfig(unittest.TestCase):
    """Test cases for the config module."""

    def test_constants(self):
        """Test that constants are defined correctly."""
        self.assertEqual(PROJECT_NAME, "TAP-Infrastructure")
        self.assertEqual(ENVIRONMENT, "production")
        self.assertEqual(AWS_REGION, "us-east-1")
        self.assertEqual(VPC_CIDR, "10.0.0.0/16")
        self.assertEqual(INSTANCE_TYPE, "t2.micro")
        self.assertEqual(AMI_ID, "ami-0c02fb55956c7d316")
        self.assertEqual(len(PUBLIC_SUBNET_CIDRS), 2)
        self.assertIn("10.0.1.0/24", PUBLIC_SUBNET_CIDRS)
        self.assertIn("10.0.2.0/24", PUBLIC_SUBNET_CIDRS)

    def test_common_tags(self):
        """Test that common tags are defined correctly."""
        expected_tags = {
            "Environment": "production",
            "Project": "TAP-Infrastructure",
            "ManagedBy": "Pulumi",
            "Team": "Infrastructure"
        }
        self.assertEqual(COMMON_TAGS, expected_tags)

    def test_get_config(self):
        """Test get_config function."""
        config = get_config()
        self.assertIsInstance(config, dict)
        self.assertEqual(config["project_name"], PROJECT_NAME)
        self.assertEqual(config["environment"], ENVIRONMENT)
        self.assertEqual(config["aws_region"], AWS_REGION)
        self.assertEqual(config["vpc_cidr"], VPC_CIDR)
        self.assertEqual(config["public_subnet_cidrs"], PUBLIC_SUBNET_CIDRS)
        self.assertEqual(config["instance_type"], INSTANCE_TYPE)
        self.assertEqual(config["ami_id"], AMI_ID)
        self.assertEqual(config["common_tags"], COMMON_TAGS)

    def test_validate_config(self):
        """Test validate_config function."""
        self.assertTrue(validate_config())

    def test_get_environment_config(self):
        """Test get_environment_config function."""
        config = get_environment_config()
        self.assertIsInstance(config, dict)
        self.assertEqual(config["environment"], ENVIRONMENT)
        self.assertEqual(config["project_name"], PROJECT_NAME)
        self.assertEqual(config["aws_region"], AWS_REGION)

    def test_get_environment_config_with_env_var(self):
        """Test get_environment_config function with environment variable."""
        with patch.dict(os.environ, {"ENVIRONMENT": "dev"}):
            config = get_environment_config()
            self.assertEqual(config["environment"], "dev")

    def test_is_valid_environment(self):
        """Test is_valid_environment function."""
        self.assertTrue(is_valid_environment("dev"))
        self.assertTrue(is_valid_environment("staging"))
        self.assertTrue(is_valid_environment("production"))
        self.assertTrue(is_valid_environment("prod"))
        self.assertTrue(is_valid_environment("DEV"))
        self.assertTrue(is_valid_environment("PROD"))
        
        self.assertFalse(is_valid_environment("invalid"))
        self.assertFalse(is_valid_environment(""))
        self.assertFalse(is_valid_environment(None))

    def test_get_tag_value(self):
        """Test get_tag_value function."""
        self.assertEqual(get_tag_value("Environment"), "production")
        self.assertEqual(get_tag_value("Project"), "TAP-Infrastructure")
        self.assertEqual(get_tag_value("ManagedBy"), "Pulumi")
        self.assertEqual(get_tag_value("Team"), "Infrastructure")
        self.assertIsNone(get_tag_value("nonexistent"))

    def test_update_tag(self):
        """Test update_tag function."""
        original_value = COMMON_TAGS["Environment"]
        
        # Update a tag
        update_tag("Environment", "test")
        self.assertEqual(COMMON_TAGS["Environment"], "test")
        
        # Restore original value
        update_tag("Environment", original_value)
        self.assertEqual(COMMON_TAGS["Environment"], original_value)

    def test_get_network_config(self):
        """Test get_network_config function."""
        config = get_network_config()
        self.assertIsInstance(config, dict)
        self.assertEqual(config["vpc_cidr"], VPC_CIDR)
        self.assertEqual(config["public_subnet_cidrs"], PUBLIC_SUBNET_CIDRS)
        self.assertEqual(config["aws_region"], AWS_REGION)

    def test_get_compute_config(self):
        """Test get_compute_config function."""
        config = get_compute_config()
        self.assertIsInstance(config, dict)
        self.assertEqual(config["instance_type"], INSTANCE_TYPE)
        self.assertEqual(config["ami_id"], AMI_ID)


if __name__ == '__main__':
    unittest.main()
