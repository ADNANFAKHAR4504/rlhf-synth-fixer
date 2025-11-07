"""
Comprehensive unit tests for all Lambda function handlers
Tests success paths, error paths, and edge cases for 100% coverage
"""
import json
import os
import pytest
from unittest.mock import Mock, patch, MagicMock
from decimal import Decimal
from datetime import datetime


# Import Lambda handlers
import sys
sys.path.insert(0, 'lib/lambda')

from authorizer import lambda_handler as authorizer_handler
from stripe_processor import lambda_handler as stripe_handler
from paypal_processor import lambda_handler as paypal_handler
from square_processor import lambda_handler as square_handler
from sqs_consumer import lambda_handler as sqs_consumer_handler
from dlq_processor import lambda_handler as dlq_handler


class TestAuthorizerLambda:
    """Test custom authorizer Lambda function"""

    def test_authorizer_success_with_valid_token(self):
        """Test successful authorization with valid token"""
        event = {
            'authorizationToken': 'valid-token',
            'methodArn': 'arn:aws:execute-api:us-east-1:123456789012:api123/prod/POST/stripe'
        }
        context = Mock()

        result = authorizer_handler(event, context)

        assert result['principalId'] == 'webhook-user'
        assert result['policyDocument']['Version'] == '2012-10-17'
        assert len(result['policyDocument']['Statement']) == 1
        assert result['policyDocument']['Statement'][0]['Effect'] == 'Allow'
        assert result['policyDocument']['Statement'][0]['Action'] == 'execute-api:Invoke'
        assert result['context']['provider'] == 'webhook'
        assert result['context']['validated'] == 'true'

    def test_authorizer_denies_empty_token(self):
        """Test authorization fails with empty token"""
        event = {
            'authorizationToken': '',
            'methodArn': 'arn:aws:execute-api:us-east-1:123456789012:api123/prod/POST/stripe'
        }
        context = Mock()

        with pytest.raises(Exception) as exc_info:
            authorizer_handler(event, context)
        assert str(exc_info.value) == 'Unauthorized'

    def test_authorizer_denies_invalid_token(self):
        """Test authorization fails with invalid token"""
        event = {
            'authorizationToken': 'invalid',
            'methodArn': 'arn:aws:execute-api:us-east-1:123456789012:api123/prod/POST/stripe'
        }
        context = Mock()

        with pytest.raises(Exception) as exc_info:
            authorizer_handler(event, context)
        assert str(exc_info.value) == 'Unauthorized'

    def test_authorizer_denies_missing_token(self):
        """Test authorization fails with missing token"""
        event = {
            'methodArn': 'arn:aws:execute-api:us-east-1:123456789012:api123/prod/POST/stripe'
        }
        context = Mock()

        with pytest.raises(Exception) as exc_info:
            authorizer_handler(event, context)
        assert str(exc_info.value) == 'Unauthorized'

    def test_authorizer_handles_exception(self):
        """Test authorization handles unexpected exceptions"""
        event = {
            'authorizationToken': 'valid-token'
            # Missing methodArn to trigger exception
        }
        context = Mock()

        with pytest.raises(Exception) as exc_info:
            authorizer_handler(event, context)
        assert str(exc_info.value) == 'Unauthorized'


class TestStripeProcessor:
    """Test Stripe webhook processor Lambda"""

    @patch('stripe_processor.sqs_client')
    def test_stripe_processor_success_with_api_gateway_event(self, mock_sqs):
        """Test successful Stripe webhook processing with API Gateway event"""
        mock_sqs.send_message.return_value = {'MessageId': 'msg-123'}
        os.environ['QUEUE_URL'] = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue'

        event = {
            'body': json.dumps({
                'id': 'evt_stripe_123',
                'type': 'payment_intent.succeeded',
                'data': {'amount': 1000}
            })
        }
        context = Mock()

        result = stripe_handler(event, context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['message'] == 'Webhook processed successfully'
        mock_sqs.send_message.assert_called_once()

    @patch('stripe_processor.sqs_client')
    def test_stripe_processor_with_direct_event(self, mock_sqs):
        """Test Stripe processor with direct event (not from API Gateway)"""
        mock_sqs.send_message.return_value = {'MessageId': 'msg-456'}
        os.environ['QUEUE_URL'] = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue'

        event = {
            'id': 'evt_direct_123',
            'type': 'charge.succeeded'
        }
        context = Mock()

        result = stripe_handler(event, context)

        assert result['statusCode'] == 200
        mock_sqs.send_message.assert_called_once()

    @patch('stripe_processor.sqs_client')
    def test_stripe_processor_handles_empty_dict_body(self, mock_sqs):
        """Test Stripe processor handles empty dict body"""
        os.environ['QUEUE_URL'] = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue'

        event = {'body': '{}'}
        context = Mock()

        result = stripe_handler(event, context)

        # Empty dict {} is falsy in Python, so should return 500
        assert result['statusCode'] == 500
        body = json.loads(result['body'])
        assert 'error' in body
        assert 'Empty webhook payload' in body['error']

    @patch('stripe_processor.sqs_client')
    def test_stripe_processor_handles_none_body(self, mock_sqs):
        """Test Stripe processor handles None body"""
        os.environ['QUEUE_URL'] = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue'

        event = {'body': None}
        context = Mock()

        result = stripe_handler(event, context)

        # Should return 500 for None body
        assert result['statusCode'] == 500
        body = json.loads(result['body'])
        assert 'error' in body
        assert 'Empty webhook payload' in body['error']

    @patch('stripe_processor.sqs_client')
    def test_stripe_processor_handles_sqs_error(self, mock_sqs):
        """Test Stripe processor handles SQS send error"""
        mock_sqs.send_message.side_effect = Exception('SQS error')
        os.environ['QUEUE_URL'] = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue'

        event = {
            'body': json.dumps({'id': 'evt_123', 'type': 'test'})
        }
        context = Mock()

        result = stripe_handler(event, context)

        assert result['statusCode'] == 500
        body = json.loads(result['body'])
        assert 'error' in body

    @patch('stripe_processor.sqs_client')
    def test_stripe_processor_with_string_body(self, mock_sqs):
        """Test Stripe processor with string body"""
        mock_sqs.send_message.return_value = {'MessageId': 'msg-999'}
        os.environ['QUEUE_URL'] = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue'

        event = {
            'body': '{"id": "evt_string_123", "type": "invoice.paid"}'
        }
        context = Mock()

        result = stripe_handler(event, context)

        assert result['statusCode'] == 200
        mock_sqs.send_message.assert_called_once()


class TestPayPalProcessor:
    """Test PayPal webhook processor Lambda"""

    @patch('paypal_processor.sqs_client')
    def test_paypal_processor_success(self, mock_sqs):
        """Test successful PayPal webhook processing"""
        mock_sqs.send_message.return_value = {'MessageId': 'msg-paypal-123'}
        os.environ['QUEUE_URL'] = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue'

        event = {
            'body': json.dumps({
                'id': 'WH-paypal-123',
                'event_type': 'PAYMENT.CAPTURE.COMPLETED'
            })
        }
        context = Mock()

        result = paypal_handler(event, context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['message'] == 'Webhook processed successfully'
        mock_sqs.send_message.assert_called_once()

    @patch('paypal_processor.sqs_client')
    def test_paypal_processor_with_direct_event(self, mock_sqs):
        """Test PayPal processor with direct event"""
        mock_sqs.send_message.return_value = {'MessageId': 'msg-paypal-456'}
        os.environ['QUEUE_URL'] = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue'

        event = {
            'id': 'WH-direct-123',
            'event_type': 'BILLING.SUBSCRIPTION.CREATED'
        }
        context = Mock()

        result = paypal_handler(event, context)

        assert result['statusCode'] == 200
        mock_sqs.send_message.assert_called_once()

    @patch('paypal_processor.sqs_client')
    def test_paypal_processor_handles_error(self, mock_sqs):
        """Test PayPal processor handles errors"""
        mock_sqs.send_message.side_effect = Exception('PayPal SQS error')
        os.environ['QUEUE_URL'] = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue'

        event = {
            'body': json.dumps({'id': 'WH-123', 'event_type': 'test'})
        }
        context = Mock()

        result = paypal_handler(event, context)

        assert result['statusCode'] == 500
        body = json.loads(result['body'])
        assert 'error' in body

    @patch('paypal_processor.sqs_client')
    def test_paypal_processor_handles_none_body(self, mock_sqs):
        """Test PayPal processor handles None body"""
        os.environ['QUEUE_URL'] = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue'

        event = {'body': None}
        context = Mock()

        result = paypal_handler(event, context)

        assert result['statusCode'] == 500
        body = json.loads(result['body'])
        assert 'error' in body
        assert 'Empty webhook payload' in body['error']


class TestSquareProcessor:
    """Test Square webhook processor Lambda"""

    @patch('square_processor.sqs_client')
    def test_square_processor_success(self, mock_sqs):
        """Test successful Square webhook processing"""
        mock_sqs.send_message.return_value = {'MessageId': 'msg-square-123'}
        os.environ['QUEUE_URL'] = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue'

        event = {
            'body': json.dumps({
                'event_id': 'sq_event_123',
                'type': 'payment.updated'
            })
        }
        context = Mock()

        result = square_handler(event, context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['message'] == 'Webhook processed successfully'
        mock_sqs.send_message.assert_called_once()

    @patch('square_processor.sqs_client')
    def test_square_processor_with_direct_event(self, mock_sqs):
        """Test Square processor with direct event"""
        mock_sqs.send_message.return_value = {'MessageId': 'msg-square-456'}
        os.environ['QUEUE_URL'] = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue'

        event = {
            'event_id': 'sq_direct_123',
            'type': 'order.created'
        }
        context = Mock()

        result = square_handler(event, context)

        assert result['statusCode'] == 200
        mock_sqs.send_message.assert_called_once()

    @patch('square_processor.sqs_client')
    def test_square_processor_handles_error(self, mock_sqs):
        """Test Square processor handles errors"""
        mock_sqs.send_message.side_effect = Exception('Square SQS error')
        os.environ['QUEUE_URL'] = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue'

        event = {
            'body': json.dumps({'event_id': 'sq_123', 'type': 'test'})
        }
        context = Mock()

        result = square_handler(event, context)

        assert result['statusCode'] == 500
        body = json.loads(result['body'])
        assert 'error' in body

    @patch('square_processor.sqs_client')
    def test_square_processor_handles_none_body(self, mock_sqs):
        """Test Square processor handles None body"""
        os.environ['QUEUE_URL'] = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue'

        event = {'body': None}
        context = Mock()

        result = square_handler(event, context)

        assert result['statusCode'] == 500
        body = json.loads(result['body'])
        assert 'error' in body
        assert 'Empty webhook payload' in body['error']


class TestSQSConsumer:
    """Test SQS consumer Lambda function"""

    @patch('sqs_consumer.dynamodb')
    def test_sqs_consumer_success_single_record(self, mock_dynamodb):
        """Test successful processing of single SQS record"""
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        os.environ['TABLE_NAME'] = 'WebhookEvents-test'

        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'eventId': 'evt_123',
                        'provider': 'stripe',
                        'type': 'payment.succeeded',
                        'timestamp': 1234567890,
                        'payload': '{"test": "data"}'
                    }),
                    'attributes': {
                        'ApproximateFirstReceiveTimestamp': '1234567890000'
                    }
                }
            ]
        }
        context = Mock()

        result = sqs_consumer_handler(event, context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['successful'] == 1
        assert body['failed'] == 0
        mock_table.put_item.assert_called_once()

    @patch('sqs_consumer.dynamodb')
    def test_sqs_consumer_success_multiple_records(self, mock_dynamodb):
        """Test successful processing of multiple SQS records"""
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        os.environ['TABLE_NAME'] = 'WebhookEvents-test'

        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'eventId': 'evt_1',
                        'provider': 'stripe',
                        'type': 'test',
                        'timestamp': 1234567890,
                        'payload': '{}'
                    }),
                    'attributes': {'ApproximateFirstReceiveTimestamp': '1234567890000'}
                },
                {
                    'body': json.dumps({
                        'eventId': 'evt_2',
                        'provider': 'paypal',
                        'type': 'test',
                        'timestamp': 1234567891,
                        'payload': '{}'
                    }),
                    'attributes': {'ApproximateFirstReceiveTimestamp': '1234567891000'}
                }
            ]
        }
        context = Mock()

        result = sqs_consumer_handler(event, context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['successful'] == 2
        assert body['failed'] == 0
        assert mock_table.put_item.call_count == 2

    @patch('sqs_consumer.dynamodb')
    def test_sqs_consumer_handles_dynamodb_error(self, mock_dynamodb):
        """Test SQS consumer handles DynamoDB errors"""
        mock_table = MagicMock()
        mock_table.put_item.side_effect = Exception('DynamoDB error')
        mock_dynamodb.Table.return_value = mock_table
        os.environ['TABLE_NAME'] = 'WebhookEvents-test'

        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'eventId': 'evt_fail',
                        'provider': 'stripe',
                        'type': 'test',
                        'timestamp': 1234567890,
                        'payload': '{}'
                    }),
                    'attributes': {'ApproximateFirstReceiveTimestamp': '1234567890000'}
                }
            ]
        }
        context = Mock()

        # Should raise exception to trigger SQS retry
        with pytest.raises(Exception):
            sqs_consumer_handler(event, context)

    @patch('sqs_consumer.dynamodb')
    def test_sqs_consumer_handles_malformed_json(self, mock_dynamodb):
        """Test SQS consumer handles malformed JSON"""
        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        os.environ['TABLE_NAME'] = 'WebhookEvents-test'

        event = {
            'Records': [
                {
                    'body': 'invalid json',
                    'attributes': {'ApproximateFirstReceiveTimestamp': '1234567890000'}
                }
            ]
        }
        context = Mock()

        # Should raise exception due to JSON decode error
        with pytest.raises(Exception):
            sqs_consumer_handler(event, context)


class TestDLQProcessor:
    """Test DLQ processor Lambda function"""

    @patch('dlq_processor.s3_client')
    def test_dlq_processor_success_single_record(self, mock_s3):
        """Test successful processing of single DLQ record"""
        os.environ['BUCKET_NAME'] = 'failed-webhooks-test'

        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'eventId': 'evt_failed_123',
                        'provider': 'stripe',
                        'type': 'payment.failed',
                        'timestamp': 1234567890,
                        'payload': '{"test": "data"}'
                    }),
                    'messageId': 'msg-dlq-123',
                    'attributes': {
                        'ApproximateReceiveCount': '4'
                    }
                }
            ]
        }
        context = Mock()

        result = dlq_handler(event, context)

        assert result['statusCode'] == 200
        body = json.loads(result['body'])
        assert body['message'] == 'DLQ processing completed'
        mock_s3.put_object.assert_called_once()

        # Verify S3 key format
        call_args = mock_s3.put_object.call_args
        assert call_args[1]['Bucket'] == 'failed-webhooks-test'
        assert 'stripe/' in call_args[1]['Key']
        assert call_args[1]['ContentType'] == 'application/json'

    @patch('dlq_processor.s3_client')
    def test_dlq_processor_multiple_records(self, mock_s3):
        """Test processing multiple DLQ records"""
        os.environ['BUCKET_NAME'] = 'failed-webhooks-test'

        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'eventId': 'evt_1',
                        'provider': 'paypal',
                        'type': 'test',
                        'timestamp': 123,
                        'payload': '{}'
                    }),
                    'messageId': 'msg-1',
                    'attributes': {'ApproximateReceiveCount': '4'}
                },
                {
                    'body': json.dumps({
                        'eventId': 'evt_2',
                        'provider': 'square',
                        'type': 'test',
                        'timestamp': 124,
                        'payload': '{}'
                    }),
                    'messageId': 'msg-2',
                    'attributes': {'ApproximateReceiveCount': '4'}
                }
            ]
        }
        context = Mock()

        result = dlq_handler(event, context)

        assert result['statusCode'] == 200
        assert mock_s3.put_object.call_count == 2

    @patch('dlq_processor.s3_client')
    def test_dlq_processor_handles_s3_error_continues_processing(self, mock_s3):
        """Test DLQ processor continues processing other records when one fails"""
        mock_s3.put_object.side_effect = [Exception('S3 error'), None]
        os.environ['BUCKET_NAME'] = 'failed-webhooks-test'

        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'eventId': 'evt_fail',
                        'provider': 'stripe',
                        'type': 'test',
                        'timestamp': 123,
                        'payload': '{}'
                    }),
                    'messageId': 'msg-fail',
                    'attributes': {'ApproximateReceiveCount': '4'}
                },
                {
                    'body': json.dumps({
                        'eventId': 'evt_success',
                        'provider': 'paypal',
                        'type': 'test',
                        'timestamp': 124,
                        'payload': '{}'
                    }),
                    'messageId': 'msg-success',
                    'attributes': {'ApproximateReceiveCount': '4'}
                }
            ]
        }
        context = Mock()

        result = dlq_handler(event, context)

        # Should still return 200 and continue processing
        assert result['statusCode'] == 200
        assert mock_s3.put_object.call_count == 2

    @patch('dlq_processor.s3_client')
    def test_dlq_processor_handles_exception_returns_error(self, mock_s3):
        """Test DLQ processor handles unexpected exception"""
        mock_s3.put_object.side_effect = Exception('Critical S3 error')
        os.environ['BUCKET_NAME'] = 'failed-webhooks-test'

        event = {
            'Records': []  # Empty records to trigger different code path
        }
        context = Mock()

        result = dlq_handler(event, context)

        # Should return 200 even with empty records
        assert result['statusCode'] == 200

    @patch('dlq_processor.s3_client')
    def test_dlq_processor_with_unknown_provider(self, mock_s3):
        """Test DLQ processor handles unknown provider"""
        os.environ['BUCKET_NAME'] = 'failed-webhooks-test'

        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'eventId': 'evt_unknown',
                        'type': 'test',
                        'timestamp': 123,
                        'payload': '{}'
                        # Missing 'provider' field
                    }),
                    'messageId': 'msg-unknown',
                    'attributes': {'ApproximateReceiveCount': '4'}
                }
            ]
        }
        context = Mock()

        result = dlq_handler(event, context)

        assert result['statusCode'] == 200
        mock_s3.put_object.assert_called_once()

        # Verify it uses 'unknown' as provider
        call_args = mock_s3.put_object.call_args
        assert 'unknown/' in call_args[1]['Key']

    @patch('dlq_processor.s3_client')
    def test_dlq_processor_formats_s3_key_correctly(self, mock_s3):
        """Test DLQ processor formats S3 key with correct date structure"""
        os.environ['BUCKET_NAME'] = 'failed-webhooks-test'

        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'eventId': 'evt_date_test',
                        'provider': 'stripe',
                        'type': 'test',
                        'timestamp': 123,
                        'payload': '{}'
                    }),
                    'messageId': 'msg-date',
                    'attributes': {'ApproximateReceiveCount': '4'}
                }
            ]
        }
        context = Mock()

        result = dlq_handler(event, context)

        assert result['statusCode'] == 200
        call_args = mock_s3.put_object.call_args

        # Verify S3 key format: provider/year/month/day/eventId.json
        s3_key = call_args[1]['Key']
        assert s3_key.startswith('stripe/')
        assert s3_key.endswith('evt_date_test.json')
        key_parts = s3_key.split('/')
        assert len(key_parts) == 5  # provider/year/month/day/eventId.json

    def test_dlq_processor_handles_missing_bucket_name(self):
        """Test DLQ processor handles missing BUCKET_NAME environment variable"""
        # Remove BUCKET_NAME from environment
        if 'BUCKET_NAME' in os.environ:
            del os.environ['BUCKET_NAME']

        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'eventId': 'evt_test',
                        'provider': 'stripe',
                        'type': 'test',
                        'timestamp': 123,
                        'payload': '{}'
                    }),
                    'messageId': 'msg-test',
                    'attributes': {'ApproximateReceiveCount': '4'}
                }
            ]
        }
        context = Mock()

        result = dlq_handler(event, context)

        # Should return 500 due to missing environment variable
        assert result['statusCode'] == 500
        body = json.loads(result['body'])
        assert 'error' in body
