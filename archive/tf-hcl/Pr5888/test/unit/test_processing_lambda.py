"""Unit tests for processing Lambda function"""
import json
import os
import sys
from unittest import mock
from unittest.mock import MagicMock, patch
import pytest

# Add lib/lambda to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/lambda'))

# Mock boto3 before importing
sys.modules['boto3'] = MagicMock()

# Now import the Lambda function
import processing


@pytest.fixture
def lambda_context():
    """Mock Lambda context"""
    context = MagicMock()
    context.function_name = 'test-processing'
    context.memory_limit_in_mb = 512
    context.invoked_function_arn = 'arn:aws:lambda:us-east-1:123456789012:function:test-processing'
    context.aws_request_id = 'test-request-id'
    return context


@pytest.fixture
def mock_sns():
    """Mock SNS client"""
    with patch('processing.sns') as mock_sns_client:
        yield mock_sns_client


@pytest.fixture
def setup_env():
    """Setup environment variables"""
    os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'
    yield
    # Cleanup
    if 'SNS_TOPIC_ARN' in os.environ:
        del os.environ['SNS_TOPIC_ARN']


class TestProcessingLambda:
    """Test processing Lambda function"""

    def test_lambda_handler_single_record(self, lambda_context, mock_sns, setup_env):
        """Test lambda_handler with single SQS record"""
        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'webhook_id': 'test-webhook-1',
                        'payload': {'merchant_id': 'merchant1', 'amount': 100}
                    })
                }
            ]
        }

        with patch('processing.datetime') as mock_datetime:
            mock_datetime.now.return_value.isoformat.return_value = '2024-01-01T00:00:00'
            result = processing.lambda_handler(event, lambda_context)

        # Assert response
        assert result['statusCode'] == 200
        body_response = json.loads(result['body'])
        assert body_response['processed'] == 1
        assert body_response['failed'] == 0

        # Verify SNS publish was called
        mock_sns.publish.assert_called_once()
        call_args = mock_sns.publish.call_args[1]
        assert call_args['TopicArn'] == 'arn:aws:sns:us-east-1:123456789012:test-topic'
        assert 'Message' in call_args
        assert 'Subject' in call_args

    def test_lambda_handler_multiple_records(self, lambda_context, mock_sns, setup_env):
        """Test lambda_handler with multiple SQS records"""
        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'webhook_id': f'test-webhook-{i}',
                        'payload': {'merchant_id': f'merchant{i}', 'amount': 100 * i}
                    })
                }
                for i in range(1, 6)
            ]
        }

        with patch('processing.datetime') as mock_datetime:
            mock_datetime.now.return_value.isoformat.return_value = '2024-01-01T00:00:00'
            result = processing.lambda_handler(event, lambda_context)

        # Assert response
        assert result['statusCode'] == 200
        body_response = json.loads(result['body'])
        assert body_response['processed'] == 5
        assert body_response['failed'] == 0

        # Verify SNS publish was called for each record
        assert mock_sns.publish.call_count == 5

    def test_lambda_handler_batch_of_10(self, lambda_context, mock_sns, setup_env):
        """Test lambda_handler with batch of 10 records (max batch size)"""
        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'webhook_id': f'test-webhook-{i}',
                        'payload': {'merchant_id': f'merchant{i}', 'amount': 100}
                    })
                }
                for i in range(1, 11)
            ]
        }

        with patch('processing.datetime') as mock_datetime:
            mock_datetime.now.return_value.isoformat.return_value = '2024-01-01T00:00:00'
            result = processing.lambda_handler(event, lambda_context)

        # Assert response
        assert result['statusCode'] == 200
        body_response = json.loads(result['body'])
        assert body_response['processed'] == 10
        assert body_response['failed'] == 0

        # Verify SNS publish was called for all records
        assert mock_sns.publish.call_count == 10

    def test_lambda_handler_record_processing_failure(self, lambda_context, mock_sns, setup_env):
        """Test lambda_handler when record processing fails"""
        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'webhook_id': 'test-webhook-1',
                        'payload': {'merchant_id': 'merchant1', 'amount': 100}
                    })
                }
            ]
        }

        # Mock SNS to raise exception
        mock_sns.publish.side_effect = Exception('SNS publish failed')

        with pytest.raises(Exception, match='SNS publish failed'):
            processing.lambda_handler(event, lambda_context)

    def test_lambda_handler_partial_batch_failure(self, lambda_context, mock_sns, setup_env):
        """Test lambda_handler when one record in batch fails"""
        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'webhook_id': 'test-webhook-1',
                        'payload': {'merchant_id': 'merchant1', 'amount': 100}
                    })
                },
                {
                    'body': json.dumps({
                        'webhook_id': 'test-webhook-2',
                        'payload': {'merchant_id': 'merchant2', 'amount': 200}
                    })
                }
            ]
        }

        # Mock SNS to fail on second call
        mock_sns.publish.side_effect = [None, Exception('SNS publish failed')]

        with pytest.raises(Exception, match='SNS publish failed'):
            with patch('processing.datetime') as mock_datetime:
                mock_datetime.now.return_value.isoformat.return_value = '2024-01-01T00:00:00'
                processing.lambda_handler(event, lambda_context)

        # Verify first call succeeded
        assert mock_sns.publish.call_count == 2

    def test_lambda_handler_invalid_json_body(self, lambda_context, mock_sns, setup_env):
        """Test lambda_handler with invalid JSON in record body"""
        event = {
            'Records': [
                {
                    'body': 'invalid json'
                }
            ]
        }

        with pytest.raises(Exception):
            processing.lambda_handler(event, lambda_context)

    def test_lambda_handler_missing_webhook_id(self, lambda_context, mock_sns, setup_env):
        """Test lambda_handler with missing webhook_id in message"""
        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'payload': {'merchant_id': 'merchant1', 'amount': 100}
                        # Missing webhook_id
                    })
                }
            ]
        }

        with pytest.raises(Exception):
            processing.lambda_handler(event, lambda_context)

    def test_process_webhook(self, setup_env):
        """Test process_webhook function"""
        webhook_id = 'test-webhook-123'
        payload = {'merchant_id': 'merchant1', 'amount': 100, 'currency': 'USD'}

        with patch('processing.datetime') as mock_datetime:
            mock_datetime.now.return_value.isoformat.return_value = '2024-01-01T00:00:00'
            result = processing.process_webhook(webhook_id, payload)

        # Verify result structure
        assert 'webhook_id' in result
        assert result['webhook_id'] == webhook_id
        assert 'processed_at' in result
        assert result['processed_at'] == '2024-01-01T00:00:00'
        assert 'payload_size' in result
        assert result['payload_size'] > 0

    def test_process_webhook_large_payload(self, setup_env):
        """Test process_webhook with large payload"""
        webhook_id = 'test-webhook-123'
        payload = {
            'merchant_id': 'merchant1',
            'amount': 100,
            'data': 'x' * 10000  # Large data
        }

        with patch('processing.datetime') as mock_datetime:
            mock_datetime.now.return_value.isoformat.return_value = '2024-01-01T00:00:00'
            result = processing.process_webhook(webhook_id, payload)

        # Verify payload size is calculated correctly
        assert result['payload_size'] > 10000

    def test_sns_message_attributes(self, lambda_context, mock_sns, setup_env):
        """Test that SNS message includes correct attributes"""
        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'webhook_id': 'test-webhook-1',
                        'payload': {'merchant_id': 'merchant1', 'amount': 100}
                    })
                }
            ]
        }

        with patch('processing.datetime') as mock_datetime:
            mock_datetime.now.return_value.isoformat.return_value = '2024-01-01T00:00:00'
            processing.lambda_handler(event, lambda_context)

        # Verify SNS message attributes
        call_args = mock_sns.publish.call_args[1]
        assert 'MessageAttributes' in call_args
        assert 'webhook_id' in call_args['MessageAttributes']
        assert 'status' in call_args['MessageAttributes']
        assert call_args['MessageAttributes']['webhook_id']['StringValue'] == 'test-webhook-1'
        assert call_args['MessageAttributes']['status']['StringValue'] == 'processed'

    def test_sns_message_structure(self, lambda_context, mock_sns, setup_env):
        """Test that SNS message has correct structure"""
        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'webhook_id': 'test-webhook-1',
                        'payload': {'merchant_id': 'merchant1', 'amount': 100}
                    })
                }
            ]
        }

        with patch('processing.datetime') as mock_datetime:
            mock_datetime.now.return_value.isoformat.return_value = '2024-01-01T00:00:00'
            processing.lambda_handler(event, lambda_context)

        # Verify SNS message structure
        call_args = mock_sns.publish.call_args[1]
        message = json.loads(call_args['Message'])
        assert 'webhook_id' in message
        assert 'status' in message
        assert 'timestamp' in message
        assert 'result' in message
        assert message['status'] == 'processed'

    def test_sns_subject(self, lambda_context, mock_sns, setup_env):
        """Test that SNS message has correct subject"""
        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'webhook_id': 'test-webhook-1',
                        'payload': {'merchant_id': 'merchant1', 'amount': 100}
                    })
                }
            ]
        }

        with patch('processing.datetime') as mock_datetime:
            mock_datetime.now.return_value.isoformat.return_value = '2024-01-01T00:00:00'
            processing.lambda_handler(event, lambda_context)

        # Verify SNS subject
        call_args = mock_sns.publish.call_args[1]
        assert call_args['Subject'] == 'Webhook Processed'

    def test_empty_records_list(self, lambda_context, mock_sns, setup_env):
        """Test lambda_handler with empty Records list"""
        event = {
            'Records': []
        }

        with patch('processing.datetime') as mock_datetime:
            mock_datetime.now.return_value.isoformat.return_value = '2024-01-01T00:00:00'
            result = processing.lambda_handler(event, lambda_context)

        # Should return success with 0 processed
        assert result['statusCode'] == 200
        body_response = json.loads(result['body'])
        assert body_response['processed'] == 0
        assert body_response['failed'] == 0

    def test_batch_processing_error_tracking(self, lambda_context, mock_sns, setup_env):
        """Test that processing counts track errors correctly"""
        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'webhook_id': 'test-webhook-1',
                        'payload': {'merchant_id': 'merchant1', 'amount': 100}
                    })
                },
                {
                    'body': json.dumps({
                        'webhook_id': 'test-webhook-2',
                        'payload': {'merchant_id': 'merchant2', 'amount': 200}
                    })
                }
            ]
        }

        # Make the second publish fail
        mock_sns.publish.side_effect = [None, Exception('Publish failed')]

        with pytest.raises(Exception):
            with patch('processing.datetime') as mock_datetime:
                mock_datetime.now.return_value.isoformat.return_value = '2024-01-01T00:00:00'
                processing.lambda_handler(event, lambda_context)

        # Error is re-raised for DLQ handling
        assert mock_sns.publish.call_count == 2
