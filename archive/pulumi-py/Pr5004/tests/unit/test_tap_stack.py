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


class MyMocks(pulumi.runtime.Mocks):
    """Custom mock for Pulumi resources."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = {
            **args.inputs,
            'id': f"{args.name}_id",
            'arn': f"arn:aws:{args.typ}:us-east-1:123456789:resource/{args.name}",
        }

        # Special handling for ElastiCache cluster
        if args.typ == 'aws:elasticache/cluster:Cluster':
            outputs['cache_nodes'] = [{
                'address': 'redis.test.cache.amazonaws.com',
                'port': 6379,
                'id': 'node-001'
            }]

        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        if args.token == 'aws:index/getAvailabilityZones:getAvailabilityZones':
            return {
                'names': ['us-east-1a', 'us-east-1b']
            }
        return {}


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {"Environment": "test", "Project": "assessment"}
        args = TapStackArgs(environment_suffix='test', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.tags, custom_tags)


pulumi.runtime.set_mocks(MyMocks())


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack Pulumi component."""

    @pulumi.runtime.test
    def test_tap_stack_instantiation(self):
        """Test that TapStack can be instantiated."""

        def check_stack_creation(args):
            stack = TapStack(
                "test-stack",
                args=args
            )
            self.assertIsNotNone(stack)
            self.assertEqual(stack.environment_suffix, 'test')

        # Create test stack with custom suffix
        args = TapStackArgs(environment_suffix='test')
        return check_stack_creation(args)

    @pulumi.runtime.test
    def test_tap_stack_component_type(self):
        """Test that TapStack has correct component type."""

        def check_component_type(args):
            stack = TapStack(
                "test-stack",
                args=args
            )
            # Verify it's a ComponentResource
            self.assertIsInstance(stack, pulumi.ComponentResource)

        args = TapStackArgs(environment_suffix='test')
        return check_component_type(args)

    def test_tap_stack_args_environment_suffix(self):
        """Test that environment_suffix is properly set."""
        args = TapStackArgs(environment_suffix='prod')
        self.assertEqual(args.environment_suffix, 'prod')

    def test_tap_stack_args_tags_optional(self):
        """Test that tags are optional."""
        args = TapStackArgs(environment_suffix='staging')
        self.assertIsNotNone(args.tags)
        self.assertEqual(args.tags, {})


if __name__ == '__main__':
    unittest.main()
