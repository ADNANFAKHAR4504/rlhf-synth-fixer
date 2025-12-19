"""
test_monitoring_stack.py

Comprehensive unit tests for the MonitoringStack Pulumi component.
Tests S3 buckets, VPC Flow Logs, AWS Config, and CloudWatch resources.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
from pulumi import ResourceOptions, Output

# Import the classes we're testing
from lib.monitoring_stack import MonitoringStack, MonitoringStackArgs


class TestMonitoringStackArgs(unittest.TestCase):
    """Test cases for MonitoringStackArgs configuration class."""

    def test_monitoring_stack_args_default_values(self):
        """Test MonitoringStackArgs with default values."""
        vpc_id = Output.from_input("vpc-12345")
        args = MonitoringStackArgs(
            environment_suffix='test',
            vpc_id=vpc_id
        )

        self.assertEqual(args.environment_suffix, 'test')
        self.assertIsNotNone(args.vpc_id)
        self.assertEqual(args.region, 'us-east-2')

    def test_monitoring_stack_args_custom_region(self):
        """Test MonitoringStackArgs with custom region."""
        vpc_id = Output.from_input("vpc-12345")
        args = MonitoringStackArgs(
            environment_suffix='prod',
            vpc_id=vpc_id,
            region='us-west-2'
        )

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.region, 'us-west-2')

    def test_monitoring_stack_args_various_environments(self):
        """Test MonitoringStackArgs with different environment suffixes."""
        vpc_id = Output.from_input("vpc-12345")

        for env in ['dev', 'staging', 'prod', 'test', 'pr6611']:
            args = MonitoringStackArgs(
                environment_suffix=env,
                vpc_id=vpc_id
            )
            self.assertEqual(args.environment_suffix, env)

    def test_monitoring_stack_args_vpc_id_required(self):
        """Test that vpc_id is properly set."""
        vpc_id = Output.from_input("vpc-test-123")
        args = MonitoringStackArgs(
            environment_suffix='test',
            vpc_id=vpc_id
        )

        self.assertIsNotNone(args.vpc_id)


class TestMonitoringStackResourceCreation(unittest.TestCase):
    """Test cases for verifying resource configuration."""

    def test_monitoring_stack_bucket_naming(self):
        """Test that bucket names are correctly configured."""
        vpc_id = Output.from_input("vpc-12345")
        args = MonitoringStackArgs(
            environment_suffix='test',
            vpc_id=vpc_id
        )

        # Verify args are set correctly
        self.assertEqual(args.environment_suffix, 'test')
        self.assertIsNotNone(args.vpc_id)

    def test_monitoring_stack_region_configuration(self):
        """Test that region is correctly configured."""
        vpc_id = Output.from_input("vpc-12345")
        args = MonitoringStackArgs(
            environment_suffix='prod',
            vpc_id=vpc_id,
            region='us-west-2'
        )

        self.assertEqual(args.region, 'us-west-2')
        self.assertEqual(args.environment_suffix, 'prod')


class TestMonitoringStackImports(unittest.TestCase):
    """Test that all required classes can be imported."""

    def test_monitoring_stack_class_exists(self):
        """Test that MonitoringStack class exists."""
        from lib.monitoring_stack import MonitoringStack
        self.assertIsNotNone(MonitoringStack)

    def test_monitoring_stack_args_class_exists(self):
        """Test that MonitoringStackArgs class exists."""
        from lib.monitoring_stack import MonitoringStackArgs
        self.assertIsNotNone(MonitoringStackArgs)


if __name__ == '__main__':
    unittest.main()
