"""Unit tests for validation Lambda function"""
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
import validation


@pytest.fixture
def lambda_context():
    """Mock Lambda context"""
    context = MagicMock()
    context.function_name = 'test-validation'
    context.memory_limit_in_mb = 512
    context.invoked_function_arn = 'arn:aws:lambda:us-east-1:123456789012:function:test-validation'
    context.aws_request_id = 'test-request-id'
    return context


@pytest.fixture
def mock_dynamodb():
    """Mock DynamoDB resource"""
    with patch('validation.dynamodb') as mock_db:
        mock_table = MagicMock()
        mock_db.Table.return_value = mock_table
        yield mock_table


@pytest.fixture
def mock_sqs():
    """Mock SQS client"""
    with patch('validation.sqs') as mock_sqs_client:
        yield mock_sqs_client


@pytest.fixture
def setup_env():
    """Setup environment variables"""
    os.environ['DYNAMODB_TABLE'] = 'test-webhooks'
    os.environ['SQS_QUEUE_URL'] = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue.fifo'
    os.environ['WEBHOOK_SECRET'] = 'test-secret-key'
    yield
    # Cleanup
    if 'DYNAMODB_TABLE' in os.environ:
        del os.environ['DYNAMODB_TABLE']
    if 'SQS_QUEUE_URL' in os.environ:
        del os.environ['SQS_QUEUE_URL']
    if 'WEBHOOK_SECRET' in os.environ:
        del os.environ['WEBHOOK_SECRET']


class TestValidationLambda:
    """Test validation Lambda function"""

    def test_lambda_handler_valid_signature(self, lambda_context, mock_dynamodb, mock_sqs, setup_env):
        """Test lambda_handler with valid signature"""
        # Create test payload
        body = {'merchant_id': 'test123', 'amount': 100}
        body_str = json.dumps(body)

        # Calculate valid signature
        import hmac
        import hashlib
        signature = hmac.new(
            'test-secret-key'.encode('utf-8'),
            body_str.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        event = {
            'body': body_str,
            'headers': {'X-Webhook-Signature': signature},
            'requestContext': {
                'identity': {'sourceIp': '1.2.3.4'}
            }
        }

        # Execute
        with patch('validation.uuid.uuid4', return_value='test-webhook-id'):
            with patch('validation.time.time', return_value=1234567890):
                result = validation.lambda_handler(event, lambda_context)

        # Assert response
        assert result['statusCode'] == 200
        body_response = json.loads(result['body'])
        assert 'webhook_id' in body_response
        assert body_response['message'] == 'Webhook received and queued for processing'

        # Verify DynamoDB put_item was called
        mock_dynamodb.put_item.assert_called_once()
        call_args = mock_dynamodb.put_item.call_args[1]
        assert 'Item' in call_args
        assert call_args['Item']['webhook_id'] == 'test-webhook-id'
        assert 'expiry_time' in call_args['Item']

        # Verify SQS send_message was called
        mock_sqs.send_message.assert_called_once()
        sqs_call_args = mock_sqs.send_message.call_args[1]
        assert 'QueueUrl' in sqs_call_args
        assert 'MessageBody' in sqs_call_args
        assert 'MessageGroupId' in sqs_call_args
        assert 'MessageDeduplicationId' in sqs_call_args

    def test_lambda_handler_invalid_signature(self, lambda_context, mock_dynamodb, mock_sqs, setup_env):
        """Test lambda_handler with invalid signature"""
        body = {'merchant_id': 'test123', 'amount': 100}
        event = {
            'body': json.dumps(body),
            'headers': {'X-Webhook-Signature': 'invalid-signature'},
            'requestContext': {
                'identity': {'sourceIp': '1.2.3.4'}
            }
        }

        result = validation.lambda_handler(event, lambda_context)

        assert result['statusCode'] == 401
        body_response = json.loads(result['body'])
        assert 'error' in body_response
        assert body_response['error'] == 'Invalid signature'

        # Verify DynamoDB and SQS were not called
        mock_dynamodb.put_item.assert_not_called()
        mock_sqs.send_message.assert_not_called()

    def test_lambda_handler_missing_signature(self, lambda_context, mock_dynamodb, mock_sqs, setup_env):
        """Test lambda_handler with missing signature"""
        body = {'merchant_id': 'test123', 'amount': 100}
        event = {
            'body': json.dumps(body),
            'headers': {},
            'requestContext': {
                'identity': {'sourceIp': '1.2.3.4'}
            }
        }

        result = validation.lambda_handler(event, lambda_context)

        assert result['statusCode'] == 401
        body_response = json.loads(result['body'])
        assert body_response['error'] == 'Invalid signature'

    def test_lambda_handler_empty_body(self, lambda_context, mock_dynamodb, mock_sqs, setup_env):
        """Test lambda_handler with empty body"""
        event = {
            'body': '',
            'headers': {'X-Webhook-Signature': 'test'},
            'requestContext': {
                'identity': {'sourceIp': '1.2.3.4'}
            }
        }

        result = validation.lambda_handler(event, lambda_context)

        # Should return 401 due to invalid signature
        assert result['statusCode'] == 401

    def test_lambda_handler_exception_handling(self, lambda_context, mock_dynamodb, mock_sqs, setup_env):
        """Test lambda_handler exception handling"""
        # Mock DynamoDB to raise exception
        mock_dynamodb.put_item.side_effect = Exception('Database error')

        body = {'merchant_id': 'test123', 'amount': 100}
        body_str = json.dumps(body)

        # Calculate valid signature
        import hmac
        import hashlib
        signature = hmac.new(
            'test-secret-key'.encode('utf-8'),
            body_str.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        event = {
            'body': body_str,
            'headers': {'X-Webhook-Signature': signature},
            'requestContext': {
                'identity': {'sourceIp': '1.2.3.4'}
            }
        }

        result = validation.lambda_handler(event, lambda_context)

        assert result['statusCode'] == 500
        body_response = json.loads(result['body'])
        assert 'error' in body_response

    def test_validate_signature_valid(self, setup_env):
        """Test validate_signature with valid signature"""
        payload = 'test payload'
        import hmac
        import hashlib
        signature = hmac.new(
            'test-secret-key'.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        result = validation.validate_signature(payload, signature)
        assert result is True

    def test_validate_signature_invalid(self, setup_env):
        """Test validate_signature with invalid signature"""
        payload = 'test payload'
        signature = 'invalid-signature'

        result = validation.validate_signature(payload, signature)
        assert result is False

    def test_validate_signature_empty(self, setup_env):
        """Test validate_signature with empty signature"""
        payload = 'test payload'
        signature = ''

        result = validation.validate_signature(payload, signature)
        assert result is False

    def test_validate_signature_none(self, setup_env):
        """Test validate_signature with None signature"""
        payload = 'test payload'
        signature = None

        result = validation.validate_signature(payload, signature)
        assert result is False

    def test_message_group_id_from_payload(self, lambda_context, mock_dynamodb, mock_sqs, setup_env):
        """Test that MessageGroupId is extracted from merchant_id"""
        body = {'merchant_id': 'merchant123', 'amount': 100}
        body_str = json.dumps(body)

        import hmac
        import hashlib
        signature = hmac.new(
            'test-secret-key'.encode('utf-8'),
            body_str.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        event = {
            'body': body_str,
            'headers': {'X-Webhook-Signature': signature},
            'requestContext': {
                'identity': {'sourceIp': '1.2.3.4'}
            }
        }

        with patch('validation.uuid.uuid4', return_value='test-id'):
            with patch('validation.time.time', return_value=1234567890):
                validation.lambda_handler(event, lambda_context)

        # Verify MessageGroupId uses merchant_id
        sqs_call_args = mock_sqs.send_message.call_args[1]
        assert sqs_call_args['MessageGroupId'] == 'merchant123'

    def test_message_group_id_default(self, lambda_context, mock_dynamodb, mock_sqs, setup_env):
        """Test that MessageGroupId defaults when merchant_id missing"""
        body = {'amount': 100}  # No merchant_id
        body_str = json.dumps(body)

        import hmac
        import hashlib
        signature = hmac.new(
            'test-secret-key'.encode('utf-8'),
            body_str.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        event = {
            'body': body_str,
            'headers': {'X-Webhook-Signature': signature},
            'requestContext': {
                'identity': {'sourceIp': '1.2.3.4'}
            }
        }

        with patch('validation.uuid.uuid4', return_value='test-id'):
            with patch('validation.time.time', return_value=1234567890):
                validation.lambda_handler(event, lambda_context)

        # Verify MessageGroupId uses default
        sqs_call_args = mock_sqs.send_message.call_args[1]
        assert sqs_call_args['MessageGroupId'] == 'default'

    def test_expiry_time_calculation(self, lambda_context, mock_dynamodb, mock_sqs, setup_env):
        """Test that expiry_time is set to 30 days in future"""
        body = {'merchant_id': 'test123', 'amount': 100}
        body_str = json.dumps(body)

        import hmac
        import hashlib
        signature = hmac.new(
            'test-secret-key'.encode('utf-8'),
            body_str.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        event = {
            'body': body_str,
            'headers': {'X-Webhook-Signature': signature},
            'requestContext': {
                'identity': {'sourceIp': '1.2.3.4'}
            }
        }

        from datetime import datetime, timedelta
        mock_now = datetime(2024, 1, 1)
        expected_expiry = int((mock_now + timedelta(days=30)).timestamp())

        with patch('validation.datetime') as mock_datetime:
            mock_datetime.now.return_value = mock_now
            with patch('validation.uuid.uuid4', return_value='test-id'):
                with patch('validation.time.time', return_value=1234567890):
                    validation.lambda_handler(event, lambda_context)

        # Verify expiry_time in DynamoDB call
        dynamo_call_args = mock_dynamodb.put_item.call_args[1]
        assert dynamo_call_args['Item']['expiry_time'] == expected_expiry
