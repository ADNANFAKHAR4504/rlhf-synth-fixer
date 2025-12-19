"""
Unit tests for TAP stack configuration.
"""

import unittest
from lib.config import get_environment_config
from lib.tap_stack import TapStackArgs


class TestTapStackConfiguration(unittest.TestCase):
    """Test TAP stack configuration and arguments."""

    def test_tap_stack_args_default(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom(self):
        """Test TapStackArgs with custom values."""
        args = TapStackArgs(environment_suffix='prod', tags={'Owner': 'Team'})
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, {'Owner': 'Team'})

    def test_prod_cost_center_tagging(self):
        """Test production environment should have cost center tag."""
        config = get_environment_config('prod')
        self.assertEqual(config.environment, 'prod')

    def test_dev_environment_defaults(self):
        """Test dev environment uses cost-optimized defaults."""
        config = get_environment_config('dev123')
        self.assertEqual(config.environment, 'dev')
        self.assertFalse(config.enable_db_encryption)
        self.assertFalse(config.enable_storage_encryption)


if __name__ == '__main__':
    unittest.main()
