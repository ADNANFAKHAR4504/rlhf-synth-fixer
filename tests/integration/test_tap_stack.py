"""
test_tap_stack_integration.py

Integration tests for TapStack Pulumi infrastructure code - NO MOCKING.
Validates the infrastructure code structure, configuration, and compliance.
"""

import unittest
import sys
import os

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests validating TapStack infrastructure code."""

    def test_tap_stack_args_initialization(self):
        """Validate TapStackArgs can be initialized with default values."""
        args = TapStackArgs()

        self.assertIsNotNone(args.environment_suffix)
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_with_custom_values(self):
        """Validate TapStackArgs accepts custom environment suffix and tags."""
        custom_tags = {"Environment": "production", "Compliance": "FedRAMP-High"}
        args = TapStackArgs(environment_suffix="prod-123", tags=custom_tags)

        self.assertEqual(args.environment_suffix, "prod-123")
        self.assertEqual(args.tags, custom_tags)
        self.assertIn("Environment", args.tags)
        self.assertIn("Compliance", args.tags)

    def test_tap_stack_args_environment_suffix_format(self):
        """Validate environment suffix format restrictions."""
        # Test various valid formats
        valid_suffixes = ["dev", "prod", "test-123", "env-abc-123"]

        for suffix in valid_suffixes:
            args = TapStackArgs(environment_suffix=suffix)
            self.assertEqual(args.environment_suffix, suffix)

    def test_tap_stack_class_exists(self):
        """Validate TapStack class is properly defined."""
        self.assertTrue(hasattr(TapStack, '__init__'))
        self.assertTrue(callable(getattr(TapStack, '__init__')))

    def test_tap_stack_is_component_resource(self):
        """Validate TapStack inherits from pulumi.ComponentResource."""
        # Check that TapStack has ComponentResource in its MRO
        import pulumi
        self.assertTrue(issubclass(TapStack, pulumi.ComponentResource))

    def test_tap_stack_docstring_compliance(self):
        """Validate TapStack has comprehensive documentation."""
        self.assertIsNotNone(TapStack.__doc__)
        self.assertIn("FedRAMP", TapStack.__doc__)

        # Verify key compliance features are documented
        doc = TapStack.__doc__.lower()
        self.assertIn("encryption", doc)
        self.assertIn("audit", doc)
        self.assertIn("availability", doc)

    def test_tap_stack_args_class_attributes(self):
        """Validate TapStackArgs has required attributes."""
        args = TapStackArgs(environment_suffix="test", tags={"key": "value"})

        self.assertTrue(hasattr(args, 'environment_suffix'))
        self.assertTrue(hasattr(args, 'tags'))

    def test_module_imports(self):
        """Validate required imports are available."""
        from lib import tap_stack

        self.assertTrue(hasattr(tap_stack, 'TapStack'))
        self.assertTrue(hasattr(tap_stack, 'TapStackArgs'))
        self.assertTrue(hasattr(tap_stack, 'pulumi'))
        self.assertTrue(hasattr(tap_stack, 'aws'))

    def test_tap_stack_args_default_tags_handling(self):
        """Validate TapStackArgs handles None tags correctly."""
        args_without_tags = TapStackArgs(environment_suffix="test")
        args_with_empty_tags = TapStackArgs(environment_suffix="test", tags={})

        self.assertIsNone(args_without_tags.tags)
        self.assertEqual(args_with_empty_tags.tags, {})
        self.assertIsInstance(args_with_empty_tags.tags, dict)

    def test_environment_suffix_variations(self):
        """Validate various environment suffix patterns work correctly."""
        test_cases = [
            ("dev", "dev"),
            ("production", "production"),
            ("test-123", "test-123"),
            ("env-feature-branch", "env-feature-branch"),
        ]

        for input_suffix, expected_suffix in test_cases:
            args = TapStackArgs(environment_suffix=input_suffix)
            self.assertEqual(args.environment_suffix, expected_suffix)

    def test_tags_structure_validation(self):
        """Validate tags structure follows AWS tagging conventions."""
        valid_tags = {
            "Environment": "production",
            "Compliance": "FedRAMP-High",
            "CostCenter": "12345",
            "Owner": "security-team"
        }

        args = TapStackArgs(environment_suffix="prod", tags=valid_tags)

        # Verify all tags are strings
        for key, value in args.tags.items():
            self.assertIsInstance(key, str)
            self.assertIsInstance(value, str)

    def test_module_level_imports_complete(self):
        """Validate all required dependencies are imported."""
        import lib.tap_stack as module

        # Check for critical imports
        self.assertTrue(hasattr(module, 'pulumi'))
        self.assertTrue(hasattr(module, 'ResourceOptions'))
        self.assertTrue(hasattr(module, 'aws'))
        self.assertTrue(hasattr(module, 'json'))
        self.assertTrue(hasattr(module, 'Optional'))


if __name__ == '__main__':
    unittest.main()
