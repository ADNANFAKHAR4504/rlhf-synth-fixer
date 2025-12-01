"""
Unit tests for Lambda payment processor function
"""

import json
import os
import sys
from decimal import Decimal
from unittest.mock import Mock, patch, MagicMock
import pytest

# Add lib/lambda to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib', 'lambda'))

import payment_processor


class TestLambdaHandler:
    """Test Lambda handler function"""

    @patch('payment_processor.process_payment_file')
    def test_handler_with_s3_event(self, mock_process):
        """Test handler processes S3 event"""
        event = {
            'Records': [
                {
                    's3': {
                        'bucket': {'name': 'test-bucket'},
                        'object': {'key': 'test-file.json'}
                    }
                }
            ]
        }
        context = Mock(request_id='test-123')

        response = payment_processor.lambda_handler(event, context)

        assert response['statusCode'] == 200
        mock_process.assert_called_once_with('test-bucket', 'test-file.json')

    @patch('payment_processor.process_payment_data')
    def test_handler_with_payment_data(self, mock_process):
        """Test handler processes direct payment data"""
        mock_process.return_value = 'txn-123'

        event = {
            'payment_data': {
                'transactionId': 'txn-123',
                'amount': '100.00',
                'currency': 'USD',
                'cardLast4': '1234'
            }
        }
        context = Mock(request_id='test-123')

        response = payment_processor.lambda_handler(event, context)

        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['transactionId'] == 'txn-123'
        mock_process.assert_called_once()

    def test_handler_with_invalid_event(self):
        """Test handler rejects invalid event format"""
        event = {'invalid': 'event'}
        context = Mock(request_id='test-123')

        response = payment_processor.lambda_handler(event, context)

        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'error' in body


class TestPaymentValidation:
    """Test payment data validation"""

    @patch.dict(os.environ, {
        'DYNAMODB_TABLE': 'test-table',
        'S3_BUCKET': 'test-bucket',
        'KMS_KEY_ID': 'test-key'
    })
    @patch('payment_processor.table')
    def test_valid_payment_data(self, mock_table):
        """Test processing valid payment data"""
        mock_table.put_item = Mock()

        payment_data = {
            'transactionId': 'txn-123',
            'amount': '100.00',
            'currency': 'USD',
            'cardLast4': '1234'
        }

        transaction_id = payment_processor.process_payment_data(payment_data)

        assert transaction_id == 'txn-123'
        mock_table.put_item.assert_called_once()

    def test_missing_required_fields(self):
        """Test validation fails with missing fields"""
        payment_data = {
            'transactionId': 'txn-123',
            'amount': '100.00'
            # Missing currency and cardLast4
        }

        with pytest.raises(payment_processor.PaymentValidationError) as exc_info:
            payment_processor.process_payment_data(payment_data)

        assert 'Missing required fields' in str(exc_info.value)

    def test_invalid_amount_negative(self):
        """Test validation fails with negative amount"""
        payment_data = {
            'transactionId': 'txn-123',
            'amount': '-100.00',
            'currency': 'USD',
            'cardLast4': '1234'
        }

        with pytest.raises(payment_processor.PaymentValidationError) as exc_info:
            payment_processor.process_payment_data(payment_data)

        assert 'positive' in str(exc_info.value).lower()

    def test_invalid_amount_too_large(self):
        """Test validation fails with amount exceeding maximum"""
        payment_data = {
            'transactionId': 'txn-123',
            'amount': '2000000.00',
            'currency': 'USD',
            'cardLast4': '1234'
        }

        with pytest.raises(payment_processor.PaymentValidationError) as exc_info:
            payment_processor.process_payment_data(payment_data)

        assert 'exceeds maximum' in str(exc_info.value).lower()

    def test_invalid_card_last4_length(self):
        """Test validation fails with invalid cardLast4 length"""
        payment_data = {
            'transactionId': 'txn-123',
            'amount': '100.00',
            'currency': 'USD',
            'cardLast4': '123'  # Only 3 digits
        }

        with pytest.raises(payment_processor.PaymentValidationError) as exc_info:
            payment_processor.process_payment_data(payment_data)

        assert '4 digits' in str(exc_info.value).lower()

    def test_invalid_card_last4_non_numeric(self):
        """Test validation fails with non-numeric cardLast4"""
        payment_data = {
            'transactionId': 'txn-123',
            'amount': '100.00',
            'currency': 'USD',
            'cardLast4': 'ABCD'
        }

        with pytest.raises(payment_processor.PaymentValidationError) as exc_info:
            payment_processor.process_payment_data(payment_data)

        assert '4 digits' in str(exc_info.value).lower()

    def test_invalid_currency(self):
        """Test validation fails with unsupported currency"""
        payment_data = {
            'transactionId': 'txn-123',
            'amount': '100.00',
            'currency': 'XYZ',
            'cardLast4': '1234'
        }

        with pytest.raises(payment_processor.PaymentValidationError) as exc_info:
            payment_processor.process_payment_data(payment_data)

        assert 'Unsupported currency' in str(exc_info.value)


class TestS3FileProcessing:
    """Test S3 file processing"""

    @patch('payment_processor.s3_client')
    @patch('payment_processor.process_payment_data')
    def test_process_payment_file_success(self, mock_process_data, mock_s3):
        """Test successful file processing from S3"""
        # Mock S3 response
        payment_data = {
            'transactionId': 'txn-123',
            'amount': '100.00',
            'currency': 'USD',
            'cardLast4': '1234'
        }

        mock_response = {
            'Body': Mock(read=Mock(return_value=json.dumps(payment_data).encode())),
            'ServerSideEncryption': 'aws:kms'
        }
        mock_s3.get_object.return_value = mock_response

        payment_processor.process_payment_file('test-bucket', 'test-file.json')

        mock_s3.get_object.assert_called_once_with(
            Bucket='test-bucket',
            Key='test-file.json'
        )
        mock_process_data.assert_called_once()

    @patch('payment_processor.s3_client')
    def test_process_payment_file_not_encrypted(self, mock_s3):
        """Test fails when file is not encrypted"""
        mock_response = {
            'Body': Mock(read=Mock(return_value=b'{"test": "data"}')),
            # Missing ServerSideEncryption
        }
        mock_s3.get_object.return_value = mock_response

        with pytest.raises(payment_processor.PaymentValidationError) as exc_info:
            payment_processor.process_payment_file('test-bucket', 'test-file.json')

        assert 'not encrypted' in str(exc_info.value).lower()

    @patch('payment_processor.s3_client')
    def test_process_payment_file_invalid_json(self, mock_s3):
        """Test fails with invalid JSON"""
        mock_response = {
            'Body': Mock(read=Mock(return_value=b'invalid json')),
            'ServerSideEncryption': 'aws:kms'
        }
        mock_s3.get_object.return_value = mock_response

        with pytest.raises(payment_processor.PaymentValidationError) as exc_info:
            payment_processor.process_payment_file('test-bucket', 'test-file.json')

        assert 'Invalid JSON' in str(exc_info.value)


class TestDynamoDBOperations:
    """Test DynamoDB operations"""

    @patch.dict(os.environ, {
        'DYNAMODB_TABLE': 'test-table',
        'S3_BUCKET': 'test-bucket',
        'KMS_KEY_ID': 'test-key'
    })
    @patch('payment_processor.table')
    def test_duplicate_transaction_prevention(self, mock_table):
        """Test duplicate transaction is rejected"""
        # Mock DynamoDB conditional check failure
        from botocore.exceptions import ClientError
        mock_table.put_item.side_effect = ClientError(
            {'Error': {'Code': 'ConditionalCheckFailedException'}},
            'PutItem'
        )
        mock_table.meta.client.exceptions.ConditionalCheckFailedException = ClientError

        payment_data = {
            'transactionId': 'txn-123',
            'amount': '100.00',
            'currency': 'USD',
            'cardLast4': '1234'
        }

        with pytest.raises(payment_processor.PaymentValidationError) as exc_info:
            payment_processor.process_payment_data(payment_data)

        assert 'Duplicate transaction' in str(exc_info.value)


class TestErrorHandling:
    """Test error handling and logging"""

    @patch('payment_processor.process_payment_file')
    def test_handler_handles_processing_errors(self, mock_process):
        """Test handler handles processing errors gracefully"""
        mock_process.side_effect = Exception('Processing failed')

        event = {
            'Records': [
                {
                    's3': {
                        'bucket': {'name': 'test-bucket'},
                        'object': {'key': 'test-file.json'}
                    }
                }
            ]
        }
        context = Mock(request_id='test-123')

        response = payment_processor.lambda_handler(event, context)

        assert response['statusCode'] == 500
        body = json.loads(response['body'])
        assert 'error' in body

    @patch('payment_processor.process_payment_data')
    def test_handler_returns_validation_error(self, mock_process):
        """Test handler returns 400 for validation errors"""
        mock_process.side_effect = payment_processor.PaymentValidationError('Invalid data')

        event = {
            'payment_data': {
                'transactionId': 'txn-123',
                'amount': 'invalid',
                'currency': 'USD',
                'cardLast4': '1234'
            }
        }
        context = Mock(request_id='test-123')

        response = payment_processor.lambda_handler(event, context)

        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'validation' in body['error'].lower()
