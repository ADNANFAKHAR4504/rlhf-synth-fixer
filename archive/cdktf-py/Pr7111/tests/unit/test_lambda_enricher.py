"""Unit tests for price enricher Lambda function."""
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

# Create temporary directory for price enricher only
temp_dir_enricher = tempfile.mkdtemp(suffix='_enricher')
enricher_zip = os.path.join(
    os.path.dirname(__file__), '../../lambda/price-enricher.zip'
)

with zipfile.ZipFile(enricher_zip, 'r') as zip_ref:
    zip_ref.extractall(temp_dir_enricher)

# Insert at position 0 so it's found first
sys.path.insert(0, temp_dir_enricher)

# Mock boto3 before importing the lambda module
sys.modules['boto3'] = MagicMock()

# Now import the lambda handler
import index as enricher_module

# Remove from sys.path to avoid conflicts
sys.path.remove(temp_dir_enricher)


class TestPriceEnricher(unittest.TestCase):
    """Test cases for price enricher Lambda function."""

    def setUp(self):
        """Set up test fixtures."""
        # Mock DynamoDB table
        self.mock_table = MagicMock()
        enricher_module.table = self.mock_table

        # Mock environment variable
        os.environ['DYNAMODB_TABLE'] = 'test-table'

    def tearDown(self):
        """Clean up after tests."""
        if 'DYNAMODB_TABLE' in os.environ:
            del os.environ['DYNAMODB_TABLE']

    def test_lambda_handler_success_single_record(self):
        """Test successful processing of a single INSERT record."""
        event = {
            'Records': [
                {
                    'eventName': 'INSERT',
                    'dynamodb': {
                        'NewImage': {
                            'symbol': {'S': 'BTC'},
                            'timestamp': {'N': '1234567890000'},
                            'price': {'N': '50000.00'}
                        }
                    }
                }
            ]
        }
        context = {}

        # Mock query responses
        self.mock_table.query.return_value = {
            'Items': [
                {'price': Decimal('50000.00')},
                {'price': Decimal('49000.00')},
                {'price': Decimal('51000.00')},
                {'price': Decimal('50500.00')},
                {'price': Decimal('49500.00')}
            ]
        }
        self.mock_table.update_item.return_value = {}

        response = enricher_module.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 200)
        self.mock_table.update_item.assert_called_once()

    def test_lambda_handler_success_multiple_records(self):
        """Test successful processing of multiple records."""
        event = {
            'Records': [
                {
                    'eventName': 'INSERT',
                    'dynamodb': {
                        'NewImage': {
                            'symbol': {'S': 'BTC'},
                            'timestamp': {'N': '1234567890000'},
                            'price': {'N': '50000.00'}
                        }
                    }
                },
                {
                    'eventName': 'MODIFY',
                    'dynamodb': {
                        'NewImage': {
                            'symbol': {'S': 'ETH'},
                            'timestamp': {'N': '1234567891000'},
                            'price': {'N': '3000.00'}
                        }
                    }
                }
            ]
        }
        context = {}

        # Mock query responses
        self.mock_table.query.return_value = {
            'Items': [
                {'price': Decimal('50000.00')},
                {'price': Decimal('49000.00')},
                {'price': Decimal('51000.00')},
                {'price': Decimal('50500.00')},
                {'price': Decimal('49500.00')}
            ]
        }
        self.mock_table.update_item.return_value = {}

        response = enricher_module.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 200)
        # Should be called twice (once per record)
        self.assertEqual(self.mock_table.update_item.call_count, 2)

    def test_lambda_handler_skips_remove_events(self):
        """Test that REMOVE events are skipped."""
        event = {
            'Records': [
                {
                    'eventName': 'REMOVE',
                    'dynamodb': {
                        'NewImage': {
                            'symbol': {'S': 'BTC'},
                            'timestamp': {'N': '1234567890000'},
                            'price': {'N': '50000.00'}
                        }
                    }
                }
            ]
        }
        context = {}

        response = enricher_module.lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 200)
        self.mock_table.update_item.assert_not_called()

    def test_lambda_handler_exception_propagates(self):
        """Test that exceptions are propagated to trigger DLQ."""
        event = {
            'Records': [
                {
                    'eventName': 'INSERT',
                    'dynamodb': {
                        'NewImage': {
                            'symbol': {'S': 'BTC'},
                            'timestamp': {'N': '1234567890000'},
                            'price': {'N': '50000.00'}
                        }
                    }
                }
            ]
        }
        context = {}

        self.mock_table.query.side_effect = Exception("DynamoDB error")

        with self.assertRaises(Exception) as cm:
            enricher_module.lambda_handler(event, context)

        self.assertIn("DynamoDB error", str(cm.exception))

    def test_process_price_record_updates_item(self):
        """Test that process_price_record updates DynamoDB item with enrichment."""
        record = {
            'eventName': 'INSERT',
            'dynamodb': {
                'NewImage': {
                    'symbol': {'S': 'BTC'},
                    'timestamp': {'N': '1234567890000'},
                    'price': {'N': '50000.00'}
                }
            }
        }

        # Mock query responses
        self.mock_table.query.return_value = {
            'Items': [
                {'price': Decimal('50000.00')},
                {'price': Decimal('49000.00')},
                {'price': Decimal('51000.00')},
                {'price': Decimal('50500.00')},
                {'price': Decimal('49500.00')}
            ]
        }
        self.mock_table.update_item.return_value = {}

        enricher_module.process_price_record(record)

        self.mock_table.update_item.assert_called_once()

        # Check update parameters
        call_args = self.mock_table.update_item.call_args
        self.assertIn('Key', call_args[1])
        self.assertIn('UpdateExpression', call_args[1])
        self.assertIn('ExpressionAttributeValues', call_args[1])

    def test_calculate_moving_average_sufficient_data(self):
        """Test moving average calculation with sufficient data."""
        # Mock query response with 5 prices
        self.mock_table.query.return_value = {
            'Items': [
                {'price': Decimal('50000.00')},
                {'price': Decimal('49000.00')},
                {'price': Decimal('51000.00')},
                {'price': Decimal('50500.00')},
                {'price': Decimal('49500.00')}
            ]
        }

        result = enricher_module.calculate_moving_average('BTC', 1234567890000, periods=5)

        self.assertIsInstance(result, Decimal)
        # (50000 + 49000 + 51000 + 50500 + 49500) / 5 = 50000
        self.assertEqual(result, Decimal('50000.00'))

    def test_calculate_moving_average_insufficient_data(self):
        """Test moving average calculation with insufficient data."""
        # Mock query response with only 3 prices (need 5)
        self.mock_table.query.return_value = {
            'Items': [
                {'price': Decimal('50000.00')},
                {'price': Decimal('49000.00')},
                {'price': Decimal('51000.00')}
            ]
        }

        result = enricher_module.calculate_moving_average('BTC', 1234567890000, periods=5)

        self.assertEqual(result, Decimal('0'))

    def test_calculate_moving_average_query_parameters(self):
        """Test that moving average uses correct query parameters."""
        self.mock_table.query.return_value = {
            'Items': [
                {'price': Decimal('50000.00')},
                {'price': Decimal('49000.00')},
                {'price': Decimal('51000.00')},
                {'price': Decimal('50500.00')},
                {'price': Decimal('49500.00')}
            ]
        }

        enricher_module.calculate_moving_average('BTC', 1234567890000, periods=5)

        call_args = self.mock_table.query.call_args
        self.assertIn('KeyConditionExpression', call_args[1])
        self.assertIn('ExpressionAttributeNames', call_args[1])
        self.assertIn('ExpressionAttributeValues', call_args[1])
        self.assertEqual(call_args[1]['ScanIndexForward'], False)
        self.assertEqual(call_args[1]['Limit'], 5)

    def test_calculate_moving_average_exception_handling(self):
        """Test moving average exception handling."""
        self.mock_table.query.side_effect = Exception("Query error")

        with self.assertRaises(Exception) as cm:
            enricher_module.calculate_moving_average('BTC', 1234567890000, periods=5)

        self.assertIn("Query error", str(cm.exception))

    def test_calculate_volatility_sufficient_data(self):
        """Test volatility calculation with sufficient data."""
        # Mock query response with 10 prices
        prices = [Decimal('50000.00')] * 10
        self.mock_table.query.return_value = {
            'Items': [{'price': p} for p in prices]
        }

        result = enricher_module.calculate_volatility('BTC', 1234567890000, periods=10)

        self.assertIsInstance(result, Decimal)
        # All same prices = 0 volatility
        self.assertEqual(result, Decimal('0.0000'))

    def test_calculate_volatility_insufficient_data(self):
        """Test volatility calculation with insufficient data."""
        # Mock query response with only 5 prices (need 10)
        self.mock_table.query.return_value = {
            'Items': [
                {'price': Decimal('50000.00')},
                {'price': Decimal('49000.00')},
                {'price': Decimal('51000.00')},
                {'price': Decimal('50500.00')},
                {'price': Decimal('49500.00')}
            ]
        }

        result = enricher_module.calculate_volatility('BTC', 1234567890000, periods=10)

        self.assertEqual(result, Decimal('0'))

    def test_calculate_volatility_variance(self):
        """Test volatility calculation with varying prices."""
        # Create prices with known variance
        prices = [
            Decimal('50000.00'),
            Decimal('51000.00'),
            Decimal('49000.00'),
            Decimal('52000.00'),
            Decimal('48000.00'),
            Decimal('50000.00'),
            Decimal('51000.00'),
            Decimal('49000.00'),
            Decimal('50000.00'),
            Decimal('50000.00')
        ]
        self.mock_table.query.return_value = {
            'Items': [{'price': p} for p in prices]
        }

        result = enricher_module.calculate_volatility('BTC', 1234567890000, periods=10)

        self.assertIsInstance(result, Decimal)
        self.assertGreater(result, Decimal('0'))

    def test_calculate_volatility_exception_handling(self):
        """Test volatility exception handling."""
        self.mock_table.query.side_effect = Exception("Query error")

        with self.assertRaises(Exception) as cm:
            enricher_module.calculate_volatility('BTC', 1234567890000, periods=10)

        self.assertIn("Query error", str(cm.exception))

    def test_update_item_includes_all_enrichment_fields(self):
        """Test that update_item includes all enrichment fields."""
        record = {
            'eventName': 'INSERT',
            'dynamodb': {
                'NewImage': {
                    'symbol': {'S': 'BTC'},
                    'timestamp': {'N': '1234567890000'},
                    'price': {'N': '50000.00'}
                }
            }
        }

        self.mock_table.query.return_value = {
            'Items': [
                {'price': Decimal('50000.00')},
                {'price': Decimal('49000.00')},
                {'price': Decimal('51000.00')},
                {'price': Decimal('50500.00')},
                {'price': Decimal('49500.00')}
            ]
        }
        self.mock_table.update_item.return_value = {}

        enricher_module.process_price_record(record)

        call_args = self.mock_table.update_item.call_args
        expr_values = call_args[1]['ExpressionAttributeValues']

        self.assertIn(':processed', expr_values)
        self.assertIn(':ma5', expr_values)
        self.assertIn(':ma20', expr_values)
        self.assertIn(':vol', expr_values)
        self.assertIn(':enriched', expr_values)

    def test_update_item_key_includes_symbol_and_timestamp(self):
        """Test that update_item Key includes symbol and timestamp."""
        record = {
            'eventName': 'INSERT',
            'dynamodb': {
                'NewImage': {
                    'symbol': {'S': 'BTC'},
                    'timestamp': {'N': '1234567890000'},
                    'price': {'N': '50000.00'}
                }
            }
        }

        self.mock_table.query.return_value = {
            'Items': [
                {'price': Decimal('50000.00')},
                {'price': Decimal('49000.00')},
                {'price': Decimal('51000.00')},
                {'price': Decimal('50500.00')},
                {'price': Decimal('49500.00')}
            ]
        }
        self.mock_table.update_item.return_value = {}

        enricher_module.process_price_record(record)

        call_args = self.mock_table.update_item.call_args
        key = call_args[1]['Key']

        self.assertEqual(key['symbol'], 'BTC')
        self.assertEqual(key['timestamp'], 1234567890000)

    def test_process_price_record_exception_propagates(self):
        """Test that exceptions in process_price_record are propagated."""
        record = {
            'eventName': 'INSERT',
            'dynamodb': {
                'NewImage': {
                    'symbol': {'S': 'BTC'},
                    'timestamp': {'N': '1234567890000'},
                    'price': {'N': '50000.00'}
                }
            }
        }

        self.mock_table.query.side_effect = Exception("Query failed")

        with self.assertRaises(Exception) as cm:
            enricher_module.process_price_record(record)

        self.assertIn("Query failed", str(cm.exception))

    def test_lambda_handler_response_body_structure(self):
        """Test that response body has correct structure."""
        event = {
            'Records': [
                {
                    'eventName': 'INSERT',
                    'dynamodb': {
                        'NewImage': {
                            'symbol': {'S': 'BTC'},
                            'timestamp': {'N': '1234567890000'},
                            'price': {'N': '50000.00'}
                        }
                    }
                }
            ]
        }
        context = {}

        self.mock_table.query.return_value = {
            'Items': [
                {'price': Decimal('50000.00')},
                {'price': Decimal('49000.00')},
                {'price': Decimal('51000.00')},
                {'price': Decimal('50500.00')},
                {'price': Decimal('49500.00')}
            ]
        }
        self.mock_table.update_item.return_value = {}

        response = enricher_module.lambda_handler(event, context)

        self.assertIn('statusCode', response)
        self.assertIn('body', response)

        body = json.loads(response['body'])
        self.assertIn('message', body)

    def test_calculate_moving_average_20_periods(self):
        """Test moving average calculation with 20 periods."""
        # Mock 20 prices
        prices = [Decimal(str(50000 + i * 100)) for i in range(20)]
        self.mock_table.query.return_value = {
            'Items': [{'price': p} for p in prices]
        }

        result = enricher_module.calculate_moving_average('BTC', 1234567890000, periods=20)

        self.assertIsInstance(result, Decimal)
        self.assertGreater(result, Decimal('0'))

    def test_enriched_at_timestamp_included(self):
        """Test that enriched_at timestamp is included in update."""
        record = {
            'eventName': 'INSERT',
            'dynamodb': {
                'NewImage': {
                    'symbol': {'S': 'BTC'},
                    'timestamp': {'N': '1234567890000'},
                    'price': {'N': '50000.00'}
                }
            }
        }

        self.mock_table.query.return_value = {
            'Items': [
                {'price': Decimal('50000.00')},
                {'price': Decimal('49000.00')},
                {'price': Decimal('51000.00')},
                {'price': Decimal('50500.00')},
                {'price': Decimal('49500.00')}
            ]
        }
        self.mock_table.update_item.return_value = {}

        enricher_module.process_price_record(record)

        call_args = self.mock_table.update_item.call_args
        expr_values = call_args[1]['ExpressionAttributeValues']

        self.assertIn(':enriched', expr_values)
        # Verify it's a valid ISO format timestamp
        datetime.fromisoformat(expr_values[':enriched'])

    def test_processed_flag_set_to_true(self):
        """Test that processed flag is set to True after enrichment."""
        record = {
            'eventName': 'INSERT',
            'dynamodb': {
                'NewImage': {
                    'symbol': {'S': 'BTC'},
                    'timestamp': {'N': '1234567890000'},
                    'price': {'N': '50000.00'}
                }
            }
        }

        self.mock_table.query.return_value = {
            'Items': [
                {'price': Decimal('50000.00')},
                {'price': Decimal('49000.00')},
                {'price': Decimal('51000.00')},
                {'price': Decimal('50500.00')},
                {'price': Decimal('49500.00')}
            ]
        }
        self.mock_table.update_item.return_value = {}

        enricher_module.process_price_record(record)

        call_args = self.mock_table.update_item.call_args
        expr_values = call_args[1]['ExpressionAttributeValues']

        self.assertEqual(expr_values[':processed'], True)

    def test_moving_average_result_rounded_to_2_decimals(self):
        """Test that moving average is rounded to 2 decimal places."""
        prices = [
            Decimal('50000.123'),
            Decimal('49000.456'),
            Decimal('51000.789'),
            Decimal('50500.111'),
            Decimal('49500.222')
        ]
        self.mock_table.query.return_value = {
            'Items': [{'price': p} for p in prices]
        }

        result = enricher_module.calculate_moving_average('BTC', 1234567890000, periods=5)

        # Check that result has at most 2 decimal places
        self.assertEqual(result, result.quantize(Decimal('0.01')))

    def test_volatility_result_rounded_to_4_decimals(self):
        """Test that volatility is rounded to 4 decimal places."""
        prices = [Decimal(str(50000 + i * 100)) for i in range(10)]
        self.mock_table.query.return_value = {
            'Items': [{'price': p} for p in prices]
        }

        result = enricher_module.calculate_volatility('BTC', 1234567890000, periods=10)

        # Check that result has at most 4 decimal places
        self.assertEqual(result, result.quantize(Decimal('0.0001')))


if __name__ == '__main__':
    unittest.main()
