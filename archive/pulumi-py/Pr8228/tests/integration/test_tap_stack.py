"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import MagicMock, patch

import pulumi
from pulumi import ResourceOptions


# Mock implementation for Pulumi runtime
class MyMocks(pulumi.runtime.Mocks):
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        outputs = {**args.inputs}
        outputs.update({"id": f"{args.name}-id"})
        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        return {}

# Set mocks before importing
pulumi.runtime.set_mocks(MyMocks())

# Mock boto3 before importing main
with patch('boto3.client') as mock_boto3:
    mock_sts = MagicMock()
    mock_sts.get_caller_identity.return_value = {'Account': '123456789012'}
    mock_boto3.return_value = mock_sts
    # Import the classes we're testing
    from lib import __main__ as main_module
    from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_custom_environment_suffix(self):
        """Test TapStackArgs with custom environment_suffix."""
        args = TapStackArgs(environment_suffix='prod')
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_custom_tags(self):
        """Test TapStackArgs with custom tags."""
        custom_tags = {'Project': 'TAP', 'Environment': 'test'}
        args = TapStackArgs(tags=custom_tags)
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_both_custom(self):
        """Test TapStackArgs with both custom environment_suffix and tags."""
        custom_tags = {'Owner': 'Team'}
        args = TapStackArgs(environment_suffix='staging', tags=custom_tags)
        self.assertEqual(args.environment_suffix, 'staging')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_none_environment_suffix(self):
        """Test TapStackArgs with None environment_suffix defaults to 'dev'."""
        args = TapStackArgs(environment_suffix=None)
        self.assertEqual(args.environment_suffix, 'dev')

    def test_tap_stack_args_none_tags(self):
        """Test TapStackArgs with None tags."""
        args = TapStackArgs(tags=None)
        self.assertIsNone(args.tags)


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack Pulumi component."""

    def setUp(self):
        """Set up mocks for each test."""
        pulumi.runtime.set_mocks(MyMocks())

    def test_tap_stack_init_default_args(self):
        """Test TapStack initialization with default args."""
        stack = TapStack('test-stack', TapStackArgs())
        self.assertEqual(stack.environment_suffix, 'dev')
        self.assertIsNone(stack.tags)

    def test_tap_stack_init_custom_args(self):
        """Test TapStack initialization with custom args."""
        custom_tags = {'Key': 'Value'}
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='prod', tags=custom_tags))
        self.assertEqual(stack.environment_suffix, 'prod')
        self.assertEqual(stack.tags, custom_tags)

    def test_tap_stack_is_component_resource(self):
        """Test that TapStack is a ComponentResource."""
        stack = TapStack('test-stack', TapStackArgs())
        self.assertIsInstance(stack, pulumi.ComponentResource)

    def test_tap_stack_type_name(self):
        """Test the type name of TapStack."""
        stack = TapStack('test-stack', TapStackArgs())
        self.assertEqual(stack._type, 'tap:stack:TapStack')

    def test_tap_stack_name(self):
        """Test the name of TapStack."""
        stack = TapStack('my-test-stack', TapStackArgs())
        self.assertEqual(stack._name, 'my-test-stack')

    def test_tap_stack_with_opts(self):
        """Test TapStack initialization with ResourceOptions."""
        opts = ResourceOptions(parent=None)
        stack = TapStack('test-stack', TapStackArgs(), opts=opts)
        # Just verify it initializes without error
        self.assertIsNotNone(stack)

    def test_tap_stack_environment_suffix_attribute(self):
        """Test environment_suffix attribute assignment."""
        stack = TapStack('test-stack', TapStackArgs(environment_suffix='test-env'))
        self.assertEqual(stack.environment_suffix, 'test-env')

    def test_tap_stack_tags_attribute(self):
        """Test tags attribute assignment."""
        tags = {'Env': 'test'}
        stack = TapStack('test-stack', TapStackArgs(tags=tags))
        self.assertEqual(stack.tags, tags)

    def test_tap_stack_register_outputs_called(self):
        """Test that register_outputs is called with empty dict."""
        with patch.object(pulumi.ComponentResource, 'register_outputs') as mock_register:
            stack = TapStack('test-stack', TapStackArgs())
            mock_register.assert_called_once_with({})

if __name__ == '__main__':
    unittest.main()