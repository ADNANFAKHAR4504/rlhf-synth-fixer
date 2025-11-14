"""
Unit tests for Lambda functions.
Tests payment validation, transaction processing, and notification logic.
"""
import json
import os
import sys
from unittest.mock import MagicMock, patch

# Add lib directory to path for Lambda imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/lambda'))


def test_payment_validation_success():
    """Test payment validation Lambda with valid input."""
    from payment_validation.index import handler

    event = {
        'body': json.dumps({'payment_id': 'pay_123'})
    }
    context = {}

    response = handler(event, context)

    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert body['valid'] is True
    assert 'region' in body
    assert 'environment' in body


def test_payment_validation_missing_payment_id():
    """Test payment validation Lambda with missing payment_id."""
    from payment_validation.index import handler

    event = {
        'body': json.dumps({})
    }
    context = {}

    response = handler(event, context)

    assert response['statusCode'] == 400
    body = json.loads(response['body'])
    assert 'error' in body
    assert 'payment_id is required' in body['error']


def test_payment_validation_empty_payment_id():
    """Test payment validation Lambda with empty payment_id."""
    from payment_validation.index import handler

    event = {
        'body': json.dumps({'payment_id': ''})
    }
    context = {}

    response = handler(event, context)

    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert body['valid'] is False


@patch('boto3.resource')
def test_transaction_processing_success(mock_boto3):
    """Test transaction processing Lambda."""
    from transaction_processing.index import handler

    # Mock DynamoDB table
    mock_table = MagicMock()
    mock_dynamodb = MagicMock()
    mock_dynamodb.Table.return_value = mock_table
    mock_boto3.return_value = mock_dynamodb

    event = {
        'body': json.dumps({'transaction_id': 'txn_123'})
    }
    context = {}

    response = handler(event, context)

    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert body['transaction_id'] == 'txn_123'
    assert body['status'] == 'processed'

    # Verify DynamoDB put_item was called
    mock_table.put_item.assert_called_once()


@patch('boto3.client')
def test_notification_success(mock_boto3):
    """Test notification Lambda."""
    from notification.index import handler

    # Mock SNS client
    mock_sns = MagicMock()
    mock_boto3.return_value = mock_sns

    event = {
        'body': json.dumps({'message': 'Payment completed'})
    }
    context = {}

    response = handler(event, context)

    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert body['notification_sent'] is True
    assert body['message'] == 'Payment completed'


def test_lambda_environment_variables():
    """Test Lambda functions use environment variables."""
    from payment_validation.index import handler

    os.environ['ENVIRONMENT_SUFFIX'] = 'prod'
    os.environ['DR_ROLE'] = 'primary'

    event = {
        'body': json.dumps({'payment_id': 'pay_123'})
    }
    context = {}

    response = handler(event, context)

    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert body['environment'] == 'prod'
    assert body['region'] == 'primary'

    # Cleanup
    del os.environ['ENVIRONMENT_SUFFIX']
    del os.environ['DR_ROLE']
