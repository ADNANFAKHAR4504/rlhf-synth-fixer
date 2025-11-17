"""
Unit tests for TapStack arguments and configuration.
"""

import unittest
from lib.tap_stack import TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test TapStackArgs class."""

    def test_tap_stack_args_with_defaults(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_with_environment(self):
        """Test TapStackArgs with custom environment."""
        args = TapStackArgs(environment_suffix='prod')

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_with_tags(self):
        """Test TapStackArgs with custom tags."""
        custom_tags = {
            'Project': 'PaymentSystem',
            'Owner': 'DevOps',
            'CostCenter': '12345'
        }
        args = TapStackArgs(tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_with_both_params(self):
        """Test TapStackArgs with both parameters."""
        custom_tags = {'Environment': 'Production'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_environment_variations(self):
        """Test TapStackArgs with various environment names."""
        environments = ['dev', 'development', 'staging', 'qa', 'prod', 'production']

        for env in environments:
            args = TapStackArgs(environment_suffix=env)
            self.assertEqual(args.environment_suffix, env)

    def test_tap_stack_args_empty_tags(self):
        """Test TapStackArgs with explicitly empty tags."""
        args = TapStackArgs(environment_suffix='test', tags={})

        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.tags, {})
        self.assertIsInstance(args.tags, dict)

    def test_tap_stack_args_complex_tags(self):
        """Test TapStackArgs with complex tag structure."""
        complex_tags = {
            'Application': 'PaymentProcessor',
            'Team': 'Platform',
            'ManagedBy': 'Pulumi',
            'Compliance': 'PCI-DSS',
            'DataClassification': 'Sensitive'
        }
        args = TapStackArgs(environment_suffix='prod', tags=complex_tags)

        self.assertEqual(len(args.tags), 5)
        self.assertEqual(args.tags['Application'], 'PaymentProcessor')
        self.assertEqual(args.tags['Compliance'], 'PCI-DSS')

    def test_tap_stack_args_none_parameters(self):
        """Test TapStackArgs handles None parameters correctly."""
        args = TapStackArgs(environment_suffix=None, tags=None)

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_multiple_instances(self):
        """Test creating multiple TapStackArgs instances."""
        args1 = TapStackArgs(environment_suffix='dev', tags={'Env': 'dev'})
        args2 = TapStackArgs(environment_suffix='prod', tags={'Env': 'prod'})

        self.assertNotEqual(args1.environment_suffix, args2.environment_suffix)
        self.assertNotEqual(args1.tags, args2.tags)

    def test_tap_stack_args_tag_immutability(self):
        """Test that tag dictionaries are independent."""
        args1 = TapStackArgs(tags={'Key': 'Value1'})
        args2 = TapStackArgs(tags={'Key': 'Value2'})

        args1.tags['NewKey'] = 'NewValue'

        self.assertIn('NewKey', args1.tags)
        self.assertNotIn('NewKey', args2.tags)


if __name__ == '__main__':
    unittest.main()
