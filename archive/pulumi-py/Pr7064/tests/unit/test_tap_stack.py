"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
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
        args = TapStackArgs()
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {"Environment": "test", "Project": "payment"}
        args = TapStackArgs(environment_suffix="prod", tags=custom_tags)
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_only_suffix(self):
        """Test TapStackArgs with only environment suffix."""
        args = TapStackArgs(environment_suffix="staging")
        self.assertEqual(args.environment_suffix, 'staging')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_only_tags(self):
        """Test TapStackArgs with only tags."""
        tags = {"Owner": "DevOps"}
        args = TapStackArgs(tags=tags)
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, tags)


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack component."""

    def setUp(self):
        """Set up test fixtures."""
        pulumi.runtime.set_mocks(MyMocks())

    @pulumi.runtime.test
    def test_tap_stack_initialization(self):
        """Test TapStack component initialization."""
        args = TapStackArgs(
            environment_suffix="test",
            tags={"Environment": "test"}
        )

        def check_stack(args):
            stack = TapStack("test-stack", args)
            self.assertEqual(stack.environment_suffix, "test")
            self.assertIsNotNone(stack.tags)

        return pulumi.Output.from_input(args).apply(check_stack)

    @pulumi.runtime.test
    def test_tap_stack_default_config(self):
        """Test TapStack with default configuration."""
        args = TapStackArgs()

        def check_default(args):
            stack = TapStack("test-stack", args)
            self.assertEqual(stack.environment_suffix, "dev")

        return pulumi.Output.from_input(args).apply(check_default)


class MyMocks(pulumi.runtime.Mocks):
    """Mock provider for Pulumi unit tests."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create mock resource."""
        return [args.name, args.inputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock provider calls."""
        return {}


if __name__ == "__main__":
    unittest.main()
