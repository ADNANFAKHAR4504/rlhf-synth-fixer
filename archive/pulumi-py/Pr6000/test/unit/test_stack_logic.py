"""
Unit tests for stack logic and configuration coverage.
"""

import unittest
from lib.config import get_environment_config, get_default_egress_rules


class TestStackLogic(unittest.TestCase):
    """Test stack logic and configuration paths."""

    def test_database_encryption_enabled_config(self):
        """Test database encryption configuration for prod."""
        config = get_environment_config('prod')
        self.assertTrue(config.enable_db_encryption)
        self.assertEqual(config.db_instance_class, 'db.m5.large')

    def test_database_encryption_disabled_config(self):
        """Test database encryption configuration for dev."""
        config = get_environment_config('dev')
        self.assertFalse(config.enable_db_encryption)
        self.assertEqual(config.db_instance_class, 'db.t3.small')

    def test_database_instance_classes(self):
        """Test various database instance class configurations."""
        dev_config = get_environment_config('development')
        prod_config = get_environment_config('production')

        self.assertEqual(dev_config.db_instance_class, 'db.t3.small')
        self.assertEqual(prod_config.db_instance_class, 'db.m5.large')

    def test_compute_reserved_concurrency(self):
        """Test Lambda reserved concurrency settings."""
        dev_config = get_environment_config('dev')
        prod_config = get_environment_config('prod')

        self.assertIsNone(dev_config.lambda_reserved_concurrency)
        self.assertEqual(prod_config.lambda_reserved_concurrency, 100)

    def test_api_custom_domain_settings(self):
        """Test API custom domain configuration."""
        dev_config = get_environment_config('dev')
        prod_config = get_environment_config('prod')

        self.assertFalse(dev_config.enable_custom_domain)
        self.assertTrue(prod_config.enable_custom_domain)

    def test_storage_encryption_config(self):
        """Test storage encryption configuration."""
        dev_config = get_environment_config('dev')
        prod_config = get_environment_config('prod')

        self.assertFalse(dev_config.enable_storage_encryption)
        self.assertTrue(prod_config.enable_storage_encryption)

    def test_s3_lifecycle_policies(self):
        """Test S3 lifecycle policy days."""
        dev_config = get_environment_config('dev')
        prod_config = get_environment_config('prod')

        self.assertIsNone(dev_config.s3_lifecycle_days)
        self.assertEqual(prod_config.s3_lifecycle_days, 90)

    def test_dynamodb_billing_modes(self):
        """Test DynamoDB billing mode configuration."""
        dev_config = get_environment_config('dev')
        prod_config = get_environment_config('prod')

        self.assertEqual(dev_config.dynamodb_billing_mode, 'PROVISIONED')
        self.assertEqual(prod_config.dynamodb_billing_mode, 'PAY_PER_REQUEST')

    def test_log_retention_periods(self):
        """Test CloudWatch log retention periods."""
        dev_config = get_environment_config('dev')
        prod_config = get_environment_config('prod')

        self.assertEqual(dev_config.log_retention_days, 7)
        self.assertEqual(prod_config.log_retention_days, 30)

    def test_vpc_cidr_blocks(self):
        """Test VPC CIDR block configuration."""
        dev_config = get_environment_config('dev')
        prod_config = get_environment_config('prod')

        self.assertEqual(dev_config.vpc_cidr, '10.0.0.0/16')
        self.assertEqual(prod_config.vpc_cidr, '10.1.0.0/16')

    def test_s3_versioning_config(self):
        """Test S3 versioning configuration."""
        dev_config = get_environment_config('dev')
        prod_config = get_environment_config('prod')

        self.assertFalse(dev_config.enable_s3_versioning)
        self.assertTrue(prod_config.enable_s3_versioning)

    def test_environment_detection_variations(self):
        """Test environment detection with various suffixes."""
        test_cases = [
            ('dev', 'dev'),
            ('development', 'dev'),
            ('dev-us-east-1', 'dev'),
            ('prod', 'prod'),
            ('production', 'prod'),
            ('prod-eu-west-1', 'prod'),
            ('staging', 'dev'),
            ('qa', 'dev'),
        ]

        for suffix, expected_env in test_cases:
            config = get_environment_config(suffix)
            self.assertEqual(config.environment, expected_env)

    def test_egress_rules_configuration(self):
        """Test default egress rules."""
        egress_rules = get_default_egress_rules()
        self.assertIsInstance(egress_rules, list)
        self.assertEqual(len(egress_rules), 1)

        # Verify the rule object exists and has correct type
        rule = egress_rules[0]
        self.assertIsNotNone(rule)

    def test_all_config_attributes_exist(self):
        """Test all configuration attributes exist for both environments."""
        for env in ['dev', 'prod']:
            config = get_environment_config(env)

            # Verify all attributes exist
            self.assertTrue(hasattr(config, 'environment'))
            self.assertTrue(hasattr(config, 'vpc_cidr'))
            self.assertTrue(hasattr(config, 'db_instance_class'))
            self.assertTrue(hasattr(config, 'enable_db_encryption'))
            self.assertTrue(hasattr(config, 'lambda_reserved_concurrency'))
            self.assertTrue(hasattr(config, 'enable_custom_domain'))
            self.assertTrue(hasattr(config, 'enable_s3_versioning'))
            self.assertTrue(hasattr(config, 's3_lifecycle_days'))
            self.assertTrue(hasattr(config, 'dynamodb_billing_mode'))
            self.assertTrue(hasattr(config, 'enable_storage_encryption'))
            self.assertTrue(hasattr(config, 'log_retention_days'))

    def test_prod_security_features(self):
        """Test production security features are enabled."""
        config = get_environment_config('production')

        # Verify security features
        self.assertTrue(config.enable_db_encryption)
        self.assertTrue(config.enable_storage_encryption)
        self.assertTrue(config.enable_s3_versioning)
        self.assertTrue(config.enable_custom_domain)

    def test_dev_cost_optimization(self):
        """Test development environment cost optimizations."""
        config = get_environment_config('development')

        # Verify cost optimizations
        self.assertFalse(config.enable_db_encryption)
        self.assertFalse(config.enable_storage_encryption)
        self.assertFalse(config.enable_s3_versioning)
        self.assertIsNone(config.lambda_reserved_concurrency)
        self.assertEqual(config.dynamodb_billing_mode, 'PROVISIONED')
        self.assertEqual(config.log_retention_days, 7)

    def test_config_consistency(self):
        """Test configuration consistency across different instances."""
        config1 = get_environment_config('dev')
        config2 = get_environment_config('dev')

        self.assertEqual(config1.vpc_cidr, config2.vpc_cidr)
        self.assertEqual(config1.db_instance_class, config2.db_instance_class)


if __name__ == '__main__':
    unittest.main()
