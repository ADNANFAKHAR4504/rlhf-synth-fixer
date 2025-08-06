#!/usr/bin/env python3
"""
Simple, accurate unit tests for the integrated TapStack.
10 focused tests that validate core functionality without complex mocking.
"""

import os
import sys
import unittest

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))


class TestTapStackArgs(unittest.TestCase):
    """Test TapStackArgs class without Pulumi runtime dependencies"""

    def test_tap_stack_args_defaults(self):
        """Test TapStackArgs with default values"""
        from lib.tap_stack import TapStackArgs
        args = TapStackArgs()
        self.assertEqual(args.environment_suffix, "dev")
        self.assertIsNone(args.tags)

    def test_tap_stack_args_custom_environment(self):
        """Test TapStackArgs with custom environment"""
        from lib.tap_stack import TapStackArgs
        args = TapStackArgs(environment_suffix="production")
        self.assertEqual(args.environment_suffix, "production")

    def test_tap_stack_args_custom_tags(self):
        """Test TapStackArgs with custom tags"""
        from lib.tap_stack import TapStackArgs
        custom_tags = {"project": "test", "env": "staging"}
        args = TapStackArgs(tags=custom_tags)
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_both_custom(self):
        """Test TapStackArgs with both custom environment and tags"""
        from lib.tap_stack import TapStackArgs
        custom_tags = {"team": "infrastructure"}
        args = TapStackArgs(environment_suffix="staging", tags=custom_tags)
        self.assertEqual(args.environment_suffix, "staging")
        self.assertEqual(args.tags, custom_tags)


class TestTapStackImports(unittest.TestCase):
    """Test that imports work correctly"""

    def test_tap_stack_import(self):
        """Test that TapStack can be imported"""
        try:
            from lib.tap_stack import TapStack
            self.assertTrue(True)  # Import successful
        except ImportError:
            self.fail("TapStack import failed")

    def test_tap_stack_args_import(self):
        """Test that TapStackArgs can be imported"""
        try:
            from lib.tap_stack import TapStackArgs
            self.assertTrue(True)  # Import successful
        except ImportError:
            self.fail("TapStackArgs import failed")

    def test_both_imports(self):
        """Test that both classes can be imported together"""
        try:
            from lib.tap_stack import TapStack, TapStackArgs
            self.assertTrue(True)  # Both imports successful
        except ImportError:
            self.fail("Combined import failed")


class TestTapStackStructure(unittest.TestCase):
    """Test TapStack class structure without instantiation"""

    def test_tap_stack_class_exists(self):
        """Test that TapStack class exists and has expected attributes"""
        from lib.tap_stack import TapStack

        # Check that it's a class
        self.assertTrue(hasattr(TapStack, '__init__'))
        self.assertTrue(hasattr(TapStack, '_create_infrastructure'))

    def test_tap_stack_args_class_exists(self):
        """Test that TapStackArgs class exists"""
        from lib.tap_stack import TapStackArgs

        # Check that it's a class with expected attributes
        self.assertTrue(hasattr(TapStackArgs, '__init__'))

    def test_module_structure(self):
        """Test that the module has expected structure"""
        import lib.tap_stack as tap_module

        # Check that module contains expected classes
        self.assertTrue(hasattr(tap_module, 'TapStack'))
        self.assertTrue(hasattr(tap_module, 'TapStackArgs'))

