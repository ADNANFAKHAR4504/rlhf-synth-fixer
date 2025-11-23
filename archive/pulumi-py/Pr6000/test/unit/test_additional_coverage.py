"""
Additional unit tests to improve coverage.
"""

import unittest
from lib.config import get_environment_config
from lib.tap_stack import TapStackArgs


class TestAdditionalCoverage(unittest.TestCase):
    """Additional tests for coverage."""

    def test_environment_config_for_all_variations(self):
        """Test environment configuration for various environment names."""
        # Test various dev environments
        dev_envs = ['dev', 'develop', 'development', 'dev-us-west-2', 'dev-123']
        for env in dev_envs:
            config = get_environment_config(env)
            self.assertEqual(config.environment, 'dev')
            self.assertEqual(config.vpc_cidr, '10.0.0.0/16')
            self.assertFalse(config.enable_db_encryption)

        # Test various prod environments
        prod_envs = ['prod', 'production', 'prod-us-east-1', 'prod-123']
        for env in prod_envs:
            config = get_environment_config(env)
            self.assertEqual(config.environment, 'prod')
            self.assertEqual(config.vpc_cidr, '10.1.0.0/16')
            self.assertTrue(config.enable_db_encryption)

    def test_tap_stack_args_variations(self):
        """Test TapStackArgs with various inputs."""
        # Test with None values
        args1 = TapStackArgs(None, None)
        self.assertEqual(args1.environment_suffix, 'dev')
        self.assertEqual(args1.tags, {})

        # Test with various environment suffixes
        for env in ['dev', 'prod', 'staging', 'qa', 'test']:
            args = TapStackArgs(env)
            self.assertEqual(args.environment_suffix, env)

        # Test with various tags
        tag_sets = [
            {'Env': 'dev'},
            {'Project': 'Test', 'Owner': 'Team'},
            {'A': '1', 'B': '2', 'C': '3'},
        ]
        for tags in tag_sets:
            args = TapStackArgs('test', tags)
            self.assertEqual(args.tags, tags)

    def test_config_attributes_types(self):
        """Test configuration attribute types."""
        dev_config = get_environment_config('dev')
        prod_config = get_environment_config('prod')

        # Check string types
        self.assertIsInstance(dev_config.environment, str)
        self.assertIsInstance(dev_config.vpc_cidr, str)
        self.assertIsInstance(dev_config.db_instance_class, str)
        self.assertIsInstance(dev_config.dynamodb_billing_mode, str)

        # Check boolean types
        self.assertIsInstance(dev_config.enable_db_encryption, bool)
        self.assertIsInstance(dev_config.enable_custom_domain, bool)
        self.assertIsInstance(dev_config.enable_s3_versioning, bool)
        self.assertIsInstance(dev_config.enable_storage_encryption, bool)

        # Check int types
        self.assertIsInstance(dev_config.log_retention_days, int)
        self.assertIsInstance(prod_config.log_retention_days, int)

    def test_config_value_ranges(self):
        """Test configuration values are within expected ranges."""
        dev_config = get_environment_config('dev')
        prod_config = get_environment_config('prod')

        # Check VPC CIDR validity
        self.assertTrue(dev_config.vpc_cidr.endswith('/16'))
        self.assertTrue(prod_config.vpc_cidr.endswith('/16'))

        # Check log retention is positive
        self.assertGreater(dev_config.log_retention_days, 0)
        self.assertGreater(prod_config.log_retention_days, 0)

        # Check DB instance class format
        self.assertTrue(dev_config.db_instance_class.startswith('db.'))
        self.assertTrue(prod_config.db_instance_class.startswith('db.'))

    def test_config_consistency_across_calls(self):
        """Test configuration is consistent across multiple calls."""
        configs_dev = [get_environment_config('dev') for _ in range(5)]
        configs_prod = [get_environment_config('prod') for _ in range(5)]

        # All dev configs should be identical
        for i in range(1, len(configs_dev)):
            self.assertEqual(configs_dev[0].vpc_cidr, configs_dev[i].vpc_cidr)
            self.assertEqual(configs_dev[0].db_instance_class, configs_dev[i].db_instance_class)

        # All prod configs should be identical
        for i in range(1, len(configs_prod)):
            self.assertEqual(configs_prod[0].vpc_cidr, configs_prod[i].vpc_cidr)
            self.assertEqual(configs_prod[0].db_instance_class, configs_prod[i].db_instance_class)

    def test_tap_stack_args_independence(self):
        """Test TapStackArgs instances are independent."""
        args1 = TapStackArgs('dev', {'Key1': 'Value1'})
        args2 = TapStackArgs('prod', {'Key2': 'Value2'})

        # Modify args1
        args1.tags['NewKey'] = 'NewValue'

        # Verify args2 is not affected
        self.assertNotIn('NewKey', args2.tags)
        self.assertNotEqual(args1.environment_suffix, args2.environment_suffix)

    def test_prod_environment_detection(self):
        """Test production environment detection."""
        prod_keywords = ['prod', 'Prod', 'PROD', 'production', 'Production', 'PRODUCTION']

        for keyword in prod_keywords:
            config = get_environment_config(keyword)
            self.assertEqual(config.environment, 'prod')

    def test_dev_environment_detection(self):
        """Test development environment detection."""
        dev_keywords = ['dev', 'develop', 'development', 'staging', 'test', 'qa']

        for keyword in dev_keywords:
            config = get_environment_config(keyword)
            self.assertEqual(config.environment, 'dev')

    def test_config_security_settings(self):
        """Test security-related configuration settings."""
        dev_config = get_environment_config('dev')
        prod_config = get_environment_config('prod')

        # Prod should have more security features enabled
        self.assertTrue(prod_config.enable_db_encryption)
        self.assertTrue(prod_config.enable_storage_encryption)
        self.assertTrue(prod_config.enable_s3_versioning)

        # Dev should have minimal security for cost savings
        self.assertFalse(dev_config.enable_db_encryption)
        self.assertFalse(dev_config.enable_storage_encryption)
        self.assertFalse(dev_config.enable_s3_versioning)


if __name__ == '__main__':
    unittest.main()
