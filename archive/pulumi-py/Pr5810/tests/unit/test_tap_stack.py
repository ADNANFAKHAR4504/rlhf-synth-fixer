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
        custom_tags = {"Environment": "test", "Project": "tap"}
        args = TapStackArgs(environment_suffix='test', tags=custom_tags)
        
        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_none_environment_suffix(self):
        """Test TapStackArgs with None environment_suffix defaults to 'dev'."""
        args = TapStackArgs(environment_suffix=None)
        
        self.assertEqual(args.environment_suffix, 'dev')


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack Pulumi component."""

    @pulumi.runtime.test
    def test_tap_stack_creation(self):
        """Test TapStack component creation."""
        import asyncio
        
        def check_tap_stack():
            args = TapStackArgs(environment_suffix='test', tags={"env": "test"})
            stack = TapStack("test-stack", args)
            
            # Verify the stack properties are set correctly
            assert stack.environment_suffix == 'test'
            assert stack.tags == {"env": "test"}
            
            return {
                "environment_suffix": stack.environment_suffix,
                "tags": stack.tags
            }
        
        result = check_tap_stack()
        self.assertEqual(result["environment_suffix"], 'test')
        self.assertEqual(result["tags"], {"env": "test"})

    @pulumi.runtime.test 
    def test_tap_stack_with_default_args(self):
        """Test TapStack with default arguments."""
        def check_default_stack():
            args = TapStackArgs()
            stack = TapStack("default-stack", args)
            
            assert stack.environment_suffix == 'dev'
            assert stack.tags is None
            
            return {
                "environment_suffix": stack.environment_suffix,
                "tags": stack.tags
            }
        
        result = check_default_stack()
        self.assertEqual(result["environment_suffix"], 'dev')
        self.assertIsNone(result["tags"])


if __name__ == '__main__':
    unittest.main()
