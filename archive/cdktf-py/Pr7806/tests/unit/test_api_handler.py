"""Unit tests for API Handler Lambda function."""
import json
import unittest
from unittest.mock import patch, MagicMock, Mock
import sys
import os
from decimal import Decimal

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib', 'lambda'))

import api_handler  # pylint: disable=wrong-import-position


class TestAPIHandler(unittest.TestCase):
    """Test cases for API Handler Lambda."""

    def setUp(self):
        """Set up test fixtures."""
        os.environ['DYNAMODB_TABLE'] = 'test-transactions-table'
        os.environ['AWS_REGION'] = 'us-east-1'

    @patch('api_handler.boto3')
    def test_get_table(self, mock_boto3):
        """Test get_table helper function."""
        mock_dynamodb = MagicMock()
        mock_boto3.resource.return_value = mock_dynamodb

        result = api_handler.get_table()

        mock_boto3.resource.assert_called_once_with('dynamodb')
        mock_dynamodb.Table.assert_called_once_with('test-transactions-table')

    @patch('api_handler.get_table')
    def test_successful_transaction(self, mock_get_table):
        """Test successful transaction processing."""
        mock_table = MagicMock()
        mock_get_table.return_value = mock_table

        event = {
            'body': json.dumps({
                'amount': 100.50,
                'merchant': 'Test Merchant',
                'card_number': '1234567890123456'
            })
        }

        response = api_handler.lambda_handler(event, None)

        self.assertEqual(response['statusCode'], 201)
        self.assertIn('transaction_id', json.loads(response['body']))
        mock_table.put_item.assert_called_once()

    @patch('api_handler.get_table')
    def test_missing_body(self, mock_get_table):
        """Test request with missing body."""
        event = {}

        response = api_handler.lambda_handler(event, None)

        self.assertEqual(response['statusCode'], 400)
        self.assertIn('Missing request body', json.loads(response['body'])['error'])

    @patch('api_handler.get_table')
    def test_missing_required_fields(self, mock_get_table):
        """Test request with missing required fields."""
        event = {
            'body': json.dumps({
                'amount': 100.50
            })
        }

        response = api_handler.lambda_handler(event, None)

        self.assertEqual(response['statusCode'], 400)
        body = json.loads(response['body'])
        self.assertIn('Missing required fields', body['error'])

    @patch('api_handler.get_table')
    def test_transaction_with_optional_fields(self, mock_get_table):
        """Test transaction with optional fields."""
        mock_table = MagicMock()
        mock_get_table.return_value = mock_table

        event = {
            'body': json.dumps({
                'amount': 500.00,
                'merchant': 'Big Store',
                'card_number': '9876543210987654',
                'location': 'New York, USA',
                'customer_id': 'CUST12345',
                'currency': 'USD'
            })
        }

        response = api_handler.lambda_handler(event, None)

        self.assertEqual(response['statusCode'], 201)
        mock_table.put_item.assert_called_once()

        # Verify all fields are included
        call_args = mock_table.put_item.call_args[1]['Item']
        self.assertIn('location', call_args)
        self.assertIn('customer_id', call_args)
        self.assertIn('currency', call_args)

    @patch('api_handler.get_table')
    def test_invalid_json_body(self, mock_get_table):
        """Test request with invalid JSON."""
        event = {
            'body': 'invalid json'
        }

        response = api_handler.lambda_handler(event, None)

        self.assertEqual(response['statusCode'], 400)

    @patch('api_handler.get_table')
    def test_dynamodb_error(self, mock_get_table):
        """Test handling of DynamoDB errors."""
        mock_table = MagicMock()
        mock_table.put_item.side_effect = Exception('DynamoDB error')
        mock_get_table.return_value = mock_table

        event = {
            'body': json.dumps({
                'amount': 100.50,
                'merchant': 'Test Merchant',
                'card_number': '1234567890123456'
            })
        }

        response = api_handler.lambda_handler(event, None)

        self.assertEqual(response['statusCode'], 500)
        self.assertIn('Internal server error', json.loads(response['body'])['error'])

    @patch('api_handler.get_table')
    def test_cors_headers(self, mock_get_table):
        """Test CORS headers are included in response."""
        mock_table = MagicMock()
        mock_get_table.return_value = mock_table

        event = {
            'body': json.dumps({
                'amount': 100.50,
                'merchant': 'Test Merchant',
                'card_number': '1234567890123456'
            })
        }

        response = api_handler.lambda_handler(event, None)

        self.assertIn('headers', response)
        self.assertIn('Access-Control-Allow-Origin', response['headers'])
        self.assertEqual(response['headers']['Access-Control-Allow-Origin'], '*')

    @patch('api_handler.get_table')
    def test_transaction_id_generation(self, mock_get_table):
        """Test automatic transaction ID generation."""
        mock_table = MagicMock()
        mock_get_table.return_value = mock_table

        event = {
            'body': json.dumps({
                'amount': 100.50,
                'merchant': 'Test Merchant',
                'card_number': '1234567890123456'
            })
        }

        response = api_handler.lambda_handler(event, None)
        body = json.loads(response['body'])

        self.assertIn('transaction_id', body)
        self.assertIsNotNone(body['transaction_id'])

    @patch('api_handler.get_table')
    def test_custom_transaction_id(self, mock_get_table):
        """Test using custom transaction ID."""
        mock_table = MagicMock()
        mock_get_table.return_value = mock_table
        custom_id = 'CUSTOM-TX-12345'

        event = {
            'body': json.dumps({
                'transaction_id': custom_id,
                'amount': 100.50,
                'merchant': 'Test Merchant',
                'card_number': '1234567890123456'
            })
        }

        response = api_handler.lambda_handler(event, None)
        body = json.loads(response['body'])

        self.assertEqual(body['transaction_id'], custom_id)


if __name__ == '__main__':
    unittest.main()
