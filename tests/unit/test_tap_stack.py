"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest

# Import only what we're actually using
from lib.tap_stack import TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()
        
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {"Environment": "test", "Owner": "TestTeam"}
        args = TapStackArgs(environment_suffix='test', tags=custom_tags)
        
        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.tags, custom_tags)


if __name__ == '__main__':
    unittest.main()