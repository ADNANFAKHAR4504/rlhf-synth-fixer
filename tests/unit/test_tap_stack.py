"""
test_tap_stack.py

Unit tests for the TapStack configuration and argument handling.
These tests focus on testing configuration logic without resource deployment or mocking.
"""

import unittest
from lib.tap_stack import TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()
        
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {"Team": "DevOps", "CostCenter": "Engineering"}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)
        
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_empty_string_suffix(self):
        """Test TapStackArgs with empty string defaults to 'dev'."""
        args = TapStackArgs(environment_suffix='')
        
        self.assertEqual(args.environment_suffix, 'dev')

    def test_tap_stack_args_none_suffix(self):
        """Test TapStackArgs with None suffix defaults to 'dev'."""
        args = TapStackArgs(environment_suffix=None)
        
        self.assertEqual(args.environment_suffix, 'dev')

    def test_tap_stack_args_whitespace_suffix(self):
        """Test TapStackArgs with whitespace suffix preserves the value."""
        args = TapStackArgs(environment_suffix='  ')
        
        self.assertEqual(args.environment_suffix, '  ')

    def test_tap_stack_args_special_chars_suffix(self):
        """Test TapStackArgs with special characters in suffix."""
        args = TapStackArgs(environment_suffix='test-env_123')
        
        self.assertEqual(args.environment_suffix, 'test-env_123')

    def test_tap_stack_args_empty_tags_dict(self):
        """Test TapStackArgs with empty tags dictionary."""
        args = TapStackArgs(tags={})
        
        self.assertEqual(args.tags, {})
        self.assertEqual(args.environment_suffix, 'dev')

    def test_tap_stack_args_complex_tags(self):
        """Test TapStackArgs with complex tag values."""
        complex_tags = {
            "Team": "Platform Engineering",
            "CostCenter": "12345",
            "Environment": "production",
            "ManagedBy": "Pulumi",
            "Owner": "platform-team@example.com"
        }
        args = TapStackArgs(environment_suffix='prod', tags=complex_tags)
        
        self.assertEqual(args.tags, complex_tags)
        self.assertEqual(len(args.tags), 5)

    def test_tap_stack_args_multiple_environments(self):
        """Test TapStackArgs with various environment suffix values."""
        environments = ['dev', 'staging', 'qa', 'prod', 'test', 'demo']
        
        for env in environments:
            args = TapStackArgs(environment_suffix=env)
            self.assertEqual(args.environment_suffix, env)

    def test_tap_stack_args_tags_none_vs_empty(self):
        """Test difference between None and empty dict for tags."""
        args_none = TapStackArgs(tags=None)
        args_empty = TapStackArgs(tags={})
        
        self.assertIsNone(args_none.tags)
        self.assertIsNotNone(args_empty.tags)
        self.assertEqual(args_empty.tags, {})

    def test_tap_stack_args_immutability(self):
        """Test that TapStackArgs doesn't share mutable default values."""
        args1 = TapStackArgs()
        args2 = TapStackArgs()
        
        # Both should have independent tags (None)
        self.assertIsNone(args1.tags)
        self.assertIsNone(args2.tags)
        
        # Modifying args would require creating new instance
        args1_modified = TapStackArgs(environment_suffix='prod', tags={"test": "value"})
        
        # Original args2 should be unaffected
        self.assertEqual(args2.environment_suffix, 'dev')
        self.assertIsNone(args2.tags)

    def test_tap_stack_args_boolean_like_suffix(self):
        """Test TapStackArgs with boolean-like string values."""
        args_true = TapStackArgs(environment_suffix='true')
        args_false = TapStackArgs(environment_suffix='false')
        
        self.assertEqual(args_true.environment_suffix, 'true')
        self.assertEqual(args_false.environment_suffix, 'false')

    def test_tap_stack_args_numeric_string_suffix(self):
        """Test TapStackArgs with numeric string as suffix."""
        args = TapStackArgs(environment_suffix='12345')
        
        self.assertEqual(args.environment_suffix, '12345')
        self.assertIsInstance(args.environment_suffix, str)

    def test_tap_stack_args_case_sensitivity(self):
        """Test TapStackArgs preserves case sensitivity."""
        args_lower = TapStackArgs(environment_suffix='dev')
        args_upper = TapStackArgs(environment_suffix='DEV')
        args_mixed = TapStackArgs(environment_suffix='Dev')
        
        self.assertEqual(args_lower.environment_suffix, 'dev')
        self.assertEqual(args_upper.environment_suffix, 'DEV')
        self.assertEqual(args_mixed.environment_suffix, 'Dev')
        self.assertNotEqual(args_lower.environment_suffix, args_upper.environment_suffix)

    def test_tap_stack_args_tags_with_special_chars(self):
        """Test TapStackArgs with special characters in tag values."""
        special_tags = {
            "Email": "team@example.com",
            "URL": "https://example.com/project",
            "Version": "1.0.0-beta.1",
            "Description": "Test environment (staging)"
        }
        args = TapStackArgs(tags=special_tags)
        
        self.assertEqual(args.tags, special_tags)
        self.assertEqual(args.tags["Email"], "team@example.com")

    def test_tap_stack_args_realistic_production_config(self):
        """Test TapStackArgs with realistic production configuration."""
        prod_tags = {
            "Environment": "production",
            "Team": "Data Science",
            "Project": "Image Inference Pipeline",
            "CostCenter": "ML-OPS-001",
            "Compliance": "SOC2",
            "Backup": "daily",
            "ManagedBy": "pulumi"
        }
        args = TapStackArgs(environment_suffix='prod', tags=prod_tags)
        
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, prod_tags)
        self.assertEqual(len(args.tags), 7)

    def test_tap_stack_args_realistic_dev_config(self):
        """Test TapStackArgs with realistic development configuration."""
        dev_tags = {
            "Environment": "development",
            "Developer": "john.doe",
            "Temporary": "true",
            "AutoShutdown": "enabled"
        }
        args = TapStackArgs(environment_suffix='dev', tags=dev_tags)
        
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, dev_tags)


class TestTapStackArgsEdgeCases(unittest.TestCase):
    """Test edge cases and boundary conditions for TapStackArgs."""

    def test_very_long_environment_suffix(self):
        """Test TapStackArgs with very long environment suffix."""
        long_suffix = 'a' * 100
        args = TapStackArgs(environment_suffix=long_suffix)
        
        self.assertEqual(args.environment_suffix, long_suffix)
        self.assertEqual(len(args.environment_suffix), 100)

    def test_many_tags(self):
        """Test TapStackArgs with many tags."""
        many_tags = {f"Tag{i}": f"Value{i}" for i in range(50)}
        args = TapStackArgs(tags=many_tags)
        
        self.assertEqual(len(args.tags), 50)
        self.assertEqual(args.tags["Tag0"], "Value0")
        self.assertEqual(args.tags["Tag49"], "Value49")

    def test_unicode_in_tags(self):
        """Test TapStackArgs with unicode characters in tags."""
        unicode_tags = {
            "Team": "データサイエンス",
            "Project": "图像处理",
            "Owner": "José García"
        }
        args = TapStackArgs(tags=unicode_tags)
        
        self.assertEqual(args.tags, unicode_tags)
        self.assertEqual(args.tags["Team"], "データサイエンス")

    def test_zero_length_tag_value(self):
        """Test TapStackArgs with empty string tag values."""
        empty_value_tags = {
            "Key1": "",
            "Key2": "value2"
        }
        args = TapStackArgs(tags=empty_value_tags)
        
        self.assertEqual(args.tags["Key1"], "")
        self.assertEqual(args.tags["Key2"], "value2")


if __name__ == '__main__':
    unittest.main()
