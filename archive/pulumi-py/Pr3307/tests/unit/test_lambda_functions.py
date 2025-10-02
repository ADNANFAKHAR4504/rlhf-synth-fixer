"""
test_lambda_functions.py

Unit tests for Lambda functions using moto for AWS mocking.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import json
import os
import sys
from decimal import Decimal
from datetime import datetime
import time

# Add the parent directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

# Set up environment variables before importing Lambda functions
os.environ['DYNAMODB_TABLE_NAME'] = 'test-inventory-table'
os.environ['DLQ_URL'] = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-dlq'
os.environ['ENVIRONMENT'] = 'test'
os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'
os.environ['AWS_REGION'] = 'us-east-1'


class TestInventoryProcessor(unittest.TestCase):
    """Test cases for inventory processor Lambda function."""

    def setUp(self):
        """Set up test fixtures."""
        self.sample_event = {
            'detail': {
                'bucket': {'name': 'test-bucket'},
                'object': {'key': 'test-file.csv'}
            }
        }
        self.sample_csv_content = """product_id,quantity,price,warehouse_id
PROD-001,100,25.50,WH-001
PROD-002,50,15.75,WH-002
PROD-003,75,30.00,WH-001"""

    @patch('boto3.resource')
    @patch('boto3.client')
    def test_inventory_handler(self, mock_boto_client, mock_boto_resource):
        """Test inventory processor handler."""
        # Mock S3 client
        mock_s3 = MagicMock()
        mock_s3.get_object.return_value = {
            'ContentLength': 100,
            'Body': Mock(read=Mock(return_value=self.sample_csv_content.encode('utf-8')))
        }

        # Mock CloudWatch client
        mock_cloudwatch = MagicMock()

        # Mock SQS client
        mock_sqs = MagicMock()

        # Configure boto3.client to return appropriate mocks
        def client_side_effect(service_name):
            if service_name == 's3':
                return mock_s3
            elif service_name == 'cloudwatch':
                return mock_cloudwatch
            elif service_name == 'sqs':
                return mock_sqs
            return MagicMock()

        mock_boto_client.side_effect = client_side_effect

        # Mock DynamoDB resource
        mock_table = MagicMock()
        mock_dynamodb_resource = MagicMock()
        mock_dynamodb_resource.Table.return_value = mock_table
        mock_boto_resource.return_value = mock_dynamodb_resource

        # Import handler after mocking
        from lib.handlers.inventory_processor import handler

        # Call the handler
        response = handler(self.sample_event, None)

        # Verify response
        self.assertEqual(response['statusCode'], 200)
        body = json.loads(response['body'])
        self.assertEqual(body['message'], 'Inventory processed successfully')

    @patch('boto3.resource')
    @patch('boto3.client')
    def test_process_csv_row(self, mock_boto_client, mock_boto_resource):
        """Test processing a single CSV row."""
        # Import function after mocking
        from lib.handlers.inventory_processor import process_csv_row

        row = {
            'product_id': 'PROD-001',
            'quantity': '100',
            'price': '25.50',
            'warehouse_id': 'WH-001'
        }

        with patch('lib.handlers.inventory_processor.time.time', return_value=1234567890.0):
            item = process_csv_row(row, 'test-file.csv')

            self.assertEqual(item['product_id'], 'PROD-001')
            self.assertEqual(item['quantity'], Decimal('100'))
            self.assertEqual(item['price'], Decimal('25.50'))
            self.assertEqual(item['warehouse_id'], 'WH-001')
            self.assertEqual(item['source_file'], 'test-file.csv')
            self.assertEqual(item['environment'], 'test')


class TestSummaryProcessor(unittest.TestCase):
    """Test cases for summary processor Lambda function."""

    def setUp(self):
        """Set up test fixtures."""
        self.sample_items = [
            {
                'product_id': 'PROD-001',
                'quantity': Decimal('100'),
                'price': Decimal('25.50'),
                'warehouse_id': 'WH-001',
                'timestamp': Decimal(str(time.time()))
            },
            {
                'product_id': 'PROD-002',
                'quantity': Decimal('50'),
                'price': Decimal('15.75'),
                'warehouse_id': 'WH-002',
                'timestamp': Decimal(str(time.time()))
            }
        ]

    @patch('lib.handlers.summary_processor.cloudwatch')
    @patch('lib.handlers.summary_processor.dynamodb')
    def test_summary_handler(self, mock_dynamodb, mock_cloudwatch):
        """Test summary Lambda handler."""
        # Mock DynamoDB table
        mock_table = MagicMock()
        mock_table.scan.return_value = {
            'Items': self.sample_items
        }
        mock_dynamodb.Table.return_value = mock_table

        # Import handler after mocking
        from lib.handlers.summary_processor import handler

        # Call the handler
        response = handler({}, None)

        # Verify response
        self.assertEqual(response['statusCode'], 200)
        body = json.loads(response['body'])
        self.assertEqual(body['environment'], 'test')
        self.assertEqual(body['total_updates'], 2)
        self.assertEqual(body['unique_products'], 2)

    def test_decimal_encoder(self):
        """Test DecimalEncoder for JSON serialization."""
        from lib.handlers.summary_processor import DecimalEncoder

        # Test Decimal encoding
        data = {'value': Decimal('123.45')}
        json_str = json.dumps(data, cls=DecimalEncoder)
        self.assertIn('123.45', json_str)

        # Test normal values pass through
        data = {'value': 'test', 'number': 42}
        json_str = json.dumps(data, cls=DecimalEncoder)
        self.assertIn('test', json_str)
        self.assertIn('42', json_str)


if __name__ == '__main__':
    unittest.main()