#!/usr/bin/env python3

import sys
import os
import json
import unittest
from unittest.mock import patch, Mock, MagicMock
from datetime import datetime, timedelta
from decimal import Decimal

# Add lib to path to import Lambda functions
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../lib'))

# Mock AWS environment variables
os.environ['TABLE_NAME'] = 'test-table'
os.environ['REMINDER_FUNCTION_ARN'] = 'arn:aws:lambda:us-east-1:123456789:function:test'
os.environ['TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789:test-topic'

class TestConflictDetector(unittest.TestCase):
    def setUp(self):
        self.mock_table = MagicMock()
        self.mock_events = MagicMock()
        self.mock_cloudwatch = MagicMock()

    @patch('conflict_detector.cloudwatch')
    @patch('conflict_detector.events')
    @patch('conflict_detector.table')
    def test_handler_successful_booking(self, mock_table, mock_events, mock_cw):
        import conflict_detector

        # Mock check_conflicts to return no conflict
        with patch.object(conflict_detector, 'check_conflicts', return_value=None):
            with patch.object(conflict_detector, 'create_appointment', return_value={'appointmentId': 'test-123'}):
                with patch.object(conflict_detector, 'schedule_reminders'):
                    event = {
                        'body': json.dumps({
                            'userId': 'user-123',
                            'startTime': '2024-01-15T10:00:00',
                            'endTime': '2024-01-15T11:00:00',
                            'details': {'description': 'Test appointment'}
                        })
                    }

                    result = conflict_detector.handler(event, None)

                    self.assertEqual(result['statusCode'], 201)
                    response_body = json.loads(result['body'])
                    self.assertIn('appointmentId', response_body)

    @patch('conflict_detector.cloudwatch')
    @patch('conflict_detector.events')
    @patch('conflict_detector.table')
    def test_handler_conflict_detected(self, mock_table, mock_events, mock_cw):
        import conflict_detector

        # Mock check_conflicts to return a conflict
        conflict = {'appointmentId': 'existing-123', 'startTime': '2024-01-15T10:00:00'}
        with patch.object(conflict_detector, 'check_conflicts', return_value=conflict):
            event = {
                'body': json.dumps({
                    'userId': 'user-123',
                    'startTime': '2024-01-15T10:00:00',
                    'endTime': '2024-01-15T11:00:00'
                })
            }

            result = conflict_detector.handler(event, None)

            self.assertEqual(result['statusCode'], 409)
            response_body = json.loads(result['body'])
            self.assertIn('error', response_body)
            self.assertIn('conflict', response_body['error'].lower())

    def test_decimal_default(self):
        import conflict_detector

        # Test conversion of Decimal to float
        result = conflict_detector.decimal_default(Decimal('10.5'))
        self.assertEqual(result, 10.5)

        # Test that it raises TypeError for non-Decimal types
        with self.assertRaises(TypeError):
            conflict_detector.decimal_default("not a decimal")

    @patch('conflict_detector.table')
    def test_check_conflicts_with_no_conflicts(self, mock_table):
        import conflict_detector

        mock_table.query.return_value = {'Items': []}

        result = conflict_detector.check_conflicts('user-123', '2024-01-15T10:00:00', '2024-01-15T11:00:00')

        self.assertIsNone(result)

    @patch('conflict_detector.table')
    def test_check_conflicts_with_existing_conflict(self, mock_table):
        import conflict_detector

        existing_appointment = {
            'appointmentId': 'existing-123',
            'startTime': '2024-01-15T10:30:00',
            'endTime': '2024-01-15T11:30:00'
        }
        mock_table.query.return_value = {'Items': [existing_appointment]}

        result = conflict_detector.check_conflicts('user-123', '2024-01-15T10:00:00', '2024-01-15T11:00:00')

        self.assertEqual(result, existing_appointment)

    @patch('conflict_detector.table')
    def test_create_appointment_success(self, mock_table):
        import conflict_detector

        mock_table.put_item.return_value = True

        result = conflict_detector.create_appointment(
            'app-123', 'user-123', '2024-01-15T10:00:00', '2024-01-15T11:00:00', {}
        )

        self.assertIsNotNone(result)
        self.assertEqual(result['appointmentId'], 'app-123')
        self.assertEqual(result['status'], 'scheduled')

    @patch('conflict_detector.events')
    def test_schedule_reminders(self, mock_events):
        import conflict_detector

        # Future appointment
        future_time = (datetime.utcnow() + timedelta(days=2)).isoformat()

        conflict_detector.schedule_reminders('app-123', future_time, 'user-123')

        # Should create 2 rules (24h and 1h reminders)
        self.assertEqual(mock_events.put_rule.call_count, 2)
        self.assertEqual(mock_events.put_targets.call_count, 2)


class TestReminderSender(unittest.TestCase):
    def setUp(self):
        self.mock_table = MagicMock()
        self.mock_sns = MagicMock()
        self.mock_events = MagicMock()
        self.mock_cloudwatch = MagicMock()

    @patch('reminder_sender.cloudwatch')
    @patch('reminder_sender.events')
    @patch('reminder_sender.sns')
    @patch('reminder_sender.table')
    def test_handler_successful_reminder(self, mock_table, mock_sns, mock_events, mock_cw):
        import reminder_sender

        # Mock get_item to return an appointment
        appointment = {
            'appointmentId': 'app-123',
            'status': 'scheduled',
            'startTime': '2024-01-15T10:00:00',
            'details': {'location': 'Room 101'}
        }
        mock_table.get_item.return_value = {'Item': appointment}

        event = {
            'appointmentId': 'app-123',
            'userId': 'user-123',
            'reminderType': '24_hour'
        }

        result = reminder_sender.handler(event, None)

        self.assertEqual(result['statusCode'], 200)
        mock_sns.publish.assert_called_once()
        mock_cw.put_metric_data.assert_called_once()

    @patch('reminder_sender.table')
    def test_handler_appointment_not_found(self, mock_table):
        import reminder_sender

        mock_table.get_item.return_value = {}

        event = {
            'appointmentId': 'app-123',
            'userId': 'user-123',
            'reminderType': '24_hour'
        }

        result = reminder_sender.handler(event, None)

        self.assertEqual(result['statusCode'], 404)

    @patch('reminder_sender.table')
    def test_handler_appointment_not_scheduled(self, mock_table):
        import reminder_sender

        appointment = {
            'appointmentId': 'app-123',
            'status': 'cancelled',
            'startTime': '2024-01-15T10:00:00'
        }
        mock_table.get_item.return_value = {'Item': appointment}

        event = {
            'appointmentId': 'app-123',
            'userId': 'user-123',
            'reminderType': '24_hour'
        }

        result = reminder_sender.handler(event, None)

        self.assertEqual(result['statusCode'], 200)
        response_body = json.loads(result['body'])
        self.assertIn('not active', response_body['message'])

    def test_format_reminder_message_24_hour(self):
        import reminder_sender

        appointment = {
            'startTime': '2024-01-15T10:00:00',
            'details': {
                'location': 'Room 101',
                'description': 'Team meeting'
            }
        }

        message = reminder_sender.format_reminder_message(appointment, '24_hour')

        self.assertIn('tomorrow', message)
        self.assertIn('Room 101', message)
        self.assertIn('Team meeting', message)

    def test_format_reminder_message_1_hour(self):
        import reminder_sender

        appointment = {
            'startTime': '2024-01-15T10:00:00',
            'details': {}
        }

        message = reminder_sender.format_reminder_message(appointment, '1_hour')

        self.assertIn('1 hour', message)
        self.assertIn('2024-01-15T10:00:00', message)

    @patch('reminder_sender.events')
    def test_cleanup_rule_24_hour(self, mock_events):
        import reminder_sender

        reminder_sender.cleanup_rule('app-123', '24_hour')

        mock_events.remove_targets.assert_called_once_with(
            Rule='appointment-reminder-24h-app-123',
            Ids=['1']
        )
        mock_events.delete_rule.assert_called_once_with(
            Name='appointment-reminder-24h-app-123'
        )

    @patch('reminder_sender.events')
    def test_cleanup_rule_1_hour(self, mock_events):
        import reminder_sender

        reminder_sender.cleanup_rule('app-123', '1_hour')

        mock_events.remove_targets.assert_called_once_with(
            Rule='appointment-reminder-1h-app-123',
            Ids=['1']
        )
        mock_events.delete_rule.assert_called_once_with(
            Name='appointment-reminder-1h-app-123'
        )


if __name__ == '__main__':
    unittest.main()
