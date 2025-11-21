"""Unit tests for Lambda handler function."""
import json
import base64
import unittest
from unittest.mock import Mock, patch, MagicMock
from decimal import Decimal
import sys
import os

# Set environment variables before importing the lambda module
os.environ['ENVIRONMENT'] = 'test'
os.environ['DYNAMODB_TABLE_NAME'] = 'test-table'
os.environ['S3_BUCKET_NAME'] = 'test-bucket'
os.environ['SSM_API_KEY_PARAM'] = '/test/api-key'
os.environ['SSM_CONNECTION_STRING_PARAM'] = '/test/connection-string'
os.environ['REGION'] = 'us-east-1'

# Import the handler module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib', 'lambda'))

# pylint: disable=wrong-import-position,import-error
import index as lambda_handler


class TestLambdaHandler(unittest.TestCase):
    """Test cases for Lambda handler functions."""

    def setUp(self) -> None:
        """Set up test fixtures."""
        # Set environment variables
        os.environ['ENVIRONMENT'] = 'test'
        os.environ['DYNAMODB_TABLE_NAME'] = 'test-table'
        os.environ['S3_BUCKET_NAME'] = 'test-bucket'
        os.environ['SSM_API_KEY_PARAM'] = '/test/api-key'
        os.environ['SSM_CONNECTION_STRING_PARAM'] = '/test/connection-string'
        os.environ['REGION'] = 'us-east-1'

        # Clear SSM cache
        lambda_handler._ssm_cache.clear()

    @patch('index.get_ssm_client')
    def test_get_ssm_parameter_success(self, mock_get_ssm: Mock) -> None:
        """Test successful SSM parameter retrieval."""
        mock_ssm = Mock()
        mock_get_ssm.return_value = mock_ssm
        mock_ssm.get_parameter.return_value = {
            'Parameter': {'Value': 'test-value'}
        }

        result = lambda_handler.get_ssm_parameter('/test/param')

        self.assertEqual(result, 'test-value')
        mock_ssm.get_parameter.assert_called_once_with(
            Name='/test/param',
            WithDecryption=True
        )

    @patch('index.get_ssm_client')
    def test_get_ssm_parameter_caching(self, mock_get_ssm: Mock) -> None:
        """Test that SSM parameters are cached."""
        mock_ssm = Mock()
        mock_get_ssm.return_value = mock_ssm
        mock_ssm.get_parameter.return_value = {
            'Parameter': {'Value': 'cached-value'}
        }

        # First call
        result1 = lambda_handler.get_ssm_parameter('/test/param')
        # Second call
        result2 = lambda_handler.get_ssm_parameter('/test/param')

        self.assertEqual(result1, 'cached-value')
        self.assertEqual(result2, 'cached-value')
        # Should only be called once due to caching
        mock_ssm.get_parameter.assert_called_once()

    @patch('index.get_ssm_client')
    def test_get_ssm_parameter_error(self, mock_get_ssm: Mock) -> None:
        """Test SSM parameter retrieval error handling."""
        mock_ssm = Mock()
        mock_get_ssm.return_value = mock_ssm
        mock_ssm.get_parameter.side_effect = Exception('Parameter not found')

        with self.assertRaises(Exception):
            lambda_handler.get_ssm_parameter('/test/param')

    def test_calculate_fraud_score_high_amount(self) -> None:
        """Test fraud score calculation for high transaction amount."""
        transaction = {
            'amount': 15000,
            'hour': 12,
            'location_mismatch': False,
            'velocity_flag': False
        }

        score = lambda_handler.calculate_fraud_score(transaction)

        # High amount adds 0.3
        self.assertGreaterEqual(score, 0.3)

    def test_calculate_fraud_score_medium_amount(self) -> None:
        """Test fraud score calculation for medium transaction amount."""
        transaction = {
            'amount': 7500,  # Between 5000 and 10000
            'hour': 12,
            'location_mismatch': False,
            'velocity_flag': False
        }

        score = lambda_handler.calculate_fraud_score(transaction)

        # Medium amount adds 0.2
        self.assertAlmostEqual(score, 0.2, places=2)

    def test_calculate_fraud_score_low_medium_amount(self) -> None:
        """Test fraud score calculation for low-medium transaction amount."""
        transaction = {
            'amount': 2500,  # Between 1000 and 5000
            'hour': 12,
            'location_mismatch': False,
            'velocity_flag': False
        }

        score = lambda_handler.calculate_fraud_score(transaction)

        # Low-medium amount adds 0.1
        self.assertAlmostEqual(score, 0.1, places=2)

    def test_calculate_fraud_score_late_night(self) -> None:
        """Test fraud score calculation for late night transaction."""
        transaction = {
            'amount': 100,
            'hour': 2,  # 2 AM
            'location_mismatch': False,
            'velocity_flag': False
        }

        score = lambda_handler.calculate_fraud_score(transaction)

        # Late night adds 0.2
        self.assertGreaterEqual(score, 0.2)

    def test_calculate_fraud_score_location_mismatch(self) -> None:
        """Test fraud score calculation for location mismatch."""
        transaction = {
            'amount': 100,
            'hour': 12,
            'location_mismatch': True,
            'velocity_flag': False
        }

        score = lambda_handler.calculate_fraud_score(transaction)

        # Location mismatch adds 0.3
        self.assertGreaterEqual(score, 0.3)

    def test_calculate_fraud_score_velocity_flag(self) -> None:
        """Test fraud score calculation for velocity flag."""
        transaction = {
            'amount': 100,
            'hour': 12,
            'location_mismatch': False,
            'velocity_flag': True
        }

        score = lambda_handler.calculate_fraud_score(transaction)

        # Velocity flag adds 0.25
        self.assertGreaterEqual(score, 0.25)

    def test_calculate_fraud_score_max_cap(self) -> None:
        """Test that fraud score is capped at 1.0."""
        transaction = {
            'amount': 20000,  # 0.3
            'hour': 2,        # 0.2
            'location_mismatch': True,  # 0.3
            'velocity_flag': True       # 0.25
        }

        score = lambda_handler.calculate_fraud_score(transaction)

        # Should be capped at 1.0
        self.assertEqual(score, 1.0)

    def test_categorize_fraud_score_high(self) -> None:
        """Test fraud score categorization - HIGH."""
        category = lambda_handler.categorize_fraud_score(0.8)
        self.assertEqual(category, "HIGH")

    def test_categorize_fraud_score_medium(self) -> None:
        """Test fraud score categorization - MEDIUM."""
        category = lambda_handler.categorize_fraud_score(0.5)
        self.assertEqual(category, "MEDIUM")

    def test_categorize_fraud_score_low(self) -> None:
        """Test fraud score categorization - LOW."""
        category = lambda_handler.categorize_fraud_score(0.2)
        self.assertEqual(category, "LOW")

    @patch('index.datetime')
    def test_process_transaction(self, mock_datetime: Mock) -> None:
        """Test transaction processing."""
        mock_datetime.utcnow.return_value.isoformat.return_value = '2024-01-01T00:00:00'

        transaction_data = {
            'transaction_id': 'test-123',
            'amount': 5500,
            'hour': 23,
            'location_mismatch': True,
            'velocity_flag': False
        }

        result = lambda_handler.process_transaction(transaction_data)

        self.assertEqual(result['transaction_id'], 'test-123')
        self.assertIn('fraud_score', result)
        self.assertIn('fraud_score_category', result)
        self.assertEqual(result['environment'], 'test')

    @patch('index.get_dynamodb_resource')
    def test_save_to_dynamodb_success(self, mock_get_dynamodb: Mock) -> None:
        """Test successful DynamoDB save."""
        mock_dynamodb = Mock()
        mock_table = Mock()
        mock_get_dynamodb.return_value = mock_dynamodb
        mock_dynamodb.Table.return_value = mock_table

        record = {
            'transaction_id': 'test-123',
            'timestamp': '2024-01-01T00:00:00',
            'fraud_score': 0.5
        }

        lambda_handler.save_to_dynamodb(record)

        mock_table.put_item.assert_called_once()

    @patch('index.get_dynamodb_resource')
    def test_save_to_dynamodb_error(self, mock_get_dynamodb: Mock) -> None:
        """Test DynamoDB save error handling."""
        mock_dynamodb = Mock()
        mock_table = Mock()
        mock_table.put_item.side_effect = Exception('DynamoDB error')
        mock_get_dynamodb.return_value = mock_dynamodb
        mock_dynamodb.Table.return_value = mock_table

        record = {
            'transaction_id': 'test-123',
            'timestamp': '2024-01-01T00:00:00'
        }

        with self.assertRaises(Exception):
            lambda_handler.save_to_dynamodb(record)

    @patch('index.get_s3_client')
    def test_archive_to_s3_high_risk(self, mock_get_s3: Mock) -> None:
        """Test S3 archival for high-risk transaction."""
        mock_s3 = Mock()
        mock_get_s3.return_value = mock_s3

        record = {
            'transaction_id': 'test-123',
            'timestamp': '2024-01-01T00:00:00',
            'fraud_score_category': 'HIGH'
        }

        lambda_handler.archive_to_s3(record)

        mock_s3.put_object.assert_called_once()

    @patch('index.get_s3_client')
    def test_archive_to_s3_medium_risk(self, mock_get_s3: Mock) -> None:
        """Test S3 archival for medium-risk transaction."""
        mock_s3 = Mock()
        mock_get_s3.return_value = mock_s3

        record = {
            'transaction_id': 'test-123',
            'timestamp': '2024-01-01T00:00:00',
            'fraud_score_category': 'MEDIUM'
        }

        lambda_handler.archive_to_s3(record)

        mock_s3.put_object.assert_called_once()

    @patch('index.get_s3_client')
    def test_archive_to_s3_low_risk_skipped(self, mock_get_s3: Mock) -> None:
        """Test that low-risk transactions are not archived."""
        mock_s3 = Mock()
        mock_get_s3.return_value = mock_s3

        record = {
            'transaction_id': 'test-123',
            'timestamp': '2024-01-01T00:00:00',
            'fraud_score_category': 'LOW'
        }

        lambda_handler.archive_to_s3(record)

        mock_s3.put_object.assert_not_called()

    @patch('index.get_s3_client')
    def test_archive_to_s3_error_handled(self, mock_get_s3: Mock) -> None:
        """Test that S3 archival errors don't raise exceptions."""
        mock_s3 = Mock()
        mock_get_s3.return_value = mock_s3
        mock_s3.put_object.side_effect = Exception('S3 error')

        record = {
            'transaction_id': 'test-123',
            'timestamp': '2024-01-01T00:00:00',
            'fraud_score_category': 'HIGH'
        }

        # Should not raise exception
        lambda_handler.archive_to_s3(record)

    @patch('index.archive_to_s3')
    @patch('index.save_to_dynamodb')
    @patch('index.process_transaction')
    @patch('index.get_ssm_parameter')
    def test_handler_success(
        self,
        mock_ssm: Mock,
        mock_process: Mock,
        mock_save: Mock,
        mock_archive: Mock
    ) -> None:
        """Test successful handler execution."""
        mock_ssm.return_value = 'test-value'
        mock_process.return_value = {
            'transaction_id': 'test-123',
            'fraud_score_category': 'LOW'
        }

        transaction_data = {
            'transaction_id': 'test-123',
            'amount': 100
        }
        encoded_data = base64.b64encode(json.dumps(transaction_data).encode('utf-8'))

        event = {
            'Records': [
                {
                    'kinesis': {
                        'data': encoded_data.decode('utf-8')
                    }
                }
            ]
        }

        result = lambda_handler.handler(event, None)

        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertEqual(body['processed'], 1)
        self.assertEqual(body['failed'], 0)

    @patch('index.get_ssm_parameter')
    def test_handler_ssm_parameter_failure(self, mock_ssm: Mock) -> None:
        """Test handler continues when SSM parameters fail."""
        mock_ssm.side_effect = Exception('SSM error')

        event = {
            'Records': []
        }

        result = lambda_handler.handler(event, None)

        # Should still return success even if SSM fails
        self.assertEqual(result['statusCode'], 200)

    @patch('index.process_transaction')
    def test_handler_record_processing_failure(self, mock_process: Mock) -> None:
        """Test handler continues processing after individual record failure."""
        mock_process.side_effect = Exception('Processing error')

        transaction_data = {
            'transaction_id': 'test-123',
            'amount': 100
        }
        encoded_data = base64.b64encode(json.dumps(transaction_data).encode('utf-8'))

        event = {
            'Records': [
                {
                    'kinesis': {
                        'data': encoded_data.decode('utf-8')
                    }
                }
            ]
        }

        result = lambda_handler.handler(event, None)

        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertEqual(body['processed'], 0)
        self.assertEqual(body['failed'], 1)

    @patch('index.archive_to_s3')
    @patch('index.save_to_dynamodb')
    @patch('index.process_transaction')
    @patch('index.get_ssm_parameter')
    def test_handler_multiple_records(
        self,
        mock_ssm: Mock,
        mock_process: Mock,
        mock_save: Mock,
        mock_archive: Mock
    ) -> None:
        """Test handler processes multiple records."""
        mock_ssm.return_value = 'test-value'
        mock_process.return_value = {
            'transaction_id': 'test-123',
            'fraud_score_category': 'LOW'
        }

        records = []
        for i in range(3):
            transaction_data = {
                'transaction_id': f'test-{i}',
                'amount': 100
            }
            encoded_data = base64.b64encode(
                json.dumps(transaction_data).encode('utf-8')
            )
            records.append({
                'kinesis': {
                    'data': encoded_data.decode('utf-8')
                }
            })

        event = {'Records': records}

        result = lambda_handler.handler(event, None)

        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertEqual(body['processed'], 3)
        self.assertEqual(body['failed'], 0)


if __name__ == '__main__':
    unittest.main()
