"""Unit tests for webhook processor Lambda function."""
import json
import sys
import os
import unittest
from unittest.mock import Mock, patch, MagicMock
from decimal import Decimal
from datetime import datetime

# Extract lambda code for testing
import zipfile
import tempfile

# Create temporary directory for webhook processor only
temp_dir_webhook = tempfile.mkdtemp(suffix='_webhook')
webhook_zip = os.path.join(
    os.path.dirname(__file__), '../../lambda/webhook-processor.zip'
)

with zipfile.ZipFile(webhook_zip, 'r') as zip_ref:
    zip_ref.extractall(temp_dir_webhook)

# Insert at position 0 so it's found first
sys.path.insert(0, temp_dir_webhook)

# Mock boto3 before importing the lambda module
sys.modules['boto3'] = MagicMock()

# Remove any cached 'index' module to avoid conflicts with enricher tests
if 'index' in sys.modules:
    del sys.modules['index']

# Now import the lambda handler
import index as webhook_module

# Remove from sys.path to avoid conflicts
sys.path.remove(temp_dir_webhook)


class TestWebhookProcessor(unittest.TestCase):
    """Test cases for webhook processor Lambda function."""

    def setUp(self):
        """Set up test fixtures."""
        # Mock DynamoDB table
        self.mock_table = MagicMock()
        self.mock_table.put_item = MagicMock(return_value={})

        # Patch the table in the module
        webhook_module.table = self.mock_table

        # Mock environment variable
        os.environ['DYNAMODB_TABLE'] = 'test-table'

    def tearDown(self):
        """Clean up after tests."""
        if 'DYNAMODB_TABLE' in os.environ:
            del os.environ['DYNAMODB_TABLE']

    def test_lambda_handler_success_with_body_string(self):
        """Test successful processing with body as string."""
        event = {
            'body': json.dumps({
                'symbol': 'btc',
                'price': 50000.00,
                'exchange': 'coinbase',
                'volume': 1234.56
            })
        }
        context = {}

        response = webhook_module.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 200)
        self.assertIn('message', json.loads(response['body']))
        self.mock_table.put_item.assert_called_once()

        # Check that symbol was uppercased
        call_args = self.mock_table.put_item.call_args
        item = call_args[1]['Item']
        self.assertEqual(item['symbol'], 'BTC')

    def test_lambda_handler_success_with_body_dict(self):
        """Test successful processing with body as dict."""
        event = {
            'symbol': 'eth',
            'price': 3000.00,
            'exchange': 'binance'
        }
        context = {}

        response = webhook_module.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 200)
        self.mock_table.put_item.assert_called_once()

        # Check item structure
        call_args = self.mock_table.put_item.call_args
        item = call_args[1]['Item']
        self.assertEqual(item['symbol'], 'ETH')
        self.assertEqual(item['exchange'], 'binance')
        self.assertEqual(item['processed'], False)

    def test_lambda_handler_missing_symbol(self):
        """Test validation error when symbol is missing."""
        event = {
            'price': 50000.00,
            'exchange': 'coinbase'
        }
        context = {}

        response = webhook_module.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 400)
        body = json.loads(response['body'])
        self.assertIn('error', body)
        self.mock_table.put_item.assert_not_called()

    def test_lambda_handler_missing_price(self):
        """Test validation error when price is missing."""
        event = {
            'symbol': 'btc',
            'exchange': 'coinbase'
        }
        context = {}

        response = webhook_module.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 400)
        body = json.loads(response['body'])
        self.assertIn('error', body)
        self.mock_table.put_item.assert_not_called()

    def test_lambda_handler_missing_exchange(self):
        """Test validation error when exchange is missing."""
        event = {
            'symbol': 'btc',
            'price': 50000.00
        }
        context = {}

        response = webhook_module.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 400)
        body = json.loads(response['body'])
        self.assertIn('error', body)
        self.mock_table.put_item.assert_not_called()

    def test_lambda_handler_with_volume(self):
        """Test processing with volume included."""
        event = {
            'symbol': 'btc',
            'price': 50000.00,
            'exchange': 'coinbase',
            'volume': 9999.99
        }
        context = {}

        response = webhook_module.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 200)

        call_args = self.mock_table.put_item.call_args
        item = call_args[1]['Item']
        self.assertEqual(item['volume'], Decimal('9999.99'))

    def test_lambda_handler_without_volume(self):
        """Test processing without volume (should default to 0)."""
        event = {
            'symbol': 'btc',
            'price': 50000.00,
            'exchange': 'coinbase'
        }
        context = {}

        response = webhook_module.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 200)

        call_args = self.mock_table.put_item.call_args
        item = call_args[1]['Item']
        self.assertEqual(item['volume'], Decimal('0'))

    def test_lambda_handler_dynamodb_exception(self):
        """Test handling of DynamoDB exceptions."""
        self.mock_table.put_item.side_effect = Exception("DynamoDB error")

        event = {
            'symbol': 'btc',
            'price': 50000.00,
            'exchange': 'coinbase'
        }
        context = {}

        with self.assertRaises(Exception) as cm:
            webhook_module.lambda_handler(event, context)

        self.assertIn("DynamoDB error", str(cm.exception))

    def test_lambda_handler_stores_raw_data(self):
        """Test that raw data is stored in DynamoDB."""
        event = {
            'symbol': 'btc',
            'price': 50000.00,
            'exchange': 'coinbase',
            'volume': 1234.56
        }
        context = {}

        webhook_module.lambda_handler(event, context)

        call_args = self.mock_table.put_item.call_args
        item = call_args[1]['Item']
        self.assertIn('raw_data', item)

        raw_data = json.loads(item['raw_data'])
        self.assertEqual(raw_data['symbol'], 'btc')
        self.assertEqual(raw_data['price'], 50000.00)

    def test_lambda_handler_includes_timestamp(self):
        """Test that timestamp is included in stored item."""
        event = {
            'symbol': 'btc',
            'price': 50000.00,
            'exchange': 'coinbase'
        }
        context = {}

        response = webhook_module.lambda_handler(event, context)

        call_args = self.mock_table.put_item.call_args
        item = call_args[1]['Item']
        self.assertIn('timestamp', item)
        self.assertIsInstance(item['timestamp'], int)
        self.assertGreater(item['timestamp'], 0)

    def test_lambda_handler_includes_created_at(self):
        """Test that created_at is included in stored item."""
        event = {
            'symbol': 'btc',
            'price': 50000.00,
            'exchange': 'coinbase'
        }
        context = {}

        webhook_module.lambda_handler(event, context)

        call_args = self.mock_table.put_item.call_args
        item = call_args[1]['Item']
        self.assertIn('created_at', item)

        # Verify it's a valid ISO format timestamp
        datetime.fromisoformat(item['created_at'])

    def test_lambda_handler_sets_processed_false(self):
        """Test that processed flag is set to False initially."""
        event = {
            'symbol': 'btc',
            'price': 50000.00,
            'exchange': 'coinbase'
        }
        context = {}

        webhook_module.lambda_handler(event, context)

        call_args = self.mock_table.put_item.call_args
        item = call_args[1]['Item']
        self.assertEqual(item['processed'], False)

    def test_lambda_handler_response_format(self):
        """Test that response has correct format."""
        event = {
            'symbol': 'btc',
            'price': 50000.00,
            'exchange': 'coinbase'
        }
        context = {}

        response = webhook_module.lambda_handler(event, context)

        self.assertIn('statusCode', response)
        self.assertIn('headers', response)
        self.assertIn('body', response)
        self.assertEqual(response['headers']['Content-Type'], 'application/json')

    def test_lambda_handler_response_body_structure(self):
        """Test that response body has correct structure."""
        event = {
            'symbol': 'btc',
            'price': 50000.00,
            'exchange': 'coinbase'
        }
        context = {}

        response = webhook_module.lambda_handler(event, context)
        body = json.loads(response['body'])

        self.assertIn('message', body)
        self.assertIn('symbol', body)
        self.assertIn('timestamp', body)

    def test_lambda_handler_symbol_uppercase(self):
        """Test that symbol is converted to uppercase."""
        event = {
            'symbol': 'eth',
            'price': 3000.00,
            'exchange': 'binance'
        }
        context = {}

        webhook_module.lambda_handler(event, context)

        call_args = self.mock_table.put_item.call_args
        item = call_args[1]['Item']
        self.assertEqual(item['symbol'], 'ETH')

    def test_lambda_handler_price_as_decimal(self):
        """Test that price is stored as Decimal."""
        event = {
            'symbol': 'btc',
            'price': 50000.12345,
            'exchange': 'coinbase'
        }
        context = {}

        webhook_module.lambda_handler(event, context)

        call_args = self.mock_table.put_item.call_args
        item = call_args[1]['Item']
        self.assertIsInstance(item['price'], Decimal)
        self.assertEqual(item['price'], Decimal('50000.12345'))

    def test_lambda_handler_invalid_json_in_body(self):
        """Test handling of invalid JSON in body."""
        event = {
            'body': 'invalid json {'
        }
        context = {}

        response = webhook_module.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 400)
        body = json.loads(response['body'])
        self.assertIn('error', body)

    def test_lambda_handler_preserves_exchange_name(self):
        """Test that exchange name is preserved correctly."""
        event = {
            'symbol': 'btc',
            'price': 50000.00,
            'exchange': 'Kraken'
        }
        context = {}

        webhook_module.lambda_handler(event, context)

        call_args = self.mock_table.put_item.call_args
        item = call_args[1]['Item']
        self.assertEqual(item['exchange'], 'Kraken')

    def test_validation_error_response_structure(self):
        """Test that validation error response has correct structure."""
        event = {
            'price': 50000.00
        }
        context = {}

        response = webhook_module.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 400)
        body = json.loads(response['body'])
        self.assertIn('error', body)
        self.assertIn('message', body)

    def test_lambda_handler_all_required_fields(self):
        """Test that all required fields are present in stored item."""
        event = {
            'symbol': 'btc',
            'price': 50000.00,
            'exchange': 'coinbase'
        }
        context = {}

        webhook_module.lambda_handler(event, context)

        call_args = self.mock_table.put_item.call_args
        item = call_args[1]['Item']

        required_fields = [
            'symbol', 'timestamp', 'price', 'exchange',
            'volume', 'raw_data', 'processed', 'created_at'
        ]
        for field in required_fields:
            self.assertIn(field, item)


if __name__ == '__main__':
    unittest.main()
