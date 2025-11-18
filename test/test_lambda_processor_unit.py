"""
Unit tests for Lambda processor function.
Tests all functions with 100% coverage including edge cases and error paths.
"""
import json
import pytest
import sys
import os
from unittest.mock import Mock, patch, MagicMock
from io import StringIO
from datetime import datetime

# Add lib/lambda to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib', 'lambda'))

# Import after path setup
import processor


class TestProcessorHandler:
    """Tests for the main Lambda handler function."""

    @patch.dict(os.environ, {
        'OUTPUT_BUCKET': 'test-output',
        'AUDIT_BUCKET': 'test-audit',
        'DLQ_URL': 'https://sqs.test.com/dlq',
        'ENVIRONMENT_SUFFIX': 'test'
    })
    @patch('processor.s3_client')
    @patch('processor.save_processed_data')
    @patch('processor.save_audit_log')
    def test_handler_success_csv(self, mock_save_audit, mock_save_processed, mock_s3):
        """Test successful handler execution with CSV file."""
        # Setup
        mock_s3.get_object.return_value = {
            'Body': Mock(read=lambda: b'transaction_id,amount,account_id,timestamp\nTXN001,100.50,ACC123,2024-01-01T10:00:00Z')
        }

        event = {
            'detail': {
                'bucket': {'name': 'input-bucket'},
                'object': {'key': 'test.csv'}
            }
        }
        context = Mock()

        # Execute
        result = processor.handler(event, context)

        # Verify
        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['message'] == 'Processing completed successfully'
        assert body['records_processed'] == 1
        assert body['records_valid'] == 1
        assert body['records_invalid'] == 0

        # Verify mocks called
        mock_s3.get_object.assert_called_once_with(Bucket='input-bucket', Key='test.csv')
        mock_save_processed.assert_called_once()
        mock_save_audit.assert_called_once()

    @patch.dict(os.environ, {
        'OUTPUT_BUCKET': 'test-output',
        'AUDIT_BUCKET': 'test-audit',
        'DLQ_URL': 'https://sqs.test.com/dlq',
        'ENVIRONMENT_SUFFIX': 'test'
    })
    @patch('processor.s3_client')
    @patch('processor.send_to_dlq')
    def test_handler_s3_error(self, mock_dlq, mock_s3):
        """Test handler when S3 get_object fails."""
        # Setup
        mock_s3.get_object.side_effect = Exception('S3 error')

        event = {
            'detail': {
                'bucket': {'name': 'input-bucket'},
                'object': {'key': 'test.csv'}
            }
        }
        context = Mock()

        # Execute and verify exception
        with pytest.raises(Exception, match='S3 error'):
            processor.handler(event, context)

        # Verify DLQ called
        mock_dlq.assert_called_once()

    @patch.dict(os.environ, {
        'OUTPUT_BUCKET': 'test-output',
        'AUDIT_BUCKET': 'test-audit',
        'DLQ_URL': 'https://sqs.test.com/dlq',
        'ENVIRONMENT_SUFFIX': 'test'
    })
    @patch('processor.s3_client')
    @patch('processor.send_to_dlq')
    def test_handler_dlq_failure(self, mock_dlq, mock_s3):
        """Test handler when both processing and DLQ fail."""
        # Setup
        mock_s3.get_object.side_effect = Exception('S3 error')
        mock_dlq.side_effect = Exception('DLQ error')

        event = {
            'detail': {
                'bucket': {'name': 'input-bucket'},
                'object': {'key': 'test.csv'}
            }
        }
        context = Mock()

        # Execute and verify exception
        with pytest.raises(Exception, match='S3 error'):
            processor.handler(event, context)


class TestProcessTransactions:
    """Tests for transaction processing function."""

    def test_process_transactions_csv_valid(self):
        """Test processing valid CSV transactions."""
        csv_content = 'transaction_id,amount,account_id,timestamp\nTXN001,100.50,ACC123,2024-01-01T10:00:00Z\nTXN002,50.00,ACC456,2024-01-01T11:00:00Z'

        result = processor.process_transactions(csv_content, 'test.csv')

        assert result['total_records'] == 2
        assert result['valid_records'] == 2
        assert result['invalid_records'] == 0
        assert len(result['processed_transactions']) == 2
        assert result['audit_data']['file'] == 'test.csv'

    def test_process_transactions_json_array(self):
        """Test processing JSON array format."""
        json_content = json.dumps([
            {'transaction_id': 'TXN001', 'amount': 100.50, 'account_id': 'ACC123', 'timestamp': '2024-01-01T10:00:00Z'}
        ])

        result = processor.process_transactions(json_content, 'test.json')

        assert result['total_records'] == 1
        assert result['valid_records'] == 1
        assert len(result['processed_transactions']) == 1

    def test_process_transactions_json_object(self):
        """Test processing JSON object with transactions field."""
        json_content = json.dumps({
            'transactions': [
                {'transaction_id': 'TXN001', 'amount': 100.50, 'account_id': 'ACC123', 'timestamp': '2024-01-01T10:00:00Z'}
            ]
        })

        result = processor.process_transactions(json_content, 'test.json')

        assert result['total_records'] == 1
        assert result['valid_records'] == 1

    def test_process_transactions_with_invalid_records(self):
        """Test processing with some invalid transactions."""
        csv_content = 'transaction_id,amount,account_id,timestamp\nTXN001,100.50,ACC123,2024-01-01T10:00:00Z\nTXN002,invalid,ACC456,2024-01-01T11:00:00Z'

        result = processor.process_transactions(csv_content, 'test.csv')

        assert result['total_records'] == 2
        assert result['valid_records'] == 1
        assert result['invalid_records'] == 1
        assert len(result['audit_data']['invalid_details']) == 1


class TestProcessCSVFormat:
    """Tests for CSV format processing."""

    def test_process_csv_format_valid(self):
        """Test parsing valid CSV content."""
        csv_content = 'transaction_id,amount,account_id,timestamp\nTXN001,100.50,ACC123,2024-01-01T10:00:00Z'

        transactions = processor.process_csv_format(csv_content)

        assert len(transactions) == 1
        assert transactions[0]['transaction_id'] == 'TXN001'
        assert transactions[0]['amount'] == '100.50'

    def test_process_csv_format_empty(self):
        """Test parsing empty CSV."""
        csv_content = 'transaction_id,amount,account_id,timestamp'

        transactions = processor.process_csv_format(csv_content)

        assert len(transactions) == 0


class TestProcessJSONFormat:
    """Tests for JSON format processing."""

    def test_process_json_format_array(self):
        """Test parsing JSON array."""
        json_content = json.dumps([{'id': '1'}, {'id': '2'}])

        transactions = processor.process_json_format(json_content)

        assert len(transactions) == 2
        assert transactions[0]['id'] == '1'

    def test_process_json_format_object_with_transactions(self):
        """Test parsing JSON object with transactions field."""
        json_content = json.dumps({'transactions': [{'id': '1'}]})

        transactions = processor.process_json_format(json_content)

        assert len(transactions) == 1

    def test_process_json_format_invalid(self):
        """Test parsing invalid JSON format."""
        json_content = json.dumps({'data': [{'id': '1'}]})

        with pytest.raises(ValueError, match='Invalid JSON format'):
            processor.process_json_format(json_content)


class TestValidateTransaction:
    """Tests for transaction validation."""

    def test_validate_transaction_valid(self):
        """Test validation of valid transaction."""
        transaction = {
            'transaction_id': 'TXN001',
            'amount': '100.50',
            'account_id': 'ACC123',
            'timestamp': '2024-01-01T10:00:00Z'
        }

        result = processor.validate_transaction(transaction, 0)

        assert result == transaction

    def test_validate_transaction_missing_field(self):
        """Test validation with missing required field."""
        transaction = {
            'transaction_id': 'TXN001',
            'amount': '100.50',
            'timestamp': '2024-01-01T10:00:00Z'
        }

        with pytest.raises(ValueError, match='Missing required field: account_id'):
            processor.validate_transaction(transaction, 0)

    def test_validate_transaction_empty_field(self):
        """Test validation with empty required field."""
        transaction = {
            'transaction_id': 'TXN001',
            'amount': '100.50',
            'account_id': '',
            'timestamp': '2024-01-01T10:00:00Z'
        }

        with pytest.raises(ValueError, match='Missing required field: account_id'):
            processor.validate_transaction(transaction, 0)

    def test_validate_transaction_invalid_amount(self):
        """Test validation with invalid amount format."""
        transaction = {
            'transaction_id': 'TXN001',
            'amount': 'invalid',
            'account_id': 'ACC123',
            'timestamp': '2024-01-01T10:00:00Z'
        }

        with pytest.raises(ValueError, match='Invalid amount format'):
            processor.validate_transaction(transaction, 0)

    def test_validate_transaction_negative_amount(self):
        """Test validation with negative amount."""
        transaction = {
            'transaction_id': 'TXN001',
            'amount': '-100.50',
            'account_id': 'ACC123',
            'timestamp': '2024-01-01T10:00:00Z'
        }

        with pytest.raises(ValueError, match='Invalid amount format'):
            processor.validate_transaction(transaction, 0)

    def test_validate_transaction_empty_transaction_id(self):
        """Test validation with empty transaction ID."""
        transaction = {
            'transaction_id': '   ',
            'amount': '100.50',
            'account_id': 'ACC123',
            'timestamp': '2024-01-01T10:00:00Z'
        }

        with pytest.raises(ValueError, match='Transaction ID cannot be empty'):
            processor.validate_transaction(transaction, 0)

    def test_validate_transaction_empty_account_id(self):
        """Test validation with empty account ID."""
        transaction = {
            'transaction_id': 'TXN001',
            'amount': '100.50',
            'account_id': '  ',
            'timestamp': '2024-01-01T10:00:00Z'
        }

        with pytest.raises(ValueError, match='Account ID cannot be empty'):
            processor.validate_transaction(transaction, 0)


class TestEnrichTransaction:
    """Tests for transaction enrichment."""

    def test_enrich_transaction_positive_amount(self):
        """Test enrichment of transaction with positive amount."""
        transaction = {
            'transaction_id': 'TXN001',
            'amount': '100.50',
            'account_id': 'ACC123',
            'timestamp': '2024-01-01T10:00:00Z'
        }

        result = processor.enrich_transaction(transaction)

        assert 'processed_at' in result
        assert 'environment' in result
        assert result['amount_float'] == 100.50
        assert result['transaction_type'] == 'credit'
        assert result['category'] == 'medium'

    @patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': 'test-env'})
    def test_enrich_transaction_zero_amount(self):
        """Test enrichment of transaction with zero amount."""
        transaction = {
            'transaction_id': 'TXN001',
            'amount': '0',
            'account_id': 'ACC123',
            'timestamp': '2024-01-01T10:00:00Z'
        }

        result = processor.enrich_transaction(transaction)

        assert result['amount_float'] == 0.0
        assert result['transaction_type'] == 'credit'
        assert result['category'] == 'small'


class TestCategorizeTransaction:
    """Tests for transaction categorization."""

    def test_categorize_small_transaction(self):
        """Test categorization of small transaction."""
        transaction = {'amount': '25.00'}

        result = processor.categorize_transaction(transaction)

        assert result == 'small'

    def test_categorize_medium_transaction(self):
        """Test categorization of medium transaction."""
        transaction = {'amount': '500.00'}

        result = processor.categorize_transaction(transaction)

        assert result == 'medium'

    def test_categorize_large_transaction(self):
        """Test categorization of large transaction."""
        transaction = {'amount': '5000.00'}

        result = processor.categorize_transaction(transaction)

        assert result == 'large'

    def test_categorize_boundary_small_medium(self):
        """Test categorization at boundary between small and medium."""
        transaction = {'amount': '49.99'}
        assert processor.categorize_transaction(transaction) == 'small'

        transaction = {'amount': '50.00'}
        assert processor.categorize_transaction(transaction) == 'medium'

    def test_categorize_boundary_medium_large(self):
        """Test categorization at boundary between medium and large."""
        transaction = {'amount': '999.99'}
        assert processor.categorize_transaction(transaction) == 'medium'

        transaction = {'amount': '1000.00'}
        assert processor.categorize_transaction(transaction) == 'large'


class TestSaveProcessedData:
    """Tests for saving processed data to S3."""

    @patch('processor.s3_client')
    def test_save_processed_data_success(self, mock_s3):
        """Test successful save of processed data."""
        transactions = [{'id': '1'}, {'id': '2'}]

        with patch('processor.OUTPUT_BUCKET', 'test-output'):
            processor.save_processed_data(transactions, 'path/to/test.csv')

            # Verify S3 put_object called
            mock_s3.put_object.assert_called_once()
            call_args = mock_s3.put_object.call_args
            assert call_args[1]['Bucket'] == 'test-output'
            assert 'year=' in call_args[1]['Key']
            assert 'month=' in call_args[1]['Key']
            assert 'day=' in call_args[1]['Key']
            assert call_args[1]['ContentType'] == 'application/json'
            assert call_args[1]['ServerSideEncryption'] == 'AES256'

    @patch.dict(os.environ, {'OUTPUT_BUCKET': 'test-output'})
    @patch('processor.s3_client')
    def test_save_processed_data_empty(self, mock_s3):
        """Test save with empty transaction list."""
        processor.save_processed_data([], 'test.csv')

        # Verify S3 not called for empty list
        mock_s3.put_object.assert_not_called()

    @patch.dict(os.environ, {'OUTPUT_BUCKET': 'test-output'})
    @patch('processor.s3_client')
    def test_save_processed_data_with_subdirectory(self, mock_s3):
        """Test save with file in subdirectory."""
        transactions = [{'id': '1'}]

        processor.save_processed_data(transactions, 'dir/subdir/test.json')

        # Verify filename extracted correctly
        call_args = mock_s3.put_object.call_args
        assert 'processed_test.json.json' in call_args[1]['Key']


class TestSaveAuditLog:
    """Tests for saving audit logs to S3."""

    @patch('processor.s3_client')
    def test_save_audit_log_success(self, mock_s3):
        """Test successful save of audit log."""
        audit_data = {
            'file': 'test.csv',
            'total_records': 10,
            'valid_records': 8,
            'invalid_records': 2
        }

        with patch('processor.AUDIT_BUCKET', 'test-audit'):
            processor.save_audit_log(audit_data, 'test.csv')

            # Verify S3 put_object called
            mock_s3.put_object.assert_called_once()
            call_args = mock_s3.put_object.call_args
            assert call_args[1]['Bucket'] == 'test-audit'
            assert 'audit_logs/' in call_args[1]['Key']
            assert 'test.csv_audit.json' in call_args[1]['Key']
            assert call_args[1]['ContentType'] == 'application/json'
            assert call_args[1]['ServerSideEncryption'] == 'AES256'

    @patch.dict(os.environ, {'AUDIT_BUCKET': 'test-audit'})
    @patch('processor.s3_client')
    def test_save_audit_log_with_path(self, mock_s3):
        """Test audit log save with file path."""
        audit_data = {'file': 'dir/test.csv'}

        processor.save_audit_log(audit_data, 'dir/subdir/test.csv')

        # Verify filename extracted from path
        call_args = mock_s3.put_object.call_args
        assert 'test.csv_audit.json' in call_args[1]['Key']


class TestSendToDLQ:
    """Tests for sending messages to DLQ."""

    @patch('processor.sqs_client')
    def test_send_to_dlq_success(self, mock_sqs):
        """Test successful send to DLQ."""
        event = {'detail': {'bucket': {'name': 'test'}}}
        error_message = 'Test error'

        with patch('processor.DLQ_URL', 'https://sqs.test.com/dlq'):
            with patch('processor.ENVIRONMENT_SUFFIX', 'test-env'):
                processor.send_to_dlq(event, error_message)

                # Verify SQS send_message called
                mock_sqs.send_message.assert_called_once()
                call_args = mock_sqs.send_message.call_args
                assert call_args[1]['QueueUrl'] == 'https://sqs.test.com/dlq'

                message_body = json.loads(call_args[1]['MessageBody'])
                assert message_body['event'] == event
                assert message_body['error'] == 'Test error'
                assert 'timestamp' in message_body
                assert message_body['environment'] == 'test-env'


class TestModuleLevelCode:
    """Tests for module-level code and initialization."""

    def test_logger_configuration(self):
        """Test logger is properly configured."""
        assert processor.logger is not None
        assert processor.logger.level in [10, 20]  # INFO or WARNING level

    def test_environment_variables_loaded(self):
        """Test environment variables are loaded at module level."""
        with patch.dict(os.environ, {
            'OUTPUT_BUCKET': 'env-output',
            'AUDIT_BUCKET': 'env-audit',
            'DLQ_URL': 'env-dlq',
            'ENVIRONMENT_SUFFIX': 'env-suffix'
        }):
            # Reload module to pick up env vars
            import importlib
            importlib.reload(processor)

            assert processor.OUTPUT_BUCKET == 'env-output'
            assert processor.AUDIT_BUCKET == 'env-audit'
            assert processor.DLQ_URL == 'env-dlq'
            assert processor.ENVIRONMENT_SUFFIX == 'env-suffix'
