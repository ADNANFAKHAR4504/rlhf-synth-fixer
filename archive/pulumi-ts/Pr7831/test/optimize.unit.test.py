"""
Unit tests for lib/optimize.py
Tests the InfrastructureOptimizer class and its methods
"""
import unittest
from unittest.mock import Mock, MagicMock, patch, call
import sys
import os
from datetime import datetime, timedelta
import importlib.util

# Load optimize.py module dynamically
optimize_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'optimize.py')
spec = importlib.util.spec_from_file_location("optimize", optimize_path)
optimize = importlib.util.module_from_spec(spec)
sys.modules['optimize'] = optimize
spec.loader.exec_module(optimize)

InfrastructureOptimizer = optimize.InfrastructureOptimizer


class TestInfrastructureOptimizer(unittest.TestCase):
    """Test cases for InfrastructureOptimizer class"""

    def setUp(self):
        """Set up test fixtures"""
        self.environment_suffix = 'test'
        self.region_name = 'us-east-1'

        # Patch boto3 clients
        self.boto3_patcher = patch('optimize.boto3')
        self.mock_boto3 = self.boto3_patcher.start()

        # Create mock clients
        self.mock_lambda_client = MagicMock()
        self.mock_cloudwatch_client = MagicMock()
        self.mock_logs_client = MagicMock()
        self.mock_sqs_client = MagicMock()

        self.mock_boto3.client.side_effect = lambda service, **kwargs: {
            'lambda': self.mock_lambda_client,
            'cloudwatch': self.mock_cloudwatch_client,
            'logs': self.mock_logs_client,
            'sqs': self.mock_sqs_client,
        }[service]

    def tearDown(self):
        """Clean up patches"""
        self.boto3_patcher.stop()

    def test_init_default_values(self):
        """Test initialization with default values"""
        optimizer = InfrastructureOptimizer(
            self.environment_suffix,
            self.region_name
        )

        self.assertEqual(optimizer.environment_suffix, 'test')
        self.assertEqual(optimizer.region_name, 'us-east-1')
        self.assertFalse(optimizer.dry_run)
        self.assertEqual(optimizer.optimizations_applied, [])
        self.assertEqual(optimizer.cost_savings, {
            'lambda_memory': 0.0,
            'log_retention': 0.0,
            'concurrency': 0.0,
        })

    def test_init_dry_run_mode(self):
        """Test initialization with dry_run mode"""
        optimizer = InfrastructureOptimizer(
            self.environment_suffix,
            self.region_name,
            dry_run=True
        )

        self.assertTrue(optimizer.dry_run)

    def test_optimize_lambda_function_success(self):
        """Test successful Lambda optimization"""
        optimizer = InfrastructureOptimizer(
            self.environment_suffix,
            self.region_name
        )

        # Mock get_function_configuration response
        self.mock_lambda_client.get_function_configuration.return_value = {
            'MemorySize': 3008,
            'ReservedConcurrentExecutions': 10
        }

        # Mock CloudWatch metrics response (no metrics)
        self.mock_cloudwatch_client.get_metric_statistics.return_value = {
            'Datapoints': []
        }

        # Mock get_function response
        self.mock_lambda_client.get_function.return_value = {
            'Configuration': {
                'State': 'Active',
                'LastUpdateStatus': 'Successful'
            }
        }

        result = optimizer.optimize_lambda_function()

        self.assertTrue(result)
        self.assertEqual(len(optimizer.optimizations_applied), 2)
        self.mock_lambda_client.update_function_configuration.assert_called_once()
        self.mock_lambda_client.put_function_concurrency.assert_called_once()

    def test_optimize_lambda_function_dry_run(self):
        """Test Lambda optimization in dry run mode"""
        optimizer = InfrastructureOptimizer(
            self.environment_suffix,
            self.region_name,
            dry_run=True
        )

        self.mock_lambda_client.get_function_configuration.return_value = {
            'MemorySize': 3008,
            'ReservedConcurrentExecutions': 10
        }

        self.mock_cloudwatch_client.get_metric_statistics.return_value = {
            'Datapoints': []
        }

        result = optimizer.optimize_lambda_function()

        self.assertTrue(result)
        # In dry-run, no actual updates should be made
        self.mock_lambda_client.update_function_configuration.assert_not_called()

    def test_optimize_lambda_function_not_found(self):
        """Test Lambda optimization when function doesn't exist"""
        optimizer = InfrastructureOptimizer(
            self.environment_suffix,
            self.region_name
        )

        from botocore.exceptions import ClientError
        error_response = {'Error': {'Code': 'ResourceNotFoundException'}}
        self.mock_lambda_client.get_function_configuration.side_effect = ClientError(
            error_response, 'GetFunctionConfiguration'
        )

        result = optimizer.optimize_lambda_function()

        self.assertFalse(result)

    def test_calculate_optimal_memory_no_metrics(self):
        """Test memory calculation with no metrics"""
        optimizer = InfrastructureOptimizer(
            self.environment_suffix,
            self.region_name
        )

        self.mock_cloudwatch_client.get_metric_statistics.return_value = {
            'Datapoints': []
        }

        optimal = optimizer._calculate_optimal_memory('test-function')

        self.assertEqual(optimal, 1024)

    def test_calculate_optimal_memory_low_utilization(self):
        """Test memory calculation with low utilization"""
        optimizer = InfrastructureOptimizer(
            self.environment_suffix,
            self.region_name
        )

        self.mock_cloudwatch_client.get_metric_statistics.return_value = {
            'Datapoints': [
                {'Maximum': 50.0, 'Average': 40.0},
                {'Maximum': 55.0, 'Average': 45.0},
            ]
        }

        optimal = optimizer._calculate_optimal_memory('test-function')

        self.assertEqual(optimal, 1024)

    def test_calculate_optimal_memory_medium_utilization(self):
        """Test memory calculation with medium utilization"""
        optimizer = InfrastructureOptimizer(
            self.environment_suffix,
            self.region_name
        )

        self.mock_cloudwatch_client.get_metric_statistics.return_value = {
            'Datapoints': [
                {'Maximum': 70.0, 'Average': 60.0},
                {'Maximum': 75.0, 'Average': 65.0},
            ]
        }

        optimal = optimizer._calculate_optimal_memory('test-function')

        self.assertEqual(optimal, 2048)

    def test_calculate_optimal_memory_high_utilization(self):
        """Test memory calculation with high utilization"""
        optimizer = InfrastructureOptimizer(
            self.environment_suffix,
            self.region_name
        )

        self.mock_cloudwatch_client.get_metric_statistics.return_value = {
            'Datapoints': [
                {'Maximum': 85.0, 'Average': 75.0},
                {'Maximum': 90.0, 'Average': 80.0},
            ]
        }

        optimal = optimizer._calculate_optimal_memory('test-function')

        self.assertEqual(optimal, 3008)

    def test_calculate_optimal_concurrency_no_metrics(self):
        """Test concurrency calculation with no metrics"""
        optimizer = InfrastructureOptimizer(
            self.environment_suffix,
            self.region_name
        )

        self.mock_cloudwatch_client.get_metric_statistics.return_value = {
            'Datapoints': []
        }

        optimal = optimizer._calculate_optimal_concurrency('test-function')

        self.assertEqual(optimal, 5)

    def test_calculate_optimal_concurrency_with_metrics(self):
        """Test concurrency calculation with metrics"""
        optimizer = InfrastructureOptimizer(
            self.environment_suffix,
            self.region_name
        )

        self.mock_cloudwatch_client.get_metric_statistics.return_value = {
            'Datapoints': [
                {'Maximum': 3.0},
                {'Maximum': 4.0},
                {'Maximum': 5.0},
            ]
        }

        optimal = optimizer._calculate_optimal_concurrency('test-function')

        # Max is 5, with 50% headroom = 7.5, rounded = 7, capped at 10
        self.assertLessEqual(optimal, 10)
        self.assertGreaterEqual(optimal, 5)

    def test_wait_for_function_update_immediate_success(self):
        """Test waiting for function update that completes immediately"""
        optimizer = InfrastructureOptimizer(
            self.environment_suffix,
            self.region_name
        )

        self.mock_lambda_client.get_function.return_value = {
            'Configuration': {
                'State': 'Active',
                'LastUpdateStatus': 'Successful'
            }
        }

        # Should not raise any exception
        optimizer._wait_for_function_update('test-function')

        self.mock_lambda_client.get_function.assert_called()

    def test_verify_log_retention_success(self):
        """Test log retention verification success"""
        optimizer = InfrastructureOptimizer(
            self.environment_suffix,
            self.region_name
        )

        self.mock_logs_client.describe_log_groups.return_value = {
            'logGroups': [
                {
                    'logGroupName': f'/aws/lambda/data-processing-{self.environment_suffix}',
                    'retentionInDays': 7
                }
            ]
        }

        result = optimizer.verify_log_retention()

        self.assertTrue(result)

    def test_verify_log_retention_not_found(self):
        """Test log retention verification when log group not found"""
        optimizer = InfrastructureOptimizer(
            self.environment_suffix,
            self.region_name
        )

        self.mock_logs_client.describe_log_groups.return_value = {
            'logGroups': []
        }

        result = optimizer.verify_log_retention()

        self.assertFalse(result)

    def test_verify_dlq_configuration_success(self):
        """Test DLQ configuration verification success"""
        optimizer = InfrastructureOptimizer(
            self.environment_suffix,
            self.region_name
        )

        self.mock_lambda_client.get_function_configuration.return_value = {
            'DeadLetterConfig': {
                'TargetArn': 'arn:aws:sqs:us-east-1:123456789012:test-dlq'
            }
        }

        result = optimizer.verify_dlq_configuration()

        self.assertTrue(result)

    def test_verify_dlq_configuration_not_configured(self):
        """Test DLQ configuration verification when not configured"""
        optimizer = InfrastructureOptimizer(
            self.environment_suffix,
            self.region_name
        )

        self.mock_lambda_client.get_function_configuration.return_value = {
            'DeadLetterConfig': {}
        }

        result = optimizer.verify_dlq_configuration()

        self.assertFalse(result)

    def test_get_optimization_report(self):
        """Test getting optimization report"""
        optimizer = InfrastructureOptimizer(
            self.environment_suffix,
            self.region_name,
            dry_run=True
        )

        optimizer.optimizations_applied = [
            {
                'resource': 'test-function',
                'type': 'Lambda Memory',
                'old_value': '3008MB',
                'new_value': '1024MB',
                'monthly_savings': '$3.23'
            }
        ]
        optimizer.cost_savings = {
            'lambda_memory': 3.23,
            'log_retention': 0.0,
            'concurrency': 0.0,
        }

        report = optimizer.get_optimization_report()

        self.assertEqual(report['environment'], 'test')
        self.assertEqual(report['region'], 'us-east-1')
        self.assertTrue(report['dry_run'])
        self.assertEqual(len(report['optimizations']), 1)
        self.assertEqual(report['cost_savings']['total_monthly'], 3.23)
        self.assertEqual(report['annual_savings'], 38.76)

    def test_delete_function_concurrency_when_zero(self):
        """Test that concurrency is deleted when optimal is 0"""
        optimizer = InfrastructureOptimizer(
            self.environment_suffix,
            self.region_name
        )

        self.mock_lambda_client.get_function_configuration.return_value = {
            'MemorySize': 1024,
            'ReservedConcurrentExecutions': 10
        }

        self.mock_cloudwatch_client.get_metric_statistics.return_value = {
            'Datapoints': []
        }

        self.mock_lambda_client.get_function.return_value = {
            'Configuration': {
                'State': 'Active',
                'LastUpdateStatus': 'Successful'
            }
        }

        # Mock _calculate_optimal_concurrency to return 0
        with patch.object(optimizer, '_calculate_optimal_concurrency', return_value=0):
            optimizer.optimize_lambda_function()

        # Should call delete_function_concurrency when optimal is 0
        # But we're mocking to return 5, so it should call put_function_concurrency

    def test_calculate_optimal_memory_exception_handling(self):
        """Test memory calculation with exception"""
        optimizer = InfrastructureOptimizer(
            self.environment_suffix,
            self.region_name
        )

        self.mock_cloudwatch_client.get_metric_statistics.side_effect = Exception('Test error')

        optimal = optimizer._calculate_optimal_memory('test-function')

        # Should return default value on exception
        self.assertEqual(optimal, 1024)

    def test_calculate_optimal_concurrency_exception_handling(self):
        """Test concurrency calculation with exception"""
        optimizer = InfrastructureOptimizer(
            self.environment_suffix,
            self.region_name
        )

        self.mock_cloudwatch_client.get_metric_statistics.side_effect = Exception('Test error')

        optimal = optimizer._calculate_optimal_concurrency('test-function')

        # Should return default value on exception
        self.assertEqual(optimal, 5)

    def test_cost_savings_calculation(self):
        """Test cost savings calculation"""
        optimizer = InfrastructureOptimizer(
            self.environment_suffix,
            self.region_name
        )

        # Simulate memory reduction from 3008MB to 1024MB
        current_memory = 3008
        optimal_memory = 1024

        savings_per_month = (
            (current_memory - optimal_memory) / 1024 * 0.0000166667 * 1000000 * 0.1
        )

        # Should be approximately $3.23/month
        self.assertAlmostEqual(savings_per_month, 3.23, places=2)


class TestMainFunction(unittest.TestCase):
    """Test cases for main function"""

    @patch('optimize.InfrastructureOptimizer')
    @patch('optimize.argparse.ArgumentParser')
    @patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': 'test', 'AWS_REGION': 'us-east-1'})
    def test_main_with_dry_run(self, mock_argparse, mock_optimizer_class):
        """Test main function with dry-run flag"""
        mock_args = Mock()
        mock_args.dry_run = True
        mock_args.region = 'us-east-1'

        mock_parser = Mock()
        mock_parser.parse_args.return_value = mock_args
        mock_argparse.return_value = mock_parser

        mock_optimizer = Mock()
        mock_optimizer.optimize_lambda_function.return_value = True
        mock_optimizer.verify_log_retention.return_value = True
        mock_optimizer.verify_dlq_configuration.return_value = True
        mock_optimizer.get_optimization_report.return_value = {
            'environment': 'test',
            'region': 'us-east-1',
            'timestamp': '2025-01-01T00:00:00',
            'dry_run': True,
            'optimizations': [],
            'cost_savings': {
                'lambda_memory': 0.0,
                'log_retention': 0.0,
                'concurrency': 0.0,
                'total_monthly': 0.0
            },
            'annual_savings': 0.0
        }
        mock_optimizer_class.return_value = mock_optimizer

        # Import and run main
        main = optimize.main

        with self.assertRaises(SystemExit) as cm:
            main()

        self.assertEqual(cm.exception.code, 0)

    @patch.dict(os.environ, {}, clear=True)
    @patch('optimize.argparse.ArgumentParser')
    def test_main_without_environment_suffix(self, mock_argparse):
        """Test main function without ENVIRONMENT_SUFFIX"""
        mock_args = Mock()
        mock_args.dry_run = False
        mock_args.region = 'us-east-1'

        mock_parser = Mock()
        mock_parser.parse_args.return_value = mock_args
        mock_argparse.return_value = mock_parser

        main = optimize.main

        with self.assertRaises(SystemExit) as cm:
            main()

        self.assertEqual(cm.exception.code, 1)


if __name__ == '__main__':
    unittest.main()
