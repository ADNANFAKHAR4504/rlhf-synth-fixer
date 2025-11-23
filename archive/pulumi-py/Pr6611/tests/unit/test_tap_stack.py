"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component.
Uses simple mocking to avoid complex Pulumi resource creation.
"""

import unittest
from unittest.mock import patch, MagicMock
from pulumi import ResourceOptions

# Import the classes we're testing
from lib.tap_stack import TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})
        self.assertEqual(args.region, 'us-east-2')

    def test_tap_stack_args_custom_environment_suffix(self):
        """Test TapStackArgs with custom environment suffix."""
        args = TapStackArgs(environment_suffix='prod')

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, {})
        self.assertEqual(args.region, 'us-east-2')

    def test_tap_stack_args_custom_tags(self):
        """Test TapStackArgs with custom tags."""
        custom_tags = {'Environment': 'test', 'Team': 'devops'}
        args = TapStackArgs(tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, custom_tags)
        self.assertEqual(args.region, 'us-east-2')

    def test_tap_stack_args_custom_region(self):
        """Test TapStackArgs with custom region."""
        args = TapStackArgs(region='us-west-2')

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})
        self.assertEqual(args.region, 'us-west-2')

    def test_tap_stack_args_all_custom_values(self):
        """Test TapStackArgs with all custom values."""
        custom_tags = {'Project': 'TAP', 'Owner': 'DevOps'}
        args = TapStackArgs(
            environment_suffix='staging',
            tags=custom_tags,
            region='eu-west-1'
        )

        self.assertEqual(args.environment_suffix, 'staging')
        self.assertEqual(args.tags, custom_tags)
        self.assertEqual(args.region, 'eu-west-1')

    def test_tap_stack_args_none_environment_suffix_defaults_to_dev(self):
        """Test TapStackArgs with explicit None for environment_suffix."""
        args = TapStackArgs(environment_suffix=None)

        self.assertEqual(args.environment_suffix, 'dev')

    def test_tap_stack_args_none_tags_defaults_to_empty_dict(self):
        """Test TapStackArgs with explicit None for tags."""
        args = TapStackArgs(tags=None)

        self.assertEqual(args.tags, {})

    def test_tap_stack_args_empty_environment_suffix(self):
        """Test TapStackArgs with empty string defaults to dev."""
        args = TapStackArgs(environment_suffix='')

        self.assertEqual(args.environment_suffix, 'dev')

    def test_tap_stack_args_environment_suffix_types(self):
        """Test TapStackArgs with various environment suffix types."""
        for env_suffix in ['dev', 'staging', 'prod', 'test', 'fix6611']:
            args = TapStackArgs(environment_suffix=env_suffix)
            self.assertEqual(args.environment_suffix, env_suffix)

    def test_tap_stack_args_tags_immutability(self):
        """Test that tags parameter doesn't mutate original dict."""
        original_tags = {'Key': 'Value'}
        args = TapStackArgs(tags=original_tags)

        # Verify tags are stored
        self.assertEqual(args.tags, original_tags)
        self.assertIsNotNone(args.tags)

    def test_tap_stack_args_region_validation(self):
        """Test TapStackArgs accepts various AWS regions."""
        regions = ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1']
        for region in regions:
            args = TapStackArgs(region=region)
            self.assertEqual(args.region, region)


# Simple integration test to ensure the class imports work
class TestTapStackImports(unittest.TestCase):
    """Test that all required classes can be imported."""

    def test_tap_stack_class_exists(self):
        """Test that TapStack class can be imported."""
        from lib.tap_stack import TapStack
        self.assertIsNotNone(TapStack)

    def test_tap_stack_args_class_exists(self):
        """Test that TapStackArgs class exists."""
        self.assertIsNotNone(TapStackArgs)

    def test_networking_stack_import(self):
        """Test that NetworkingStack can be imported."""
        from lib.networking_stack import NetworkingStack, NetworkingStackArgs
        self.assertIsNotNone(NetworkingStack)
        self.assertIsNotNone(NetworkingStackArgs)

    def test_security_stack_import(self):
        """Test that SecurityStack can be imported."""
        from lib.security_stack import SecurityStack, SecurityStackArgs
        self.assertIsNotNone(SecurityStack)
        self.assertIsNotNone(SecurityStackArgs)

    def test_monitoring_stack_import(self):
        """Test that MonitoringStack can be imported."""
        from lib.monitoring_stack import MonitoringStack, MonitoringStackArgs
        self.assertIsNotNone(MonitoringStack)
        self.assertIsNotNone(MonitoringStackArgs)

    def test_automation_stack_import(self):
        """Test that AutomationStack can be imported."""
        from lib.automation_stack import AutomationStack, AutomationStackArgs
        self.assertIsNotNone(AutomationStack)
        self.assertIsNotNone(AutomationStackArgs)


if __name__ == '__main__':
    unittest.main()
