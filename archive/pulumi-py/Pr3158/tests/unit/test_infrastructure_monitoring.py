"""
test_infrastructure_monitoring.py

Unit tests for the infrastructure monitoring module.
Tests CloudWatch alarms, SNS topics, and dashboards.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Add lib to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

# Mock pulumi before importing our modules
sys.modules['pulumi'] = MagicMock()
sys.modules['pulumi_aws'] = MagicMock()
sys.modules['pulumi_aws.aws'] = MagicMock()

from infrastructure.monitoring import (create_dashboard, create_lambda_alarms,
                                       create_sns_topic)


class TestMonitoringModule(unittest.TestCase):
    """Test cases for monitoring module functions."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_config = MagicMock()
        self.mock_config.aws_provider = MagicMock()
        self.mock_config.aws_region = "us-east-1"
        self.mock_config.get_tags.return_value = {
            "Environment": "dev",
            "Project": "serverless-infrastructure"
        }

    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    @patch('infrastructure.monitoring.config')
    def test_create_lambda_alarms(self, mock_config, mock_alarm):
        """Test that Lambda alarms are created."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock alarm creation
        mock_alarm_instance = MagicMock()
        mock_alarm.return_value = mock_alarm_instance
        
        result = create_lambda_alarms("test-function", "test-function", "arn:aws:sns:us-east-1:123456789012:test-topic")
        
        # Test that alarms are created
        self.assertEqual(mock_alarm.call_count, 4)  # error, throttle, duration, concurrent
        
        # Test that error alarm is created
        call_args_list = mock_alarm.call_args_list
        alarm_names = [call[1]['name'] for call in call_args_list]
        self.assertIn("test-function-error-alarm", alarm_names)
        self.assertIn("test-function-throttle-alarm", alarm_names)
        self.assertIn("test-function-duration-alarm", alarm_names)
        self.assertIn("test-function-concurrent-alarm", alarm_names)

    @patch('infrastructure.monitoring.aws.sns.Topic')
    @patch('infrastructure.monitoring.aws.sns.TopicPolicy')
    @patch('infrastructure.monitoring.config')
    def test_create_sns_topic(self, mock_config, mock_policy, mock_topic):
        """Test that SNS topic is created."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock topic creation
        mock_topic_instance = MagicMock()
        mock_topic_instance.arn = "arn:aws:sns:us-east-1:123456789012:test-topic"
        mock_topic.return_value = mock_topic_instance
        
        # Mock policy creation
        mock_policy_instance = MagicMock()
        mock_policy.return_value = mock_policy_instance
        
        result = create_sns_topic("test-topic")
        
        # Test that topic is created
        mock_topic.assert_called_once()
        call_args = mock_topic.call_args
        self.assertEqual(call_args[1]['name'], "test-topic-notifications")
        
        # Test that policy is created
        mock_policy.assert_called_once()


    @patch('infrastructure.monitoring.aws.cloudwatch.Dashboard')
    @patch('infrastructure.monitoring.config')
    def test_create_dashboard(self, mock_config, mock_dashboard):
        """Test that CloudWatch dashboard is created."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock dashboard creation
        mock_dashboard_instance = MagicMock()
        mock_dashboard_instance.dashboard_name = "test-dashboard"
        mock_dashboard.return_value = mock_dashboard_instance
        
        result = create_dashboard("test-function", "test-function")
        
        # Test that dashboard is created
        mock_dashboard.assert_called_once()
        call_args = mock_dashboard.call_args
        self.assertEqual(call_args[1]['dashboard_name'], "test-function-dashboard")

    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    @patch('infrastructure.monitoring.config')
    def test_lambda_error_alarm_configuration(self, mock_config, mock_alarm):
        """Test that error alarm is configured correctly."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock alarm creation
        mock_alarm_instance = MagicMock()
        mock_alarm.return_value = mock_alarm_instance
        
        create_lambda_alarms("test-function", "test-function", "arn:aws:sns:us-east-1:123456789012:test-topic")
        
        # Test that error alarm is configured
        call_args_list = mock_alarm.call_args_list
        error_alarm_call = next(call for call in call_args_list if call[1]['name'] == "test-function-error-alarm")
        
        self.assertEqual(error_alarm_call[1]['metric_name'], "Errors")
        self.assertEqual(error_alarm_call[1]['threshold'], 2)
        self.assertEqual(error_alarm_call[1]['comparison_operator'], "GreaterThanThreshold")

    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    @patch('infrastructure.monitoring.config')
    def test_lambda_throttle_alarm_configuration(self, mock_config, mock_alarm):
        """Test that throttle alarm is configured correctly."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock alarm creation
        mock_alarm_instance = MagicMock()
        mock_alarm.return_value = mock_alarm_instance
        
        create_lambda_alarms("test-function", "test-function", "arn:aws:sns:us-east-1:123456789012:test-topic")
        
        # Test that throttle alarm is configured
        call_args_list = mock_alarm.call_args_list
        throttle_alarm_call = next(call for call in call_args_list if call[1]['name'] == "test-function-throttle-alarm")
        
        self.assertEqual(throttle_alarm_call[1]['metric_name'], "Throttles")
        self.assertEqual(throttle_alarm_call[1]['threshold'], 1)
        self.assertEqual(throttle_alarm_call[1]['comparison_operator'], "GreaterThanThreshold")

    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    @patch('infrastructure.monitoring.config')
    def test_lambda_duration_alarm_configuration(self, mock_config, mock_alarm):
        """Test that duration alarm is configured correctly."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock alarm creation
        mock_alarm_instance = MagicMock()
        mock_alarm.return_value = mock_alarm_instance
        
        create_lambda_alarms("test-function", "test-function", "arn:aws:sns:us-east-1:123456789012:test-topic")
        
        # Test that duration alarm is configured
        call_args_list = mock_alarm.call_args_list
        duration_alarm_call = next(call for call in call_args_list if call[1]['name'] == "test-function-duration-alarm")
        
        self.assertEqual(duration_alarm_call[1]['metric_name'], "Duration")
        self.assertEqual(duration_alarm_call[1]['threshold'], 160000)  # 160 seconds (close to 3 min timeout)
        self.assertEqual(duration_alarm_call[1]['comparison_operator'], "GreaterThanThreshold")

    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    @patch('infrastructure.monitoring.config')
    def test_lambda_concurrent_alarm_configuration(self, mock_config, mock_alarm):
        """Test that concurrent alarm is configured correctly."""
        mock_config.aws_provider = MagicMock()
        mock_config.get_tags.return_value = {"Environment": "dev"}
        
        # Mock alarm creation
        mock_alarm_instance = MagicMock()
        mock_alarm.return_value = mock_alarm_instance
        
        create_lambda_alarms("test-function", "test-function", "arn:aws:sns:us-east-1:123456789012:test-topic")
        
        # Test that concurrent alarm is configured
        call_args_list = mock_alarm.call_args_list
        concurrent_alarm_call = next(call for call in call_args_list if call[1]['name'] == "test-function-concurrent-alarm")
        
        self.assertEqual(concurrent_alarm_call[1]['metric_name'], "ConcurrentExecutions")
        self.assertEqual(concurrent_alarm_call[1]['threshold'], 950)  # Close to 1000 concurrent execution limit
        self.assertEqual(concurrent_alarm_call[1]['comparison_operator'], "GreaterThanThreshold")


if __name__ == '__main__':
    unittest.main()