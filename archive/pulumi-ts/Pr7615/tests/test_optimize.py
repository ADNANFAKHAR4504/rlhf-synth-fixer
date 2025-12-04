#!/usr/bin/env python3
"""
Unit tests for lib/optimize.py Lambda optimization script.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, Mock, patch, call
from io import StringIO

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))

from optimize import LambdaOptimizer, main


class TestLambdaOptimizer(unittest.TestCase):
    """Test suite for LambdaOptimizer class."""

    def setUp(self):
        """Set up test fixtures."""
        self.environment_suffix = 'test-env'
        self.region = 'us-east-1'

    @patch('optimize.boto3.client')
    def test_init(self, mock_boto3_client):
        """Test LambdaOptimizer initialization."""
        optimizer = LambdaOptimizer(self.environment_suffix, self.region)

        self.assertEqual(optimizer.environment_suffix, self.environment_suffix)
        self.assertEqual(optimizer.region_name, self.region)
        self.assertEqual(mock_boto3_client.call_count, 2)

    @patch('optimize.boto3.client')
    def test_get_lambda_function_name_success(self, mock_boto3_client):
        """Test successful Lambda function name retrieval."""
        mock_lambda_client = MagicMock()
        mock_boto3_client.return_value = mock_lambda_client

        optimizer = LambdaOptimizer(self.environment_suffix, self.region)
        function_name = optimizer.get_lambda_function_name()

        self.assertEqual(function_name, f'optimized-function-{self.environment_suffix}')
        mock_lambda_client.get_function.assert_called_once()

    @patch('optimize.boto3.client')
    def test_get_lambda_function_name_not_found(self, mock_boto3_client):
        """Test Lambda function not found."""
        mock_lambda_client = MagicMock()
        mock_lambda_client.get_function.side_effect = Exception('ResourceNotFoundException')
        mock_boto3_client.return_value = mock_lambda_client

        optimizer = LambdaOptimizer(self.environment_suffix, self.region)

        with patch('sys.stdout', new=StringIO()):
            function_name = optimizer.get_lambda_function_name()

        self.assertIsNone(function_name)

    @patch('optimize.boto3.client')
    def test_verify_memory_allocation_optimal(self, mock_boto3_client):
        """Test memory allocation verification when optimal."""
        mock_lambda_client = MagicMock()
        mock_lambda_client.get_function_configuration.return_value = {
            'MemorySize': 512
        }
        mock_boto3_client.return_value = mock_lambda_client

        optimizer = LambdaOptimizer(self.environment_suffix, self.region)

        with patch('sys.stdout', new=StringIO()):
            result = optimizer.verify_memory_allocation('test-function')

        self.assertTrue(result)

    @patch('optimize.boto3.client')
    def test_verify_memory_allocation_not_optimal(self, mock_boto3_client):
        """Test memory allocation verification when not optimal."""
        mock_lambda_client = MagicMock()
        mock_lambda_client.get_function_configuration.return_value = {
            'MemorySize': 3072
        }
        mock_boto3_client.return_value = mock_lambda_client

        optimizer = LambdaOptimizer(self.environment_suffix, self.region)

        with patch('sys.stdout', new=StringIO()):
            result = optimizer.verify_memory_allocation('test-function')

        self.assertFalse(result)

    @patch('optimize.boto3.client')
    def test_verify_timeout_optimal(self, mock_boto3_client):
        """Test timeout verification when optimal."""
        mock_lambda_client = MagicMock()
        mock_lambda_client.get_function_configuration.return_value = {
            'Timeout': 30
        }
        mock_boto3_client.return_value = mock_lambda_client

        optimizer = LambdaOptimizer(self.environment_suffix, self.region)

        with patch('sys.stdout', new=StringIO()):
            result = optimizer.verify_timeout('test-function')

        self.assertTrue(result)

    @patch('optimize.boto3.client')
    def test_verify_timeout_not_optimal(self, mock_boto3_client):
        """Test timeout verification when not optimal."""
        mock_lambda_client = MagicMock()
        mock_lambda_client.get_function_configuration.return_value = {
            'Timeout': 300
        }
        mock_boto3_client.return_value = mock_lambda_client

        optimizer = LambdaOptimizer(self.environment_suffix, self.region)

        with patch('sys.stdout', new=StringIO()):
            result = optimizer.verify_timeout('test-function')

        self.assertFalse(result)

    @patch('optimize.boto3.client')
    def test_verify_reserved_concurrency_optimal(self, mock_boto3_client):
        """Test reserved concurrency verification when optimal."""
        mock_lambda_client = MagicMock()
        mock_lambda_client.get_function_configuration.return_value = {
            'ReservedConcurrentExecutions': 10
        }
        mock_boto3_client.return_value = mock_lambda_client

        optimizer = LambdaOptimizer(self.environment_suffix, self.region)

        with patch('sys.stdout', new=StringIO()):
            result = optimizer.verify_reserved_concurrency('test-function')

        self.assertTrue(result)

    @patch('optimize.boto3.client')
    def test_verify_reserved_concurrency_not_set(self, mock_boto3_client):
        """Test reserved concurrency verification when not set."""
        mock_lambda_client = MagicMock()
        mock_lambda_client.get_function_configuration.return_value = {}
        mock_boto3_client.return_value = mock_lambda_client

        optimizer = LambdaOptimizer(self.environment_suffix, self.region)

        with patch('sys.stdout', new=StringIO()):
            result = optimizer.verify_reserved_concurrency('test-function')

        self.assertFalse(result)

    @patch('optimize.boto3.client')
    def test_verify_xray_tracing_active(self, mock_boto3_client):
        """Test X-Ray tracing verification when active."""
        mock_lambda_client = MagicMock()
        mock_lambda_client.get_function_configuration.return_value = {
            'TracingConfig': {'Mode': 'Active'}
        }
        mock_boto3_client.return_value = mock_lambda_client

        optimizer = LambdaOptimizer(self.environment_suffix, self.region)

        with patch('sys.stdout', new=StringIO()):
            result = optimizer.verify_xray_tracing('test-function')

        self.assertTrue(result)

    @patch('optimize.boto3.client')
    def test_verify_xray_tracing_passthrough(self, mock_boto3_client):
        """Test X-Ray tracing verification when PassThrough."""
        mock_lambda_client = MagicMock()
        mock_lambda_client.get_function_configuration.return_value = {
            'TracingConfig': {'Mode': 'PassThrough'}
        }
        mock_boto3_client.return_value = mock_lambda_client

        optimizer = LambdaOptimizer(self.environment_suffix, self.region)

        with patch('sys.stdout', new=StringIO()):
            result = optimizer.verify_xray_tracing('test-function')

        self.assertFalse(result)

    @patch('optimize.boto3.client')
    def test_verify_log_retention_optimal(self, mock_boto3_client):
        """Test log retention verification when optimal."""
        mock_lambda_client = MagicMock()
        mock_logs_client = MagicMock()
        mock_logs_client.describe_log_groups.return_value = {
            'logGroups': [{'retentionInDays': 7}]
        }

        def client_side_effect(service, **kwargs):
            if service == 'lambda':
                return mock_lambda_client
            return mock_logs_client

        mock_boto3_client.side_effect = client_side_effect

        optimizer = LambdaOptimizer(self.environment_suffix, self.region)

        with patch('sys.stdout', new=StringIO()):
            result = optimizer.verify_log_retention('test-function')

        self.assertTrue(result)

    @patch('optimize.boto3.client')
    def test_verify_log_retention_not_set(self, mock_boto3_client):
        """Test log retention verification when not set."""
        mock_lambda_client = MagicMock()
        mock_logs_client = MagicMock()
        mock_logs_client.describe_log_groups.return_value = {
            'logGroups': [{}]  # No retentionInDays
        }

        def client_side_effect(service, **kwargs):
            if service == 'lambda':
                return mock_lambda_client
            return mock_logs_client

        mock_boto3_client.side_effect = client_side_effect

        optimizer = LambdaOptimizer(self.environment_suffix, self.region)

        with patch('sys.stdout', new=StringIO()):
            result = optimizer.verify_log_retention('test-function')

        self.assertFalse(result)

    @patch('optimize.boto3.client')
    def test_verify_dead_letter_queue_configured(self, mock_boto3_client):
        """Test DLQ verification when configured."""
        mock_lambda_client = MagicMock()
        mock_lambda_client.get_function_configuration.return_value = {
            'DeadLetterConfig': {'TargetArn': 'arn:aws:sqs:us-east-1:123456789012:dlq'}
        }
        mock_boto3_client.return_value = mock_lambda_client

        optimizer = LambdaOptimizer(self.environment_suffix, self.region)

        with patch('sys.stdout', new=StringIO()):
            result = optimizer.verify_dead_letter_queue('test-function')

        self.assertTrue(result)

    @patch('optimize.boto3.client')
    def test_verify_dead_letter_queue_not_configured(self, mock_boto3_client):
        """Test DLQ verification when not configured."""
        mock_lambda_client = MagicMock()
        mock_lambda_client.get_function_configuration.return_value = {}
        mock_boto3_client.return_value = mock_lambda_client

        optimizer = LambdaOptimizer(self.environment_suffix, self.region)

        with patch('sys.stdout', new=StringIO()):
            result = optimizer.verify_dead_letter_queue('test-function')

        self.assertFalse(result)

    @patch('optimize.boto3.client')
    def test_verify_lambda_layers_attached(self, mock_boto3_client):
        """Test Lambda layers verification when attached."""
        mock_lambda_client = MagicMock()
        mock_lambda_client.get_function_configuration.return_value = {
            'Layers': [{'Arn': 'arn:aws:lambda:us-east-1:123456789012:layer:dependencies:1'}]
        }
        mock_boto3_client.return_value = mock_lambda_client

        optimizer = LambdaOptimizer(self.environment_suffix, self.region)

        with patch('sys.stdout', new=StringIO()):
            result = optimizer.verify_lambda_layers('test-function')

        self.assertTrue(result)

    @patch('optimize.boto3.client')
    def test_verify_lambda_layers_not_attached(self, mock_boto3_client):
        """Test Lambda layers verification when not attached."""
        mock_lambda_client = MagicMock()
        mock_lambda_client.get_function_configuration.return_value = {
            'Layers': []
        }
        mock_boto3_client.return_value = mock_lambda_client

        optimizer = LambdaOptimizer(self.environment_suffix, self.region)

        with patch('sys.stdout', new=StringIO()):
            result = optimizer.verify_lambda_layers('test-function')

        self.assertFalse(result)

    @patch('optimize.boto3.client')
    def test_verify_environment_variables_all_present(self, mock_boto3_client):
        """Test environment variables verification when all present."""
        mock_lambda_client = MagicMock()
        mock_lambda_client.get_function_configuration.return_value = {
            'Environment': {
                'Variables': {
                    'DB_ENDPOINT': 'db.example.com',
                    'API_KEY': 'secret',
                    'MAX_RETRIES': '3',
                    'LOG_LEVEL': 'INFO',
                    'ENVIRONMENT': 'test-env'
                }
            }
        }
        mock_boto3_client.return_value = mock_lambda_client

        optimizer = LambdaOptimizer(self.environment_suffix, self.region)

        with patch('sys.stdout', new=StringIO()):
            result = optimizer.verify_environment_variables('test-function')

        self.assertTrue(result)

    @patch('optimize.boto3.client')
    def test_verify_environment_variables_missing(self, mock_boto3_client):
        """Test environment variables verification when some missing."""
        mock_lambda_client = MagicMock()
        mock_lambda_client.get_function_configuration.return_value = {
            'Environment': {
                'Variables': {
                    'DB_ENDPOINT': 'db.example.com'
                }
            }
        }
        mock_boto3_client.return_value = mock_lambda_client

        optimizer = LambdaOptimizer(self.environment_suffix, self.region)

        with patch('sys.stdout', new=StringIO()):
            result = optimizer.verify_environment_variables('test-function')

        self.assertFalse(result)

    @patch('optimize.boto3.client')
    def test_add_cost_allocation_tags_success(self, mock_boto3_client):
        """Test adding cost allocation tags successfully."""
        mock_lambda_client = MagicMock()
        mock_lambda_client.get_function.return_value = {
            'Configuration': {
                'FunctionArn': 'arn:aws:lambda:us-east-1:123456789012:function:test'
            }
        }
        mock_boto3_client.return_value = mock_lambda_client

        optimizer = LambdaOptimizer(self.environment_suffix, self.region)

        with patch('sys.stdout', new=StringIO()):
            result = optimizer.add_cost_allocation_tags('test-function')

        self.assertTrue(result)
        mock_lambda_client.tag_resource.assert_called_once()

    @patch('optimize.boto3.client')
    def test_add_cost_allocation_tags_already_exist(self, mock_boto3_client):
        """Test adding cost allocation tags when they already exist."""
        mock_lambda_client = MagicMock()
        mock_lambda_client.get_function.return_value = {
            'Configuration': {
                'FunctionArn': 'arn:aws:lambda:us-east-1:123456789012:function:test'
            }
        }
        # Simulate tags already exist (boto3 doesn't error, just updates)
        mock_boto3_client.return_value = mock_lambda_client

        optimizer = LambdaOptimizer(self.environment_suffix, self.region)

        with patch('sys.stdout', new=StringIO()):
            result = optimizer.add_cost_allocation_tags('test-function')

        self.assertTrue(result)

    @patch('optimize.boto3.client')
    def test_get_cost_savings_estimate(self, mock_boto3_client):
        """Test cost savings estimate calculation."""
        optimizer = LambdaOptimizer(self.environment_suffix, self.region)

        savings = optimizer.get_cost_savings_estimate()

        self.assertIn('baseline_monthly_cost', savings)
        self.assertIn('optimized_monthly_cost', savings)
        self.assertIn('total_monthly_savings', savings)
        self.assertIn('savings_percentage', savings)
        self.assertGreater(savings['total_monthly_savings'], 0)
        self.assertGreater(savings['savings_percentage'], 0)

    @patch('optimize.boto3.client')
    def test_run_optimization_success(self, mock_boto3_client):
        """Test full optimization run with all checks passing."""
        mock_lambda_client = MagicMock()
        mock_logs_client = MagicMock()

        # Mock Lambda function exists
        mock_lambda_client.get_function.return_value = {
            'Configuration': {
                'FunctionArn': 'arn:aws:lambda:us-east-1:123456789012:function:test',
                'MemorySize': 512,
                'Timeout': 30,
                'ReservedConcurrentExecutions': 10,
                'TracingConfig': {'Mode': 'Active'},
                'DeadLetterConfig': {'TargetArn': 'arn:aws:sqs:us-east-1:123456789012:dlq'},
                'Layers': [{'Arn': 'arn:aws:lambda:us-east-1:123456789012:layer:dependencies:1'}],
                'Environment': {
                    'Variables': {
                        'DB_ENDPOINT': 'db.example.com',
                        'API_KEY': 'secret',
                        'MAX_RETRIES': '3',
                        'LOG_LEVEL': 'INFO',
                        'ENVIRONMENT': 'test-env'
                    }
                }
            }
        }
        mock_lambda_client.get_function_configuration.return_value = {
            'MemorySize': 512,
            'Timeout': 30,
            'ReservedConcurrentExecutions': 10,
            'TracingConfig': {'Mode': 'Active'},
            'DeadLetterConfig': {'TargetArn': 'arn:aws:sqs:us-east-1:123456789012:dlq'},
            'Layers': [{'Arn': 'arn:aws:lambda:us-east-1:123456789012:layer:dependencies:1'}],
            'Environment': {
                'Variables': {
                    'DB_ENDPOINT': 'db.example.com',
                    'API_KEY': 'secret',
                    'MAX_RETRIES': '3',
                    'LOG_LEVEL': 'INFO',
                    'ENVIRONMENT': 'test-env'
                }
            }
        }

        mock_logs_client.describe_log_groups.return_value = {
            'logGroups': [{'retentionInDays': 7}]
        }

        def client_side_effect(service, **kwargs):
            if service == 'lambda':
                return mock_lambda_client
            return mock_logs_client

        mock_boto3_client.side_effect = client_side_effect

        optimizer = LambdaOptimizer(self.environment_suffix, self.region)

        with patch('sys.stdout', new=StringIO()):
            result = optimizer.run_optimization()

        self.assertTrue(result)

    @patch('optimize.boto3.client')
    def test_run_optimization_function_not_found(self, mock_boto3_client):
        """Test optimization run when function not found."""
        mock_lambda_client = MagicMock()
        from botocore.exceptions import ClientError
        mock_lambda_client.get_function.side_effect = ClientError(
            {'Error': {'Code': 'ResourceNotFoundException'}},
            'GetFunction'
        )
        mock_boto3_client.return_value = mock_lambda_client

        optimizer = LambdaOptimizer(self.environment_suffix, self.region)

        with patch('sys.stdout', new=StringIO()):
            result = optimizer.run_optimization()

        self.assertFalse(result)


class TestMainFunction(unittest.TestCase):
    """Test suite for main function."""

    @patch('optimize.LambdaOptimizer')
    @patch('sys.argv', ['optimize.py', '--dry-run'])
    def test_main_dry_run(self, mock_optimizer_class):
        """Test main function in dry-run mode."""
        mock_optimizer = MagicMock()
        mock_optimizer.get_cost_savings_estimate.return_value = {
            'total_monthly_savings': 25.50,
            'savings_percentage': 75.0
        }
        mock_optimizer_class.return_value = mock_optimizer

        with patch('sys.stdout', new=StringIO()):
            main()

        mock_optimizer.get_cost_savings_estimate.assert_called_once()
        mock_optimizer.run_optimization.assert_not_called()

    @patch('optimize.LambdaOptimizer')
    @patch('sys.argv', ['optimize.py', '--environment', 'prod', '--region', 'us-west-2'])
    def test_main_with_args(self, mock_optimizer_class):
        """Test main function with environment and region args."""
        mock_optimizer = MagicMock()
        mock_optimizer.run_optimization.return_value = True
        mock_optimizer_class.return_value = mock_optimizer

        with patch('sys.stdout', new=StringIO()):
            with self.assertRaises(SystemExit) as cm:
                main()

        self.assertEqual(cm.exception.code, 0)
        mock_optimizer_class.assert_called_with('prod', 'us-west-2')

    @patch('optimize.LambdaOptimizer')
    @patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': 'staging', 'AWS_REGION': 'eu-west-1'})
    @patch('sys.argv', ['optimize.py'])
    def test_main_with_env_vars(self, mock_optimizer_class):
        """Test main function with environment variables."""
        mock_optimizer = MagicMock()
        mock_optimizer.run_optimization.return_value = True
        mock_optimizer_class.return_value = mock_optimizer

        with patch('sys.stdout', new=StringIO()):
            with self.assertRaises(SystemExit) as cm:
                main()

        self.assertEqual(cm.exception.code, 0)
        mock_optimizer_class.assert_called_with('staging', 'eu-west-1')


if __name__ == '__main__':
    unittest.main()
