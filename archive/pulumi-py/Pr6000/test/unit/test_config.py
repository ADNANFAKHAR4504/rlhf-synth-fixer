"""
Unit tests for environment configuration.
"""

import unittest
from lib.config import get_environment_config, EnvironmentConfig


class TestEnvironmentConfig(unittest.TestCase):
    """Test environment configuration logic."""

    def test_dev_config(self):
        """Test development environment configuration."""
        config = get_environment_config('dev123')

        self.assertEqual(config.environment, 'dev')
        self.assertEqual(config.vpc_cidr, '10.0.0.0/16')
        self.assertEqual(config.db_instance_class, 'db.t3.small')
        self.assertFalse(config.enable_db_encryption)
        self.assertIsNone(config.lambda_reserved_concurrency)
        self.assertFalse(config.enable_custom_domain)
        self.assertFalse(config.enable_s3_versioning)
        self.assertIsNone(config.s3_lifecycle_days)
        self.assertEqual(config.dynamodb_billing_mode, 'PROVISIONED')
        self.assertFalse(config.enable_storage_encryption)
        self.assertEqual(config.log_retention_days, 7)

    def test_prod_config(self):
        """Test production environment configuration."""
        config = get_environment_config('prod456')

        self.assertEqual(config.environment, 'prod')
        self.assertEqual(config.vpc_cidr, '10.1.0.0/16')
        self.assertEqual(config.db_instance_class, 'db.m5.large')
        self.assertTrue(config.enable_db_encryption)
        self.assertEqual(config.lambda_reserved_concurrency, 100)
        self.assertTrue(config.enable_custom_domain)
        self.assertTrue(config.enable_s3_versioning)
        self.assertEqual(config.s3_lifecycle_days, 90)
        self.assertEqual(config.dynamodb_billing_mode, 'PAY_PER_REQUEST')
        self.assertTrue(config.enable_storage_encryption)
        self.assertEqual(config.log_retention_days, 30)

    def test_prod_detection_case_insensitive(self):
        """Test that production is detected case-insensitively."""
        configs = [
            get_environment_config('PROD123'),
            get_environment_config('Prod456'),
            get_environment_config('production-789')
        ]

        for config in configs:
            self.assertEqual(config.environment, 'prod')
            self.assertTrue(config.enable_db_encryption)


if __name__ == '__main__':
    unittest.main()
