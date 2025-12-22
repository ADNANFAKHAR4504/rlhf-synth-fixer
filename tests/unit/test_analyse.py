#!/usr/bin/env python3
"""
Unit tests for Infrastructure Analysis Script
Tests all methods in InfrastructureAnalyzer with mocked AWS clients
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock, call
from datetime import datetime, timedelta, timezone
import sys
import os

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import InfrastructureAnalyzer


class TestInfrastructureAnalyzerInit:
    """Test InfrastructureAnalyzer initialization"""

    @patch('analyse.boto3.client')
    def test_init_default_region(self, mock_boto_client):
        """Test initialization with default region"""
        analyzer = InfrastructureAnalyzer('pr123')

        assert analyzer.environment_suffix == 'pr123'
        assert analyzer.region == 'us-east-1'
        assert mock_boto_client.call_count == 4

    @patch('analyse.boto3.client')
    def test_init_custom_region(self, mock_boto_client):
        """Test initialization with custom region"""
        analyzer = InfrastructureAnalyzer('pr456', region_name='us-west-2')

        assert analyzer.environment_suffix == 'pr456'
        assert analyzer.region == 'us-west-2'

    @patch('analyse.boto3.client')
    def test_init_creates_all_clients(self, mock_boto_client):
        """Test that all required AWS clients are created"""
        analyzer = InfrastructureAnalyzer('test')

        # Verify all 4 clients are created
        expected_calls = [
            call('cloudwatch', region_name='us-east-1'),
            call('logs', region_name='us-east-1'),
            call('sns', region_name='us-east-1'),
            call('kms', region_name='us-east-1')
        ]
        mock_boto_client.assert_has_calls(expected_calls, any_order=True)


class TestAnalyzeLogGroups:
    """Test analyze_log_groups method"""

    @patch('analyse.boto3.client')
    def test_analyze_log_groups_all_found(self, mock_boto_client):
        """Test when all log groups are found"""
        mock_logs_client = Mock()
        mock_boto_client.return_value = mock_logs_client

        mock_logs_client.describe_log_groups.return_value = {
            'logGroups': [{
                'logGroupName': '/aws/payment-api-test',
                'retentionInDays': 7,
                'kmsKeyId': 'arn:aws:kms:us-east-1:123456789012:key/test',
                'storedBytes': 1024
            }]
        }

        analyzer = InfrastructureAnalyzer('test')
        analyzer.logs_client = mock_logs_client
        result = analyzer.analyze_log_groups()

        assert len(result) == 3
        assert result[0]['status'] == 'found'
        assert result[0]['kms_encrypted'] is True
        assert result[0]['retention_days'] == 7

    @patch('analyse.boto3.client')
    def test_analyze_log_groups_missing(self, mock_boto_client):
        """Test when log groups are missing"""
        mock_logs_client = Mock()
        mock_boto_client.return_value = mock_logs_client

        mock_logs_client.describe_log_groups.return_value = {'logGroups': []}

        analyzer = InfrastructureAnalyzer('test')
        analyzer.logs_client = mock_logs_client
        result = analyzer.analyze_log_groups()

        assert len(result) == 3
        assert all(lg['status'] == 'missing' for lg in result)
        assert all(lg['kms_encrypted'] is False for lg in result)

    @patch('analyse.boto3.client')
    def test_analyze_log_groups_with_error(self, mock_boto_client):
        """Test when error occurs retrieving log groups"""
        mock_logs_client = Mock()
        mock_boto_client.return_value = mock_logs_client

        mock_logs_client.describe_log_groups.side_effect = Exception('AWS Error')

        analyzer = InfrastructureAnalyzer('test')
        analyzer.logs_client = mock_logs_client
        result = analyzer.analyze_log_groups()

        assert len(result) == 3
        assert all(lg['status'] == 'error' for lg in result)

    @patch('analyse.boto3.client')
    def test_analyze_log_groups_without_kms(self, mock_boto_client):
        """Test log groups without KMS encryption"""
        mock_logs_client = Mock()
        mock_boto_client.return_value = mock_logs_client

        mock_logs_client.describe_log_groups.return_value = {
            'logGroups': [{
                'logGroupName': '/aws/payment-api-test',
                'storedBytes': 2048
            }]
        }

        analyzer = InfrastructureAnalyzer('test')
        analyzer.logs_client = mock_logs_client
        result = analyzer.analyze_log_groups()

        assert result[0]['kms_encrypted'] is False
        assert result[0]['retention_days'] == 'unlimited'


class TestAnalyzeAlarms:
    """Test analyze_alarms method"""

    @patch('analyse.boto3.client')
    def test_analyze_alarms_all_found(self, mock_boto_client):
        """Test when all alarms are found"""
        mock_cw_client = Mock()
        mock_boto_client.return_value = mock_cw_client

        # Mock all 6 expected alarms with correct names
        mock_cw_client.describe_alarms.return_value = {
            'MetricAlarms': [
                {'AlarmName': 'payment-api-error-rate-test', 'StateValue': 'OK', 'MetricName': 'ErrorRate', 'Threshold': 5.0, 'AlarmActions': ['arn:aws:sns:us-east-1:123456789012:test']},
                {'AlarmName': 'payment-api-response-time-test', 'StateValue': 'OK', 'MetricName': 'ResponseTime', 'Threshold': 500, 'AlarmActions': ['arn:aws:sns:us-east-1:123456789012:test']},
                {'AlarmName': 'failed-transactions-test', 'StateValue': 'OK', 'MetricName': 'FailedTransactions', 'Threshold': 5, 'AlarmActions': ['arn:aws:sns:us-east-1:123456789012:test']},
                {'AlarmName': 'transaction-processor-errors-test', 'StateValue': 'OK', 'MetricName': 'Errors', 'Threshold': 1, 'AlarmActions': ['arn:aws:sns:us-east-1:123456789012:test']},
                {'AlarmName': 'fraud-detector-errors-test', 'StateValue': 'OK', 'MetricName': 'Errors', 'Threshold': 1, 'AlarmActions': ['arn:aws:sns:us-east-1:123456789012:test']},
                {'AlarmName': 'payment-high-load-test', 'StateValue': 'OK', 'MetricName': 'RequestCount', 'Threshold': 1000, 'AlarmActions': ['arn:aws:sns:us-east-1:123456789012:test']}
            ]
        }

        analyzer = InfrastructureAnalyzer('test')
        analyzer.cloudwatch_client = mock_cw_client
        result = analyzer.analyze_alarms()

        assert len(result) == 6
        assert all(alarm['status'] == 'found' for alarm in result)
        assert all(alarm['has_sns_action'] is True for alarm in result)

    @patch('analyse.boto3.client')
    def test_analyze_alarms_missing(self, mock_boto_client):
        """Test when alarms are missing"""
        mock_cw_client = Mock()
        mock_boto_client.return_value = mock_cw_client

        mock_cw_client.describe_alarms.return_value = {'MetricAlarms': []}

        analyzer = InfrastructureAnalyzer('test')
        analyzer.cloudwatch_client = mock_cw_client
        result = analyzer.analyze_alarms()

        assert len(result) == 6
        assert all(alarm['status'] == 'missing' for alarm in result)

    @patch('analyse.boto3.client')
    def test_analyze_alarms_with_error(self, mock_boto_client):
        """Test when error occurs retrieving alarms"""
        mock_cw_client = Mock()
        mock_boto_client.return_value = mock_cw_client

        mock_cw_client.describe_alarms.side_effect = Exception('API Error')

        analyzer = InfrastructureAnalyzer('test')
        analyzer.cloudwatch_client = mock_cw_client
        result = analyzer.analyze_alarms()

        # When there's an error, returns single entry with name 'all'
        assert len(result) == 1
        assert result[0]['name'] == 'all'
        assert result[0]['status'] == 'error'


class TestAnalyzeCompositeAlarms:
    """Test analyze_composite_alarms method"""

    @patch('analyse.boto3.client')
    def test_analyze_composite_alarms_found(self, mock_boto_client):
        """Test when composite alarm is found"""
        mock_cw_client = Mock()
        mock_boto_client.return_value = mock_cw_client

        mock_cw_client.describe_alarms.return_value = {
            'CompositeAlarms': [{
                'AlarmName': 'payment-high-load-test',
                'StateValue': 'OK',
                'AlarmRule': 'ALARM(alarm1) OR ALARM(alarm2)',
                'AlarmActions': ['arn:aws:sns:us-east-1:123456789012:test']
            }]
        }

        analyzer = InfrastructureAnalyzer('test')
        analyzer.cloudwatch_client = mock_cw_client
        result = analyzer.analyze_composite_alarms()

        assert len(result) == 1
        assert result[0]['status'] == 'found'
        assert result[0]['state'] == 'OK'

    @patch('analyse.boto3.client')
    def test_analyze_composite_alarms_missing(self, mock_boto_client):
        """Test when composite alarm is missing"""
        mock_cw_client = Mock()
        mock_boto_client.return_value = mock_cw_client

        mock_cw_client.describe_alarms.return_value = {'CompositeAlarms': []}

        analyzer = InfrastructureAnalyzer('test')
        analyzer.cloudwatch_client = mock_cw_client
        result = analyzer.analyze_composite_alarms()

        assert len(result) == 1
        assert result[0]['status'] == 'missing'


class TestAnalyzeDashboards:
    """Test analyze_dashboards method"""

    @patch('analyse.boto3.client')
    def test_analyze_dashboards_found(self, mock_boto_client):
        """Test when dashboard is found"""
        mock_cw_client = Mock()
        mock_boto_client.return_value = mock_cw_client

        mock_cw_client.list_dashboards.return_value = {
            'DashboardEntries': [{
                'DashboardName': 'payment-monitoring-test',
                'Size': 5000
            }]
        }

        mock_cw_client.get_dashboard.return_value = {
            'DashboardName': 'payment-monitoring-test',
            'DashboardBody': json.dumps({'widgets': [1, 2, 3, 4, 5, 6, 7, 8, 9]})
        }

        analyzer = InfrastructureAnalyzer('test')
        analyzer.cloudwatch_client = mock_cw_client
        result = analyzer.analyze_dashboards()

        assert len(result) == 1
        assert result[0]['status'] == 'found'
        assert result[0]['widget_count'] == 9

    @patch('analyse.boto3.client')
    def test_analyze_dashboards_missing(self, mock_boto_client):
        """Test when dashboard is missing"""
        mock_cw_client = Mock()
        mock_boto_client.return_value = mock_cw_client

        # Mock DashboardNotFoundError exception
        dashboard_not_found = type('DashboardNotFoundError', (Exception,), {})
        mock_cw_client.exceptions = type('exceptions', (), {'DashboardNotFoundError': dashboard_not_found})()
        mock_cw_client.get_dashboard.side_effect = dashboard_not_found()

        analyzer = InfrastructureAnalyzer('test')
        analyzer.cloudwatch_client = mock_cw_client
        result = analyzer.analyze_dashboards()

        assert len(result) == 1
        assert result[0]['status'] == 'missing'


class TestAnalyzeMetricFilters:
    """Test analyze_metric_filters method"""

    @patch('analyse.boto3.client')
    def test_analyze_metric_filters_found(self, mock_boto_client):
        """Test when metric filters are found"""
        mock_logs_client = Mock()
        mock_boto_client.return_value = mock_logs_client

        mock_logs_client.describe_metric_filters.return_value = {
            'metricFilters': [
                {'filterName': f'filter{i}', 'logGroupName': '/aws/payment-api-test', 'filterPattern': '{$.level = "ERROR"}'}
                for i in range(14)
            ]
        }

        analyzer = InfrastructureAnalyzer('test')
        analyzer.logs_client = mock_logs_client
        result = analyzer.analyze_metric_filters()

        # Returns 3 entries (one per log group), each with filter info
        assert len(result) == 3
        # First log group should have 14 filters
        assert result[0]['filter_count'] == 14
        assert result[0]['status'] == 'found'

    @patch('analyse.boto3.client')
    def test_analyze_metric_filters_with_error(self, mock_boto_client):
        """Test when error occurs retrieving metric filters"""
        mock_logs_client = Mock()
        mock_boto_client.return_value = mock_logs_client

        mock_logs_client.describe_metric_filters.side_effect = Exception('API Error')

        analyzer = InfrastructureAnalyzer('test')
        analyzer.logs_client = mock_logs_client
        result = analyzer.analyze_metric_filters()

        # Returns 3 entries (one per log group), all with error status
        assert len(result) == 3
        assert all(entry['status'] == 'error' for entry in result)
        assert all('API Error' in entry['error'] for entry in result)


class TestAnalyzeInfrastructure:
    """Test analyze_infrastructure method"""

    @patch('analyse.boto3.client')
    def test_analyze_infrastructure_complete(self, mock_boto_client):
        """Test complete infrastructure analysis"""
        analyzer = InfrastructureAnalyzer('test')

        # Mock all sub-methods
        analyzer.analyze_log_groups = Mock(return_value=[{'status': 'found'}])
        analyzer.analyze_alarms = Mock(return_value=[{'status': 'found'}])
        analyzer.analyze_composite_alarms = Mock(return_value=[{'status': 'found'}])
        analyzer.analyze_dashboards = Mock(return_value=[{'status': 'found'}])
        analyzer.analyze_metric_filters = Mock(return_value=[{'status': 'found'}])
        analyzer._generate_recommendations = Mock(return_value=[])
        analyzer._calculate_compliance_score = Mock(return_value=95.0)

        result = analyzer.analyze_infrastructure()

        assert 'log_groups' in result
        assert 'alarms' in result
        assert 'composite_alarms' in result
        assert 'dashboards' in result
        assert 'metric_filters' in result
        assert 'recommendations' in result
        assert 'compliance_score' in result
        assert 'timestamp' in result
        assert 'environment_suffix' in result
        assert 'region' in result


class TestGenerateRecommendations:
    """Test _generate_recommendations method"""

    @patch('analyse.boto3.client')
    def test_generate_recommendations_missing_log_groups(self, mock_boto_client):
        """Test recommendations for missing log groups"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [{'status': 'missing', 'name': '/aws/test'}],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        assert len(recommendations) > 0
        assert any('log group' in rec['message'].lower() for rec in recommendations)

    @patch('analyse.boto3.client')
    def test_generate_recommendations_missing_encryption(self, mock_boto_client):
        """Test recommendations for missing KMS encryption"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [{'status': 'found', 'name': '/aws/test', 'kms_encrypted': False}],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        assert len(recommendations) > 0
        assert any('kms' in rec['message'].lower() or 'encrypt' in rec['message'].lower()
                   for rec in recommendations)


class TestCalculateComplianceScore:
    """Test _calculate_compliance_score method"""

    @patch('analyse.boto3.client')
    def test_calculate_compliance_score_perfect(self, mock_boto_client):
        """Test compliance score with all resources present"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [
                {'status': 'found', 'kms_encrypted': True, 'retention_days': 7},
                {'status': 'found', 'kms_encrypted': True, 'retention_days': 7},
                {'status': 'found', 'kms_encrypted': True, 'retention_days': 7}
            ],
            'alarms': [
                {'status': 'found', 'has_sns_action': True},
                {'status': 'found', 'has_sns_action': True},
                {'status': 'found', 'has_sns_action': True},
                {'status': 'found', 'has_sns_action': True},
                {'status': 'found', 'has_sns_action': True},
                {'status': 'found', 'has_sns_action': True}
            ],
            'composite_alarms': [{'status': 'found', 'has_sns_action': True}],
            'dashboards': [{'status': 'found', 'compliant': True}],
            'metric_filters': [
                {'filter_count': 5},
                {'filter_count': 5},
                {'filter_count': 4}
            ]
        }

        score = analyzer._calculate_compliance_score(analysis)

        assert score == 100.0

    @patch('analyse.boto3.client')
    def test_calculate_compliance_score_partial(self, mock_boto_client):
        """Test compliance score with some missing resources"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [{'status': 'found'}, {'status': 'missing'}, {'status': 'missing'}],
            'alarms': [{'status': 'found'}] * 3 + [{'status': 'missing'}] * 3,
            'composite_alarms': [{'status': 'missing'}],
            'dashboards': [{'status': 'found'}],
            'metric_filters': [{'status': 'found'}] * 7 + [{'status': 'missing'}] * 7
        }

        score = analyzer._calculate_compliance_score(analysis)

        assert 0 < score < 100

    @patch('analyse.boto3.client')
    def test_calculate_compliance_score_none(self, mock_boto_client):
        """Test compliance score with all resources missing"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [{'status': 'missing'}] * 3,
            'alarms': [{'status': 'missing'}] * 6,
            'composite_alarms': [{'status': 'missing'}],
            'dashboards': [{'status': 'missing'}],
            'metric_filters': [{'status': 'missing'}] * 14
        }

        score = analyzer._calculate_compliance_score(analysis)

        assert score == 0.0


class TestPrintReport:
    """Test print_report method"""

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_print_report(self, mock_print, mock_boto_client):
        """Test report printing"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'environment_suffix': 'test',
            'region': 'us-east-1',
            'timestamp': '2025-01-01T00:00:00Z',
            'log_groups': [{'status': 'found', 'name': 'test'}],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': [],
            'recommendations': [{'priority': 'high', 'category': 'test', 'resource': 'test', 'message': 'Test rec'}],
            'compliance_score': 75.5
        }

        analyzer.print_report(analysis)

        assert mock_print.called
        # Verify key sections are printed
        print_calls = [str(call) for call in mock_print.call_args_list]
        assert any('75.5' in call for call in print_calls)


class TestExportJsonReport:
    """Test export_json_report method"""

    @patch('analyse.boto3.client')
    @patch('builtins.open', create=True)
    def test_export_json_report(self, mock_open, mock_boto_client):
        """Test JSON report export"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': [],
            'recommendations': [],
            'compliance_score': 100.0
        }

        mock_file = MagicMock()
        mock_open.return_value.__enter__.return_value = mock_file

        analyzer.export_json_report(analysis, '/tmp/report.json')

        mock_open.assert_called_once_with('/tmp/report.json', 'w')
        mock_file.write.assert_called()


class TestMainFunction:
    """Test main function"""

    @patch('analyse.InfrastructureAnalyzer')
    @patch('analyse.os.environ.get')
    def test_main_with_environment(self, mock_env_get, mock_analyzer_class):
        """Test main function with environment suffix"""
        from analyse import main

        mock_env_get.return_value = 'pr123'
        mock_analyzer = Mock()
        mock_analyzer_class.return_value = mock_analyzer
        # Return all required fields for print_report
        mock_analyzer.analyze_infrastructure.return_value = {
            'compliance_score': 100,
            'environment_suffix': 'pr123',
            'region': 'us-east-1',
            'timestamp': '2025-01-01T00:00:00Z',
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': [],
            'recommendations': []
        }

        result = main()

        assert result == 0
        mock_analyzer.analyze_infrastructure.assert_called_once()

    @patch('analyse.InfrastructureAnalyzer')
    @patch('analyse.os.getenv')
    def test_main_without_environment(self, mock_getenv, mock_analyzer_class):
        """Test main function with default environment suffix"""
        from analyse import main

        # Return None for ENVIRONMENT_SUFFIX, should use 'dev' as default
        mock_getenv.side_effect = lambda key, default=None: {'ENVIRONMENT_SUFFIX': 'dev', 'AWS_REGION': 'us-east-1', 'OUTPUT_FILE': ''}.get(key, default)

        mock_analyzer = Mock()
        mock_analyzer_class.return_value = mock_analyzer
        mock_analyzer.analyze_infrastructure.return_value = {
            'compliance_score': 85,
            'environment_suffix': 'dev',
            'region': 'us-east-1',
            'timestamp': '2025-01-01T00:00:00Z',
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': [],
            'recommendations': []
        }

        result = main()

        assert result == 0
        mock_analyzer_class.assert_called_once_with('dev', 'us-east-1')

    @patch('analyse.InfrastructureAnalyzer')
    @patch('analyse.os.getenv')
    def test_main_with_error(self, mock_getenv, mock_analyzer_class):
        """Test main function with analysis error"""
        from analyse import main
        import pytest

        mock_getenv.side_effect = lambda key, default=None: {'ENVIRONMENT_SUFFIX': 'pr123', 'AWS_REGION': 'us-east-1', 'OUTPUT_FILE': ''}.get(key, default)
        mock_analyzer = Mock()
        mock_analyzer_class.return_value = mock_analyzer
        mock_analyzer.analyze_infrastructure.side_effect = Exception('Test error')

        # Exception should propagate
        with pytest.raises(Exception, match='Test error'):
            main()
