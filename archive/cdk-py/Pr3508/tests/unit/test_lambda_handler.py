"""Unit tests for Lambda handler logic"""
import json
import os
import unittest
from unittest.mock import Mock, MagicMock, patch, ANY
from decimal import Decimal
from datetime import datetime
import sys

# Add lib/lambda to path to import the handler
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/lambda'))

# Set required environment variables before importing
os.environ.update({
    'GIFT_CARD_TABLE': 'gift-cards-test',
    'IDEMPOTENCY_TABLE': 'idempotency-test',
    'SNS_TOPIC_ARN': 'arn:aws:sns:us-east-1:123456789012:test-topic',
    'SECRET_ARN': 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret',
    'APPCONFIG_APP_ID': 'test-app-id',
    'APPCONFIG_ENV': 'test-env',
    'APPCONFIG_PROFILE': 'test-profile',
    'FRAUD_DETECTOR_NAME': 'test-detector',
    'AWS_XRAY_TRACING_NAME': 'test-service',
})

# Mock boto3 clients before importing
with patch('boto3.resource') as mock_resource, \
     patch('boto3.client') as mock_client:
    # Import the handler module
    import redemption_handler
    from redemption_handler import (
        lambda_handler,
        DecimalEncoder,
        get_encryption_key,
        get_feature_flags,
        check_idempotency,
        save_idempotency,
        validate_fraud,
        process_redemption,
        send_notification
    )


class TestDecimalEncoder(unittest.TestCase):
    """Test DecimalEncoder class"""

    def test_decimal_encoding(self):
        """Test encoding of decimal values"""
        encoder = DecimalEncoder()
        # Test Decimal conversion
        self.assertEqual(json.dumps(Decimal('10.5'), cls=DecimalEncoder), '10.5')
        self.assertEqual(json.dumps({'amount': Decimal('100.00')}, cls=DecimalEncoder), '{"amount": 100.0}')

    def test_non_decimal_encoding(self):
        """Test encoding of non-decimal values"""
        encoder = DecimalEncoder()
        # Test normal values pass through
        self.assertEqual(json.dumps('string', cls=DecimalEncoder), '"string"')
        self.assertEqual(json.dumps(123, cls=DecimalEncoder), '123')
        self.assertEqual(json.dumps({'key': 'value'}, cls=DecimalEncoder), '{"key": "value"}')


class TestLambdaHandler(unittest.TestCase):
    """Test Lambda handler functions"""

    def setUp(self):
        """Set up test fixtures"""
        # Set required environment variables
        os.environ['GIFT_CARD_TABLE'] = 'test-gift-cards'
        os.environ['IDEMPOTENCY_TABLE'] = 'test-idempotency'
        os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:test-topic'
        os.environ['SECRET_ARN'] = 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test'
        os.environ['FRAUD_DETECTOR_NAME'] = 'test-detector'
        os.environ['APPCONFIG_APP_ID'] = 'test-app'
        os.environ['APPCONFIG_ENV'] = 'test'
        os.environ['APPCONFIG_PROFILE'] = 'test-profile'

    @patch('redemption_handler.secrets_manager')
    def test_get_encryption_key(self, mock_secrets):
        """Test getting encryption key from Secrets Manager"""
        # Mock successful response
        mock_secrets.get_secret_value.return_value = {
            'SecretString': '{"key": "test-encryption-key"}'
        }

        key = get_encryption_key()
        self.assertEqual(key, 'test-encryption-key')
        mock_secrets.get_secret_value.assert_called_once()

    @patch('redemption_handler.appconfig')
    def test_get_feature_flags(self, mock_appconfig):
        """Test getting feature flags from AppConfig"""
        # Mock configuration session and response
        mock_appconfig.start_configuration_session.return_value = {
            'InitialConfigurationToken': 'test-token'
        }
        mock_config = MagicMock()
        mock_config.read.return_value = '{"fraud_detection_enabled": {"enabled": true}}'
        mock_appconfig.get_configuration.return_value = {
            'Configuration': mock_config
        }

        flags = get_feature_flags()
        self.assertEqual(flags, {"fraud_detection_enabled": {"enabled": True}})

    @patch('redemption_handler.idempotency_table')
    def test_check_idempotency_found(self, mock_table):
        """Test checking idempotency when key exists"""
        mock_table.get_item.return_value = {
            'Item': {'response': {'success': True, 'cached': True}}
        }

        result = check_idempotency('test-key')
        self.assertEqual(result, {'success': True, 'cached': True})

    @patch('redemption_handler.idempotency_table')
    def test_check_idempotency_not_found(self, mock_table):
        """Test checking idempotency when key doesn't exist"""
        mock_table.get_item.return_value = {}

        result = check_idempotency('test-key')
        self.assertIsNone(result)

    @patch('redemption_handler.idempotency_table')
    def test_save_idempotency(self, mock_table):
        """Test saving idempotency response"""
        response = {'success': True, 'message': 'test'}

        save_idempotency('test-key', response)

        mock_table.put_item.assert_called_once()
        call_args = mock_table.put_item.call_args[1]['Item']
        self.assertEqual(call_args['idempotency_key'], 'test-key')
        self.assertEqual(call_args['response'], response)
        self.assertIn('ttl', call_args)
        self.assertIn('timestamp', call_args)

    @patch('redemption_handler.get_feature_flags')
    @patch('redemption_handler.frauddetector')
    def test_validate_fraud_disabled(self, mock_fraud, mock_flags):
        """Test fraud validation when disabled"""
        mock_flags.return_value = {'fraud_detection_enabled': {'enabled': False}}

        result = validate_fraud('customer-1', 100.0, 'card-1')

        self.assertEqual(result, {'fraud_score': 0, 'is_fraudulent': False})
        mock_fraud.get_event_prediction.assert_not_called()

    @patch('redemption_handler.get_feature_flags')
    @patch('redemption_handler.frauddetector')
    def test_validate_fraud_enabled(self, mock_fraud, mock_flags):
        """Test fraud validation when enabled"""
        mock_flags.return_value = {'fraud_detection_enabled': {'enabled': True}}
        mock_fraud.get_event_prediction.return_value = {
            'modelScores': [{'scores': {'fraud_score': 500}}]
        }

        result = validate_fraud('customer-1', 100.0, 'card-1')

        self.assertEqual(result['fraud_score'], 500)
        self.assertFalse(result['is_fraudulent'])

    @patch('redemption_handler.sns')
    def test_send_notification(self, mock_sns):
        """Test sending SNS notification"""
        send_notification('customer-1', 'card-1', 50.0, 150.0)

        mock_sns.publish.assert_called_once()
        call_args = mock_sns.publish.call_args[1]
        self.assertEqual(call_args['TopicArn'], os.environ['SNS_TOPIC_ARN'])
        self.assertEqual(call_args['Subject'], 'Gift Card Redemption Notification')

    @patch('redemption_handler.save_idempotency')
    @patch('redemption_handler.send_notification')
    @patch('redemption_handler.process_redemption')
    @patch('redemption_handler.check_idempotency')
    def test_lambda_handler_success(self, mock_check_idem, mock_process, mock_notify, mock_save_idem):
        """Test successful Lambda handler execution"""
        # Mock no cached response
        mock_check_idem.return_value = None

        # Mock successful redemption
        mock_process.return_value = {
            'success': True,
            'message': 'Redemption successful',
            'new_balance': 50.0,
            'transaction_id': 'txn-123'
        }

        # Create test event
        event = {
            'body': json.dumps({
                'card_id': 'card-123',
                'amount': 50.0,
                'customer_id': 'customer-123',
                'idempotency_key': 'idem-123'
            })
        }

        response = lambda_handler(event, None)

        self.assertEqual(response['statusCode'], 200)
        body = json.loads(response['body'])
        self.assertTrue(body['success'])
        mock_notify.assert_called_once()
        mock_save_idem.assert_called_once()

    @patch('redemption_handler.check_idempotency')
    def test_lambda_handler_cached(self, mock_check_idem):
        """Test Lambda handler with cached response"""
        cached_response = {'success': True, 'cached': True}
        mock_check_idem.return_value = cached_response

        event = {
            'body': json.dumps({
                'card_id': 'card-123',
                'amount': 50.0,
                'customer_id': 'customer-123',
                'idempotency_key': 'idem-123'
            })
        }

        response = lambda_handler(event, None)

        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(response['headers']['X-Idempotency'], 'cached')
        body = json.loads(response['body'])
        self.assertTrue(body['cached'])

    def test_lambda_handler_invalid_json(self):
        """Test Lambda handler with invalid JSON"""
        event = {'body': 'invalid json'}

        response = lambda_handler(event, None)

        self.assertEqual(response['statusCode'], 400)
        body = json.loads(response['body'])
        self.assertIn('error', body)

    def test_lambda_handler_missing_fields(self):
        """Test Lambda handler with missing required fields"""
        event = {
            'body': json.dumps({
                'card_id': 'card-123'
                # Missing other required fields
            })
        }

        response = lambda_handler(event, None)

        self.assertEqual(response['statusCode'], 400)
        body = json.loads(response['body'])
        self.assertIn('error', body)

    @patch('redemption_handler.dynamodb')
    @patch('redemption_handler.validate_fraud')
    def test_process_redemption_fraudulent(self, mock_fraud, mock_dynamo):
        """Test processing fraudulent redemption"""
        mock_fraud.return_value = {'is_fraudulent': True, 'fraud_score': 800}

        result = process_redemption('card-1', 100.0, 'customer-1')

        self.assertFalse(result['success'])
        self.assertIn('fraudulent', result['message'].lower())

    @patch('redemption_handler.dynamodb')
    @patch('redemption_handler.validate_fraud')
    @patch('redemption_handler.gift_card_table')
    def test_process_redemption_success(self, mock_table, mock_fraud, mock_dynamo):
        """Test successful redemption processing"""
        mock_fraud.return_value = {'is_fraudulent': False, 'fraud_score': 100}
        mock_client = MagicMock()
        mock_dynamo.client.return_value = mock_client
        mock_client.transact_write_items.return_value = {}
        mock_table.get_item.return_value = {
            'Item': {'balance': Decimal('150.0')}
        }

        result = process_redemption('card-1', 50.0, 'customer-1')

        self.assertTrue(result['success'])
        self.assertEqual(result['new_balance'], 150.0)
        self.assertIn('transaction_id', result)


if __name__ == '__main__':
    unittest.main()