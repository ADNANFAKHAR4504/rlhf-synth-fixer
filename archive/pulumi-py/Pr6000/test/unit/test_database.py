"""
Unit tests for database configuration.
"""

import unittest
from lib.config import get_environment_config


class TestDatabaseConfiguration(unittest.TestCase):
    """Test database configuration logic."""

    def test_db_instance_class_dev(self):
        """Test database instance class for dev."""
        config = get_environment_config('dev')
        self.assertEqual(config.db_instance_class, 'db.t3.small')

    def test_db_instance_class_prod(self):
        """Test database instance class for prod."""
        config = get_environment_config('prod789')
        self.assertEqual(config.db_instance_class, 'db.m5.large')

    def test_db_encryption_dev(self):
        """Test database encryption is disabled for dev."""
        config = get_environment_config('dev')
        self.assertFalse(config.enable_db_encryption)

    def test_db_encryption_prod(self):
        """Test database encryption is enabled for prod."""
        config = get_environment_config('production')
        self.assertTrue(config.enable_db_encryption)


if __name__ == '__main__':
    unittest.main()
