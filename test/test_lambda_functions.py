"""
Unit tests for Lambda functions
"""
import pytest
import json
import sys
import os
from unittest import mock
from datetime import datetime, timedelta
import importlib

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


class TestPaymentProcessorLambda:
    """Test suite for payment processor Lambda"""

    @pytest.fixture(autouse=True)
    def setup_method(self):
        """Setup for each test"""
        # Import the module
        self.payment_processor = importlib.import_module('lib.lambda.payment_processor')

    @pytest.fixture
    def mock_env(self):
        """Mock environment variables"""
        with mock.patch.dict(os.environ, {
            'DYNAMODB_TABLE': 'test-table',
            'DB_SECRET_ARN': 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test',
            'REGION': 'us-east-1'
        }):
            yield

    @pytest.fixture
    def mock_boto_clients(self):
        """Mock boto3 clients"""
        with mock.patch('boto3.resource') as mock_resource, \
             mock.patch('boto3.client') as mock_client:

            # Mock DynamoDB table
            mock_table = mock.MagicMock()
            mock_resource.return_value.Table.return_value = mock_table

            yield {
                'resource': mock_resource,
                'client': mock_client,
                'table': mock_table
            }

    def test_handler_success(self, mock_env, mock_boto_clients):
        """Test successful payment processing"""
        # Mock context
        context = mock.MagicMock()
        context.request_id = 'test-request-123'

        event = {
            'paymentId': 'pay-123',
            'amount': 100.00,
            'currency': 'USD'
        }

        response = self.payment_processor.handler(event, context)

        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['paymentId'] == 'pay-123'
        assert body['status'] == 'success'
        assert body['region'] == 'us-east-1'

    def test_handler_missing_payment_id(self, mock_env, mock_boto_clients):
        """Test handling of missing payment ID"""
        context = mock.MagicMock()
        event = {
            'amount': 100.00
        }

        response = self.payment_processor.handler(event, context)

        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'error' in body

    def test_handler_missing_amount(self, mock_env, mock_boto_clients):
        """Test handling of missing amount"""
        context = mock.MagicMock()
        event = {
            'paymentId': 'pay-123'
        }

        response = self.payment_processor.handler(event, context)

        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'error' in body

    def test_handler_exception(self, mock_env, mock_boto_clients):
        """Test exception handling"""
        # Make DynamoDB raise an exception
        mock_boto_clients['table'].put_item.side_effect = Exception('DynamoDB error')

        context = mock.MagicMock()
        event = {
            'paymentId': 'pay-123',
            'amount': 100.00
        }

        response = self.payment_processor.handler(event, context)

        assert response['statusCode'] == 500
        body = json.loads(response['body'])
        assert 'error' in body

    def test_health_check(self, mock_env, mock_boto_clients):
        """Test health check endpoint"""
        context = mock.MagicMock()
        event = {}

        response = self.payment_processor.health_check(event, context)

        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['status'] == 'healthy'
        assert body['region'] == 'us-east-1'

    def test_default_currency(self, mock_env, mock_boto_clients):
        """Test that default currency is USD"""
        context = mock.MagicMock()
        context.request_id = 'test-request-123'

        event = {
            'paymentId': 'pay-123',
            'amount': 100.00
        }

        response = self.payment_processor.handler(event, context)

        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['currency'] == 'USD'


class TestBackupVerificationLambda:
    """Test suite for backup verification Lambda"""

    @pytest.fixture(autouse=True)
    def setup_method(self):
        """Setup for each test"""
        # Import the module
        self.backup_verification = importlib.import_module('lib.lambda.backup_verification')

    @pytest.fixture
    def mock_env(self):
        """Mock environment variables"""
        with mock.patch.dict(os.environ, {
            'CLUSTER_IDENTIFIER': 'test-cluster',
            'ENVIRONMENT': 'test'
        }):
            yield

    @pytest.fixture
    def mock_boto_clients(self):
        """Mock boto3 clients"""
        with mock.patch('boto3.client') as mock_client:
            mock_rds = mock.MagicMock()
            mock_cloudwatch = mock.MagicMock()

            def client_side_effect(service):
                if service == 'rds':
                    return mock_rds
                elif service == 'cloudwatch':
                    return mock_cloudwatch
                return mock.MagicMock()

            mock_client.side_effect = client_side_effect

            yield {
                'client': mock_client,
                'rds': mock_rds,
                'cloudwatch': mock_cloudwatch
            }

    def test_handler_success(self, mock_env, mock_boto_clients):
        """Test successful backup verification"""
        # Mock successful snapshot response
        mock_boto_clients['rds'].describe_db_cluster_snapshots.return_value = {
            'DBClusterSnapshots': [
                {
                    'DBClusterSnapshotIdentifier': 'snapshot-123',
                    'SnapshotCreateTime': datetime.now(datetime.now().astimezone().tzinfo),
                    'Status': 'available'
                }
            ]
        }

        context = mock.MagicMock()
        event = {}

        response = self.backup_verification.handler(event, context)

        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['status'] == 'success'
        assert 'latestSnapshot' in body

    def test_handler_no_snapshots(self, mock_env, mock_boto_clients):
        """Test handling when no snapshots exist"""
        # Mock no snapshots response
        mock_boto_clients['rds'].describe_db_cluster_snapshots.return_value = {
            'DBClusterSnapshots': []
        }

        context = mock.MagicMock()
        event = {}

        response = self.backup_verification.handler(event, context)

        assert response['statusCode'] == 500
        body = json.loads(response['body'])
        assert 'error' in body

    def test_handler_old_snapshot(self, mock_env, mock_boto_clients):
        """Test handling of old snapshots"""
        # Mock old snapshot
        old_time = datetime.now(datetime.now().astimezone().tzinfo) - timedelta(hours=30)
        mock_boto_clients['rds'].describe_db_cluster_snapshots.return_value = {
            'DBClusterSnapshots': [
                {
                    'DBClusterSnapshotIdentifier': 'snapshot-old',
                    'SnapshotCreateTime': old_time,
                    'Status': 'available'
                }
            ]
        }

        context = mock.MagicMock()
        event = {}

        response = self.backup_verification.handler(event, context)

        # Should still succeed but log warning
        assert response['statusCode'] == 200
        mock_boto_clients['cloudwatch'].put_metric_data.assert_called()

    def test_handler_unavailable_snapshot(self, mock_env, mock_boto_clients):
        """Test handling of unavailable snapshots"""
        # Mock unavailable snapshot
        mock_boto_clients['rds'].describe_db_cluster_snapshots.return_value = {
            'DBClusterSnapshots': [
                {
                    'DBClusterSnapshotIdentifier': 'snapshot-123',
                    'SnapshotCreateTime': datetime.now(datetime.now().astimezone().tzinfo),
                    'Status': 'creating'
                }
            ]
        }

        context = mock.MagicMock()
        event = {}

        response = self.backup_verification.handler(event, context)

        assert response['statusCode'] == 500
        body = json.loads(response['body'])
        assert 'error' in body

    def test_handler_exception(self, mock_env, mock_boto_clients):
        """Test exception handling"""
        # Make RDS raise an exception
        mock_boto_clients['rds'].describe_db_cluster_snapshots.side_effect = Exception('RDS error')

        context = mock.MagicMock()
        event = {}

        response = self.backup_verification.handler(event, context)

        assert response['statusCode'] == 500
        body = json.loads(response['body'])
        assert 'error' in body

    def test_send_metric(self, mock_env, mock_boto_clients):
        """Test CloudWatch metric sending"""
        self.backup_verification.send_metric('TestMetric', 1.0)

        mock_boto_clients['cloudwatch'].put_metric_data.assert_called_once()
        call_args = mock_boto_clients['cloudwatch'].put_metric_data.call_args

        assert call_args[1]['Namespace'] == 'PaymentSystem'
        assert call_args[1]['MetricData'][0]['MetricName'] == 'TestMetric'
        assert call_args[1]['MetricData'][0]['Value'] == 1.0
