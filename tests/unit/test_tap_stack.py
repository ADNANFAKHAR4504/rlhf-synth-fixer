"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component.
"""

import unittest
from unittest.mock import patch, MagicMock
import pulumi
from pulumi import ResourceOptions

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs(environment_suffix='test')

        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_with_custom_tags(self):
        """Test TapStackArgs with custom tags."""
        custom_tags = {'Project': 'TestProject', 'Owner': 'TestOwner'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)


class TestTapStackCreation(unittest.TestCase):
    """Test cases for TapStack creation and configuration."""

    @pulumi.runtime.test
    def test_stack_creation(self):
        """Test basic TapStack creation."""

        def check_stack(args):
            # Create a TapStack instance
            args_obj = TapStackArgs(environment_suffix='unittest')
            stack = TapStack('test-stack', args_obj)

            # Verify the stack was created
            self.assertIsNotNone(stack)
            self.assertEqual(stack.environment_suffix, 'unittest')
            self.assertEqual(stack.region, 'us-east-1')

            return {}

        return pulumi.Output.from_input({}).apply(check_stack)


if __name__ == '__main__':
    unittest.main()
