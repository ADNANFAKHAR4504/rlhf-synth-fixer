"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock
import pulumi
from pulumi import ResourceOptions

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs
from lib.config import EnvironmentConfig


class TestEnvironmentConfig(unittest.TestCase):
    """Test cases for EnvironmentConfig class."""

    def test_dev_environment_config(self):
        """Test development environment configuration."""
        config = EnvironmentConfig('dev')

        self.assertEqual(config.environment, 'dev')
        self.assertEqual(config.get('dynamodb_read_capacity'), 5)
        self.assertEqual(config.get('dynamodb_write_capacity'), 5)
        self.assertEqual(config.get('lambda_memory'), 512)
        self.assertEqual(config.get('lambda_timeout'), 30)
        self.assertEqual(config.get('s3_log_retention_days'), 7)
        self.assertFalse(config.get('dynamodb_pitr'))
        self.assertEqual(config.get('cost_center'), 'DEV-001')
        self.assertEqual(config.get('domain_prefix'), 'dev.api')

    def test_staging_environment_config(self):
        """Test staging environment configuration."""
        config = EnvironmentConfig('staging')

        self.assertEqual(config.environment, 'staging')
        self.assertEqual(config.get('dynamodb_read_capacity'), 25)
        self.assertEqual(config.get('dynamodb_write_capacity'), 25)
        self.assertEqual(config.get('lambda_memory'), 1024)
        self.assertEqual(config.get('lambda_timeout'), 60)
        self.assertEqual(config.get('s3_log_retention_days'), 30)
        self.assertTrue(config.get('dynamodb_pitr'))
        self.assertEqual(config.get('cost_center'), 'STG-001')

    def test_prod_environment_config(self):
        """Test production environment configuration."""
        config = EnvironmentConfig('prod')

        self.assertEqual(config.environment, 'prod')
        self.assertEqual(config.get('dynamodb_read_capacity'), 100)
        self.assertEqual(config.get('dynamodb_write_capacity'), 100)
        self.assertEqual(config.get('lambda_memory'), 3008)
        self.assertEqual(config.get('lambda_timeout'), 120)
        self.assertEqual(config.get('s3_log_retention_days'), 90)
        self.assertTrue(config.get('dynamodb_pitr'))
        self.assertEqual(config.get('cost_center'), 'PROD-001')

    def test_invalid_environment(self):
        """Test invalid environment raises ValueError."""
        with self.assertRaises(ValueError) as context:
            EnvironmentConfig('invalid')
        self.assertIn('Invalid environment', str(context.exception))

    def test_get_common_tags(self):
        """Test common tags generation."""
        config = EnvironmentConfig('dev')
        tags = config.get_common_tags()

        self.assertEqual(tags['Environment'], 'dev')
        self.assertEqual(tags['ManagedBy'], 'Pulumi')
        self.assertEqual(tags['CostCenter'], 'DEV-001')
        self.assertEqual(tags['Project'], 'PaymentProcessing')

    def test_get_domain(self):
        """Test domain name generation."""
        config = EnvironmentConfig('dev')
        domain = config.get_domain()
        self.assertEqual(domain, 'dev.api.example.com')

    def test_get_domain_staging(self):
        """Test domain name generation for staging."""
        config = EnvironmentConfig('staging')
        domain = config.get_domain()
        self.assertEqual(domain, 'staging.api.example.com')

    def test_get_domain_prod(self):
        """Test domain name generation for production."""
        config = EnvironmentConfig('prod')
        domain = config.get_domain()
        self.assertEqual(domain, 'api.example.com')

    def test_validate_capacity_valid(self):
        """Test capacity validation with valid values."""
        config = EnvironmentConfig('dev')
        config.validate_capacity()  # Should not raise

    def test_validate_capacity_invalid_read(self):
        """Test capacity validation with invalid read capacity."""
        config = EnvironmentConfig('dev')
        config.current_config['dynamodb_read_capacity'] = 0

        with self.assertRaises(ValueError) as context:
            config.validate_capacity()
        self.assertIn('read capacity', str(context.exception))

    def test_validate_capacity_invalid_write(self):
        """Test capacity validation with invalid write capacity."""
        config = EnvironmentConfig('dev')
        config.current_config['dynamodb_write_capacity'] = 2000

        with self.assertRaises(ValueError) as context:
            config.validate_capacity()
        self.assertIn('write capacity', str(context.exception))

    def test_validate_capacity_invalid_memory(self):
        """Test capacity validation with invalid lambda memory."""
        config = EnvironmentConfig('dev')
        config.current_config['lambda_memory'] = 100

        with self.assertRaises(ValueError) as context:
            config.validate_capacity()
        self.assertIn('Lambda memory', str(context.exception))

    def test_validate_capacity_edge_cases(self):
        """Test capacity validation at boundaries."""
        config = EnvironmentConfig('dev')

        # Test min valid values
        config.current_config['dynamodb_read_capacity'] = 1
        config.current_config['dynamodb_write_capacity'] = 1
        config.current_config['lambda_memory'] = 128
        config.validate_capacity()  # Should not raise

        # Test max valid values
        config.current_config['dynamodb_read_capacity'] = 1000
        config.current_config['dynamodb_write_capacity'] = 1000
        config.current_config['lambda_memory'] = 10240
        config.validate_capacity()  # Should not raise


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Custom': 'Tag', 'Application': 'Test'}
        args = TapStackArgs(environment_suffix='staging', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'staging')
        self.assertEqual(args.tags, custom_tags)
        self.assertEqual(args.tags['Custom'], 'Tag')

    def test_tap_stack_args_none_tags(self):
        """Test TapStackArgs with None tags."""
        args = TapStackArgs(environment_suffix='prod', tags=None)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, {})


class TestConfigValidation(unittest.TestCase):
    """Test configuration validation edge cases."""

    def test_all_environments_have_required_fields(self):
        """Test that all environments have required configuration fields."""
        required_fields = [
            'dynamodb_read_capacity',
            'dynamodb_write_capacity',
            'lambda_memory',
            'lambda_timeout',
            's3_log_retention_days',
            'api_throttle_burst',
            'api_throttle_rate',
            'dynamodb_pitr',
            'cost_center',
            'domain_prefix',
        ]

        for env in ['dev', 'staging', 'prod']:
            config = EnvironmentConfig(env)
            for field in required_fields:
                value = config.get(field)
                self.assertIsNotNone(value, f"{env} missing {field}")

    def test_pitr_enabled_for_staging_and_prod(self):
        """Test that PITR is properly configured for staging and prod."""
        dev_config = EnvironmentConfig('dev')
        staging_config = EnvironmentConfig('staging')
        prod_config = EnvironmentConfig('prod')

        self.assertFalse(dev_config.get('dynamodb_pitr'))
        self.assertTrue(staging_config.get('dynamodb_pitr'))
        self.assertTrue(prod_config.get('dynamodb_pitr'))

    def test_capacity_increases_across_environments(self):
        """Test that capacity increases from dev to staging to prod."""
        dev_config = EnvironmentConfig('dev')
        staging_config = EnvironmentConfig('staging')
        prod_config = EnvironmentConfig('prod')

        # Check DynamoDB capacity
        self.assertLess(
            dev_config.get('dynamodb_read_capacity'),
            staging_config.get('dynamodb_read_capacity')
        )
        self.assertLess(
            staging_config.get('dynamodb_read_capacity'),
            prod_config.get('dynamodb_read_capacity')
        )

        # Check Lambda memory
        self.assertLess(
            dev_config.get('lambda_memory'),
            staging_config.get('lambda_memory')
        )
        self.assertLess(
            staging_config.get('lambda_memory'),
            prod_config.get('lambda_memory')
        )

    def test_log_retention_increases_across_environments(self):
        """Test that log retention increases from dev to staging to prod."""
        dev_config = EnvironmentConfig('dev')
        staging_config = EnvironmentConfig('staging')
        prod_config = EnvironmentConfig('prod')

        self.assertEqual(dev_config.get('s3_log_retention_days'), 7)
        self.assertEqual(staging_config.get('s3_log_retention_days'), 30)
        self.assertEqual(prod_config.get('s3_log_retention_days'), 90)


if __name__ == '__main__':
    unittest.main()
