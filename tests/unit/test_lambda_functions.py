"""
test_lambda_functions.py

Unit tests for Lambda function handlers.
"""

import unittest
from unittest.mock import patch, MagicMock
import sys
import os

# Add lambda directory to path
lambda_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'lib', 'lambda')
sys.path.insert(0, lambda_dir)

import payment_processor
import session_manager


class TestPaymentProcessor(unittest.TestCase):
    """Test cases for payment processor Lambda function."""

    def test_decimal_default(self):
        """Test decimal_default JSON encoder."""
        from decimal import Decimal
        
        result = payment_processor.decimal_default(Decimal('99.99'))
        self.assertEqual(result, 99.99)
        self.assertIsInstance(result, float)

    def test_decimal_default_raises(self):
        """Test decimal_default raises TypeError for non-Decimal."""
        with self.assertRaises(TypeError):
            payment_processor.decimal_default("not a decimal")

    @patch('payment_processor.dynamodb_client')
    def test_handler_success(self, mock_dynamodb_client):
        """Test payment processor handler with valid request."""
        mock_dynamodb_client.put_item.return_value = {}
        os.environ['TRANSACTIONS_TABLE'] = 'test-transactions'

        event = {
            'body': '{"transactionId": "tx-123", "customerId": "cust-456", "amount": 99.99}'
        }
        context = {}

        response = payment_processor.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 200)
        self.assertIn('transactionId', response['body'])
        mock_dynamodb_client.put_item.assert_called_once()

    @patch('payment_processor.dynamodb_client')
    def test_handler_missing_fields(self, mock_dynamodb_client):
        """Test payment processor handler with missing required fields."""
        os.environ['TRANSACTIONS_TABLE'] = 'test-transactions'

        event = {'body': '{"transactionId": "tx-123"}'}
        context = {}

        response = payment_processor.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 400)
        self.assertIn('Missing required fields', response['body'])

    @patch('payment_processor.dynamodb_client')
    def test_handler_error(self, mock_dynamodb_client):
        """Test payment processor handler error handling."""
        mock_dynamodb_client.put_item.side_effect = Exception('DynamoDB error')
        os.environ['TRANSACTIONS_TABLE'] = 'test-transactions'

        event = {
            'body': '{"transactionId": "tx-123", "customerId": "cust-456", "amount": 99.99}'
        }
        context = {}

        response = payment_processor.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 500)
        self.assertIn('Internal server error', response['body'])


class TestSessionManager(unittest.TestCase):
    """Test cases for session manager Lambda function."""

    @patch('session_manager.dynamodb_client')
    def test_create_session(self, mock_dynamodb_client):
        """Test session manager create session."""
        mock_dynamodb_client.put_item.return_value = {}
        os.environ['SESSIONS_TABLE'] = 'test-sessions'

        event = {
            'httpMethod': 'POST',
            'body': '{"userId": "user-123"}'
        }
        context = {}

        response = session_manager.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 201)
        self.assertIn('sessionId', response['body'])
        mock_dynamodb_client.put_item.assert_called_once()

    @patch('session_manager.dynamodb_client')
    def test_validate_session(self, mock_dynamodb_client):
        """Test session manager validate session."""
        mock_dynamodb_client.get_item.return_value = {
            'Item': {
                'sessionId': {'S': 'session-123'},
                'userId': {'S': 'user-456'},
                'expiresAt': {'N': '1234567890'}
            }
        }
        os.environ['SESSIONS_TABLE'] = 'test-sessions'

        event = {
            'httpMethod': 'GET',
            'queryStringParameters': {'sessionId': 'session-123'}
        }
        context = {}

        response = session_manager.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 200)
        self.assertIn('valid', response['body'])

    @patch('session_manager.dynamodb_client')
    def test_session_not_found(self, mock_dynamodb_client):
        """Test session manager with non-existent session."""
        mock_dynamodb_client.get_item.return_value = {}
        os.environ['SESSIONS_TABLE'] = 'test-sessions'

        event = {
            'httpMethod': 'GET',
            'queryStringParameters': {'sessionId': 'invalid'}
        }
        context = {}

        response = session_manager.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 404)
        self.assertIn('Session not found', response['body'])

    @patch('session_manager.dynamodb_client')
    def test_missing_user_id(self, mock_dynamodb_client):
        """Test session manager POST without userId."""
        os.environ['SESSIONS_TABLE'] = 'test-sessions'

        event = {
            'httpMethod': 'POST',
            'body': '{}'
        }
        context = {}

        response = session_manager.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 400)
        self.assertIn('Missing userId', response['body'])

    @patch('session_manager.dynamodb_client')
    def test_method_not_allowed(self, mock_dynamodb_client):
        """Test session manager with unsupported HTTP method."""
        os.environ['SESSIONS_TABLE'] = 'test-sessions'

        event = {
            'httpMethod': 'DELETE',
            'body': '{}'
        }
        context = {}

        response = session_manager.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 405)
        self.assertIn('Method not allowed', response['body'])


if __name__ == '__main__':
    unittest.main()
