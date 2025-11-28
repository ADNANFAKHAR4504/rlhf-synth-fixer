"""Unit tests for Lambda payment processor handler."""
import sys
import os
import json
from unittest.mock import Mock, patch

# Set region before any boto3 imports
os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'

sys.path.append(os.path.join(os.getcwd(), "lib", "lambda"))


class TestLambdaPaymentProcessorHandler:
    """Test suite for Lambda payment processor handler."""

    @patch.dict(os.environ, {
        'DYNAMODB_TABLE': 'test-table',
        'S3_BUCKET': 'test-bucket',
        'AWS_DEFAULT_REGION': 'us-east-1'
    })
    @patch('payment_processor.s3')
    @patch('payment_processor.dynamodb')
    @patch('payment_processor.datetime')
    def test_handler_processes_payment_successfully(
        self,
        mock_datetime,
        mock_dynamodb,
        mock_s3
    ):
        """Test handler processes payment successfully."""
        # Import after patching to ensure mocks are in place
        from payment_processor import handler  # pylint: disable=import-outside-toplevel

        # Setup mocks
        mock_now = Mock()
        mock_now.timestamp.return_value = 1234567890
        mock_datetime.now.return_value = mock_now

        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table

        # Create test event
        event = {
            'transaction_id': 'txn-12345',
            'amount': 100
        }
        context = {}

        # Call handler
        result = handler(event, context)

        # Verify DynamoDB put_item was called
        mock_table.put_item.assert_called_once()
        call_args = mock_table.put_item.call_args
        assert call_args[1]['Item']['transaction_id'] == 'txn-12345'
        assert call_args[1]['Item']['amount'] == 100
        assert call_args[1]['Item']['status'] == 'completed'
        assert call_args[1]['Item']['timestamp'] == 1234567890

        # Verify S3 put_object was called
        mock_s3.put_object.assert_called_once()
        s3_call_args = mock_s3.put_object.call_args
        assert s3_call_args[1]['Bucket'] == 'test-bucket'
        assert 'transactions/txn-12345.json' in s3_call_args[1]['Key']

        # Verify response
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['message'] == 'Payment processed'
        assert body['transaction_id'] == 'txn-12345'

    @patch.dict(os.environ, {
        'DYNAMODB_TABLE': 'test-table',
        'S3_BUCKET': 'test-bucket',
        'AWS_DEFAULT_REGION': 'us-east-1'
    })
    @patch('payment_processor.s3')
    @patch('payment_processor.dynamodb')
    @patch('payment_processor.datetime')
    def test_handler_uses_default_transaction_id_when_missing(
        self,
        mock_datetime,
        mock_dynamodb,
        mock_s3
    ):
        """Test handler uses default transaction ID when missing."""
        from payment_processor import handler  # pylint: disable=import-outside-toplevel

        # Setup mocks
        mock_now = Mock()
        mock_now.timestamp.return_value = 1234567890
        mock_datetime.now.return_value = mock_now

        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table

        # Create test event without transaction_id
        event = {}
        context = {}

        # Call handler
        result = handler(event, context)

        # Verify default transaction_id was used
        call_args = mock_table.put_item.call_args
        assert call_args[1]['Item']['transaction_id'] == 'unknown'

        # Verify response
        assert result['statusCode'] == 200

    @patch.dict(os.environ, {
        'DYNAMODB_TABLE': 'test-table',
        'S3_BUCKET': 'test-bucket',
        'AWS_DEFAULT_REGION': 'us-east-1'
    })
    @patch('payment_processor.s3')
    @patch('payment_processor.dynamodb')
    @patch('payment_processor.datetime')
    def test_handler_uses_default_amount_when_missing(
        self,
        mock_datetime,
        mock_dynamodb,
        mock_s3
    ):
        """Test handler uses default amount when missing."""
        from payment_processor import handler  # pylint: disable=import-outside-toplevel

        # Setup mocks
        mock_now = Mock()
        mock_now.timestamp.return_value = 1234567890
        mock_datetime.now.return_value = mock_now

        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table

        # Create test event without amount
        event = {'transaction_id': 'txn-999'}
        context = {}

        # Call handler
        result = handler(event, context)

        # Verify default amount was used
        call_args = mock_table.put_item.call_args
        assert call_args[1]['Item']['amount'] == 0

        # Verify response
        assert result['statusCode'] == 200

    @patch.dict(os.environ, {
        'DYNAMODB_TABLE': 'custom-table',
        'S3_BUCKET': 'custom-bucket',
        'AWS_DEFAULT_REGION': 'us-east-1'
    })
    @patch('payment_processor.s3')
    @patch('payment_processor.dynamodb')
    @patch('payment_processor.datetime')
    def test_handler_reads_environment_variables(
        self,
        mock_datetime,
        mock_dynamodb,
        mock_s3
    ):
        """Test handler reads environment variables correctly."""
        from payment_processor import handler  # pylint: disable=import-outside-toplevel

        # Setup mocks
        mock_now = Mock()
        mock_now.timestamp.return_value = 1234567890
        mock_datetime.now.return_value = mock_now

        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table

        # Create test event
        event = {'transaction_id': 'test-txn', 'amount': 50}
        context = {}

        # Call handler
        handler(event, context)

        # Verify correct table was accessed
        mock_dynamodb.Table.assert_called_with('custom-table')

        # Verify correct bucket was used
        s3_call_args = mock_s3.put_object.call_args
        assert s3_call_args[1]['Bucket'] == 'custom-bucket'

    @patch.dict(os.environ, {
        'DYNAMODB_TABLE': 'test-table',
        'S3_BUCKET': 'test-bucket',
        'AWS_DEFAULT_REGION': 'us-east-1'
    })
    @patch('payment_processor.s3')
    @patch('payment_processor.dynamodb')
    @patch('payment_processor.datetime')
    def test_handler_stores_event_data_in_s3(
        self,
        mock_datetime,
        mock_dynamodb,
        mock_s3
    ):
        """Test handler stores complete event data in S3."""
        from payment_processor import handler  # pylint: disable=import-outside-toplevel

        # Setup mocks
        mock_now = Mock()
        mock_now.timestamp.return_value = 1234567890
        mock_datetime.now.return_value = mock_now

        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table

        # Create test event with additional fields
        event = {
            'transaction_id': 'txn-abc',
            'amount': 250,
            'customer_id': 'cust-123',
            'payment_method': 'credit_card'
        }
        context = {}

        # Call handler
        handler(event, context)

        # Verify S3 put_object contains all event data
        s3_call_args = mock_s3.put_object.call_args
        stored_data = s3_call_args[1]['Body']
        stored_event = json.loads(stored_data)

        assert 'transaction_id' in stored_event
        assert 'customer_id' in stored_event
        assert 'payment_method' in stored_event
