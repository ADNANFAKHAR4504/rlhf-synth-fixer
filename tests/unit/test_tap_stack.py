"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
import pulumi
from pulumi import ResourceOptions

from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'Production')
        self.assertEqual(args.tags, {})
        self.assertEqual(args.region, 'us-west-2')

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {"CustomTag": "CustomValue"}
        args = TapStackArgs(
            environment_suffix="test",
            tags=custom_tags,
            region="us-east-1"
        )

        self.assertEqual(args.environment_suffix, "test")
        self.assertEqual(args.tags, custom_tags)
        self.assertEqual(args.region, "us-east-1")


if __name__ == "__main__":
    unittest.main()