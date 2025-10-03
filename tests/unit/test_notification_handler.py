import unittest
from unittest.mock import Mock, patch, MagicMock
import json
import os
from datetime import datetime

# Set environment variables before importing handler
os.environ['TABLE_NAME'] = 'test-sms-delivery-logs'
os.environ['SENDER_EMAIL'] = 'test@example.com'
os.environ['TOPIC_ARN'] = 'arn:aws:sns:us-west-1:123456789:test-topic'

# Import after setting env vars
import sys
sys.path.insert(0, '/Users/mayanksethi/Projects/turing/iac-test-automations/worktree/IAC-synth-46210837/lib')
import notification_handler

class TestNotificationHandler(unittest.TestCase):

    def setUp(self):
        """Set up test fixtures."""
        self.sample_appointment = {
            'patient_id': 'P12345',
            'phone_number': '+12025551234',
            'message': 'Reminder: You have an appointment tomorrow at 2:00 PM',
            'email': 'patient@example.com'
        }

        self.sample_event = {
            'appointments': [self.sample_appointment]
        }

    @patch('notification_handler.sns')
    @patch('notification_handler.table')
    @patch('notification_handler.cloudwatch')
    def test_lambda_handler_success(self, mock_cloudwatch, mock_table, mock_sns):
        """Test successful SMS notification."""
        # Mock SNS publish response
        mock_sns.publish.return_value = {
            'MessageId': 'test-message-id-123'
        }

        # Mock DynamoDB put_item
        mock_table.put_item.return_value = {}

        # Mock CloudWatch put_metric_data
        mock_cloudwatch.put_metric_data.return_value = {}

        # Call handler
        result = notification_handler.lambda_handler(self.sample_event, None)

        # Assert response
        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertEqual(body['successful'], 1)
        self.assertEqual(body['failed'], 0)

        # Verify SNS was called
        mock_sns.publish.assert_called_once()
        call_args = mock_sns.publish.call_args
        self.assertEqual(call_args[1]['PhoneNumber'], '+12025551234')

        # Verify DynamoDB logging
        mock_table.put_item.assert_called_once()

        # Verify CloudWatch metrics
        mock_cloudwatch.put_metric_data.assert_called_once()

    @patch('notification_handler.sns')
    @patch('notification_handler.ses')
    @patch('notification_handler.table')
    @patch('notification_handler.cloudwatch')
    def test_lambda_handler_with_fallback(self, mock_cloudwatch, mock_table, mock_ses, mock_sns):
        """Test SMS failure with email fallback."""
        # Mock SNS to fail
        mock_sns.publish.side_effect = Exception("SMS delivery failed")

        # Mock SES send_email success
        mock_ses.send_email.return_value = {
            'MessageId': 'email-message-id-123'
        }

        # Mock DynamoDB and CloudWatch
        mock_table.put_item.return_value = {}
        mock_cloudwatch.put_metric_data.return_value = {}

        # Call handler
        result = notification_handler.lambda_handler(self.sample_event, None)

        # Assert response
        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertEqual(body['successful'], 0)
        self.assertEqual(body['failed'], 1)

        # Verify SNS was attempted 3 times
        self.assertEqual(mock_sns.publish.call_count, 3)

        # Verify email fallback was called
        mock_ses.send_email.assert_called_once()

        # Verify DynamoDB logging
        mock_table.put_item.assert_called()

    def test_validate_appointment_valid(self):
        """Test appointment validation with valid data."""
        result = notification_handler.validate_appointment(self.sample_appointment)
        self.assertTrue(result)

    def test_validate_appointment_missing_field(self):
        """Test appointment validation with missing required field."""
        invalid_appointment = {
            'patient_id': 'P12345',
            'message': 'Test message'
            # Missing phone_number
        }
        result = notification_handler.validate_appointment(invalid_appointment)
        self.assertFalse(result)

    def test_lambda_handler_invalid_appointment(self):
        """Test Lambda handler with invalid appointment data"""
        with patch('notification_handler.sns.publish'):
            with patch('notification_handler.table.put_item'):
                with patch('notification_handler.cloudwatch.put_metric_data'):
                    event = {
                        'appointments': [{
                            'patient_id': 'P123',
                            'phone_number': '123'  # Invalid phone
                        }]
                    }
                    response = notification_handler.lambda_handler(event, None)
                    self.assertEqual(response['statusCode'], 200)
                    body = json.loads(response['body'])
                    self.assertIn('errors', body)
                    self.assertGreater(len(body['errors']), 0)

    def test_lambda_handler_exception_handling(self):
        """Test Lambda handler exception handling"""
        with patch('notification_handler.validate_appointment', side_effect=Exception("Test error")):
            with patch('notification_handler.cloudwatch.put_metric_data'):
                event = {
                    'appointments': [{
                        'patient_id': 'P123',
                        'phone_number': '+12025551234',
                        'message': 'Test'
                    }]
                }
                response = notification_handler.lambda_handler(event, None)
                self.assertEqual(response['statusCode'], 200)
                body = json.loads(response['body'])
                self.assertEqual(body['failed'], 1)
                self.assertIn('Test error', body['errors'])

    def test_validate_appointment_invalid_phone(self):
        """Test appointment validation with invalid phone format."""
        invalid_appointment = {
            'patient_id': 'P12345',
            'phone_number': '1234567',  # Invalid format
            'message': 'Test message'
        }
        result = notification_handler.validate_appointment(invalid_appointment)
        self.assertFalse(result)

    @patch('notification_handler.sns')
    @patch('notification_handler.table')
    def test_send_notification_success(self, mock_table, mock_sns):
        """Test successful notification sending."""
        # Mock SNS publish
        mock_sns.publish.return_value = {
            'MessageId': 'test-message-id'
        }
        mock_table.put_item.return_value = {}

        # Send notification
        result = notification_handler.send_notification(self.sample_appointment)

        # Assert success
        self.assertTrue(result)
        mock_sns.publish.assert_called_once()
        mock_table.put_item.assert_called_once()

    @patch('notification_handler.sns')
    @patch('notification_handler.table')
    def test_send_notification_retry_logic(self, mock_table, mock_sns):
        """Test retry logic for failed SMS."""
        # Mock SNS to fail twice then succeed
        mock_sns.publish.side_effect = [
            Exception("First attempt failed"),
            Exception("Second attempt failed"),
            {'MessageId': 'success-message-id'}
        ]
        mock_table.put_item.return_value = {}

        # Send notification
        result = notification_handler.send_notification(self.sample_appointment)

        # Assert success after retries
        self.assertTrue(result)
        self.assertEqual(mock_sns.publish.call_count, 3)

    @patch('notification_handler.ses')
    def test_send_email_fallback_success(self, mock_ses):
        """Test successful email fallback."""
        # Mock SES send_email
        mock_ses.send_email.return_value = {
            'MessageId': 'email-message-id'
        }

        # Send email
        result = notification_handler.send_email_fallback(self.sample_appointment)

        # Assert success
        self.assertTrue(result)
        mock_ses.send_email.assert_called_once()

    @patch('notification_handler.ses')
    def test_send_email_fallback_no_email(self, mock_ses):
        """Test email fallback with no email address."""
        appointment_no_email = {
            'patient_id': 'P12345',
            'phone_number': '+12025551234',
            'message': 'Test message'
            # No email field
        }

        # Send email
        result = notification_handler.send_email_fallback(appointment_no_email)

        # Assert failure
        self.assertFalse(result)
        mock_ses.send_email.assert_not_called()

    @patch('notification_handler.table')
    def test_log_delivery(self, mock_table):
        """Test delivery logging to DynamoDB."""
        mock_table.put_item.return_value = {}

        # Log delivery
        notification_handler.log_delivery(
            patient_id='P12345',
            phone='+12025551234',
            message='Test message',
            status='SUCCESS',
            retry_count=1,
            message_id='msg-123'
        )

        # Verify put_item was called
        mock_table.put_item.assert_called_once()
        call_args = mock_table.put_item.call_args
        item = call_args[1]['Item']

        # Assert item structure
        self.assertEqual(item['patientId'], 'P12345')
        self.assertEqual(item['deliveryStatus'], 'SUCCESS')
        self.assertEqual(item['retryCount'], 1)
        self.assertEqual(item['messageId'], 'msg-123')
        self.assertIn('timestamp', item)
        self.assertIn('ttl', item)

    @patch('notification_handler.cloudwatch')
    def test_send_metrics(self, mock_cloudwatch):
        """Test sending metrics to CloudWatch."""
        mock_cloudwatch.put_metric_data.return_value = {}

        results = {
            'successful': 10,
            'failed': 2,
            'fallback': 1
        }

        # Send metrics
        notification_handler.send_metrics(results)

        # Verify put_metric_data was called
        mock_cloudwatch.put_metric_data.assert_called_once()
        call_args = mock_cloudwatch.put_metric_data.call_args

        # Assert namespace and metrics
        self.assertEqual(call_args[1]['Namespace'], 'AppointmentReminders')
        metrics = call_args[1]['MetricData']
        self.assertEqual(len(metrics), 4)

        # Check metric values
        metric_names = [m['MetricName'] for m in metrics]
        self.assertIn('SuccessfulSMS', metric_names)
        self.assertIn('FailedSMS', metric_names)
        self.assertIn('FailureRate', metric_names)
        self.assertIn('EmailFallbacks', metric_names)

    def test_lambda_handler_no_appointments(self):
        """Test handler with no appointments in event."""
        event = {}

        result = notification_handler.lambda_handler(event, None)

        self.assertEqual(result['statusCode'], 400)
        body = json.loads(result['body'])
        self.assertIn('error', body)

    @patch('notification_handler.sns')
    @patch('notification_handler.table')
    @patch('notification_handler.cloudwatch')
    def test_lambda_handler_batch_processing(self, mock_cloudwatch, mock_table, mock_sns):
        """Test processing multiple appointments in batch."""
        # Create batch event
        batch_event = {
            'appointments': [
                {
                    'patient_id': f'P{i}',
                    'phone_number': f'+1202555{i:04d}',
                    'message': f'Appointment reminder {i}',
                    'email': f'patient{i}@example.com'
                }
                for i in range(5)
            ]
        }

        # Mock successful SNS publish
        mock_sns.publish.return_value = {'MessageId': 'test-id'}
        mock_table.put_item.return_value = {}
        mock_cloudwatch.put_metric_data.return_value = {}

        # Call handler
        result = notification_handler.lambda_handler(batch_event, None)

        # Assert all processed successfully
        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertEqual(body['successful'], 5)
        self.assertEqual(body['failed'], 0)

        # Verify SNS called 5 times
        self.assertEqual(mock_sns.publish.call_count, 5)

    def test_send_notification_final_failure(self):
        """Test send notification fails after 3 attempts without email"""
        with patch('notification_handler.sns.publish', side_effect=Exception("Failed")):
            with patch('notification_handler.table.put_item'):
                appointment = self.sample_appointment.copy()
                # Remove email to test no fallback scenario
                appointment.pop('email', None)
                result = notification_handler.send_notification(appointment)
                self.assertFalse(result)

    def test_send_metrics_error_handling(self):
        """Test send metrics error handling"""
        with patch('notification_handler.cloudwatch.put_metric_data', side_effect=Exception("CloudWatch error")):
            # Should not raise exception, just print error
            notification_handler.send_metrics({'successful': 1, 'failed': 0})

    def test_log_delivery_error_handling(self):
        """Test log delivery error handling"""
        with patch('notification_handler.table.put_item', side_effect=Exception("DynamoDB error")):
            # Should not raise exception, just print error
            notification_handler.log_delivery(
                patient_id='P123',
                phone='+12025551234',
                message='Test',
                status='SUCCESS',
                retry_count=1
            )

    def test_send_email_fallback_exception(self):
        """Test email fallback with SES exception"""
        with patch('notification_handler.ses.send_email', side_effect=Exception("SES error")):
            appointment = {
                'email': 'test@example.com',
                'message': 'Test message'
            }
            result = notification_handler.send_email_fallback(appointment)
            self.assertFalse(result)


if __name__ == '__main__':
    unittest.main()
