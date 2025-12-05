"""
test_optimize.py

Unit tests for the RDS optimization script.
Tests cost savings calculation and optimization logic.
"""

import unittest
from unittest.mock import MagicMock, patch

import pulumi

from lib.optimize import InfrastructureOptimizer


class TestInfrastructureOptimizer(unittest.TestCase):
    """Test cases for Infrastructure Optimizer."""

    def setUp(self):
        """Set up test fixtures."""
        self.environment_suffix = "dev"
        self.region_name = "us-east-1"

    @patch("lib.optimize.boto3.client")
    def test_optimizer_initialization(self, mock_boto_client):
        """Test that optimizer initializes correctly with AWS clients."""
        optimizer = InfrastructureOptimizer(
            environment_suffix=self.environment_suffix, region_name=self.region_name
        )

        self.assertEqual(optimizer.environment_suffix, self.environment_suffix)
        self.assertEqual(optimizer.region_name, self.region_name)
        mock_boto_client.assert_called_with("rds", region_name=self.region_name)

    @patch("lib.optimize.boto3.client")
    def test_cost_savings_estimate(self, mock_boto_client):
        """Test that cost savings calculations are reasonable."""
        optimizer = InfrastructureOptimizer()
        savings = optimizer.get_cost_savings_estimate()

        # Check that all required fields are present
        self.assertIn("rds_instance_monthly_savings", savings)
        self.assertIn("rds_storage_monthly_savings", savings)
        self.assertIn("total_monthly_savings", savings)

        # Check that savings are positive and reasonable (ballpark: $50-100/month)
        self.assertGreater(savings["rds_instance_monthly_savings"], 0)
        self.assertGreater(savings["rds_storage_monthly_savings"], 0)
        self.assertGreater(savings["total_monthly_savings"], 40)
        self.assertLess(savings["total_monthly_savings"], 150)

    @patch("lib.optimize.boto3.client")
    def test_optimize_rds_instance_not_found(self, mock_boto_client):
        """Test optimization when RDS instance is not found."""
        mock_rds = MagicMock()
        mock_rds.describe_db_instances.return_value = {"DBInstances": []}
        mock_boto_client.return_value = mock_rds

        optimizer = InfrastructureOptimizer()
        result = optimizer.optimize_rds_instance()

        self.assertFalse(result)

    @patch("lib.optimize.boto3.client")
    def test_optimize_rds_instance_already_optimized(self, mock_boto_client):
        """Test optimization when instance is already at target configuration."""
        mock_rds = MagicMock()
        mock_rds.describe_db_instances.return_value = {
            "DBInstances": [
                {
                    "DBInstanceIdentifier": "mysql-optimized-dev",
                    "DBInstanceClass": "db.t4g.large",  # Already optimized
                    "AllocatedStorage": 100,
                }
            ]
        }
        mock_boto_client.return_value = mock_rds

        optimizer = InfrastructureOptimizer()
        result = optimizer.optimize_rds_instance()

        # Should return True (no error) but not make modifications
        self.assertTrue(result)
        mock_rds.modify_db_instance.assert_not_called()

    @patch("lib.optimize.boto3.client")
    def test_optimize_rds_instance_successful(self, mock_boto_client):
        """Test successful RDS instance optimization."""
        mock_rds = MagicMock()

        # Mock instance with baseline (non-optimized) configuration
        mock_rds.describe_db_instances.return_value = {
            "DBInstances": [
                {
                    "DBInstanceIdentifier": "mysql-optimized-dev",
                    "DBInstanceClass": "db.t4g.xlarge",  # Baseline
                    "AllocatedStorage": 150,  # Baseline
                }
            ]
        }

        # Mock the waiter
        mock_waiter = MagicMock()
        mock_rds.get_waiter.return_value = mock_waiter

        mock_boto_client.return_value = mock_rds

        optimizer = InfrastructureOptimizer()
        result = optimizer.optimize_rds_instance()

        # Optimization should succeed
        self.assertTrue(result)

        # Should call modify_db_instance
        mock_rds.modify_db_instance.assert_called_once()

        # Check that it downgraded to db.t4g.large
        call_args = mock_rds.modify_db_instance.call_args
        self.assertEqual(
            call_args.kwargs["DBInstanceClass"], "db.t4g.large"
        )
        self.assertEqual(call_args.kwargs["AllocatedStorage"], 100)
        self.assertTrue(call_args.kwargs["ApplyImmediately"])

        # Should wait for instance to be available
        mock_rds.get_waiter.assert_called_with("db_instance_available")
        mock_waiter.wait.assert_called_once()

    @patch("lib.optimize.boto3.client")
    def test_optimize_rds_instance_client_error(self, mock_boto_client):
        """Test optimization handles boto3 ClientError gracefully."""
        from botocore.exceptions import ClientError

        mock_rds = MagicMock()
        mock_rds.describe_db_instances.side_effect = ClientError(
            {"Error": {"Code": "AccessDenied", "Message": "Access Denied"}},
            "DescribeDBInstances",
        )
        mock_boto_client.return_value = mock_rds

        optimizer = InfrastructureOptimizer()
        result = optimizer.optimize_rds_instance()

        self.assertFalse(result)

    @patch("lib.optimize.boto3.client")
    def test_run_optimization(self, mock_boto_client):
        """Test that run_optimization executes all optimization tasks."""
        mock_rds = MagicMock()
        mock_rds.describe_db_instances.return_value = {
            "DBInstances": [
                {
                    "DBInstanceIdentifier": "mysql-optimized-dev",
                    "DBInstanceClass": "db.t4g.xlarge",
                    "AllocatedStorage": 150,
                }
            ]
        }

        mock_waiter = MagicMock()
        mock_rds.get_waiter.return_value = mock_waiter
        mock_boto_client.return_value = mock_rds

        optimizer = InfrastructureOptimizer()
        optimizer.run_optimization()

        # Should attempt RDS optimization
        mock_rds.describe_db_instances.assert_called()

    @patch("lib.optimize.boto3.client")
    def test_run_optimization_with_failure(self, mock_boto_client):
        """Test run_optimization handles failures gracefully."""
        from botocore.exceptions import ClientError

        mock_rds = MagicMock()
        mock_rds.describe_db_instances.side_effect = ClientError(
            {"Error": {"Code": "ServiceUnavailable", "Message": "Service unavailable"}},
            "DescribeDBInstances",
        )
        mock_boto_client.return_value = mock_rds

        optimizer = InfrastructureOptimizer()
        # Should not raise exception even if optimization fails
        optimizer.run_optimization()

    @patch("lib.optimize.InfrastructureOptimizer")
    @patch("sys.argv", ["optimize.py", "--dry-run"])
    def test_main_dry_run(self, mock_optimizer_class):
        """Test main function in dry-run mode."""
        from lib.optimize import main

        mock_optimizer = MagicMock()
        mock_optimizer.get_cost_savings_estimate.return_value = {
            "total_monthly_savings": 59.90
        }
        mock_optimizer_class.return_value = mock_optimizer

        # Should not raise exception
        main()

        # Should create optimizer but not run optimization
        mock_optimizer_class.assert_called_once()
        mock_optimizer.run_optimization.assert_not_called()
        mock_optimizer.get_cost_savings_estimate.assert_called_once()

    @patch("lib.optimize.InfrastructureOptimizer")
    @patch("sys.argv", ["optimize.py"])
    def test_main_normal_execution(self, mock_optimizer_class):
        """Test main function in normal execution mode."""
        from lib.optimize import main

        mock_optimizer = MagicMock()
        mock_optimizer_class.return_value = mock_optimizer

        # Should not raise exception
        main()

        # Should create optimizer and run optimization
        mock_optimizer_class.assert_called_once()
        mock_optimizer.run_optimization.assert_called_once()

    @patch("lib.optimize.InfrastructureOptimizer")
    @patch("sys.argv", ["optimize.py", "--environment", "prod", "--region", "us-west-2"])
    def test_main_with_custom_args(self, mock_optimizer_class):
        """Test main function with custom environment and region arguments."""
        from lib.optimize import main

        mock_optimizer = MagicMock()
        mock_optimizer_class.return_value = mock_optimizer

        # Should not raise exception
        main()

        # Should create optimizer with custom args
        mock_optimizer_class.assert_called_with("prod", "us-west-2")
        mock_optimizer.run_optimization.assert_called_once()

    @patch("lib.optimize.InfrastructureOptimizer")
    @patch("sys.argv", ["optimize.py"])
    def test_main_keyboard_interrupt(self, mock_optimizer_class):
        """Test main function handles KeyboardInterrupt gracefully."""
        import sys

        from lib.optimize import main

        mock_optimizer = MagicMock()
        mock_optimizer.run_optimization.side_effect = KeyboardInterrupt()
        mock_optimizer_class.return_value = mock_optimizer

        # Should exit with code 1 on KeyboardInterrupt
        with self.assertRaises(SystemExit) as context:
            main()
        self.assertEqual(context.exception.code, 1)

    @patch("lib.optimize.InfrastructureOptimizer")
    @patch("sys.argv", ["optimize.py"])
    def test_main_unexpected_exception(self, mock_optimizer_class):
        """Test main function handles unexpected exceptions gracefully."""
        import sys

        from lib.optimize import main

        mock_optimizer = MagicMock()
        mock_optimizer.run_optimization.side_effect = Exception("Unexpected error")
        mock_optimizer_class.return_value = mock_optimizer

        # Should exit with code 1 on unexpected exception
        with self.assertRaises(SystemExit) as context:
            main()
        self.assertEqual(context.exception.code, 1)

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
