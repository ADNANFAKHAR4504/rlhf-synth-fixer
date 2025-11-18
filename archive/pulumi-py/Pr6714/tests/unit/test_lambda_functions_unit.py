"""
Unit tests for Lambda function handlers.

Tests all Lambda function logic including error handling and edge cases.
"""
import json
import os
import unittest
from unittest.mock import Mock, patch
from decimal import Decimal
import importlib.util


# Load Lambda modules dynamically to avoid 'lambda' keyword issue
def load_lambda_module(function_name):
    """Load a Lambda function module dynamically."""
    lib_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../lib'))
    module_path = os.path.join(lib_dir, 'lambda', function_name, 'index.py')
    spec = importlib.util.spec_from_file_location(f"{function_name}_index", module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class TestAPIHandlerLambda(unittest.TestCase):
    """Unit tests for API Handler Lambda function."""

    @patch.dict(os.environ, {'QUEUE_URL': 'https://sqs.us-east-1.amazonaws.com/123/test-queue'})
    def test_lambda_handler_success(self):
        """Test successful transaction processing."""
        with patch('boto3.client') as mock_boto_client:
            mock_sqs = Mock()
            mock_sqs.send_message.return_value = {'MessageId': 'test-message-id'}
            mock_boto_client.return_value = mock_sqs

            # Load module after patching
            api_handler = load_lambda_module('api_handler')

            event = {
                'body': json.dumps({
                    'transaction_id': 'txn-001',
                    'amount': 100.50,
                    'timestamp': 1234567890
                })
            }

            response = api_handler.lambda_handler(event, None)

            self.assertEqual(response['statusCode'], 202)
            body = json.loads(response['body'])
            self.assertEqual(body['transaction_id'], 'txn-001')

    @patch.dict(os.environ, {'QUEUE_URL': 'https://sqs.us-east-1.amazonaws.com/123/test-queue'})
    def test_lambda_handler_missing_field(self):
        """Test handling of missing required fields."""
        api_handler = load_lambda_module('api_handler')
        event = {
            'body': json.dumps({'transaction_id': 'txn-001', 'amount': 100.50})
        }

        response = api_handler.lambda_handler(event, None)

        self.assertEqual(response['statusCode'], 400)
        body = json.loads(response['body'])
        self.assertIn('timestamp', body['error'])

    @patch.dict(os.environ, {'QUEUE_URL': 'https://sqs.us-east-1.amazonaws.com/123/test-queue'})
    def test_lambda_handler_negative_amount(self):
        """Test handling of negative amount."""
        api_handler = load_lambda_module('api_handler')
        event = {
            'body': json.dumps({
                'transaction_id': 'txn-001',
                'amount': -50.00,
                'timestamp': 1234567890
            })
        }

        response = api_handler.lambda_handler(event, None)

        self.assertEqual(response['statusCode'], 400)

    @patch.dict(os.environ, {'QUEUE_URL': 'https://sqs.us-east-1.amazonaws.com/123/test-queue'})
    def test_lambda_handler_invalid_json(self):
        """Test handling of invalid JSON."""
        api_handler = load_lambda_module('api_handler')
        event = {'body': 'invalid json {'}

        response = api_handler.lambda_handler(event, None)

        self.assertEqual(response['statusCode'], 400)

    @patch.dict(os.environ, {'QUEUE_URL': 'https://sqs.us-east-1.amazonaws.com/123/test-queue'})
    def test_lambda_handler_sqs_error(self):
        """Test handling of SQS errors."""
        with patch('boto3.client') as mock_boto_client:
            mock_sqs = Mock()
            mock_sqs.send_message.side_effect = Exception("SQS error")
            mock_boto_client.return_value = mock_sqs

            # Load module after patching
            api_handler = load_lambda_module('api_handler')

            event = {
                'body': json.dumps({
                    'transaction_id': 'txn-001',
                    'amount': 100.50,
                    'timestamp': 1234567890
                })
            }

            response = api_handler.lambda_handler(event, None)

            self.assertEqual(response['statusCode'], 500)


class TestQueueConsumerLambda(unittest.TestCase):
    """Unit tests for Queue Consumer Lambda function."""

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table'})
    def test_lambda_handler_success(self):
        """Test successful message processing."""
        with patch('boto3.resource') as mock_boto_resource:
            mock_table = Mock()
            mock_dynamodb = Mock()
            mock_dynamodb.Table.return_value = mock_table
            mock_boto_resource.return_value = mock_dynamodb

            # Load module after patching
            queue_consumer = load_lambda_module('queue_consumer')

            event = {
                'Records': [
                    {
                        'body': json.dumps({
                            'transaction_id': 'txn-001',
                            'amount': 100.50,
                            'timestamp': 1234567890
                        })
                    }
                ]
            }

            response = queue_consumer.lambda_handler(event, None)

            self.assertEqual(response['statusCode'], 200)
            body = json.loads(response['body'])
            self.assertEqual(body['successful'], 1)

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table'})
    def test_lambda_handler_error(self):
        """Test handling of errors."""
        with patch('boto3.resource') as mock_boto_resource:
            mock_table = Mock()
            mock_table.put_item.side_effect = Exception("DynamoDB error")
            mock_dynamodb = Mock()
            mock_dynamodb.Table.return_value = mock_table
            mock_boto_resource.return_value = mock_dynamodb

            # Load module after patching
            queue_consumer = load_lambda_module('queue_consumer')

            event = {
                'Records': [
                    {'body': json.dumps({'transaction_id': 'txn-001', 'amount': 100.50, 'timestamp': 1234567890})}
                ]
            }

            response = queue_consumer.lambda_handler(event, None)

            self.assertEqual(response['statusCode'], 200)
            body = json.loads(response['body'])
            self.assertEqual(body['failed'], 1)

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table'})
    def test_lambda_handler_without_amount(self):
        """Test handling of message without amount field."""
        with patch('boto3.resource') as mock_boto_resource:
            mock_table = Mock()
            mock_dynamodb = Mock()
            mock_dynamodb.Table.return_value = mock_table
            mock_boto_resource.return_value = mock_dynamodb

            # Load module after patching
            queue_consumer = load_lambda_module('queue_consumer')

            event = {
                'Records': [
                    {
                        'body': json.dumps({
                            'transaction_id': 'txn-001',
                            'timestamp': 1234567890
                            # No 'amount' field to test branch coverage
                        })
                    }
                ]
            }

            response = queue_consumer.lambda_handler(event, None)

            self.assertEqual(response['statusCode'], 200)
            body = json.loads(response['body'])
            self.assertEqual(body['successful'], 1)


class TestBatchProcessorLambda(unittest.TestCase):
    """Unit tests for Batch Processor Lambda function."""

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table'})
    def test_lambda_handler_success(self):
        """Test successful batch processing."""
        with patch('boto3.resource') as mock_boto_resource:
            mock_table = Mock()
            mock_table.scan.return_value = {
                'Items': [
                    {
                        'transaction_id': 'txn-001', 
                        'amount': Decimal('100.50'), 
                        'timestamp': 1234567890, 
                        'customer_id': 'cust-001'
                    }
                ]
            }
            mock_dynamodb = Mock()
            mock_dynamodb.Table.return_value = mock_table
            mock_boto_resource.return_value = mock_dynamodb

            # Load module after patching
            batch_processor = load_lambda_module('batch_processor')

            response = batch_processor.lambda_handler({}, None)

            self.assertEqual(response['statusCode'], 200)

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table'})
    def test_detect_anomalies(self):
        """Test anomaly detection."""
        batch_processor = load_lambda_module('batch_processor')
        transactions = [
            {'transaction_id': 'txn-001', 'amount': Decimal('100'), 'customer_id': 'cust-001'},
            {'transaction_id': 'txn-002', 'amount': Decimal('1500'), 'customer_id': 'cust-001'}
        ]

        anomalies = batch_processor.detect_anomalies(transactions)
        self.assertIsInstance(anomalies, list)

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table'})
    def test_detect_anomalies_high_amount(self):
        """Test anomaly detection for high amount transactions."""
        batch_processor = load_lambda_module('batch_processor')
        # Customer has average of ~200 (100+200+300)/3 = 200
        # Then add a transaction of 2000 which is > 3*200 (600) and > 1000
        transactions = [
            {'transaction_id': 'txn-001', 'amount': Decimal('100'), 'customer_id': 'cust-001', 'timestamp': 1234567890},
            {'transaction_id': 'txn-002', 'amount': Decimal('200'), 'customer_id': 'cust-001', 'timestamp': 1234567891},
            {'transaction_id': 'txn-003', 'amount': Decimal('300'), 'customer_id': 'cust-001', 'timestamp': 1234567892},
            {'transaction_id': 'txn-004', 'amount': Decimal('2000'), 'customer_id': 'cust-001', 'timestamp': 1234567893}
        ]

        anomalies = batch_processor.detect_anomalies(transactions)
        # Should detect the high amount transaction (2000 > 3 * 650 and > 1000)
        self.assertGreater(len(anomalies), 0)
        self.assertIn('anomaly_reason', anomalies[0])
        self.assertEqual(anomalies[0]['anomaly_reason'], 'High amount compared to average')

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table'})
    def test_detect_anomalies_high_frequency(self):
        """Test anomaly detection for high frequency transactions."""
        batch_processor = load_lambda_module('batch_processor')
        # Create more than 10 transactions to trigger frequency anomaly
        transactions = [
            {
                'transaction_id': f'txn-{i:03d}', 
                'amount': Decimal('100'), 
                'customer_id': 'cust-001', 
                'timestamp': 1234567890 + i
            }
            for i in range(12)
        ]

        anomalies = batch_processor.detect_anomalies(transactions)
        # Should detect high frequency (12 transactions)
        self.assertGreater(len(anomalies), 0)

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table'})
    def test_lambda_handler_with_pagination(self):
        """Test batch processor with pagination."""
        with patch('boto3.resource') as mock_boto_resource:
            mock_table = Mock()
            # First scan returns data with LastEvaluatedKey
            mock_table.scan.side_effect = [
                {
                    'Items': [
                        {
                            'transaction_id': 'txn-001', 
                            'amount': Decimal('100'), 
                            'timestamp': 1234567890, 
                            'customer_id': 'cust-001'
                        }
                    ],
                    'LastEvaluatedKey': {'transaction_id': 'txn-001'}
                },
                {
                    'Items': [
                        {
                            'transaction_id': 'txn-002', 
                            'amount': Decimal('200'), 
                            'timestamp': 1234567891, 
                            'customer_id': 'cust-002'
                        }
                    ]
                }
            ]
            mock_dynamodb = Mock()
            mock_dynamodb.Table.return_value = mock_table
            mock_boto_resource.return_value = mock_dynamodb

            batch_processor = load_lambda_module('batch_processor')

            response = batch_processor.lambda_handler({}, None)

            self.assertEqual(response['statusCode'], 200)
            # Should have called scan twice due to pagination
            self.assertEqual(mock_table.scan.call_count, 2)

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table'})
    def test_lambda_handler_with_anomalies(self):
        """Test batch processor with anomalies detected."""
        with patch('boto3.resource') as mock_boto_resource:
            mock_table = Mock()
            # Create transactions that will trigger anomaly detection
            transactions = [
                {
                    'transaction_id': f'txn-{i:03d}', 
                    'amount': Decimal('100'), 
                    'timestamp': 1234567890 + i, 
                    'customer_id': 'cust-001'
                }
                for i in range(12)
            ]
            mock_table.scan.return_value = {'Items': transactions}
            mock_dynamodb = Mock()
            mock_dynamodb.Table.return_value = mock_table
            mock_boto_resource.return_value = mock_dynamodb

            batch_processor = load_lambda_module('batch_processor')

            response = batch_processor.lambda_handler({}, None)

            self.assertEqual(response['statusCode'], 200)
            body = json.loads(response['body'])
            self.assertEqual(body['transactions_processed'], 12)
            self.assertGreater(body['anomalies_detected'], 0)

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table'})
    def test_lambda_handler_error_handling(self):
        """Test batch processor error handling."""
        with patch('boto3.resource') as mock_boto_resource:
            mock_table = Mock()
            mock_table.scan.side_effect = Exception("DynamoDB error")
            mock_dynamodb = Mock()
            mock_dynamodb.Table.return_value = mock_table
            mock_boto_resource.return_value = mock_dynamodb

            batch_processor = load_lambda_module('batch_processor')

            with self.assertRaises(Exception):
                batch_processor.lambda_handler({}, None)


class TestReportGeneratorLambda(unittest.TestCase):
    """Unit tests for Report Generator Lambda function."""

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table', 'BUCKET_NAME': 'test-bucket'})
    def test_lambda_handler_success(self):
        """Test successful report generation."""
        with patch('boto3.resource') as mock_boto_resource, patch('boto3.client') as mock_boto_client:
            mock_table = Mock()
            mock_table.scan.return_value = {
                'Items': [
                    {
                        'transaction_id': 'txn-001',
                        'amount': Decimal('100.50'),
                        'timestamp': 1234567890,
                        'customer_id': 'cust-001',
                        'merchant': 'merchant-001'
                    }
                ]
            }
            mock_dynamodb = Mock()
            mock_dynamodb.Table.return_value = mock_table
            mock_boto_resource.return_value = mock_dynamodb

            mock_s3 = Mock()
            mock_boto_client.return_value = mock_s3

            # Load module after patching
            report_generator = load_lambda_module('report_generator')

            response = report_generator.lambda_handler({}, None)

            self.assertEqual(response['statusCode'], 200)

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table', 'BUCKET_NAME': 'test-bucket'})
    def test_generate_report(self):
        """Test report generation."""
        report_generator = load_lambda_module('report_generator')
        transactions = [
            {
                'transaction_id': 'txn-001',
                'amount': Decimal('100.50'),
                'timestamp': 1234567890,
                'customer_id': 'cust-001',
                'merchant': 'merchant-001'
            }
        ]

        report = report_generator.generate_report(transactions)
        self.assertIn('txn-001', report)

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table', 'BUCKET_NAME': 'test-bucket'})
    def test_generate_report_empty_transactions(self):
        """Test report generation with no transactions."""
        report_generator = load_lambda_module('report_generator')
        transactions = []

        report = report_generator.generate_report(transactions)
        self.assertEqual(report, "No transactions for the reporting period")

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table', 'BUCKET_NAME': 'test-bucket'})
    def test_lambda_handler_with_pagination(self):
        """Test report generator with pagination."""
        with patch('boto3.resource') as mock_boto_resource, patch('boto3.client') as mock_boto_client:
            mock_table = Mock()
            # First scan returns data with LastEvaluatedKey
            mock_table.scan.side_effect = [
                {
                    'Items': [
                        {
                            'transaction_id': 'txn-001',
                            'amount': Decimal('100.50'),
                            'timestamp': 1234567890,
                            'customer_id': 'cust-001',
                            'merchant': 'merchant-001'
                        }
                    ],
                    'LastEvaluatedKey': {'transaction_id': 'txn-001'}
                },
                {
                    'Items': [
                        {
                            'transaction_id': 'txn-002',
                            'amount': Decimal('200.75'),
                            'timestamp': 1234567891,
                            'customer_id': 'cust-002',
                            'merchant': 'merchant-002'
                        }
                    ]
                }
            ]
            mock_dynamodb = Mock()
            mock_dynamodb.Table.return_value = mock_table
            mock_boto_resource.return_value = mock_dynamodb

            mock_s3 = Mock()
            mock_boto_client.return_value = mock_s3

            report_generator = load_lambda_module('report_generator')

            response = report_generator.lambda_handler({}, None)

            self.assertEqual(response['statusCode'], 200)
            # Should have called scan twice due to pagination
            self.assertEqual(mock_table.scan.call_count, 2)
            # Should have uploaded to S3
            mock_s3.put_object.assert_called_once()

    @patch.dict(os.environ, {'TABLE_NAME': 'test-table', 'BUCKET_NAME': 'test-bucket'})
    def test_lambda_handler_error_handling(self):
        """Test report generator error handling."""
        with patch('boto3.resource') as mock_boto_resource, patch('boto3.client') as mock_boto_client:
            mock_table = Mock()
            mock_table.scan.side_effect = Exception("DynamoDB error")
            mock_dynamodb = Mock()
            mock_dynamodb.Table.return_value = mock_table
            mock_boto_resource.return_value = mock_dynamodb

            mock_s3 = Mock()
            mock_boto_client.return_value = mock_s3

            report_generator = load_lambda_module('report_generator')

            with self.assertRaises(Exception):
                report_generator.lambda_handler({}, None)


if __name__ == '__main__':
    unittest.main()
