# tests/unit/test_lambda_function.py

import json
import os
import sys
import unittest
from unittest.mock import Mock, patch, MagicMock, call
from datetime import datetime
from botocore.exceptions import ClientError

# Add lib directory to path to import lambda_function
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

# Set required environment variables before importing
os.environ['DYNAMODB_TABLE_NAME'] = 'test-table'
os.environ['DLQ_URL'] = 'https://sqs.us-east-1.amazonaws.com/123456789/test-dlq'
os.environ['REGION'] = 'us-east-1'

import lambda_function

class TestLambdaHandler(unittest.TestCase):
    """Test cases for the lambda_handler function"""

    def setUp(self):
        """Set up test fixtures"""
        self.mock_table = Mock()
        self.mock_sqs = Mock()

    @patch('lambda_function.table')
    @patch('lambda_function.sqs')
    def test_lambda_handler_success(self, mock_sqs, mock_table):
        """Test successful processing of valid order messages"""
        # Arrange
        event = {
            'Records': [
                {
                    'messageId': 'msg-001',
                    'receiptHandle': 'receipt-001',
                    'body': json.dumps({
                        'order_id': 'ORD-001',
                        'customer_id': 'CUST-001',
                        'amount': 100.50,
                        'items': ['item1', 'item2']
                    })
                }
            ]
        }
        context = Mock()
        mock_table.put_item = Mock(return_value={})

        # Act
        result = lambda_function.lambda_handler(event, context)

        # Assert
        self.assertEqual(result['batchItemFailures'], [])
        mock_table.put_item.assert_called_once()

    @patch('lambda_function.table')
    @patch('lambda_function.sqs')
    def test_lambda_handler_invalid_json(self, mock_sqs, mock_table):
        """Test handling of invalid JSON in message body"""
        # Arrange
        event = {
            'Records': [
                {
                    'messageId': 'msg-002',
                    'receiptHandle': 'receipt-002',
                    'body': 'invalid-json'
                }
            ]
        }
        context = Mock()

        # Act
        result = lambda_function.lambda_handler(event, context)

        # Assert
        self.assertEqual(len(result['batchItemFailures']), 1)
        self.assertEqual(result['batchItemFailures'][0]['itemIdentifier'], 'msg-002')

    @patch('lambda_function.table')
    @patch('lambda_function.sqs')
    def test_lambda_handler_missing_order_id(self, mock_sqs, mock_table):
        """Test handling of message without order_id"""
        # Arrange
        event = {
            'Records': [
                {
                    'messageId': 'msg-003',
                    'receiptHandle': 'receipt-003',
                    'body': json.dumps({
                        'customer_id': 'CUST-002',
                        'amount': 50.00,
                        'items': ['item3']
                    })
                }
            ]
        }
        context = Mock()
        mock_table.put_item = Mock(return_value={})

        # Act
        result = lambda_function.lambda_handler(event, context)

        # Assert
        self.assertEqual(len(result['batchItemFailures']), 1)
        self.assertEqual(result['batchItemFailures'][0]['itemIdentifier'], 'msg-003')

    @patch('lambda_function.table')
    @patch('lambda_function.sqs')
    def test_lambda_handler_multiple_messages(self, mock_sqs, mock_table):
        """Test processing multiple messages in a batch"""
        # Arrange
        event = {
            'Records': [
                {
                    'messageId': 'msg-004',
                    'receiptHandle': 'receipt-004',
                    'body': json.dumps({
                        'order_id': 'ORD-002',
                        'customer_id': 'CUST-003',
                        'amount': 75.00,
                        'items': ['item4']
                    })
                },
                {
                    'messageId': 'msg-005',
                    'receiptHandle': 'receipt-005',
                    'body': json.dumps({
                        'order_id': 'ORD-003',
                        'customer_id': 'CUST-004',
                        'amount': 125.00,
                        'items': ['item5', 'item6']
                    })
                }
            ]
        }
        context = Mock()
        mock_table.put_item = Mock(return_value={})

        # Act
        result = lambda_function.lambda_handler(event, context)

        # Assert
        self.assertEqual(result['batchItemFailures'], [])
        self.assertEqual(mock_table.put_item.call_count, 2)

    @patch('lambda_function.table')
    def test_lambda_handler_dynamodb_error(self, mock_table):
        """Test handling of DynamoDB errors"""
        # Arrange
        event = {
            'Records': [
                {
                    'messageId': 'msg-006',
                    'receiptHandle': 'receipt-006',
                    'body': json.dumps({
                        'order_id': 'ORD-004',
                        'customer_id': 'CUST-005',
                        'amount': 200.00,
                        'items': ['item7']
                    })
                }
            ]
        }
        context = Mock()
        mock_table.put_item = Mock(side_effect=ClientError(
            {'Error': {'Message': 'DynamoDB error'}},
            'PutItem'
        ))

        # Act
        result = lambda_function.lambda_handler(event, context)

        # Assert
        self.assertEqual(len(result['batchItemFailures']), 1)

class TestProcessOrder(unittest.TestCase):
    """Test cases for the process_order function"""

    def test_process_order_success(self):
        """Test successful order processing"""
        # Arrange
        order_id = 'ORD-005'
        order_data = {
            'customer_id': 'CUST-006',
            'amount': 150.00,
            'items': ['item8', 'item9']
        }

        # Act
        result = lambda_function.process_order(order_id, order_data)

        # Assert
        self.assertTrue(result['success'])
        self.assertIn('confirmation_number', result['details'])
        self.assertEqual(result['details']['customer_id'], 'CUST-006')
        self.assertEqual(result['details']['amount'], 150.00)
        self.assertEqual(result['details']['item_count'], 2)

    def test_process_order_missing_field(self):
        """Test order processing with missing required field"""
        # Arrange
        order_id = 'ORD-006'
        order_data = {
            'customer_id': 'CUST-007',
            'amount': 100.00
            # Missing 'items' field
        }

        # Act
        result = lambda_function.process_order(order_id, order_data)

        # Assert
        self.assertFalse(result['success'])
        self.assertIn('Missing required field: items', result['error'])

    def test_process_order_invalid_amount(self):
        """Test order processing with invalid amount"""
        # Arrange
        order_id = 'ORD-007'
        order_data = {
            'customer_id': 'CUST-008',
            'amount': -50.00,  # Invalid negative amount
            'items': ['item10']
        }

        # Act
        result = lambda_function.process_order(order_id, order_data)

        # Assert
        self.assertFalse(result['success'])
        self.assertIn('Invalid order amount', result['error'])

    def test_process_order_zero_amount(self):
        """Test order processing with zero amount"""
        # Arrange
        order_id = 'ORD-008'
        order_data = {
            'customer_id': 'CUST-009',
            'amount': 0,
            'items': ['item11']
        }

        # Act
        result = lambda_function.process_order(order_id, order_data)

        # Assert
        self.assertFalse(result['success'])
        self.assertIn('Invalid order amount', result['error'])

    def test_process_order_empty_items(self):
        """Test order processing with empty items list"""
        # Arrange
        order_id = 'ORD-009'
        order_data = {
            'customer_id': 'CUST-010',
            'amount': 50.00,
            'items': []  # Empty items list
        }

        # Act
        result = lambda_function.process_order(order_id, order_data)

        # Assert
        self.assertFalse(result['success'])
        self.assertIn('Invalid or empty items list', result['error'])

    def test_process_order_invalid_items_type(self):
        """Test order processing with invalid items type"""
        # Arrange
        order_id = 'ORD-010'
        order_data = {
            'customer_id': 'CUST-011',
            'amount': 75.00,
            'items': 'not-a-list'  # Invalid type for items
        }

        # Act
        result = lambda_function.process_order(order_id, order_data)

        # Assert
        self.assertFalse(result['success'])
        self.assertIn('Invalid or empty items list', result['error'])

class TestUpdateOrderStatus(unittest.TestCase):
    """Test cases for the update_order_status function"""

    @patch('lambda_function.table')
    def test_update_order_status_success(self, mock_table):
        """Test successful status update"""
        # Arrange
        order_id = 'ORD-011'
        status = 'PROCESSED'
        details = {'confirmation': 'CONF-123'}
        mock_table.put_item = Mock(return_value={})

        # Act
        lambda_function.update_order_status(order_id, status, details)

        # Assert
        mock_table.put_item.assert_called_once()
        call_args = mock_table.put_item.call_args[1]['Item']
        self.assertEqual(call_args['order_id'], order_id)
        self.assertEqual(call_args['status'], status)
        self.assertIn('processed_at', call_args)
        self.assertEqual(json.loads(call_args['details']), details)

    @patch('lambda_function.table')
    def test_update_order_status_with_error(self, mock_table):
        """Test status update with error message"""
        # Arrange
        order_id = 'ORD-012'
        status = 'FAILED'
        details = {'reason': 'validation_error'}
        error_message = 'Invalid order format'
        mock_table.put_item = Mock(return_value={})

        # Act
        lambda_function.update_order_status(order_id, status, details, error_message)

        # Assert
        mock_table.put_item.assert_called_once()
        call_args = mock_table.put_item.call_args[1]['Item']
        self.assertEqual(call_args['error_message'], error_message)

    @patch('lambda_function.table')
    def test_update_order_status_dynamodb_error(self, mock_table):
        """Test handling of DynamoDB errors during update"""
        # Arrange
        order_id = 'ORD-013'
        status = 'PROCESSED'
        details = {}
        mock_table.put_item = Mock(side_effect=ClientError(
            {'Error': {'Message': 'Table not found'}},
            'PutItem'
        ))

        # Act & Assert
        with self.assertRaises(ClientError):
            lambda_function.update_order_status(order_id, status, details)

    @patch('lambda_function.table')
    def test_update_order_status_unexpected_error(self, mock_table):
        """Test handling of unexpected errors during update"""
        # Arrange
        order_id = 'ORD-014'
        status = 'PROCESSED'
        details = {}
        mock_table.put_item = Mock(side_effect=Exception('Unexpected error'))

        # Act & Assert
        with self.assertRaises(Exception):
            lambda_function.update_order_status(order_id, status, details)

class TestGetProcessingStats(unittest.TestCase):
    """Test cases for the get_processing_stats function"""

    @patch('lambda_function.dynamodb')
    def test_get_processing_stats_success(self, mock_dynamodb):
        """Test successful retrieval of processing statistics"""
        # Arrange
        mock_paginator = Mock()
        mock_page_iterator = [
            {'Count': 10},
            {'Count': 15},
            {'Count': 5}
        ]
        mock_paginator.paginate = Mock(return_value=mock_page_iterator)
        mock_dynamodb.meta.client.get_paginator = Mock(return_value=mock_paginator)

        # Act
        result = lambda_function.get_processing_stats()

        # Assert
        self.assertEqual(result['total'], 30)
        mock_dynamodb.meta.client.get_paginator.assert_called_once_with('scan')

    @patch('lambda_function.dynamodb')
    def test_get_processing_stats_error(self, mock_dynamodb):
        """Test handling of errors when getting statistics"""
        # Arrange
        mock_dynamodb.meta.client.get_paginator = Mock(side_effect=Exception('DynamoDB error'))

        # Act
        result = lambda_function.get_processing_stats()

        # Assert
        self.assertEqual(result, {'total': 0, 'processed': 0, 'failed': 0})

    @patch('lambda_function.dynamodb')
    def test_get_processing_stats_empty_table(self, mock_dynamodb):
        """Test statistics for empty table"""
        # Arrange
        mock_paginator = Mock()
        mock_page_iterator = []
        mock_paginator.paginate = Mock(return_value=mock_page_iterator)
        mock_dynamodb.meta.client.get_paginator = Mock(return_value=mock_paginator)

        # Act
        result = lambda_function.get_processing_stats()

        # Assert
        self.assertEqual(result['total'], 0)

class TestEnvironmentConfiguration(unittest.TestCase):
    """Test cases for environment configuration"""

    def test_environment_variables(self):
        """Test that required environment variables are set"""
        self.assertEqual(os.environ['DYNAMODB_TABLE_NAME'], 'test-table')
        self.assertEqual(os.environ['DLQ_URL'], 'https://sqs.us-east-1.amazonaws.com/123456789/test-dlq')
        self.assertEqual(os.environ['REGION'], 'us-east-1')

    def test_aws_clients_initialization(self):
        """Test AWS clients are initialized with correct region"""
        # This test ensures the module loads without errors
        self.assertIsNotNone(lambda_function.dynamodb)
        self.assertIsNotNone(lambda_function.sqs)
        self.assertIsNotNone(lambda_function.table)

if __name__ == '__main__':
    unittest.main()
