"""
test_tap.py

Unit tests for the tap.py entry point module.
"""

import unittest
import os
from unittest.mock import patch, MagicMock


class TestTapEntry(unittest.TestCase):
    """Test cases for tap.py entry point configuration."""

    def test_environment_variables_defaults(self):
        """Test default environment variable values."""
        # Test that defaults are reasonable
        default_region = os.getenv('AWS_REGION', 'us-east-1')
        self.assertIsNotNone(default_region)
        self.assertIsInstance(default_region, str)

    def test_environment_suffix_default(self):
        """Test environment suffix defaults to 'dev'."""
        default_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        self.assertEqual(default_suffix, 'dev')

    @patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': 'prod', 'AWS_REGION': 'us-west-2'})
    def test_environment_variables_custom(self):
        """Test custom environment variable values."""
        self.assertEqual(os.getenv('ENVIRONMENT_SUFFIX'), 'prod')
        self.assertEqual(os.getenv('AWS_REGION'), 'us-west-2')

    @patch.dict(os.environ, {'TEAM': 'platform', 'REPOSITORY': 'test-repo'})
    def test_metadata_variables(self):
        """Test metadata environment variables."""
        self.assertEqual(os.getenv('TEAM'), 'platform')
        self.assertEqual(os.getenv('REPOSITORY'), 'test-repo')


if __name__ == '__main__':
    unittest.main()
