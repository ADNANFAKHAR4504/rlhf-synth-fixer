"""
Unit tests for the Lambda failover function.
Tests failover logic, error handling, and AWS service interactions.
"""

import pytest
import json
import sys
import os
from pathlib import Path
from unittest.mock import patch, MagicMock, call
from botocore.exceptions import ClientError
import importlib.util

# Get the project root directory
project_root = Path(__file__).parent.parent.parent

# Set environment variables before loading module
os.environ['PRIMARY_INSTANCE_ID'] = 'primary-db-test'
os.environ['REPLICA_INSTANCE_ID'] = 'replica-db-test'
os.environ['HOSTED_ZONE_ID'] = 'Z1234567890ABC'
os.environ['RECORD_NAME'] = 'postgres.db-test.internal'
os.environ['PRIMARY_ENDPOINT'] = 'primary-db.region.rds.amazonaws.com'
os.environ['REPLICA_ENDPOINT'] = 'replica-db.region.rds.amazonaws.com'
os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'

# Mock boto3 before loading the module
with patch('boto3.client'):
    # Load the Lambda module using importlib
    lambda_path = project_root / "lib" / "lambda" / "failover" / "index.py"
    spec = importlib.util.spec_from_file_location("failover_index", str(lambda_path))
    index = importlib.util.module_from_spec(spec)
    sys.modules['failover_index'] = index
    spec.loader.exec_module(index)


class TestLambdaFailover:
    """Test suite for Lambda failover function."""

    @pytest.fixture
    def mock_rds_client(self):
        """Create a mock RDS client."""
        with patch('failover_index.rds_client') as mock:
            yield mock

    @pytest.fixture
    def mock_route53_client(self):
        """Create a mock Route53 client."""
        with patch('failover_index.route53_client') as mock:
            yield mock

    @pytest.fixture
    def mock_sns_client(self):
        """Create a mock SNS client."""
        with patch('failover_index.sns_client') as mock:
            yield mock

    @pytest.fixture
    def lambda_event(self):
        """Create a sample Lambda event."""
        return {
            'source': 'aws.cloudwatch',
            'detail-type': 'CloudWatch Alarm State Change',
            'detail': {'alarmName': 'primary-db-availability-test'}
        }

    @pytest.fixture
    def lambda_context(self):
        """Create a mock Lambda context."""
        context = MagicMock()
        context.function_name = 'db-failover-test'
        context.aws_request_id = 'test-request-id'
        return context

    def test_check_instance_status_success(self, mock_rds_client):
        """Test successful RDS instance status check."""
        mock_rds_client.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceStatus': 'available',
                'Endpoint': {'Address': 'test.rds.amazonaws.com'},
                'ReadReplicaSourceDBInstanceIdentifier': 'source-db'
            }]
        }

        result = index.check_instance_status('test-db')

        assert result['status'] == 'available'
        assert result['available'] is True
        assert result['endpoint'] == 'test.rds.amazonaws.com'
        assert result['is_replica'] is True

    def test_check_instance_status_unavailable(self, mock_rds_client):
        """Test checking status of unavailable instance."""
        mock_rds_client.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceStatus': 'failed',
                'Endpoint': {'Address': 'test.rds.amazonaws.com'}
            }]
        }

        result = index.check_instance_status('test-db')

        assert result['status'] == 'failed'
        assert result['available'] is False

    def test_check_instance_status_error(self, mock_rds_client):
        """Test error handling in status check."""
        mock_rds_client.describe_db_instances.side_effect = ClientError(
            {'Error': {'Code': 'DBInstanceNotFound', 'Message': 'Not found'}},
            'DescribeDBInstances'
        )

        with pytest.raises(ClientError):
            index.check_instance_status('test-db')

    def test_promote_replica_success(self, mock_rds_client):
        """Test successful replica promotion."""
        mock_rds_client.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceStatus': 'available',
                'Endpoint': {'Address': 'replica.rds.amazonaws.com'},
                'ReadReplicaSourceDBInstanceIdentifier': 'primary-db'
            }]
        }
        mock_rds_client.promote_read_replica.return_value = {
            'DBInstance': {'DBInstanceIdentifier': 'replica-db-test'}
        }

        result = index.promote_replica()

        assert 'DBInstance' in result
        mock_rds_client.promote_read_replica.assert_called_once()

    def test_promote_replica_already_promoted(self, mock_rds_client):
        """Test promoting replica that's already promoted (idempotency)."""
        mock_rds_client.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceStatus': 'available',
                'Endpoint': {'Address': 'replica.rds.amazonaws.com'}
            }]
        }

        result = index.promote_replica()

        assert result['status'] == 'already_promoted'
        mock_rds_client.promote_read_replica.assert_not_called()

    def test_update_route53_weights_success(self, mock_route53_client):
        """Test successful Route53 weight update."""
        mock_route53_client.change_resource_record_sets.return_value = {
            'ChangeInfo': {'Id': 'change-123', 'Status': 'PENDING'}
        }

        result = index.update_route53_weights(0, 100)

        assert result['ChangeInfo']['Status'] == 'PENDING'
        mock_route53_client.change_resource_record_sets.assert_called_once()

    def test_update_route53_weights_error(self, mock_route53_client):
        """Test Route53 update with error."""
        mock_route53_client.change_resource_record_sets.side_effect = ClientError(
            {'Error': {'Code': 'InvalidInput', 'Message': 'Invalid input'}},
            'ChangeResourceRecordSets'
        )

        with pytest.raises(ClientError):
            index.update_route53_weights(0, 100)

    def test_send_sns_notification_success(self, mock_sns_client):
        """Test successful SNS notification."""
        mock_sns_client.publish.return_value = {'MessageId': 'msg-123'}

        index.send_sns_notification('Test Subject', 'Test Message')

        mock_sns_client.publish.assert_called_once()

    def test_retry_with_backoff_success(self):
        """Test retry logic succeeds on first attempt."""
        mock_func = MagicMock(return_value='success')

        result = index.retry_with_backoff(mock_func, 'arg1')

        assert result == 'success'
        assert mock_func.call_count == 1

    def test_retry_with_backoff_retries(self):
        """Test retry logic retries on failure."""
        mock_func = MagicMock(side_effect=[
            ClientError({'Error': {'Code': 'Throttling'}}, 'Operation'),
            'success'
        ])

        with patch('failover_index.time.sleep'):
            result = index.retry_with_backoff(mock_func)

        assert result == 'success'
        assert mock_func.call_count == 2

    def test_retry_with_backoff_max_retries(self):
        """Test retry logic when all attempts fail."""
        mock_func = MagicMock(side_effect=ClientError(
            {'Error': {'Code': 'ServiceUnavailable'}}, 'Operation'
        ))

        with patch('failover_index.time.sleep'):
            with pytest.raises(ClientError):
                index.retry_with_backoff(mock_func)

        assert mock_func.call_count == 3

    def test_handler_failover_triggered(
        self, mock_rds_client, mock_route53_client, mock_sns_client,
        lambda_event, lambda_context
    ):
        """Test handler triggers failover when primary is unavailable."""
        mock_rds_client.describe_db_instances.side_effect = [
            {'DBInstances': [{'DBInstanceStatus': 'failed', 'Endpoint': {}}]},
            {'DBInstances': [{
                'DBInstanceStatus': 'available',
                'Endpoint': {'Address': 'replica.rds.amazonaws.com'}
            }]},
            {'DBInstances': [{
                'DBInstanceStatus': 'available',
                'Endpoint': {'Address': 'replica.rds.amazonaws.com'},
                'ReadReplicaSourceDBInstanceIdentifier': 'primary-db'
            }]}
        ]
        mock_rds_client.promote_read_replica.return_value = {'DBInstance': {}}
        mock_route53_client.change_resource_record_sets.return_value = {
            'ChangeInfo': {'Status': 'PENDING'}
        }

        result = index.handler(lambda_event, lambda_context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['action'] == 'promoted_replica'

    def test_handler_primary_available_no_action(
        self, mock_rds_client, mock_route53_client, lambda_event, lambda_context
    ):
        """Test handler does nothing when primary is available."""
        mock_rds_client.describe_db_instances.side_effect = [
            {'DBInstances': [{'DBInstanceStatus': 'available', 'Endpoint': {}}]},
            {'DBInstances': [{'DBInstanceStatus': 'available', 'Endpoint': {}}]}
        ]
        mock_route53_client.change_resource_record_sets.return_value = {
            'ChangeInfo': {'Status': 'PENDING'}
        }

        result = index.handler(lambda_event, lambda_context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['action'] == 'none'

    def test_handler_both_unavailable(
        self, mock_rds_client, lambda_event, lambda_context
    ):
        """Test handler when both instances are unavailable."""
        mock_rds_client.describe_db_instances.side_effect = [
            {'DBInstances': [{'DBInstanceStatus': 'failed', 'Endpoint': {}}]},
            {'DBInstances': [{'DBInstanceStatus': 'failed', 'Endpoint': {}}]}
        ]

        result = index.handler(lambda_event, lambda_context)

        assert result['statusCode'] == 500

    def test_handler_exception(
        self, mock_rds_client, lambda_event, lambda_context
    ):
        """Test handler handles exceptions gracefully."""
        mock_rds_client.describe_db_instances.side_effect = Exception('Unexpected error')

        result = index.handler(lambda_event, lambda_context)

        assert result['statusCode'] == 500
