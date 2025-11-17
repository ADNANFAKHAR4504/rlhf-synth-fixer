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

    def test_tap_stack_args_with_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Environment': 'prod', 'Team': 'DevOps'}
        args = TapStackArgs(
            environment_suffix='prod',
            tags=custom_tags
        )

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack component."""

    @patch('pulumi.ComponentResource.__init__')
    def test_tap_stack_initialization(self, mock_init):
        """Test TapStack initializes with correct parameters."""
        mock_init.return_value = None

        args = TapStackArgs(environment_suffix='test', tags={'test': 'tag'})
        stack = TapStack('test-stack', args)

        self.assertEqual(stack.environment_suffix, 'test')
        self.assertEqual(stack.tags, {'test': 'tag'})
        mock_init.assert_called_once_with('tap:stack:TapStack', 'test-stack', None, None)

    @patch('pulumi.ComponentResource.register_outputs')
    @patch('pulumi.ComponentResource.__init__')
    def test_tap_stack_registers_outputs(self, mock_init, mock_register):
        """Test TapStack registers outputs."""
        mock_init.return_value = None

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        mock_register.assert_called_once_with({})
