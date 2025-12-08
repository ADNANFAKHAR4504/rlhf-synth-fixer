"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component and RDS optimization script.
Tests TapStack instantiation and optimization logic.
"""

import unittest
from unittest.mock import MagicMock, patch

from lib.optimize import InfrastructureOptimizer
from lib.tap_stack import TapStack, TapStackArgs


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


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    @patch('lib.tap_stack.Config')
    def test_tap_stack_args_default_values(self, mock_config):
        """Test TapStackArgs with default values."""
        mock_config_instance = MagicMock()
        mock_config_instance.get.return_value = None
        mock_config.return_value = mock_config_instance

        args = TapStackArgs()
        
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.subnet_ids, [])
        self.assertIsNone(args.tags)

    @patch('lib.tap_stack.Config')
    def test_tap_stack_args_with_environment_suffix(self, mock_config):
        """Test TapStackArgs with custom environment suffix."""
        mock_config_instance = MagicMock()
        mock_config_instance.get.return_value = None
        mock_config.return_value = mock_config_instance

        args = TapStackArgs(environment_suffix='prod')
        
        self.assertEqual(args.environment_suffix, 'prod')

    @patch('lib.tap_stack.Config')
    def test_tap_stack_args_with_subnet_ids_list(self, mock_config):
        """Test TapStackArgs with subnet_ids as list."""
        mock_config_instance = MagicMock()
        mock_config_instance.get.return_value = ['subnet-1', 'subnet-2']
        mock_config.return_value = mock_config_instance

        args = TapStackArgs()
        
        self.assertEqual(args.subnet_ids, ['subnet-1', 'subnet-2'])

    @patch('lib.tap_stack.Config')
    def test_tap_stack_args_with_subnet_ids_string(self, mock_config):
        """Test TapStackArgs with subnet_ids as comma-separated string."""
        mock_config_instance = MagicMock()
        mock_config_instance.get.return_value = 'subnet-1,subnet-2'
        mock_config.return_value = mock_config_instance

        args = TapStackArgs()
        
        self.assertEqual(args.subnet_ids, ['subnet-1', 'subnet-2'])

    @patch('lib.tap_stack.Config')
    def test_tap_stack_args_with_tags(self, mock_config):
        """Test TapStackArgs with custom tags."""
        mock_config_instance = MagicMock()
        mock_config_instance.get.return_value = None
        mock_config.return_value = mock_config_instance

        tags = {'Environment': 'test'}
        args = TapStackArgs(tags=tags)
        
        self.assertEqual(args.tags, tags)


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack Pulumi component."""

    @patch('lib.tap_stack.aws.rds.SubnetGroup')
    @patch('lib.tap_stack.aws.rds.ParameterGroup')
    @patch('lib.tap_stack.aws.rds.Instance')
    @patch('lib.tap_stack.aws.cloudwatch.MetricAlarm')
    @patch('lib.tap_stack.Config')
    @patch('lib.tap_stack.pulumi.ComponentResource.__init__')
    def test_tap_stack_initialization_with_subnet_ids(self, mock_component_init, mock_config, mock_metric_alarm, mock_instance, mock_param_group, mock_subnet_group):
        """Test TapStack initialization with subnet_ids."""
        mock_component_init.return_value = None
        
        mock_config_instance = MagicMock()
        mock_config_instance.get_bool.return_value = False
        mock_config_instance.get_secret.return_value = 'test-password'
        mock_config.return_value = mock_config_instance

        # Mock the AWS resources
        mock_subnet_group_instance = MagicMock()
        mock_subnet_group.return_value = mock_subnet_group_instance
        mock_subnet_group_instance.name = 'subnet-group-name'

        mock_param_group_instance = MagicMock()
        mock_param_group.return_value = mock_param_group_instance
        mock_param_group_instance.name = 'param-group-name'

        mock_instance_instance = MagicMock()
        mock_instance.return_value = mock_instance_instance
        mock_instance_instance.endpoint = 'test-endpoint'
        mock_instance_instance.port = 3306
        mock_instance_instance.resource_id = 'test-resource-id'
        mock_instance_instance.identifier = 'test-identifier'

        mock_metric_alarm.return_value = MagicMock()

        args = TapStackArgs()
        args.subnet_ids = ['subnet-1']

        stack = TapStack('test-stack', args)

        # Verify ComponentResource init was called
        mock_component_init.assert_called_once_with("tap:stack:TapStack", 'test-stack', None, None)

        # Verify resources were created
        mock_subnet_group.assert_called_once()
        mock_param_group.assert_called_once()
        mock_instance.assert_called_once()
        self.assertEqual(mock_metric_alarm.call_count, 2)  # CPU and storage alarms

        # Verify outputs
        self.assertEqual(stack.db_endpoint, 'test-endpoint')
        self.assertEqual(stack.db_port, 3306)
        self.assertEqual(stack.db_resource_id, 'test-resource-id')
        self.assertEqual(stack.db_instance_identifier, 'test-identifier')

    @patch('lib.tap_stack.pulumi.ComponentResource.__init__')
    def test_tap_stack_initialization_without_subnet_ids(self, mock_component_init):
        """Test TapStack initialization without subnet_ids returns early."""
        mock_component_init.return_value = None

        args = TapStackArgs()
        args.subnet_ids = []

        stack = TapStack('test-stack', args)

        # Should not create any resources
        mock_component_init.assert_called_once_with("tap:stack:TapStack", 'test-stack', None, None)

    @patch('lib.tap_stack.aws.rds.SubnetGroup')
    @patch('lib.tap_stack.aws.rds.ParameterGroup')
    @patch('lib.tap_stack.aws.rds.Instance')
    @patch('lib.tap_stack.aws.cloudwatch.MetricAlarm')
    @patch('lib.tap_stack.Config')
    @patch('lib.tap_stack.pulumi.ComponentResource.__init__')
    def test_tap_stack_initialization_production_mode(self, mock_component_init, mock_config, mock_metric_alarm, mock_instance, mock_param_group, mock_subnet_group):
        """Test TapStack initialization in production mode."""
        mock_component_init.return_value = None
        
        mock_config_instance = MagicMock()
        mock_config_instance.get_bool.return_value = True  # is_production = True
        mock_config_instance.get_secret.return_value = 'prod-password'
        mock_config.return_value = mock_config_instance

        # Mock the AWS resources
        mock_subnet_group_instance = MagicMock()
        mock_subnet_group.return_value = mock_subnet_group_instance
        mock_subnet_group_instance.name = 'subnet-group-name'

        mock_param_group_instance = MagicMock()
        mock_param_group.return_value = mock_param_group_instance
        mock_param_group_instance.name = 'param-group-name'

        mock_instance_instance = MagicMock()
        mock_instance.return_value = mock_instance_instance
        mock_instance_instance.endpoint = 'prod-endpoint'
        mock_instance_instance.port = 3306
        mock_instance_instance.resource_id = 'prod-resource-id'
        mock_instance_instance.identifier = 'prod-identifier'

        mock_metric_alarm.return_value = MagicMock()

        args = TapStackArgs()
        args.subnet_ids = ['subnet-1']

        stack = TapStack('prod-stack', args)

        # Verify ComponentResource init was called
        mock_component_init.assert_called_once_with("tap:stack:TapStack", 'prod-stack', None, None)

        # Verify RDS instance was created with production settings
        mock_instance.assert_called_once()
        call_args = mock_instance.call_args[1]
        self.assertTrue(call_args['multi_az'])  # Should be True in production
        self.assertTrue(call_args['deletion_protection'])  # Should be True in production


if __name__ == "__main__":
    unittest.main()

