"""
Comprehensive unit tests for all lib modules.
"""

import unittest
from lib.config import get_environment_config, get_default_egress_rules, EnvironmentConfig


class TestEnvironmentConfiguration(unittest.TestCase):
    """Comprehensive tests for environment configuration."""

    def test_dev_environment_full_config(self):
        """Test complete dev environment configuration."""
        config = get_environment_config('dev-test-123')

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

    def test_prod_environment_full_config(self):
        """Test complete prod environment configuration."""
        config = get_environment_config('production-456')

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

    def test_prod_detection_variations(self):
        """Test various prod environment name patterns."""
        prod_patterns = ['prod', 'PROD', 'Prod', 'production', 'PRODUCTION', 'prod-123', 'prod_test']

        for pattern in prod_patterns:
            config = get_environment_config(pattern)
            self.assertEqual(config.environment, 'prod', f'Failed for pattern: {pattern}')
            self.assertTrue(config.enable_db_encryption, f'Failed for pattern: {pattern}')

    def test_dev_detection_variations(self):
        """Test various dev environment name patterns."""
        dev_patterns = ['dev', 'development', 'dev-123', 'test', 'staging', 'qa']

        for pattern in dev_patterns:
            config = get_environment_config(pattern)
            self.assertEqual(config.environment, 'dev', f'Failed for pattern: {pattern}')
            self.assertFalse(config.enable_db_encryption, f'Failed for pattern: {pattern}')

    def test_egress_rules_structure(self):
        """Test egress rules return correct structure."""
        rules = get_default_egress_rules()

        self.assertIsInstance(rules, list)
        self.assertEqual(len(rules), 1)

        rule = rules[0]
        self.assertEqual(rule.protocol, '-1')
        self.assertEqual(rule.from_port, 0)
        self.assertEqual(rule.to_port, 0)
        self.assertEqual(rule.cidr_blocks, ['0.0.0.0/0'])

    def test_environment_config_dataclass(self):
        """Test EnvironmentConfig dataclass creation."""
        config = EnvironmentConfig(
            environment='test',
            vpc_cidr='10.2.0.0/16',
            db_instance_class='db.t3.micro',
            enable_db_encryption=False,
            lambda_reserved_concurrency=50,
            enable_custom_domain=False,
            enable_s3_versioning=True,
            s3_lifecycle_days=30,
            dynamodb_billing_mode='PROVISIONED',
            enable_storage_encryption=False,
            log_retention_days=14
        )

        self.assertEqual(config.environment, 'test')
        self.assertEqual(config.vpc_cidr, '10.2.0.0/16')
        self.assertEqual(config.lambda_reserved_concurrency, 50)
        self.assertEqual(config.s3_lifecycle_days, 30)

    def test_vpc_cidr_differences(self):
        """Test VPC CIDR is different between environments."""
        dev_config = get_environment_config('dev')
        prod_config = get_environment_config('prod')

        self.assertNotEqual(dev_config.vpc_cidr, prod_config.vpc_cidr)
        self.assertEqual(dev_config.vpc_cidr, '10.0.0.0/16')
        self.assertEqual(prod_config.vpc_cidr, '10.1.0.0/16')

    def test_db_instance_size_differences(self):
        """Test database instance sizes differ between environments."""
        dev_config = get_environment_config('dev')
        prod_config = get_environment_config('prod')

        self.assertNotEqual(dev_config.db_instance_class, prod_config.db_instance_class)
        self.assertIn('t3', dev_config.db_instance_class)
        self.assertIn('m5', prod_config.db_instance_class)

    def test_billing_mode_differences(self):
        """Test DynamoDB billing modes differ between environments."""
        dev_config = get_environment_config('dev')
        prod_config = get_environment_config('prod')

        self.assertEqual(dev_config.dynamodb_billing_mode, 'PROVISIONED')
        self.assertEqual(prod_config.dynamodb_billing_mode, 'PAY_PER_REQUEST')

    def test_log_retention_differences(self):
        """Test log retention differs between environments."""
        dev_config = get_environment_config('dev')
        prod_config = get_environment_config('prod')

        self.assertLess(dev_config.log_retention_days, prod_config.log_retention_days)
        self.assertEqual(dev_config.log_retention_days, 7)
        self.assertEqual(prod_config.log_retention_days, 30)

    def test_encryption_settings_dev(self):
        """Test all encryption is disabled in dev."""
        config = get_environment_config('dev')

        self.assertFalse(config.enable_db_encryption)
        self.assertFalse(config.enable_storage_encryption)

    def test_encryption_settings_prod(self):
        """Test all encryption is enabled in prod."""
        config = get_environment_config('prod')

        self.assertTrue(config.enable_db_encryption)
        self.assertTrue(config.enable_storage_encryption)

    def test_s3_lifecycle_dev(self):
        """Test S3 lifecycle is not configured for dev."""
        config = get_environment_config('dev')

        self.assertFalse(config.enable_s3_versioning)
        self.assertIsNone(config.s3_lifecycle_days)

    def test_s3_lifecycle_prod(self):
        """Test S3 lifecycle is configured for prod."""
        config = get_environment_config('prod')

        self.assertTrue(config.enable_s3_versioning)
        self.assertEqual(config.s3_lifecycle_days, 90)

    def test_lambda_scaling_dev(self):
        """Test Lambda has no reserved concurrency in dev."""
        config = get_environment_config('dev')
        self.assertIsNone(config.lambda_reserved_concurrency)

    def test_lambda_scaling_prod(self):
        """Test Lambda has reserved concurrency in prod."""
        config = get_environment_config('prod')
        self.assertIsNotNone(config.lambda_reserved_concurrency)
        self.assertGreater(config.lambda_reserved_concurrency, 0)


if __name__ == '__main__':
    unittest.main()
