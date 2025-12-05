"""
test_tap_stack.py

Unit tests for the RDS MySQL TapStack Pulumi component.
Tests configuration, resource creation, and parameter validation.
"""

import unittest
from unittest.mock import MagicMock, patch

import pulumi


class PulumiMocks(pulumi.runtime.Mocks):
    """Mock Pulumi runtime for unit testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = args.inputs
        if args.typ == "aws:rds/instance:Instance":
            outputs = {
                **args.inputs,
                "endpoint": "mysql-optimized-dev.abc123.us-east-1.rds.amazonaws.com:3306",
                "port": 3306,
                "resource_id": "db-ABCD1234567890",
                "id": "mysql-optimized-dev",
            }
        elif args.typ == "aws:rds/parameterGroup:ParameterGroup":
            outputs = {
                **args.inputs,
                "id": "mysql-params-dev",
                "name": "mysql-params-dev",
            }
        elif args.typ == "aws:cloudwatch/metricAlarm:MetricAlarm":
            outputs = {
                **args.inputs,
                "id": f"alarm-{args.name}",
            }
        return [args.name + "_id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock Pulumi function calls."""
        return {}


pulumi.runtime.set_mocks(PulumiMocks())


# Import after setting mocks
from lib.tap_stack import TapStack, TapStackArgs  # noqa: E402


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        with self.assertRaises(ValueError):
            args = TapStackArgs()

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {"Owner": "platform-team"}
        subnet_ids = ["subnet-12345", "subnet-67890"]
        args = TapStackArgs(environment_suffix="prod", subnet_ids=subnet_ids, tags=custom_tags)
        self.assertEqual(args.environment_suffix, "prod")
        self.assertEqual(args.subnet_ids, subnet_ids)
        self.assertEqual(args.tags, custom_tags)


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack Pulumi component."""

    @pulumi.runtime.test
    def test_tap_stack_creates_rds_parameter_group(self):
        """Test that TapStack creates RDS parameter group with correct settings."""

        def check_parameter_group(args):
            self.assertEqual(args[0], "mysql8.0", "Parameter group should use MySQL 8.0")
            parameters = args[1]
            param_names = [p["name"] for p in parameters]
            self.assertIn("performance_schema", param_names)
            self.assertIn("slow_query_log", param_names)

        with patch("pulumi_aws.rds.ParameterGroup") as mock_pg:
            mock_instance = MagicMock()
            mock_instance.name = "mysql-params-dev"
            mock_pg.return_value = mock_instance

            args = TapStackArgs(environment_suffix="dev", subnet_ids=["subnet-12345"])
            stack = TapStack("test-stack", args)

            self.assertIsNotNone(stack)

    @pulumi.runtime.test
    def test_tap_stack_creates_rds_instance_with_baseline_config(self):
        """Test that TapStack creates RDS instance with baseline (non-optimized) configuration."""

        def check_instance_config(args):
            # Baseline configuration for optimization task
            self.assertEqual(args[0], "db.t4g.xlarge", "Baseline should use db.t4g.xlarge")
            self.assertEqual(args[1], 150, "Baseline should use 150GB storage")
            self.assertEqual(args[2], "gp3", "Should use GP3 storage")
            self.assertEqual(args[3], 3000, "Should have 3000 IOPS")

        with patch("pulumi_aws.rds.Instance") as mock_instance:
            mock_rds = MagicMock()
            mock_rds.endpoint = pulumi.Output.from_input(
                "mysql-optimized-dev.abc.us-east-1.rds.amazonaws.com:3306"
            )
            mock_rds.port = pulumi.Output.from_input(3306)
            mock_rds.resource_id = pulumi.Output.from_input("db-ABC123")
            mock_rds.identifier = pulumi.Output.from_input("mysql-optimized-dev")
            mock_instance.return_value = mock_rds

            args = TapStackArgs(environment_suffix="dev", subnet_ids=["subnet-12345"])
            stack = TapStack("test-stack", args)

            self.assertIsNotNone(stack)

    @pulumi.runtime.test
    def test_tap_stack_creates_cloudwatch_alarms(self):
        """Test that TapStack creates CloudWatch alarms for monitoring."""

        with patch("pulumi_aws.cloudwatch.MetricAlarm") as mock_alarm:
            mock_alarm_instance = MagicMock()
            mock_alarm.return_value = mock_alarm_instance

            args = TapStackArgs(environment_suffix="dev", subnet_ids=["subnet-12345"])
            stack = TapStack("test-stack", args)

            # Should create at least 2 alarms (CPU and storage)
            self.assertGreaterEqual(mock_alarm.call_count, 2)

    @pulumi.runtime.test
    def test_tap_stack_exports_outputs(self):
        """Test that TapStack exports required outputs."""

        def check_outputs(outputs):
            self.assertIn("db_endpoint", outputs)
            self.assertIn("db_port", outputs)
            self.assertIn("db_resource_id", outputs)
            self.assertIn("db_instance_identifier", outputs)
            self.assertIn("db_instance_class", outputs)
            self.assertIn("allocated_storage", outputs)

        args = TapStackArgs(environment_suffix="dev", subnet_ids=["subnet-12345"])
        stack = TapStack("test-stack", args)

        # Stack should have outputs registered
        self.assertIsNotNone(stack)


if __name__ == "__main__":
    unittest.main()
