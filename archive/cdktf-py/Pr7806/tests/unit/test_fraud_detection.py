"""Unit tests for Fraud Detection Lambda function."""
import json
import unittest
from unittest.mock import patch, MagicMock, Mock
import sys
import os

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib', 'lambda'))

import fraud_detection  # pylint: disable=wrong-import-position


class TestFraudDetection(unittest.TestCase):
    """Test cases for Fraud Detection Lambda."""

    def setUp(self):
        """Set up test fixtures."""
        os.environ['SQS_QUEUE_URL'] = 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue'
        os.environ['AWS_REGION'] = 'us-east-1'

    @patch('fraud_detection.boto3')
    def test_get_sqs_client(self, mock_boto3):
        """Test get_sqs_client helper function."""
        mock_sqs = MagicMock()
        mock_boto3.client.return_value = mock_sqs

        result = fraud_detection.get_sqs_client()

        mock_boto3.client.assert_called_once_with('sqs')
        self.assertEqual(result, mock_sqs)

    def test_get_queue_url(self):
        """Test get_queue_url helper function."""
        result = fraud_detection.get_queue_url()
        self.assertEqual(result, 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue')

    def test_detect_high_value_transaction(self):
        """Test detection of high-value transactions."""
        transaction = {
            'transaction_id': 'TX-001',
            'amount': 15000.00,
            'merchant': 'Normal Store',
            'card_number': '1234567890123456',
            'location': 'USA'
        }

        result = fraud_detection.detect_fraud(transaction)
        self.assertTrue(result)

    def test_detect_suspicious_merchant(self):
        """Test detection of suspicious merchants."""
        transaction = {
            'transaction_id': 'TX-002',
            'amount': 50.00,
            'merchant': 'Unknown Merchant',
            'card_number': '1234567890123456',
            'location': 'USA'
        }

        result = fraud_detection.detect_fraud(transaction)
        self.assertTrue(result)

    def test_detect_small_round_amount(self):
        """Test detection of small round amount pattern."""
        transaction = {
            'transaction_id': 'TX-003',
            'amount': 45.00,
            'merchant': 'Normal Store',
            'card_number': '1234567890123456',
            'location': 'USA'
        }

        result = fraud_detection.detect_fraud(transaction)
        self.assertTrue(result)

    def test_detect_high_risk_location(self):
        """Test detection of high-risk locations."""
        transaction = {
            'transaction_id': 'TX-004',
            'amount': 500.00,
            'merchant': 'Normal Store',
            'card_number': '1234567890123456',
            'location': 'Nigeria'
        }

        result = fraud_detection.detect_fraud(transaction)
        self.assertTrue(result)

    def test_legitimate_transaction(self):
        """Test legitimate transaction is not flagged."""
        transaction = {
            'transaction_id': 'TX-005',
            'amount': 125.67,
            'merchant': 'Walmart',
            'card_number': '1234567890123456',
            'location': 'USA'
        }

        result = fraud_detection.detect_fraud(transaction)
        self.assertFalse(result)

    def test_get_fraud_reason_high_value(self):
        """Test fraud reason for high-value transaction."""
        transaction = {
            'transaction_id': 'TX-006',
            'amount': 12000.00,
            'merchant': 'Store',
            'card_number': '1234567890123456',
            'location': 'USA'
        }

        reason = fraud_detection.get_fraud_reason(transaction)
        self.assertIn('High-value transaction', reason)

    def test_get_fraud_reason_multiple(self):
        """Test multiple fraud reasons."""
        transaction = {
            'transaction_id': 'TX-007',
            'amount': 15000.00,
            'merchant': 'Unknown Store',
            'card_number': '1234567890123456',
            'location': 'Nigeria'
        }

        reason = fraud_detection.get_fraud_reason(transaction)
        self.assertIn('High-value transaction', reason)
        self.assertIn('Suspicious merchant', reason)
        self.assertIn('High-risk location', reason)

    def test_calculate_risk_score_high(self):
        """Test risk score calculation for high-risk transaction."""
        transaction = {
            'transaction_id': 'TX-008',
            'amount': 15000.00,
            'merchant': 'Unknown Store',
            'card_number': '1234567890123456',
            'location': 'Nigeria'
        }

        score = fraud_detection.calculate_risk_score(transaction)
        self.assertGreaterEqual(score, 80)
        self.assertLessEqual(score, 100)

    def test_calculate_risk_score_low(self):
        """Test risk score calculation for low-risk transaction."""
        transaction = {
            'transaction_id': 'TX-009',
            'amount': 125.67,
            'merchant': 'Walmart',
            'card_number': '1234567890123456',
            'location': 'USA'
        }

        score = fraud_detection.calculate_risk_score(transaction)
        self.assertLess(score, 30)

    def test_calculate_risk_score_medium_amount(self):
        """Test risk score calculation for medium amount (5000-10000)."""
        transaction = {
            'transaction_id': 'TX-017',
            'amount': 7500.00,
            'merchant': 'Store',
            'card_number': '1234567890123456',
            'location': 'USA'
        }

        score = fraud_detection.calculate_risk_score(transaction)
        self.assertEqual(score, 25)

    def test_mask_card_number(self):
        """Test card number masking."""
        card_number = '1234567890123456'
        masked = fraud_detection.mask_card_number(card_number)

        self.assertEqual(masked, '************3456')
        self.assertEqual(len(masked), len(card_number))

    def test_mask_short_card_number(self):
        """Test masking of short card numbers."""
        card_number = '1234'
        masked = fraud_detection.mask_card_number(card_number)

        self.assertEqual(masked, card_number)

    @patch('fraud_detection.get_queue_url')
    @patch('fraud_detection.get_sqs_client')
    def test_lambda_handler_with_suspicious_transaction(self, mock_get_sqs_client, mock_get_queue_url):
        """Test Lambda handler processes suspicious transactions."""
        mock_sqs = MagicMock()
        mock_get_sqs_client.return_value = mock_sqs
        mock_get_queue_url.return_value = 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue'

        event = {
            'Records': [{
                'eventName': 'INSERT',
                'dynamodb': {
                    'NewImage': {
                        'transaction_id': {'S': 'TX-010'},
                        'timestamp': {'N': '1234567890000'},
                        'amount': {'N': '15000.00'},
                        'merchant': {'S': 'Store'},
                        'card_number': {'S': '1234567890123456'},
                        'location': {'S': 'USA'}
                    }
                }
            }]
        }

        response = fraud_detection.lambda_handler(event, None)

        self.assertEqual(response['statusCode'], 200)
        mock_sqs.send_message.assert_called_once()

    @patch('fraud_detection.get_queue_url')
    @patch('fraud_detection.get_sqs_client')
    def test_lambda_handler_with_legitimate_transaction(self, mock_get_sqs_client, mock_get_queue_url):
        """Test Lambda handler skips legitimate transactions."""
        mock_sqs = MagicMock()
        mock_get_sqs_client.return_value = mock_sqs
        mock_get_queue_url.return_value = 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue'

        event = {
            'Records': [{
                'eventName': 'INSERT',
                'dynamodb': {
                    'NewImage': {
                        'transaction_id': {'S': 'TX-011'},
                        'timestamp': {'N': '1234567890000'},
                        'amount': {'N': '125.67'},
                        'merchant': {'S': 'Walmart'},
                        'card_number': {'S': '1234567890123456'},
                        'location': {'S': 'USA'}
                    }
                }
            }]
        }

        response = fraud_detection.lambda_handler(event, None)

        self.assertEqual(response['statusCode'], 200)
        mock_sqs.send_message.assert_not_called()

    @patch('fraud_detection.get_queue_url')
    @patch('fraud_detection.get_sqs_client')
    def test_lambda_handler_skips_remove_events(self, mock_get_sqs_client, mock_get_queue_url):
        """Test Lambda handler skips REMOVE events."""
        mock_sqs = MagicMock()
        mock_get_sqs_client.return_value = mock_sqs
        mock_get_queue_url.return_value = 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue'

        event = {
            'Records': [{
                'eventName': 'REMOVE',
                'dynamodb': {
                    'OldImage': {
                        'transaction_id': {'S': 'TX-012'},
                        'timestamp': {'N': '1234567890000'}
                    }
                }
            }]
        }

        response = fraud_detection.lambda_handler(event, None)

        self.assertEqual(response['statusCode'], 200)
        mock_sqs.send_message.assert_not_called()

    @patch('fraud_detection.get_queue_url')
    @patch('fraud_detection.get_sqs_client')
    def test_lambda_handler_handles_multiple_records(self, mock_get_sqs_client, mock_get_queue_url):
        """Test Lambda handler processes multiple records."""
        mock_sqs = MagicMock()
        mock_get_sqs_client.return_value = mock_sqs
        mock_get_queue_url.return_value = 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue'

        event = {
            'Records': [
                {
                    'eventName': 'INSERT',
                    'dynamodb': {
                        'NewImage': {
                            'transaction_id': {'S': 'TX-013'},
                            'timestamp': {'N': '1234567890000'},
                            'amount': {'N': '15000.00'},
                            'merchant': {'S': 'Store'},
                            'card_number': {'S': '1234567890123456'},
                            'location': {'S': 'USA'}
                        }
                    }
                },
                {
                    'eventName': 'INSERT',
                    'dynamodb': {
                        'NewImage': {
                            'transaction_id': {'S': 'TX-014'},
                            'timestamp': {'N': '1234567890001'},
                            'amount': {'N': '125.67'},
                            'merchant': {'S': 'Walmart'},
                            'card_number': {'S': '1234567890123456'},
                            'location': {'S': 'USA'}
                        }
                    }
                }
            ]
        }

        response = fraud_detection.lambda_handler(event, None)

        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(mock_sqs.send_message.call_count, 1)

    @patch('fraud_detection.get_queue_url')
    @patch('fraud_detection.get_sqs_client')
    def test_lambda_handler_includes_message_attributes(self, mock_get_sqs_client, mock_get_queue_url):
        """Test SQS message includes proper attributes."""
        mock_sqs = MagicMock()
        mock_get_sqs_client.return_value = mock_sqs
        mock_get_queue_url.return_value = 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue'

        event = {
            'Records': [{
                'eventName': 'INSERT',
                'dynamodb': {
                    'NewImage': {
                        'transaction_id': {'S': 'TX-015'},
                        'timestamp': {'N': '1234567890000'},
                        'amount': {'N': '15000.00'},
                        'merchant': {'S': 'Store'},
                        'card_number': {'S': '1234567890123456'},
                        'location': {'S': 'USA'}
                    }
                }
            }]
        }

        fraud_detection.lambda_handler(event, None)

        call_args = mock_sqs.send_message.call_args[1]
        self.assertIn('MessageAttributes', call_args)
        self.assertIn('TransactionId', call_args['MessageAttributes'])
        self.assertIn('RiskScore', call_args['MessageAttributes'])

    @patch('fraud_detection.get_queue_url')
    @patch('fraud_detection.get_sqs_client')
    def test_lambda_handler_with_empty_new_image(self, mock_get_sqs_client, mock_get_queue_url):
        """Test Lambda handler skips records with empty NewImage."""
        mock_sqs = MagicMock()
        mock_get_sqs_client.return_value = mock_sqs
        mock_get_queue_url.return_value = 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue'

        event = {
            'Records': [{
                'eventName': 'INSERT',
                'dynamodb': {}
            }]
        }

        response = fraud_detection.lambda_handler(event, None)

        self.assertEqual(response['statusCode'], 200)
        mock_sqs.send_message.assert_not_called()

    @patch('fraud_detection.get_queue_url')
    @patch('fraud_detection.get_sqs_client')
    def test_lambda_handler_exception_handling(self, mock_get_sqs_client, mock_get_queue_url):
        """Test Lambda handler raises exception on error."""
        mock_sqs = MagicMock()
        mock_sqs.send_message.side_effect = Exception('SQS error')
        mock_get_sqs_client.return_value = mock_sqs
        mock_get_queue_url.return_value = 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue'

        event = {
            'Records': [{
                'eventName': 'INSERT',
                'dynamodb': {
                    'NewImage': {
                        'transaction_id': {'S': 'TX-016'},
                        'timestamp': {'N': '1234567890000'},
                        'amount': {'N': '15000.00'},
                        'merchant': {'S': 'Store'},
                        'card_number': {'S': '1234567890123456'},
                        'location': {'S': 'USA'}
                    }
                }
            }]
        }

        with self.assertRaises(Exception):
            fraud_detection.lambda_handler(event, None)


if __name__ == '__main__':
    unittest.main()
