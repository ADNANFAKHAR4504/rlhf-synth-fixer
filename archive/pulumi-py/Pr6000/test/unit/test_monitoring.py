"""
Unit tests for monitoring infrastructure.
"""

import unittest
from unittest.mock import Mock, patch
from pulumi import Output
from lib.monitoring import MonitoringStack


class TestMonitoringStack(unittest.TestCase):
    """Test monitoring stack initialization and outputs."""

    @patch('lib.monitoring.aws.cloudwatch.LogGroup')
    def test_monitoring_stack_creation(self, mock_log_group):
        """Test monitoring stack creates log groups."""
        # Mock log group
        mock_log_group_instance = Mock()
        mock_log_group_instance.name = 'log-group-123'
        mock_log_group.return_value = mock_log_group_instance

        # Create stack
        stack = MonitoringStack(
            'test-monitoring',
            log_retention_days=7,
            lambda_function_name=Output.from_input('test-function'),
            api_gateway_id=Output.from_input('api-123'),
            api_stage_name=Output.from_input('v1'),
            environment_suffix='dev',
            tags={'Environment': 'dev'}
        )

        # Verify log groups were created (Lambda + API Gateway = 2)
        self.assertEqual(mock_log_group.call_count, 2)

    @patch('lib.monitoring.aws.cloudwatch.LogGroup')
    def test_monitoring_stack_with_prod_retention(self, mock_log_group):
        """Test monitoring stack with production retention settings."""
        mock_log_group_instance = Mock()
        mock_log_group_instance.name = 'log-group-123'
        mock_log_group.return_value = mock_log_group_instance

        # Create stack with prod retention
        stack = MonitoringStack(
            'test-monitoring',
            log_retention_days=30,
            lambda_function_name=Output.from_input('test-function'),
            api_gateway_id=Output.from_input('api-123'),
            api_stage_name=Output.from_input('v1'),
            environment_suffix='prod',
            tags={'Environment': 'prod'}
        )

        # Verify log groups were created
        self.assertEqual(mock_log_group.call_count, 2)

        # Verify retention was set correctly
        for call in mock_log_group.call_args_list:
            self.assertEqual(call[1]['retention_in_days'], 30)


if __name__ == '__main__':
    unittest.main()
