"""Unit tests for Notification Handler Lambda function."""
import json
import unittest
from unittest.mock import patch, MagicMock
import sys
import os

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib', 'lambda'))

import notification_handler  # pylint: disable=wrong-import-position


class TestNotificationHandler(unittest.TestCase):
    """Test cases for Notification Handler Lambda."""

    def setUp(self):
        """Set up test fixtures."""
        os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789:test-topic'
        os.environ['AWS_REGION'] = 'us-east-1'

    @patch('notification_handler.boto3')
    def test_get_sns_client(self, mock_boto3):
        """Test get_sns_client helper function."""
        mock_sns = MagicMock()
        mock_boto3.client.return_value = mock_sns

        result = notification_handler.get_sns_client()

        mock_boto3.client.assert_called_once_with('sns')
        self.assertEqual(result, mock_sns)

    def test_get_topic_arn(self):
        """Test get_topic_arn helper function."""
        result = notification_handler.get_topic_arn()
        self.assertEqual(result, 'arn:aws:sns:us-east-1:123456789:test-topic')

    @patch('notification_handler.get_topic_arn')
    @patch('notification_handler.get_sns_client')
    def test_successful_notification(self, mock_get_sns_client, mock_get_topic_arn):
        """Test successful notification processing."""
        mock_sns = MagicMock()
        mock_get_sns_client.return_value = mock_sns
        mock_get_topic_arn.return_value = 'arn:aws:sns:us-east-1:123456789:test-topic'

        event = {
            'Records': [{
                'body': json.dumps({
                    'transaction_id': 'TX-001',
                    'timestamp': 1234567890000,
                    'amount': 15000.00,
                    'merchant': 'Test Store',
                    'card_number': '************3456',
                    'location': 'USA',
                    'fraud_reason': 'High-value transaction',
                    'risk_score': 85
                })
            }]
        }

        response = notification_handler.lambda_handler(event, None)

        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(json.loads(response['body'])['processed'], 1)
        mock_sns.publish.assert_called_once()

    @patch('notification_handler.get_topic_arn')
    @patch('notification_handler.get_sns_client')
    def test_multiple_notifications(self, mock_get_sns_client, mock_get_topic_arn):
        """Test processing multiple notifications."""
        mock_sns = MagicMock()
        mock_get_sns_client.return_value = mock_sns
        mock_get_topic_arn.return_value = 'arn:aws:sns:us-east-1:123456789:test-topic'

        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'transaction_id': 'TX-001',
                        'timestamp': 1234567890000,
                        'amount': 15000.00,
                        'merchant': 'Test Store',
                        'card_number': '************3456',
                        'location': 'USA',
                        'fraud_reason': 'High-value transaction',
                        'risk_score': 85
                    })
                },
                {
                    'body': json.dumps({
                        'transaction_id': 'TX-002',
                        'timestamp': 1234567890001,
                        'amount': 500.00,
                        'merchant': 'Unknown Store',
                        'card_number': '************7890',
                        'location': 'Nigeria',
                        'fraud_reason': 'High-risk location',
                        'risk_score': 65
                    })
                }
            ]
        }

        response = notification_handler.lambda_handler(event, None)

        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(json.loads(response['body'])['processed'], 2)
        self.assertEqual(mock_sns.publish.call_count, 2)

    @patch('notification_handler.get_topic_arn')
    @patch('notification_handler.get_sns_client')
    def test_sns_message_attributes(self, mock_get_sns_client, mock_get_topic_arn):
        """Test SNS message includes proper attributes."""
        mock_sns = MagicMock()
        mock_get_sns_client.return_value = mock_sns
        mock_get_topic_arn.return_value = 'arn:aws:sns:us-east-1:123456789:test-topic'

        event = {
            'Records': [{
                'body': json.dumps({
                    'transaction_id': 'TX-003',
                    'timestamp': 1234567890000,
                    'amount': 15000.00,
                    'merchant': 'Test Store',
                    'card_number': '************3456',
                    'location': 'USA',
                    'fraud_reason': 'High-value transaction',
                    'risk_score': 90
                })
            }]
        }

        notification_handler.lambda_handler(event, None)

        call_args = mock_sns.publish.call_args[1]
        self.assertIn('MessageAttributes', call_args)
        self.assertIn('TransactionId', call_args['MessageAttributes'])
        self.assertIn('RiskScore', call_args['MessageAttributes'])
        self.assertIn('AlertType', call_args['MessageAttributes'])

    @patch('notification_handler.get_topic_arn')
    @patch('notification_handler.get_sns_client')
    def test_sns_subject(self, mock_get_sns_client, mock_get_topic_arn):
        """Test SNS notification subject format."""
        mock_sns = MagicMock()
        mock_get_sns_client.return_value = mock_sns
        mock_get_topic_arn.return_value = 'arn:aws:sns:us-east-1:123456789:test-topic'

        transaction_id = 'TX-004'
        event = {
            'Records': [{
                'body': json.dumps({
                    'transaction_id': transaction_id,
                    'timestamp': 1234567890000,
                    'amount': 15000.00,
                    'merchant': 'Test Store',
                    'card_number': '************3456',
                    'location': 'USA',
                    'fraud_reason': 'High-value transaction',
                    'risk_score': 85
                })
            }]
        }

        notification_handler.lambda_handler(event, None)

        call_args = mock_sns.publish.call_args[1]
        self.assertIn('Subject', call_args)
        self.assertIn('FRAUD ALERT', call_args['Subject'])
        self.assertIn(transaction_id, call_args['Subject'])

    def test_create_notification_message(self):
        """Test notification message formatting."""
        transaction = {
            'transaction_id': 'TX-005',
            'timestamp': 1234567890000,
            'amount': 15000.00,
            'merchant': 'Test Store',
            'card_number': '************3456',
            'location': 'USA',
            'fraud_reason': 'High-value transaction',
            'risk_score': 85
        }

        message = notification_handler.create_notification_message(transaction)

        self.assertIn('FRAUD ALERT', message)
        self.assertIn('TX-005', message)
        self.assertIn('$15000.00', message)
        self.assertIn('Test Store', message)
        self.assertIn('85/100', message)
        self.assertIn('High-value transaction', message)

    def test_notification_message_includes_all_fields(self):
        """Test notification message includes all transaction fields."""
        transaction = {
            'transaction_id': 'TX-006',
            'timestamp': 1234567890000,
            'amount': 500.00,
            'merchant': 'Unknown Store',
            'card_number': '************7890',
            'location': 'Nigeria',
            'fraud_reason': 'High-risk location',
            'risk_score': 65
        }

        message = notification_handler.create_notification_message(transaction)

        self.assertIn('TX-006', message)
        self.assertIn('500.00', message)
        self.assertIn('Unknown Store', message)
        self.assertIn('************7890', message)
        self.assertIn('Nigeria', message)
        self.assertIn('High-risk location', message)
        self.assertIn('65/100', message)

    def test_notification_message_without_location(self):
        """Test notification message handles missing location."""
        transaction = {
            'transaction_id': 'TX-007',
            'timestamp': 1234567890000,
            'amount': 15000.00,
            'merchant': 'Test Store',
            'card_number': '************3456',
            'fraud_reason': 'High-value transaction',
            'risk_score': 85
        }

        message = notification_handler.create_notification_message(transaction)

        self.assertIn('N/A', message)

    def test_get_severity_level_critical(self):
        """Test severity level for critical risk score."""
        severity = notification_handler.get_severity_level(90)
        self.assertEqual(severity, 'CRITICAL')

    def test_get_severity_level_high(self):
        """Test severity level for high risk score."""
        severity = notification_handler.get_severity_level(70)
        self.assertEqual(severity, 'HIGH')

    def test_get_severity_level_medium(self):
        """Test severity level for medium risk score."""
        severity = notification_handler.get_severity_level(50)
        self.assertEqual(severity, 'MEDIUM')

    def test_get_severity_level_low(self):
        """Test severity level for low risk score."""
        severity = notification_handler.get_severity_level(30)
        self.assertEqual(severity, 'LOW')

    @patch('notification_handler.get_topic_arn')
    @patch('notification_handler.get_sns_client')
    def test_error_handling_continues_processing(self, mock_get_sns_client, mock_get_topic_arn):
        """Test error in one message doesn't stop processing others."""
        mock_sns = MagicMock()
        mock_sns.publish = MagicMock(side_effect=[Exception('SNS error'), None])
        mock_get_sns_client.return_value = mock_sns
        mock_get_topic_arn.return_value = 'arn:aws:sns:us-east-1:123456789:test-topic'

        event = {
            'Records': [
                {
                    'body': json.dumps({
                        'transaction_id': 'TX-008',
                        'timestamp': 1234567890000,
                        'amount': 15000.00,
                        'merchant': 'Test Store',
                        'card_number': '************3456',
                        'location': 'USA',
                        'fraud_reason': 'High-value transaction',
                        'risk_score': 85
                    })
                },
                {
                    'body': json.dumps({
                        'transaction_id': 'TX-009',
                        'timestamp': 1234567890001,
                        'amount': 500.00,
                        'merchant': 'Store',
                        'card_number': '************7890',
                        'location': 'USA',
                        'fraud_reason': 'High-risk location',
                        'risk_score': 65
                    })
                }
            ]
        }

        response = notification_handler.lambda_handler(event, None)

        self.assertEqual(response['statusCode'], 200)
        body = json.loads(response['body'])
        self.assertEqual(body['errors'], 1)
        self.assertEqual(body['processed'], 1)

    @patch('notification_handler.get_topic_arn')
    @patch('notification_handler.get_sns_client')
    def test_invalid_json_message(self, mock_get_sns_client, mock_get_topic_arn):
        """Test handling of invalid JSON in message."""
        mock_sns = MagicMock()
        mock_get_sns_client.return_value = mock_sns
        mock_get_topic_arn.return_value = 'arn:aws:sns:us-east-1:123456789:test-topic'

        event = {
            'Records': [{
                'body': 'invalid json'
            }]
        }

        response = notification_handler.lambda_handler(event, None)

        self.assertEqual(response['statusCode'], 200)
        body = json.loads(response['body'])
        self.assertEqual(body['errors'], 1)
        self.assertEqual(body['processed'], 0)

if __name__ == '__main__':
    unittest.main()
