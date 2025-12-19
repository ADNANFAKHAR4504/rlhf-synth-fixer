#!/usr/bin/env python3
"""
Unit tests for the Infrastructure Analysis Script (analyse.py)
Tests the InfrastructureAnalyzer class and its methods
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import json
import sys
import os
from datetime import datetime

# Add lib directory to path for importing
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import InfrastructureAnalyzer, main


class TestInfrastructureAnalyzerInit(unittest.TestCase):
    """Tests for InfrastructureAnalyzer initialization"""

    @patch('analyse.boto3.client')
    def test_init_creates_aws_clients(self, mock_boto_client):
        """Test that initialization creates all required AWS clients"""
        analyzer = InfrastructureAnalyzer('test-suffix', 'us-east-1')

        self.assertEqual(analyzer.environment_suffix, 'test-suffix')
        self.assertEqual(analyzer.region, 'us-east-1')
        self.assertEqual(mock_boto_client.call_count, 4)

    @patch('analyse.boto3.client')
    def test_init_default_region(self, mock_boto_client):
        """Test that default region is us-east-1"""
        analyzer = InfrastructureAnalyzer('test-suffix')
        self.assertEqual(analyzer.region, 'us-east-1')

    @patch('analyse.boto3.client')
    def test_init_custom_region(self, mock_boto_client):
        """Test that custom region is used when provided"""
        analyzer = InfrastructureAnalyzer('test-suffix', 'eu-west-1')
        self.assertEqual(analyzer.region, 'eu-west-1')


class TestAnalyzeLogGroups(unittest.TestCase):
    """Tests for analyze_log_groups method"""

    @patch('analyse.boto3.client')
    def test_analyze_log_groups_all_found(self, mock_boto_client):
        """Test when all expected log groups are found"""
        mock_logs = Mock()
        mock_logs.describe_log_groups.return_value = {
            'logGroups': [{
                'logGroupName': '/aws/payment-api-test',
                'retentionInDays': 7,
                'kmsKeyId': 'arn:aws:kms:us-east-1:123456789012:key/test-key',
                'storedBytes': 1024
            }]
        }

        mock_boto_client.side_effect = lambda service, **kwargs: mock_logs if service == 'logs' else Mock()

        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analyzer.logs_client = mock_logs
        result = analyzer.analyze_log_groups()

        self.assertEqual(len(result), 3)
        found_groups = [lg for lg in result if lg['status'] == 'found']
        self.assertEqual(len(found_groups), 1)

    @patch('analyse.boto3.client')
    def test_analyze_log_groups_none_found(self, mock_boto_client):
        """Test when no log groups are found"""
        mock_logs = Mock()
        mock_logs.describe_log_groups.return_value = {'logGroups': []}

        mock_boto_client.side_effect = lambda service, **kwargs: mock_logs if service == 'logs' else Mock()

        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analyzer.logs_client = mock_logs
        result = analyzer.analyze_log_groups()

        self.assertEqual(len(result), 3)
        for lg in result:
            self.assertEqual(lg['status'], 'missing')

    @patch('analyse.boto3.client')
    def test_analyze_log_groups_kms_encryption_detected(self, mock_boto_client):
        """Test that KMS encryption is properly detected"""
        mock_logs = Mock()
        mock_logs.describe_log_groups.return_value = {
            'logGroups': [{
                'logGroupName': '/aws/payment-api-test',
                'kmsKeyId': 'arn:aws:kms:us-east-1:123456789012:key/test-key'
            }]
        }

        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analyzer.logs_client = mock_logs
        result = analyzer.analyze_log_groups()

        found_group = next((lg for lg in result if lg['status'] == 'found'), None)
        if found_group:
            self.assertTrue(found_group['kms_encrypted'])

    @patch('analyse.boto3.client')
    def test_analyze_log_groups_handles_exception(self, mock_boto_client):
        """Test error handling when API call fails"""
        mock_logs = Mock()
        mock_logs.describe_log_groups.side_effect = Exception('API Error')

        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analyzer.logs_client = mock_logs
        result = analyzer.analyze_log_groups()

        self.assertEqual(len(result), 3)
        for lg in result:
            self.assertEqual(lg['status'], 'error')


class TestAnalyzeAlarms(unittest.TestCase):
    """Tests for analyze_alarms method"""

    @patch('analyse.boto3.client')
    def test_analyze_alarms_all_found(self, mock_boto_client):
        """Test when all expected alarms are found"""
        mock_cloudwatch = Mock()
        mock_cloudwatch.describe_alarms.return_value = {
            'MetricAlarms': [
                {'AlarmName': 'payment-api-error-rate-test', 'StateValue': 'OK', 'MetricName': 'ErrorCount', 'AlarmActions': ['arn:aws:sns:...']}
            ]
        }

        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analyzer.cloudwatch_client = mock_cloudwatch
        result = analyzer.analyze_alarms()

        self.assertEqual(len(result), 6)
        found_alarms = [a for a in result if a['status'] == 'found']
        self.assertEqual(len(found_alarms), 1)

    @patch('analyse.boto3.client')
    def test_analyze_alarms_detects_sns_action(self, mock_boto_client):
        """Test that SNS action presence is detected"""
        mock_cloudwatch = Mock()
        mock_cloudwatch.describe_alarms.return_value = {
            'MetricAlarms': [
                {'AlarmName': 'payment-api-error-rate-test', 'AlarmActions': ['arn:aws:sns:us-east-1:123:topic']}
            ]
        }

        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analyzer.cloudwatch_client = mock_cloudwatch
        result = analyzer.analyze_alarms()

        found_alarm = next((a for a in result if a['status'] == 'found'), None)
        if found_alarm:
            self.assertTrue(found_alarm['has_sns_action'])

    @patch('analyse.boto3.client')
    def test_analyze_alarms_handles_exception(self, mock_boto_client):
        """Test error handling when API call fails"""
        mock_cloudwatch = Mock()
        mock_cloudwatch.describe_alarms.side_effect = Exception('API Error')

        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analyzer.cloudwatch_client = mock_cloudwatch
        result = analyzer.analyze_alarms()

        self.assertTrue(any(a['status'] == 'error' for a in result))


class TestAnalyzeCompositeAlarms(unittest.TestCase):
    """Tests for analyze_composite_alarms method"""

    @patch('analyse.boto3.client')
    def test_analyze_composite_alarms_found(self, mock_boto_client):
        """Test when composite alarm is found"""
        mock_cloudwatch = Mock()
        mock_cloudwatch.describe_alarms.return_value = {
            'CompositeAlarms': [{
                'AlarmName': 'multi-service-failure-test',
                'StateValue': 'OK',
                'AlarmRule': 'ALARM(alarm1) AND ALARM(alarm2)',
                'AlarmActions': ['arn:aws:sns:us-east-1:123:topic']
            }]
        }

        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analyzer.cloudwatch_client = mock_cloudwatch
        result = analyzer.analyze_composite_alarms()

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['status'], 'found')
        self.assertTrue(result[0]['has_sns_action'])

    @patch('analyse.boto3.client')
    def test_analyze_composite_alarms_missing(self, mock_boto_client):
        """Test when composite alarm is not found"""
        mock_cloudwatch = Mock()
        mock_cloudwatch.describe_alarms.return_value = {'CompositeAlarms': []}

        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analyzer.cloudwatch_client = mock_cloudwatch
        result = analyzer.analyze_composite_alarms()

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['status'], 'missing')


class TestAnalyzeDashboards(unittest.TestCase):
    """Tests for analyze_dashboards method"""

    @patch('analyse.boto3.client')
    def test_analyze_dashboards_found_compliant(self, mock_boto_client):
        """Test when dashboard is found and compliant"""
        mock_cloudwatch = Mock()
        mock_cloudwatch.get_dashboard.return_value = {
            'DashboardName': 'payment-monitoring-test',
            'DashboardBody': json.dumps({'widgets': [{}, {}, {}, {}, {}, {}, {}, {}, {}]})
        }

        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analyzer.cloudwatch_client = mock_cloudwatch
        result = analyzer.analyze_dashboards()

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['status'], 'found')
        self.assertEqual(result[0]['widget_count'], 9)
        self.assertTrue(result[0]['compliant'])

    @patch('analyse.boto3.client')
    def test_analyze_dashboards_found_not_compliant(self, mock_boto_client):
        """Test when dashboard is found but not compliant"""
        mock_cloudwatch = Mock()
        mock_cloudwatch.get_dashboard.return_value = {
            'DashboardBody': json.dumps({'widgets': [{}, {}, {}]})
        }

        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analyzer.cloudwatch_client = mock_cloudwatch
        result = analyzer.analyze_dashboards()

        self.assertEqual(result[0]['widget_count'], 3)
        self.assertFalse(result[0]['compliant'])


class TestAnalyzeMetricFilters(unittest.TestCase):
    """Tests for analyze_metric_filters method"""

    @patch('analyse.boto3.client')
    def test_analyze_metric_filters_found(self, mock_boto_client):
        """Test when metric filters are found"""
        mock_logs = Mock()
        mock_logs.describe_metric_filters.return_value = {
            'metricFilters': [
                {'filterName': 'error-filter'},
                {'filterName': 'response-time-filter'}
            ]
        }

        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analyzer.logs_client = mock_logs
        result = analyzer.analyze_metric_filters()

        self.assertEqual(len(result), 3)
        for mf in result:
            self.assertEqual(mf['filter_count'], 2)

    @patch('analyse.boto3.client')
    def test_analyze_metric_filters_log_group_not_found(self, mock_boto_client):
        """Test when log group is not found"""
        mock_logs = Mock()
        mock_logs.describe_metric_filters.side_effect = mock_logs.exceptions.ResourceNotFoundException({}, 'describe_metric_filters')
        mock_logs.exceptions = MagicMock()
        mock_logs.exceptions.ResourceNotFoundException = type('ResourceNotFoundException', (Exception,), {})
        mock_logs.describe_metric_filters.side_effect = mock_logs.exceptions.ResourceNotFoundException('Not found')

        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analyzer.logs_client = mock_logs
        result = analyzer.analyze_metric_filters()

        for mf in result:
            self.assertEqual(mf['status'], 'log_group_not_found')


class TestGenerateRecommendations(unittest.TestCase):
    """Tests for _generate_recommendations method"""

    @patch('analyse.boto3.client')
    def test_generates_recommendation_for_missing_log_group(self, mock_boto_client):
        """Test recommendation is generated for missing log group"""
        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analysis = {
            'log_groups': [{'name': '/aws/test', 'status': 'missing'}],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        self.assertTrue(any(r['priority'] == 'high' and r['category'] == 'logging' for r in recommendations))

    @patch('analyse.boto3.client')
    def test_generates_recommendation_for_unencrypted_log_group(self, mock_boto_client):
        """Test recommendation is generated for unencrypted log group"""
        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analysis = {
            'log_groups': [{'name': '/aws/test', 'status': 'found', 'kms_encrypted': False, 'retention_days': 7}],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        self.assertTrue(any(r['priority'] == 'medium' and r['category'] == 'security' for r in recommendations))

    @patch('analyse.boto3.client')
    def test_generates_recommendation_for_missing_alarms(self, mock_boto_client):
        """Test recommendation is generated for missing alarms"""
        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analysis = {
            'log_groups': [],
            'alarms': [{'name': 'test-alarm', 'status': 'missing'}],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        self.assertTrue(any(r['priority'] == 'high' and r['category'] == 'monitoring' for r in recommendations))

    @patch('analyse.boto3.client')
    def test_generates_recommendation_for_missing_dashboard(self, mock_boto_client):
        """Test recommendation is generated for missing dashboard"""
        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analysis = {
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [{'name': 'test-dashboard', 'status': 'missing'}],
            'metric_filters': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        self.assertTrue(any(r['priority'] == 'medium' and r['category'] == 'visibility' for r in recommendations))


class TestCalculateComplianceScore(unittest.TestCase):
    """Tests for _calculate_compliance_score method"""

    @patch('analyse.boto3.client')
    def test_full_compliance_score(self, mock_boto_client):
        """Test compliance score when all resources are compliant"""
        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analysis = {
            'log_groups': [
                {'status': 'found', 'kms_encrypted': True, 'retention_days': 7}
            ],
            'alarms': [
                {'status': 'found', 'has_sns_action': True}
            ],
            'composite_alarms': [
                {'status': 'found', 'has_sns_action': True}
            ],
            'dashboards': [
                {'status': 'found', 'compliant': True}
            ],
            'metric_filters': [
                {'filter_count': 3}
            ]
        }

        score = analyzer._calculate_compliance_score(analysis)
        self.assertEqual(score, 100.0)

    @patch('analyse.boto3.client')
    def test_zero_compliance_score(self, mock_boto_client):
        """Test compliance score when nothing is compliant"""
        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analysis = {
            'log_groups': [
                {'status': 'missing', 'kms_encrypted': False, 'retention_days': None}
            ],
            'alarms': [
                {'status': 'missing'}
            ],
            'composite_alarms': [
                {'status': 'missing'}
            ],
            'dashboards': [
                {'status': 'missing'}
            ],
            'metric_filters': [
                {'filter_count': 0}
            ]
        }

        score = analyzer._calculate_compliance_score(analysis)
        self.assertEqual(score, 0.0)

    @patch('analyse.boto3.client')
    def test_partial_compliance_score(self, mock_boto_client):
        """Test partial compliance score"""
        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analysis = {
            'log_groups': [
                {'status': 'found', 'kms_encrypted': True, 'retention_days': 14}  # wrong retention
            ],
            'alarms': [
                {'status': 'found', 'has_sns_action': False}  # no SNS
            ],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': []
        }

        score = analyzer._calculate_compliance_score(analysis)
        self.assertGreater(score, 0)
        self.assertLess(score, 100)

    @patch('analyse.boto3.client')
    def test_empty_analysis_returns_zero(self, mock_boto_client):
        """Test that empty analysis returns zero score"""
        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analysis = {
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': []
        }

        score = analyzer._calculate_compliance_score(analysis)
        self.assertEqual(score, 0.0)


class TestAnalyzeInfrastructure(unittest.TestCase):
    """Tests for analyze_infrastructure method"""

    @patch('analyse.boto3.client')
    def test_analyze_infrastructure_returns_complete_structure(self, mock_boto_client):
        """Test that analyze_infrastructure returns all required keys"""
        mock_logs = Mock()
        mock_logs.describe_log_groups.return_value = {'logGroups': []}
        mock_logs.describe_metric_filters.return_value = {'metricFilters': []}

        mock_cloudwatch = Mock()
        mock_cloudwatch.describe_alarms.return_value = {'MetricAlarms': [], 'CompositeAlarms': []}
        mock_cloudwatch.get_dashboard.return_value = {'DashboardBody': '{"widgets": []}'}

        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analyzer.logs_client = mock_logs
        analyzer.cloudwatch_client = mock_cloudwatch

        result = analyzer.analyze_infrastructure()

        required_keys = ['environment_suffix', 'region', 'timestamp', 'log_groups',
                         'alarms', 'composite_alarms', 'dashboards', 'metric_filters',
                         'recommendations', 'compliance_score']

        for key in required_keys:
            self.assertIn(key, result)


class TestPrintReport(unittest.TestCase):
    """Tests for print_report method"""

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_print_report_outputs_to_console(self, mock_print, mock_boto_client):
        """Test that print_report outputs to console"""
        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analysis = {
            'environment_suffix': 'test',
            'region': 'us-east-1',
            'timestamp': '2024-01-01T00:00:00',
            'compliance_score': 75.0,
            'log_groups': [{'name': '/aws/test', 'status': 'found', 'kms_encrypted': True, 'retention_days': 7}],
            'alarms': [{'name': 'test-alarm', 'status': 'found', 'state': 'OK'}],
            'composite_alarms': [{'name': 'test-composite', 'status': 'found'}],
            'dashboards': [{'name': 'test-dashboard', 'status': 'found', 'widget_count': 9}],
            'recommendations': [{'priority': 'high', 'message': 'Test recommendation'}]
        }

        analyzer.print_report(analysis)

        self.assertTrue(mock_print.called)


class TestExportJsonReport(unittest.TestCase):
    """Tests for export_json_report method"""

    @patch('analyse.boto3.client')
    @patch('builtins.open', unittest.mock.mock_open())
    def test_export_json_report_writes_file(self, mock_boto_client):
        """Test that export_json_report writes to file"""
        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analysis = {
            'environment_suffix': 'test',
            'compliance_score': 75.0
        }

        with patch('builtins.open', unittest.mock.mock_open()) as mock_file:
            analyzer.export_json_report(analysis, '/tmp/test-report.json')
            mock_file.assert_called_once_with('/tmp/test-report.json', 'w')


class TestMainFunction(unittest.TestCase):
    """Tests for main function"""

    @patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': 'test123', 'AWS_REGION': 'us-east-1'})
    @patch('analyse.InfrastructureAnalyzer')
    def test_main_uses_environment_variables(self, mock_analyzer_class):
        """Test that main function uses environment variables"""
        mock_instance = Mock()
        mock_instance.analyze_infrastructure.return_value = {'compliance_score': 85}
        mock_analyzer_class.return_value = mock_instance

        result = main()

        mock_analyzer_class.assert_called_once_with('test123', 'us-east-1')
        self.assertEqual(result, 0)

    @patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': 'test', 'AWS_REGION': 'us-east-1'})
    @patch('analyse.InfrastructureAnalyzer')
    def test_main_returns_0_for_compliant(self, mock_analyzer_class):
        """Test that main returns 0 for compliant infrastructure"""
        mock_instance = Mock()
        mock_instance.analyze_infrastructure.return_value = {'compliance_score': 85}
        mock_analyzer_class.return_value = mock_instance

        result = main()
        self.assertEqual(result, 0)

    @patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': 'test', 'AWS_REGION': 'us-east-1'})
    @patch('analyse.InfrastructureAnalyzer')
    def test_main_returns_1_for_warnings(self, mock_analyzer_class):
        """Test that main returns 1 for infrastructure with warnings"""
        mock_instance = Mock()
        mock_instance.analyze_infrastructure.return_value = {'compliance_score': 60}
        mock_analyzer_class.return_value = mock_instance

        result = main()
        self.assertEqual(result, 1)

    @patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': 'test', 'AWS_REGION': 'us-east-1'})
    @patch('analyse.InfrastructureAnalyzer')
    def test_main_returns_2_for_non_compliant(self, mock_analyzer_class):
        """Test that main returns 2 for non-compliant infrastructure"""
        mock_instance = Mock()
        mock_instance.analyze_infrastructure.return_value = {'compliance_score': 30}
        mock_analyzer_class.return_value = mock_instance

        result = main()
        self.assertEqual(result, 2)

    @patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': 'test', 'AWS_REGION': 'us-east-1', 'OUTPUT_FILE': '/tmp/report.json'})
    @patch('analyse.InfrastructureAnalyzer')
    def test_main_exports_report_when_output_file_specified(self, mock_analyzer_class):
        """Test that main exports report when OUTPUT_FILE is specified"""
        mock_instance = Mock()
        mock_instance.analyze_infrastructure.return_value = {'compliance_score': 85}
        mock_analyzer_class.return_value = mock_instance

        main()

        mock_instance.export_json_report.assert_called_once()


class TestEdgeCases(unittest.TestCase):
    """Tests for edge cases and error scenarios"""

    @patch('analyse.boto3.client')
    def test_handles_empty_environment_suffix(self, mock_boto_client):
        """Test handling of empty environment suffix"""
        analyzer = InfrastructureAnalyzer('', 'us-east-1')
        self.assertEqual(analyzer.environment_suffix, '')

    @patch('analyse.boto3.client')
    def test_handles_special_characters_in_suffix(self, mock_boto_client):
        """Test handling of special characters in environment suffix"""
        analyzer = InfrastructureAnalyzer('test-suffix-123_abc', 'us-east-1')
        self.assertEqual(analyzer.environment_suffix, 'test-suffix-123_abc')

    @patch('analyse.boto3.client')
    def test_recommendations_empty_when_all_compliant(self, mock_boto_client):
        """Test that no recommendations are generated when all resources are compliant"""
        analyzer = InfrastructureAnalyzer('test', 'us-east-1')
        analysis = {
            'log_groups': [{'name': '/aws/test', 'status': 'found', 'kms_encrypted': True, 'retention_days': 7}],
            'alarms': [{'name': 'test-alarm', 'status': 'found', 'has_sns_action': True}],
            'composite_alarms': [{'name': 'test-composite', 'status': 'found'}],
            'dashboards': [{'name': 'test-dashboard', 'status': 'found', 'compliant': True}],
            'metric_filters': [{'log_group': '/aws/test', 'status': 'found', 'filter_count': 2}]
        }

        recommendations = analyzer._generate_recommendations(analysis)
        self.assertEqual(len(recommendations), 0)


if __name__ == '__main__':
    unittest.main()
