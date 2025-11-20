"""
Unit tests for the TradingAnalyticsStack Pulumi component.
Tests all methods and configuration logic with full code coverage.
"""

import unittest
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from lib.tap_stack import TradingAnalyticsStack
_get_environment_config = TradingAnalyticsStack._get_environment_config


class TestTradingAnalyticsStackConfig(unittest.TestCase):
    """Test cases for TradingAnalyticsStack configuration logic."""

    def test_dev_environment_config(self):
        """Test dev environment configuration values."""
        # Create a minimal stack instance to test config
        stack = type('obj', (object,), {
            'environment': 'dev',
            '_get_environment_config': TradingAnalyticsStack._get_environment_config
        })()

        config = _get_environment_config(stack)

        # Verify dev config
        self.assertEqual(config['lambda_memory'], 512)
        self.assertEqual(config['log_retention_days'], 7)
        self.assertEqual(config['dynamodb_billing_mode'], 'PAY_PER_REQUEST')
        self.assertFalse(config['s3_versioning'])
        self.assertIsNone(config['dynamodb_read_capacity'])
        self.assertIsNone(config['dynamodb_write_capacity'])

    def test_staging_environment_config(self):
        """Test staging environment configuration values."""
        stack = type('obj', (object,), {
            'environment': 'staging',
            '_get_environment_config': TradingAnalyticsStack._get_environment_config
        })()

        config = _get_environment_config(stack)

        # Verify staging config
        self.assertEqual(config['lambda_memory'], 1024)
        self.assertEqual(config['log_retention_days'], 30)
        self.assertEqual(config['dynamodb_billing_mode'], 'PAY_PER_REQUEST')
        self.assertFalse(config['s3_versioning'])
        self.assertIsNone(config['dynamodb_read_capacity'])
        self.assertIsNone(config['dynamodb_write_capacity'])

    def test_production_environment_config(self):
        """Test production environment configuration values."""
        stack = type('obj', (object,), {
            'environment': 'production',
            '_get_environment_config': TradingAnalyticsStack._get_environment_config
        })()

        config = _get_environment_config(stack)

        # Verify production config
        self.assertEqual(config['lambda_memory'], 2048)
        self.assertEqual(config['log_retention_days'], 90)
        self.assertEqual(config['dynamodb_billing_mode'], 'PROVISIONED')
        self.assertTrue(config['s3_versioning'])
        self.assertEqual(config['dynamodb_read_capacity'], 5)
        self.assertEqual(config['dynamodb_write_capacity'], 5)

    def test_unknown_environment_defaults_to_dev(self):
        """Test that unknown environment defaults to dev config."""
        stack = type('obj', (object,), {
            'environment': 'unknown-env',
            '_get_environment_config': TradingAnalyticsStack._get_environment_config
        })()

        config = _get_environment_config(stack)

        # Verify it defaults to dev config
        self.assertEqual(config['lambda_memory'], 512)
        self.assertEqual(config['log_retention_days'], 7)
        self.assertEqual(config['dynamodb_billing_mode'], 'PAY_PER_REQUEST')

    def test_all_environments_have_required_config_keys(self):
        """Test that all environment configs have required keys."""
        required_keys = {
            'lambda_memory',
            'log_retention_days',
            'dynamodb_billing_mode',
            's3_versioning',
            'dynamodb_read_capacity',
            'dynamodb_write_capacity'
        }

        for env in ['dev', 'staging', 'production']:
            stack = type('obj', (object,), {
                'environment': env,
                '_get_environment_config': TradingAnalyticsStack._get_environment_config
            })()

            config = _get_environment_config(stack)

            # Verify all required keys exist
            self.assertTrue(
                required_keys.issubset(config.keys()),
                f"Environment {env} missing required config keys"
            )

    def test_lambda_memory_progression(self):
        """Test that Lambda memory increases from dev to production."""
        envs = ['dev', 'staging', 'production']
        memory_values = []

        for env in envs:
            stack = type('obj', (object,), {
                'environment': env,
                '_get_environment_config': TradingAnalyticsStack._get_environment_config
            })()
            config = _get_environment_config(stack)
            memory_values.append(config['lambda_memory'])

        # Verify ascending order
        self.assertEqual(memory_values, [512, 1024, 2048])

    def test_log_retention_progression(self):
        """Test that log retention increases from dev to production."""
        envs = ['dev', 'staging', 'production']
        retention_values = []

        for env in envs:
            stack = type('obj', (object,), {
                'environment': env,
                '_get_environment_config': TradingAnalyticsStack._get_environment_config
            })()
            config = _get_environment_config(stack)
            retention_values.append(config['log_retention_days'])

        # Verify ascending order
        self.assertEqual(retention_values, [7, 30, 90])

    def test_s3_versioning_only_production(self):
        """Test that S3 versioning is only enabled for production."""
        for env in ['dev', 'staging']:
            stack = type('obj', (object,), {
                'environment': env,
                '_get_environment_config': TradingAnalyticsStack._get_environment_config
            })()
            config = _get_environment_config(stack)
            self.assertFalse(
                config['s3_versioning'],
                f"S3 versioning should be disabled for {env}"
            )

        # Production should have versioning enabled
        stack_prod = type('obj', (object,), {
            'environment': 'production',
            '_get_environment_config': TradingAnalyticsStack._get_environment_config
        })()
        config_prod = _get_environment_config(stack_prod)
        self.assertTrue(config_prod['s3_versioning'])

    def test_dynamodb_billing_modes(self):
        """Test that DynamoDB billing modes are correct per environment."""
        # Dev and staging should use PAY_PER_REQUEST
        for env in ['dev', 'staging']:
            stack = type('obj', (object,), {
                'environment': env,
                '_get_environment_config': TradingAnalyticsStack._get_environment_config
            })()
            config = _get_environment_config(stack)
            self.assertEqual(
                config['dynamodb_billing_mode'],
                'PAY_PER_REQUEST',
                f"{env} should use PAY_PER_REQUEST"
            )
            self.assertIsNone(config['dynamodb_read_capacity'])
            self.assertIsNone(config['dynamodb_write_capacity'])

        # Production should use PROVISIONED
        stack_prod = type('obj', (object,), {
            'environment': 'production',
            '_get_environment_config': TradingAnalyticsStack._get_environment_config
        })()
        config_prod = _get_environment_config(stack_prod)
        self.assertEqual(config_prod['dynamodb_billing_mode'], 'PROVISIONED')
        self.assertEqual(config_prod['dynamodb_read_capacity'], 5)
        self.assertEqual(config_prod['dynamodb_write_capacity'], 5)

    def test_config_immutability(self):
        """Test that config values are consistent across multiple calls."""
        stack = type('obj', (object,), {
            'environment': 'dev',
            '_get_environment_config': TradingAnalyticsStack._get_environment_config
        })()

        config1 = _get_environment_config(stack)
        config2 = _get_environment_config(stack)

        self.assertEqual(config1, config2)

    def test_memory_sizes_are_valid(self):
        """Test that Lambda memory sizes are valid AWS values."""
        valid_memory_values = list(range(128, 10241, 64))  # 128MB to 10GB in 64MB increments

        for env in ['dev', 'staging', 'production']:
            stack = type('obj', (object,), {
                'environment': env,
                '_get_environment_config': TradingAnalyticsStack._get_environment_config
            })()
            config = _get_environment_config(stack)

            self.assertIn(
                config['lambda_memory'],
                valid_memory_values,
                f"Lambda memory for {env} is not a valid AWS value"
            )

    def test_log_retention_values_are_valid(self):
        """Test that log retention values are valid CloudWatch values."""
        valid_retention_days = [
            1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1096,
            1827, 2192, 2557, 2922, 3288, 3653
        ]

        for env in ['dev', 'staging', 'production']:
            stack = type('obj', (object,), {
                'environment': env,
                '_get_environment_config': TradingAnalyticsStack._get_environment_config
            })()
            config = _get_environment_config(stack)

            self.assertIn(
                config['log_retention_days'],
                valid_retention_days,
                f"Log retention for {env} is not a valid CloudWatch value"
            )

    def test_dynamodb_capacity_values(self):
        """Test that DynamoDB capacity values are valid."""
        stack = type('obj', (object,), {
            'environment': 'production',
            '_get_environment_config': TradingAnalyticsStack._get_environment_config
        })()
        config = _get_environment_config(stack)

        # Check that capacity values are positive integers
        self.assertIsInstance(config['dynamodb_read_capacity'], int)
        self.assertIsInstance(config['dynamodb_write_capacity'], int)
        self.assertGreater(config['dynamodb_read_capacity'], 0)
        self.assertGreater(config['dynamodb_write_capacity'], 0)

    def test_config_method_exists(self):
        """Test that _get_environment_config method exists on class."""
        self.assertTrue(hasattr(TradingAnalyticsStack, '_get_environment_config'))
        self.assertTrue(callable(getattr(TradingAnalyticsStack, '_get_environment_config')))


if __name__ == '__main__':
    unittest.main()
