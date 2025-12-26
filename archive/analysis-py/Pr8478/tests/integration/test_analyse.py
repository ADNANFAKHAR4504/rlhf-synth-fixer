#!/usr/bin/env python3
"""
Integration tests for Infrastructure Analysis Script
Tests end-to-end functionality with LocalStack/mocked AWS services
"""

import pytest
import json
import os
import sys
from unittest.mock import patch, Mock
from datetime import datetime

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import InfrastructureAnalyzer


class TestEndToEndAnalysis:
    """Test complete end-to-end analysis workflows"""

    @patch('analyse.boto3.client')
    def test_full_analysis_with_all_resources(self, mock_boto_client):
        """Test full analysis when all resources exist"""
        # Setup mock clients
        mock_cw = Mock()
        mock_logs = Mock()
        mock_sns = Mock()
        mock_kms = Mock()

        def get_client(service, **kwargs):
            clients = {
                'cloudwatch': mock_cw,
                'logs': mock_logs,
                'sns': mock_sns,
                'kms': mock_kms
            }
            return clients.get(service)

        mock_boto_client.side_effect = get_client

        # Mock log groups
        mock_logs.describe_log_groups.return_value = {
            'logGroups': [
                {
                    'logGroupName': '/aws/payment-api-test',
                    'retentionInDays': 7,
                    'kmsKeyId': 'arn:aws:kms:us-east-1:123456789012:key/test',
                    'storedBytes': 1024
                },
                {
                    'logGroupName': '/aws/transaction-processor-test',
                    'retentionInDays': 7,
                    'kmsKeyId': 'arn:aws:kms:us-east-1:123456789012:key/test',
                    'storedBytes': 2048
                },
                {
                    'logGroupName': '/aws/fraud-detector-test',
                    'retentionInDays': 7,
                    'kmsKeyId': 'arn:aws:kms:us-east-1:123456789012:key/test',
                    'storedBytes': 512
                }
            ]
        }

        # Mock metric alarms
        mock_cw.describe_alarms.side_effect = [
            {
                'MetricAlarms': [
                    {
                        'AlarmName': 'payment-api-error-rate-test',
                        'StateValue': 'OK',
                        'MetricName': 'ErrorRate',
                        'Threshold': 5.0,
                        'AlarmActions': ['arn:aws:sns:us-east-1:123456789012:test']
                    },
                    {
                        'AlarmName': 'payment-api-response-time-test',
                        'StateValue': 'OK',
                        'MetricName': 'ResponseTime',
                        'Threshold': 1000,
                        'AlarmActions': ['arn:aws:sns:us-east-1:123456789012:test']
                    },
                    {
                        'AlarmName': 'failed-transactions-test',
                        'StateValue': 'OK',
                        'MetricName': 'FailedTransactions',
                        'Threshold': 10,
                        'AlarmActions': ['arn:aws:sns:us-east-1:123456789012:test']
                    },
                    {
                        'AlarmName': 'transaction-processor-errors-test',
                        'StateValue': 'OK',
                        'MetricName': 'Errors',
                        'Threshold': 5,
                        'AlarmActions': ['arn:aws:sns:us-east-1:123456789012:test']
                    },
                    {
                        'AlarmName': 'fraud-detector-errors-test',
                        'StateValue': 'OK',
                        'MetricName': 'Errors',
                        'Threshold': 3,
                        'AlarmActions': ['arn:aws:sns:us-east-1:123456789012:test']
                    },
                    {
                        'AlarmName': 'payment-high-load-test',
                        'StateValue': 'OK',
                        'MetricName': 'RequestCount',
                        'Threshold': 1000,
                        'AlarmActions': ['arn:aws:sns:us-east-1:123456789012:test']
                    }
                ]
            },
            # For composite alarms
            {
                'CompositeAlarms': [{
                    'AlarmName': 'payment-high-load-test',
                    'StateValue': 'OK',
                    'AlarmRule': 'ALARM(alarm1) OR ALARM(alarm2)',
                    'AlarmActions': ['arn:aws:sns:us-east-1:123456789012:test']
                }]
            }
        ]

        # Mock dashboards
        mock_cw.list_dashboards.return_value = {
            'DashboardEntries': [{
                'DashboardName': 'payment-monitoring-test',
                'Size': 5000
            }]
        }

        mock_cw.get_dashboard.return_value = {
            'DashboardName': 'payment-monitoring-test',
            'DashboardBody': json.dumps({'widgets': list(range(9))})
        }

        # Mock metric filters
        mock_logs.describe_metric_filters.return_value = {
            'metricFilters': [
                {
                    'filterName': f'filter-{i}',
                    'logGroupName': '/aws/payment-api-test',
                    'filterPattern': '{$.level = "ERROR"}',
                    'metricTransformations': [{'metricName': f'Metric{i}'}]
                }
                for i in range(14)
            ]
        }

        # Run analysis
        analyzer = InfrastructureAnalyzer('test')
        result = analyzer.analyze_infrastructure()

        # Verify complete analysis
        assert result['compliance_score'] == 100.0
        assert len(result['log_groups']) == 3
        assert len(result['alarms']) == 6
        assert len(result['composite_alarms']) == 1
        assert len(result['dashboards']) == 1
        assert len(result['metric_filters']) == 14
        assert result['recommendations'] == []

    @patch('analyse.boto3.client')
    def test_full_analysis_with_missing_resources(self, mock_boto_client):
        """Test full analysis when resources are missing"""
        # Setup mock clients with empty responses
        mock_cw = Mock()
        mock_logs = Mock()
        mock_sns = Mock()
        mock_kms = Mock()

        def get_client(service, **kwargs):
            clients = {
                'cloudwatch': mock_cw,
                'logs': mock_logs,
                'sns': mock_sns,
                'kms': mock_kms
            }
            return clients.get(service)

        mock_boto_client.side_effect = get_client

        # All empty responses
        mock_logs.describe_log_groups.return_value = {'logGroups': []}
        mock_cw.describe_alarms.return_value = {'MetricAlarms': [], 'CompositeAlarms': []}
        mock_cw.list_dashboards.return_value = {'DashboardEntries': []}
        mock_logs.describe_metric_filters.return_value = {'metricFilters': []}

        # Run analysis
        analyzer = InfrastructureAnalyzer('test')
        result = analyzer.analyze_infrastructure()

        # Verify analysis detected missing resources
        assert result['compliance_score'] == 0.0
        assert len(result['recommendations']) > 0
        assert all(lg['status'] == 'missing' for lg in result['log_groups'])
        assert all(alarm['status'] == 'missing' for alarm in result['alarms'])

    @patch('analyse.boto3.client')
    def test_analysis_with_partial_resources(self, mock_boto_client):
        """Test analysis with some resources present and some missing"""
        mock_cw = Mock()
        mock_logs = Mock()
        mock_sns = Mock()
        mock_kms = Mock()

        def get_client(service, **kwargs):
            clients = {
                'cloudwatch': mock_cw,
                'logs': mock_logs,
                'sns': mock_sns,
                'kms': mock_kms
            }
            return clients.get(service)

        mock_boto_client.side_effect = get_client

        # Some log groups present
        mock_logs.describe_log_groups.return_value = {
            'logGroups': [{
                'logGroupName': '/aws/payment-api-test',
                'retentionInDays': 7,
                'kmsKeyId': 'key',
                'storedBytes': 1024
            }]
        }

        # Some alarms present
        mock_cw.describe_alarms.side_effect = [
            {
                'MetricAlarms': [
                    {
                        'AlarmName': 'payment-api-error-rate-test',
                        'StateValue': 'ALARM',
                        'MetricName': 'ErrorRate',
                        'Threshold': 5.0,
                        'AlarmActions': []
                    }
                ]
            },
            {'CompositeAlarms': []}
        ]

        mock_cw.list_dashboards.return_value = {'DashboardEntries': []}
        mock_logs.describe_metric_filters.return_value = {'metricFilters': []}

        # Run analysis
        analyzer = InfrastructureAnalyzer('test')
        result = analyzer.analyze_infrastructure()

        # Verify partial compliance
        assert 0 < result['compliance_score'] < 100
        assert len(result['recommendations']) > 0


class TestReportGeneration:
    """Test report generation and export"""

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_print_report_formatting(self, mock_print, mock_boto_client):
        """Test that print report generates proper formatting"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [{'status': 'found', 'name': 'test', 'kms_encrypted': True}],
            'alarms': [{'status': 'found', 'name': 'alarm1', 'state': 'OK'}],
            'composite_alarms': [{'status': 'found'}],
            'dashboards': [{'status': 'found', 'widget_count': 9}],
            'metric_filters': [{'status': 'found'}],
            'recommendations': [
                {'severity': 'high', 'description': 'High priority item'},
                {'severity': 'medium', 'description': 'Medium priority item'}
            ],
            'compliance_score': 85.5,
            'analysis_timestamp': '2025-01-01T12:00:00Z'
        }

        analyzer.print_report(analysis)

        # Verify print was called with formatted content
        assert mock_print.called
        calls = [str(call) for call in mock_print.call_args_list]

        # Check for key sections
        full_output = ' '.join(calls)
        assert '85.5' in full_output or '85' in full_output

    @patch('analyse.boto3.client')
    def test_json_export_structure(self, mock_boto_client):
        """Test that JSON export has proper structure"""
        import tempfile

        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [{'status': 'found'}],
            'alarms': [{'status': 'found'}],
            'composite_alarms': [{'status': 'found'}],
            'dashboards': [{'status': 'found'}],
            'metric_filters': [{'status': 'found'}],
            'recommendations': [],
            'compliance_score': 100.0,
            'analysis_timestamp': '2025-01-01T00:00:00Z'
        }

        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
            temp_path = f.name

        try:
            analyzer.export_json_report(analysis, temp_path)

            # Read back and verify
            with open(temp_path, 'r') as f:
                exported = json.load(f)

            assert exported['compliance_score'] == 100.0
            assert 'log_groups' in exported
            assert 'recommendations' in exported
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)


class TestErrorHandling:
    """Test error handling in various scenarios"""

    @patch('analyse.boto3.client')
    def test_aws_api_error_handling(self, mock_boto_client):
        """Test handling of AWS API errors"""
        mock_logs = Mock()
        mock_cw = Mock()

        def get_client(service, **kwargs):
            return mock_logs if service == 'logs' else mock_cw

        mock_boto_client.side_effect = get_client

        # Simulate AWS API errors
        mock_logs.describe_log_groups.side_effect = Exception('API throttling')
        mock_logs.describe_metric_filters.side_effect = Exception('Access denied')

        analyzer = InfrastructureAnalyzer('test')

        # Should handle errors gracefully
        log_groups = analyzer.analyze_log_groups()
        assert all(lg['status'] == 'error' for lg in log_groups)

    @patch('analyse.boto3.client')
    def test_malformed_response_handling(self, mock_boto_client):
        """Test handling of malformed AWS responses"""
        mock_cw = Mock()
        mock_boto_client.return_value = mock_cw

        # Return malformed response
        mock_cw.describe_alarms.return_value = {'unexpected_key': 'value'}

        analyzer = InfrastructureAnalyzer('test')
        analyzer.cloudwatch_client = mock_cw

        # Should handle gracefully
        result = analyzer.analyze_alarms()
        assert isinstance(result, list)


class TestMultiRegionSupport:
    """Test multi-region functionality"""

    @patch('analyse.boto3.client')
    def test_different_regions(self, mock_boto_client):
        """Test analyzer works with different AWS regions"""
        regions = ['us-east-1', 'us-west-2', 'eu-west-1']

        for region in regions:
            analyzer = InfrastructureAnalyzer('test', region_name=region)
            assert analyzer.region == region

            # Verify clients are created for the correct region
            calls = [call for call in mock_boto_client.call_args_list
                    if call[1].get('region_name') == region]
            assert len(calls) > 0


class TestComplianceScoring:
    """Test compliance score calculations"""

    @patch('analyse.boto3.client')
    def test_compliance_score_weights(self, mock_boto_client):
        """Test that compliance score properly weights different resource types"""
        analyzer = InfrastructureAnalyzer('test')

        # Test with only log groups
        analysis_logs_only = {
            'log_groups': [{'status': 'found'}] * 3,
            'alarms': [{'status': 'missing'}] * 6,
            'composite_alarms': [{'status': 'missing'}],
            'dashboards': [{'status': 'missing'}],
            'metric_filters': [{'status': 'missing'}] * 14
        }
        score_logs = analyzer._calculate_compliance_score(analysis_logs_only)

        # Test with only alarms
        analysis_alarms_only = {
            'log_groups': [{'status': 'missing'}] * 3,
            'alarms': [{'status': 'found'}] * 6,
            'composite_alarms': [{'status': 'missing'}],
            'dashboards': [{'status': 'missing'}],
            'metric_filters': [{'status': 'missing'}] * 14
        }
        score_alarms = analyzer._calculate_compliance_score(analysis_alarms_only)

        # Scores should be proportional to number of resources
        assert score_logs > 0
        assert score_alarms > 0
        assert score_logs + score_alarms < 100


class TestRecommendationsEngine:
    """Test recommendations generation"""

    @patch('analyse.boto3.client')
    def test_recommendations_prioritization(self, mock_boto_client):
        """Test that recommendations are properly prioritized"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [
                {'status': 'missing', 'name': 'missing-lg'},
                {'status': 'found', 'name': 'found-lg', 'kms_encrypted': False}
            ],
            'alarms': [{'status': 'missing', 'name': 'alarm1'}],
            'composite_alarms': [{'status': 'missing'}],
            'dashboards': [{'status': 'missing'}],
            'metric_filters': [{'status': 'missing'}]
        }

        recommendations = analyzer._generate_recommendations(analysis)

        # Should have recommendations
        assert len(recommendations) > 0

        # Should have severity levels
        severities = [rec.get('severity') for rec in recommendations]
        assert 'high' in severities or 'medium' in severities or 'low' in severities

    @patch('analyse.boto3.client')
    def test_no_recommendations_when_compliant(self, mock_boto_client):
        """Test that no recommendations are generated when fully compliant"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [{'status': 'found', 'kms_encrypted': True}] * 3,
            'alarms': [{'status': 'found', 'has_sns_action': True}] * 6,
            'composite_alarms': [{'status': 'found', 'has_sns_action': True}],
            'dashboards': [{'status': 'found', 'widget_count': 9}],
            'metric_filters': [{'status': 'found'}] * 14
        }

        recommendations = analyzer._generate_recommendations(analysis)

        # Should have few or no recommendations
        assert len(recommendations) == 0


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
