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


class MyMocks(pulumi.runtime.Mocks):
    """Custom mock for Pulumi resources."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = {
            **args.inputs,
            'id': f"{args.name}_id",
            'arn': f"arn:aws:{args.typ}:us-east-1:123456789:resource/{args.name}",
        }
        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        return {}


pulumi.runtime.set_mocks(MyMocks())


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()
        
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_with_suffix(self):
        """Test TapStackArgs with custom environment suffix."""
        args = TapStackArgs(environment_suffix='prod')
        
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_with_tags(self):
        """Test TapStackArgs with custom tags."""
        custom_tags = {"Environment": "test", "ManagedBy": "Pulumi"}
        args = TapStackArgs(tags=custom_tags)
        
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_with_all_values(self):
        """Test TapStackArgs with all custom values."""
        custom_tags = {"Environment": "staging", "Team": "DevOps"}
        args = TapStackArgs(environment_suffix='stg', tags=custom_tags)
        
        self.assertEqual(args.environment_suffix, 'stg')
        self.assertEqual(args.tags, custom_tags)


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack Pulumi component."""

    @pulumi.runtime.test
    def test_tap_stack_instantiation(self):
        """Test that TapStack can be instantiated."""
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack("test-stack", args=args)
        
        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, 'test')

    @pulumi.runtime.test
    def test_tap_stack_with_default_args(self):
        """Test TapStack with default arguments."""
        args = TapStackArgs()
        stack = TapStack("default-stack", args=args)
        
        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, 'dev')

    @pulumi.runtime.test
    def test_tap_stack_with_tags(self):
        """Test TapStack with custom tags."""
        custom_tags = {"Project": "TAP", "Environment": "prod"}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)
        stack = TapStack("tagged-stack", args=args)
        
        self.assertIsNotNone(stack)
        self.assertEqual(stack.tags, custom_tags)


if __name__ == '__main__':
    unittest.main()
