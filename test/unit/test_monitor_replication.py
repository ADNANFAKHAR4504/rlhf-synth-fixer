"""
Unit tests for RDS replication monitoring Lambda function.
Tests all code paths, error handling, and edge cases to achieve 100% coverage.
"""

import json
import os
import sys
import unittest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
from botocore.exceptions import ClientError

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib', 'lambda'))

# Set required environment variables before importing
os.environ['DR_DB_IDENTIFIER'] = 'test-db-dr'
os.environ['REPLICATION_LAG_THRESHOLD'] = '60'

import monitor_replication


class TestLambdaHandler(unittest.TestCase):
    """Test cases for lambda_handler function - main entry point."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_context = Mock()
        self.test_event = {}

    @patch('monitor_replication.rds')
    @patch('monitor_replication.cloudwatch')
    def test_lambda_handler_no_datapoints(self, mock_cloudwatch, mock_rds):
        """Test handling when no replication lag data is available."""
        # Arrange
        mock_cloudwatch.get_metric_statistics.return_value = {'Datapoints': []}

        # Act
        result = monitor_replication.lambda_handler(self.test_event, self.mock_context)

        # Assert
        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertEqual(body['status'], 'no_data')
        self.assertEqual(body['message'], 'No data available')
        mock_cloudwatch.get_metric_statistics.assert_called_once()

    @patch('monitor_replication.rds')
    @patch('monitor_replication.cloudwatch')
    def test_lambda_handler_healthy_replication(self, mock_cloudwatch, mock_rds):
        """Test handling when replication lag is within acceptable limits."""
        # Arrange
        mock_cloudwatch.get_metric_statistics.return_value = {
            'Datapoints': [
                {
                    'Timestamp': datetime.utcnow(),
                    'Average': 30.0,
                    'Unit': 'Seconds'
                }
            ]
        }

        # Act
        result = monitor_replication.lambda_handler(self.test_event, self.mock_context)

        # Assert
        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertEqual(body['status'], 'healthy')
        self.assertEqual(body['message'], 'Replication healthy')
        self.assertEqual(body['replication_lag'], 30.0)
        mock_cloudwatch.get_metric_statistics.assert_called_once()
        mock_rds.describe_db_instances.assert_not_called()

    @patch('monitor_replication.rds')
    @patch('monitor_replication.cloudwatch')
    def test_lambda_handler_high_lag_read_replica(self, mock_cloudwatch, mock_rds):
        """Test failover promotion when replication lag exceeds threshold."""
        # Arrange
        mock_cloudwatch.get_metric_statistics.return_value = {
            'Datapoints': [
                {
                    'Timestamp': datetime.utcnow(),
                    'Average': 120.0,
                    'Unit': 'Seconds'
                }
            ]
        }

        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [
                {
                    'DBInstanceIdentifier': 'test-db-dr',
                    'ReadReplicaSourceDBInstanceIdentifier': 'test-db-primary',
                    'DBInstanceStatus': 'available'
                }
            ]
        }

        mock_rds.promote_read_replica.return_value = {
            'DBInstance': {
                'DBInstanceStatus': 'modifying'
            }
        }

        # Act
        result = monitor_replication.lambda_handler(self.test_event, self.mock_context)

        # Assert
        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertEqual(body['status'], 'promoting')
        self.assertEqual(body['message'], 'Failover initiated')
        self.assertEqual(body['replication_lag'], 120.0)
        self.assertEqual(body['db_instance'], 'test-db-dr')

        mock_rds.promote_read_replica.assert_called_once_with(
            DBInstanceIdentifier='test-db-dr',
            BackupRetentionPeriod=7,
            PreferredBackupWindow='03:00-04:00'
        )

    @patch('monitor_replication.rds')
    @patch('monitor_replication.cloudwatch')
    def test_lambda_handler_high_lag_standalone_instance(self, mock_cloudwatch, mock_rds):
        """Test handling when instance is already standalone (not a replica)."""
        # Arrange
        mock_cloudwatch.get_metric_statistics.return_value = {
            'Datapoints': [
                {
                    'Timestamp': datetime.utcnow(),
                    'Average': 120.0,
                    'Unit': 'Seconds'
                }
            ]
        }

        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [
                {
                    'DBInstanceIdentifier': 'test-db-dr',
                    'DBInstanceStatus': 'available'
                }
            ]
        }

        # Act
        result = monitor_replication.lambda_handler(self.test_event, self.mock_context)

        # Assert
        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertEqual(body['status'], 'standalone')
        self.assertEqual(body['message'], 'Instance is not a replica')
        self.assertEqual(body['replication_lag'], 120.0)
        mock_rds.promote_read_replica.assert_not_called()

    @patch('monitor_replication.rds')
    @patch('monitor_replication.cloudwatch')
    def test_lambda_handler_multiple_datapoints(self, mock_cloudwatch, mock_rds):
        """Test that function uses most recent datapoint when multiple exist."""
        # Arrange
        now = datetime.utcnow()
        mock_cloudwatch.get_metric_statistics.return_value = {
            'Datapoints': [
                {
                    'Timestamp': now - timedelta(minutes=4),
                    'Average': 100.0,
                    'Unit': 'Seconds'
                },
                {
                    'Timestamp': now - timedelta(minutes=2),
                    'Average': 50.0,
                    'Unit': 'Seconds'
                },
                {
                    'Timestamp': now - timedelta(minutes=1),
                    'Average': 25.0,
                    'Unit': 'Seconds'
                }
            ]
        }

        # Act
        result = monitor_replication.lambda_handler(self.test_event, self.mock_context)

        # Assert
        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertEqual(body['replication_lag'], 25.0)  # Most recent datapoint

    @patch('monitor_replication.rds')
    @patch('monitor_replication.cloudwatch')
    def test_lambda_handler_cloudwatch_error(self, mock_cloudwatch, mock_rds):
        """Test error handling when CloudWatch API fails."""
        # Arrange
        mock_cloudwatch.get_metric_statistics.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}},
            'GetMetricStatistics'
        )

        # Act
        result = monitor_replication.lambda_handler(self.test_event, self.mock_context)

        # Assert
        self.assertEqual(result['statusCode'], 500)
        body = json.loads(result['body'])
        self.assertEqual(body['message'], 'Error monitoring replication')
        self.assertIn('error', body)

    @patch('monitor_replication.rds')
    @patch('monitor_replication.cloudwatch')
    def test_lambda_handler_rds_describe_error(self, mock_cloudwatch, mock_rds):
        """Test error handling when RDS describe_db_instances fails."""
        # Arrange
        mock_cloudwatch.get_metric_statistics.return_value = {
            'Datapoints': [
                {
                    'Timestamp': datetime.utcnow(),
                    'Average': 120.0,
                    'Unit': 'Seconds'
                }
            ]
        }

        mock_rds.describe_db_instances.side_effect = ClientError(
            {'Error': {'Code': 'DBInstanceNotFound', 'Message': 'DB instance not found'}},
            'DescribeDBInstances'
        )

        # Act
        result = monitor_replication.lambda_handler(self.test_event, self.mock_context)

        # Assert
        self.assertEqual(result['statusCode'], 500)
        body = json.loads(result['body'])
        self.assertEqual(body['message'], 'Error monitoring replication')

    @patch('monitor_replication.rds')
    @patch('monitor_replication.cloudwatch')
    def test_lambda_handler_promote_replica_error(self, mock_cloudwatch, mock_rds):
        """Test error handling when promote_read_replica fails."""
        # Arrange
        mock_cloudwatch.get_metric_statistics.return_value = {
            'Datapoints': [
                {
                    'Timestamp': datetime.utcnow(),
                    'Average': 120.0,
                    'Unit': 'Seconds'
                }
            ]
        }

        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [
                {
                    'DBInstanceIdentifier': 'test-db-dr',
                    'ReadReplicaSourceDBInstanceIdentifier': 'test-db-primary',
                    'DBInstanceStatus': 'available'
                }
            ]
        }

        mock_rds.promote_read_replica.side_effect = ClientError(
            {'Error': {'Code': 'InvalidDBInstanceState', 'Message': 'Instance not in valid state'}},
            'PromoteReadReplica'
        )

        # Act
        result = monitor_replication.lambda_handler(self.test_event, self.mock_context)

        # Assert
        self.assertEqual(result['statusCode'], 500)
        body = json.loads(result['body'])
        self.assertEqual(body['message'], 'Error monitoring replication')

    @patch('monitor_replication.rds')
    @patch('monitor_replication.cloudwatch')
    def test_lambda_handler_exact_threshold(self, mock_cloudwatch, mock_rds):
        """Test handling when lag exactly equals threshold (boundary condition)."""
        # Arrange
        mock_cloudwatch.get_metric_statistics.return_value = {
            'Datapoints': [
                {
                    'Timestamp': datetime.utcnow(),
                    'Average': 60.0,  # Exactly at threshold
                    'Unit': 'Seconds'
                }
            ]
        }

        # Act
        result = monitor_replication.lambda_handler(self.test_event, self.mock_context)

        # Assert
        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertEqual(body['status'], 'healthy')  # Not exceeding threshold
        self.assertEqual(body['replication_lag'], 60.0)
        mock_rds.describe_db_instances.assert_not_called()

    @patch('monitor_replication.rds')
    @patch('monitor_replication.cloudwatch')
    def test_lambda_handler_just_above_threshold(self, mock_cloudwatch, mock_rds):
        """Test handling when lag is just above threshold (boundary condition)."""
        # Arrange
        mock_cloudwatch.get_metric_statistics.return_value = {
            'Datapoints': [
                {
                    'Timestamp': datetime.utcnow(),
                    'Average': 60.1,  # Just above threshold
                    'Unit': 'Seconds'
                }
            ]
        }

        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [
                {
                    'DBInstanceIdentifier': 'test-db-dr',
                    'ReadReplicaSourceDBInstanceIdentifier': 'test-db-primary',
                    'DBInstanceStatus': 'available'
                }
            ]
        }

        mock_rds.promote_read_replica.return_value = {
            'DBInstance': {
                'DBInstanceStatus': 'modifying'
            }
        }

        # Act
        result = monitor_replication.lambda_handler(self.test_event, self.mock_context)

        # Assert
        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertEqual(body['status'], 'promoting')
        self.assertEqual(body['replication_lag'], 60.1)

    @patch('monitor_replication.rds')
    @patch('monitor_replication.cloudwatch')
    def test_lambda_handler_zero_lag(self, mock_cloudwatch, mock_rds):
        """Test handling when replication lag is zero."""
        # Arrange
        mock_cloudwatch.get_metric_statistics.return_value = {
            'Datapoints': [
                {
                    'Timestamp': datetime.utcnow(),
                    'Average': 0.0,
                    'Unit': 'Seconds'
                }
            ]
        }

        # Act
        result = monitor_replication.lambda_handler(self.test_event, self.mock_context)

        # Assert
        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertEqual(body['status'], 'healthy')
        self.assertEqual(body['replication_lag'], 0.0)

    @patch('monitor_replication.rds')
    @patch('monitor_replication.cloudwatch')
    def test_lambda_handler_generic_exception(self, mock_cloudwatch, mock_rds):
        """Test error handling for unexpected exceptions."""
        # Arrange
        mock_cloudwatch.get_metric_statistics.side_effect = Exception('Unexpected error')

        # Act
        result = monitor_replication.lambda_handler(self.test_event, self.mock_context)

        # Assert
        self.assertEqual(result['statusCode'], 500)
        body = json.loads(result['body'])
        self.assertEqual(body['message'], 'Error monitoring replication')
        self.assertIn('Unexpected error', body['error'])


class TestEnvironmentConfiguration(unittest.TestCase):
    """Test cases for environment variable configuration."""

    def test_environment_variables_set(self):
        """Test that required environment variables are correctly set."""
        self.assertEqual(monitor_replication.DR_DB_IDENTIFIER, 'test-db-dr')
        self.assertEqual(monitor_replication.REPLICATION_LAG_THRESHOLD, 60)

    def test_environment_variable_default_threshold(self):
        """Test default value for REPLICATION_LAG_THRESHOLD."""
        # This tests the get() with default in the module
        original_value = os.environ.get('REPLICATION_LAG_THRESHOLD')

        # Temporarily remove the variable
        if 'REPLICATION_LAG_THRESHOLD' in os.environ:
            del os.environ['REPLICATION_LAG_THRESHOLD']

        # Reload module to test default
        import importlib
        importlib.reload(monitor_replication)

        # Check default
        self.assertEqual(monitor_replication.REPLICATION_LAG_THRESHOLD, 60)

        # Restore original value
        if original_value:
            os.environ['REPLICATION_LAG_THRESHOLD'] = original_value
            importlib.reload(monitor_replication)

    def test_aws_clients_initialization(self):
        """Test that AWS clients are properly initialized."""
        self.assertIsNotNone(monitor_replication.cloudwatch)
        self.assertIsNotNone(monitor_replication.rds)


class TestMetricQueryParameters(unittest.TestCase):
    """Test CloudWatch metric query parameters."""

    @patch('monitor_replication.rds')
    @patch('monitor_replication.cloudwatch')
    def test_cloudwatch_query_parameters(self, mock_cloudwatch, mock_rds):
        """Test that CloudWatch query uses correct parameters."""
        # Arrange
        mock_cloudwatch.get_metric_statistics.return_value = {'Datapoints': []}

        # Act
        monitor_replication.lambda_handler({}, Mock())

        # Assert
        call_args = mock_cloudwatch.get_metric_statistics.call_args[1]
        self.assertEqual(call_args['Namespace'], 'AWS/RDS')
        self.assertEqual(call_args['MetricName'], 'ReplicaLag')
        self.assertEqual(call_args['Period'], 60)
        self.assertEqual(call_args['Statistics'], ['Average'])

        # Verify dimensions
        dimensions = call_args['Dimensions']
        self.assertEqual(len(dimensions), 1)
        self.assertEqual(dimensions[0]['Name'], 'DBInstanceIdentifier')
        self.assertEqual(dimensions[0]['Value'], 'test-db-dr')

        # Verify time range (approximately 5 minutes)
        time_diff = call_args['EndTime'] - call_args['StartTime']
        self.assertAlmostEqual(time_diff.total_seconds(), 300, delta=10)


if __name__ == '__main__':
    unittest.main()
