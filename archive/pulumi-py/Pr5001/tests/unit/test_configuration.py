"""
test_configuration.py

Unit tests for TapStackArgs configuration logic without AWS resource instantiation.
"""

import unittest
from lib.tap_stack import TapStackArgs


class TestTapStackConfiguration(unittest.TestCase):
    """Test cases for TapStackArgs configuration without AWS resources."""

    def test_default_environment_suffix(self):
        """Test default environment suffix is 'dev'."""
        args = TapStackArgs()
        self.assertEqual(args.environment_suffix, 'dev')

    def test_default_tags(self):
        """Test default tags is empty dict."""
        args = TapStackArgs()
        self.assertEqual(args.tags, {})

    def test_custom_environment_suffix(self):
        """Test custom environment suffix is preserved."""
        args = TapStackArgs(environment_suffix='prod')
        self.assertEqual(args.environment_suffix, 'prod')

    def test_custom_tags(self):
        """Test custom tags are preserved."""
        custom_tags = {'Owner': 'TestUser', 'Environment': 'test'}
        args = TapStackArgs(tags=custom_tags)
        self.assertEqual(args.tags, custom_tags)

    def test_none_environment_suffix_defaults_to_dev(self):
        """Test None environment suffix defaults to 'dev'."""
        args = TapStackArgs(environment_suffix=None)
        self.assertEqual(args.environment_suffix, 'dev')

    def test_none_tags_defaults_to_empty_dict(self):
        """Test None tags defaults to empty dict."""
        args = TapStackArgs(tags=None)
        self.assertEqual(args.tags, {})

    def test_empty_string_environment_suffix_defaults_to_dev(self):
        """Test empty string environment suffix defaults to 'dev'."""
        args = TapStackArgs(environment_suffix='')
        self.assertEqual(args.environment_suffix, 'dev')

    def test_whitespace_environment_suffix_defaults_to_dev(self):
        """Test whitespace environment suffix defaults to 'dev'."""
        args = TapStackArgs(environment_suffix='   ')
        self.assertEqual(args.environment_suffix, 'dev')

    def test_various_environment_suffix_formats(self):
        """Test various valid environment suffix formats."""
        test_cases = [
            'dev', 'prod', 'staging', 'test',
            'dev-123', 'prod-v2', 'staging-branch',
            'pr123', 'feature-branch', 'hotfix-001'
        ]
        
        for suffix in test_cases:
            with self.subTest(suffix=suffix):
                args = TapStackArgs(environment_suffix=suffix)
                self.assertEqual(args.environment_suffix, suffix)

    def test_various_tag_formats(self):
        """Test various tag dictionary formats."""
        test_cases = [
            {'Owner': 'user'},
            {'Owner': 'user', 'Team': 'devops'},
            {'Environment': 'prod', 'Cost-Center': '12345', 'Project': 'MyProject'},
            {'key-with-dashes': 'value', 'CamelCaseKey': 'value', 'snake_case_key': 'value'}
        ]
        
        for tags in test_cases:
            with self.subTest(tags=tags):
                args = TapStackArgs(tags=tags)
                self.assertEqual(args.tags, tags)

    def test_environment_suffix_type_validation(self):
        """Test environment suffix handles different input types."""
        # String inputs
        args1 = TapStackArgs(environment_suffix='test')
        self.assertEqual(args1.environment_suffix, 'test')
        
        # None input
        args2 = TapStackArgs(environment_suffix=None)
        self.assertEqual(args2.environment_suffix, 'dev')

    def test_tags_type_validation(self):
        """Test tags handles different input types."""
        # Dict input
        tags_dict = {'key': 'value'}
        args1 = TapStackArgs(tags=tags_dict)
        self.assertEqual(args1.tags, tags_dict)
        
        # None input
        args2 = TapStackArgs(tags=None)
        self.assertEqual(args2.tags, {})

    def test_immutable_defaults(self):
        """Test that default values don't affect each other."""
        args1 = TapStackArgs()
        args2 = TapStackArgs()
        
        # Modify one instance's tags
        args1.tags['test'] = 'value'
        
        # Other instance should remain unaffected
        self.assertEqual(args2.tags, {})

    def test_combined_parameters(self):
        """Test using both environment_suffix and tags together."""
        custom_tags = {'Owner': 'TestUser', 'Team': 'DevOps'}
        args = TapStackArgs(environment_suffix='integration', tags=custom_tags)
        
        self.assertEqual(args.environment_suffix, 'integration')
        self.assertEqual(args.tags, custom_tags)

    def test_tag_mutation_after_creation(self):
        """Test that tags can be modified after TapStackArgs creation."""
        args = TapStackArgs()
        args.tags['new_key'] = 'new_value'
        
        self.assertEqual(args.tags['new_key'], 'new_value')

    def test_environment_suffix_mutation_after_creation(self):
        """Test that environment_suffix can be modified after creation."""
        args = TapStackArgs()
        args.environment_suffix = 'modified'
        
        self.assertEqual(args.environment_suffix, 'modified')

    def test_special_characters_in_environment_suffix(self):
        """Test environment suffix with special characters."""
        special_suffixes = ['test-123', 'env_name', 'pr.123']
        
        for suffix in special_suffixes:
            with self.subTest(suffix=suffix):
                args = TapStackArgs(environment_suffix=suffix)
                self.assertEqual(args.environment_suffix, suffix)

    def test_unicode_in_tags(self):
        """Test tags with unicode characters."""
        unicode_tags = {'Owner': 'José', 'Team': 'Développement', 'Project': '项目'}
        args = TapStackArgs(tags=unicode_tags)
        self.assertEqual(args.tags, unicode_tags)

    def test_large_environment_suffix(self):
        """Test environment suffix with longer strings."""
        long_suffix = 'very-long-environment-suffix-name-for-testing-purposes'
        args = TapStackArgs(environment_suffix=long_suffix)
        self.assertEqual(args.environment_suffix, long_suffix)

    def test_many_tags(self):
        """Test configuration with many tags."""
        many_tags = {f'key{i}': f'value{i}' for i in range(50)}
        args = TapStackArgs(tags=many_tags)
        self.assertEqual(args.tags, many_tags)
        self.assertEqual(len(args.tags), 50)

    def test_boolean_and_numeric_tag_values(self):
        """Test tags with non-string values."""
        mixed_tags = {
            'StringKey': 'string_value',
            'BooleanKey': True,
            'IntKey': 42,
            'FloatKey': 3.14
        }
        args = TapStackArgs(tags=mixed_tags)
        self.assertEqual(args.tags, mixed_tags)