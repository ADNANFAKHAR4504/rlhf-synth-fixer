#!/usr/bin/env python3
"""
Unit tests for the Infrastructure Analysis Script (analyse.py)
Tests the InfrastructureAnalyzer class with mocked AWS services
"""

import unittest
import os
import sys
import json
import tempfile
from unittest.mock import patch, Mock, MagicMock

# Add lib directory to path for importing
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import InfrastructureAnalyzer, main


class TestInfrastructureAnalyzerInit(unittest.TestCase):
    """Test InfrastructureAnalyzer initialization"""

    @patch('analyse.boto3.client')
    def test_init_default_region(self, mock_boto_client):
        """Test initialization with default region"""
        analyzer = InfrastructureAnalyzer('test-suffix')
        self.assertEqual(analyzer.environment_suffix, 'test-suffix')
        self.assertEqual(analyzer.region, 'us-east-1')

    @patch('analyse.boto3.client')
    def test_init_custom_region(self, mock_boto_client):
        """Test initialization with custom region"""
        analyzer = InfrastructureAnalyzer('test-suffix', 'eu-west-1')
        self.assertEqual(analyzer.region, 'eu-west-1')

    @patch('analyse.boto3.client')
    def test_init_creates_aws_clients(self, mock_boto_client):
        """Test that AWS clients are created during initialization"""
        analyzer = InfrastructureAnalyzer('test-suffix')
        self.assertEqual(mock_boto_client.call_count, 4)


class TestAnalyzeLogGroups(unittest.TestCase):
    """Test analyze_log_groups method"""

    @patch('analyse.boto3.client')
    def test_analyze_log_groups_all_found(self, mock_boto_client):
        """Test when all log groups are found"""
        mock_logs = Mock()
        mock_logs.describe_log_groups.return_value = {
            'logGroups': [
                {
                    'logGroupName': '/aws/payment-api-test',
                    'retentionInDays': 7,
                    'kmsKeyId': 'arn:aws:kms:us-east-1:123456789:key/abc',
                    'storedBytes': 1000
                }
            ]
        }
        mock_boto_client.return_value = mock_logs

        analyzer = InfrastructureAnalyzer('test')
        analyzer.logs_client = mock_logs

        result = analyzer.analyze_log_groups()

        self.assertEqual(len(result), 3)
        payment_api = next(lg for lg in result if 'payment-api' in lg['name'])
        self.assertEqual(payment_api['status'], 'found')

    @patch('analyse.boto3.client')
    def test_analyze_log_groups_none_found(self, mock_boto_client):
        """Test when no log groups are found"""
        mock_logs = Mock()
        mock_logs.describe_log_groups.return_value = {'logGroups': []}
        mock_boto_client.return_value = mock_logs

        analyzer = InfrastructureAnalyzer('test')
        analyzer.logs_client = mock_logs

        result = analyzer.analyze_log_groups()

        self.assertEqual(len(result), 3)
        for lg in result:
            self.assertEqual(lg['status'], 'missing')

    @patch('analyse.boto3.client')
    def test_analyze_log_groups_kms_encryption_detected(self, mock_boto_client):
        """Test KMS encryption detection"""
        mock_logs = Mock()
        mock_logs.describe_log_groups.return_value = {
            'logGroups': [
                {
                    'logGroupName': '/aws/payment-api-test',
                    'retentionInDays': 7,
                    'kmsKeyId': 'arn:aws:kms:us-east-1:123456789:key/abc'
                }
            ]
        }
        mock_boto_client.return_value = mock_logs

        analyzer = InfrastructureAnalyzer('test')
        analyzer.logs_client = mock_logs

        result = analyzer.analyze_log_groups()
        payment_api = next(lg for lg in result if 'payment-api' in lg['name'])
        self.assertTrue(payment_api['kms_encrypted'])

    @patch('analyse.boto3.client')
    def test_analyze_log_groups_handles_exception(self, mock_boto_client):
        """Test exception handling in log group analysis"""
        mock_logs = Mock()
        mock_logs.describe_log_groups.side_effect = Exception("API Error")
        mock_boto_client.return_value = mock_logs

        analyzer = InfrastructureAnalyzer('test')
        analyzer.logs_client = mock_logs

        result = analyzer.analyze_log_groups()

        self.assertEqual(len(result), 3)
        for lg in result:
            self.assertEqual(lg['status'], 'error')


class TestAnalyzeAlarms(unittest.TestCase):
    """Test analyze_alarms method"""

    @patch('analyse.boto3.client')
    def test_analyze_alarms_all_found(self, mock_boto_client):
        """Test when all alarms are found"""
        mock_cloudwatch = Mock()
        mock_cloudwatch.describe_alarms.return_value = {
            'MetricAlarms': [
                {
                    'AlarmName': 'payment-api-error-rate-test',
                    'StateValue': 'OK',
                    'MetricName': 'ErrorCount',
                    'Threshold': 1.0,
                    'AlarmActions': ['arn:aws:sns:us-east-1:123456789:topic']
                },
                {
                    'AlarmName': 'payment-api-response-time-test',
                    'StateValue': 'OK',
                    'AlarmActions': ['arn:aws:sns:us-east-1:123456789:topic']
                },
                {
                    'AlarmName': 'failed-transactions-test',
                    'StateValue': 'OK',
                    'AlarmActions': ['arn:aws:sns:us-east-1:123456789:topic']
                },
                {
                    'AlarmName': 'transaction-processor-errors-test',
                    'StateValue': 'OK',
                    'AlarmActions': ['arn:aws:sns:us-east-1:123456789:topic']
                },
                {
                    'AlarmName': 'fraud-detector-errors-test',
                    'StateValue': 'OK',
                    'AlarmActions': ['arn:aws:sns:us-east-1:123456789:topic']
                },
                {
                    'AlarmName': 'payment-high-load-test',
                    'StateValue': 'OK',
                    'AlarmActions': ['arn:aws:sns:us-east-1:123456789:topic']
                }
            ]
        }
        mock_boto_client.return_value = mock_cloudwatch

        analyzer = InfrastructureAnalyzer('test')
        analyzer.cloudwatch_client = mock_cloudwatch

        result = analyzer.analyze_alarms()

        self.assertEqual(len(result), 6)
        for alarm in result:
            self.assertEqual(alarm['status'], 'found')
            self.assertTrue(alarm['has_sns_action'])

    @patch('analyse.boto3.client')
    def test_analyze_alarms_detects_sns_action(self, mock_boto_client):
        """Test SNS action detection"""
        mock_cloudwatch = Mock()
        mock_cloudwatch.describe_alarms.return_value = {
            'MetricAlarms': [
                {
                    'AlarmName': 'payment-api-error-rate-test',
                    'StateValue': 'OK',
                    'AlarmActions': []  # No SNS action
                }
            ]
        }
        mock_boto_client.return_value = mock_cloudwatch

        analyzer = InfrastructureAnalyzer('test')
        analyzer.cloudwatch_client = mock_cloudwatch

        result = analyzer.analyze_alarms()

        error_rate_alarm = next(
            (a for a in result if 'error-rate' in a['name']),
            None
        )
        self.assertIsNotNone(error_rate_alarm)
        self.assertFalse(error_rate_alarm['has_sns_action'])

    @patch('analyse.boto3.client')
    def test_analyze_alarms_handles_exception(self, mock_boto_client):
        """Test exception handling in alarm analysis"""
        mock_cloudwatch = Mock()
        mock_cloudwatch.describe_alarms.side_effect = Exception("API Error")
        mock_boto_client.return_value = mock_cloudwatch

        analyzer = InfrastructureAnalyzer('test')
        analyzer.cloudwatch_client = mock_cloudwatch

        result = analyzer.analyze_alarms()

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['status'], 'error')


class TestAnalyzeCompositeAlarms(unittest.TestCase):
    """Test analyze_composite_alarms method"""

    @patch('analyse.boto3.client')
    def test_analyze_composite_alarms_found(self, mock_boto_client):
        """Test when composite alarm is found"""
        mock_cloudwatch = Mock()
        mock_cloudwatch.describe_alarms.return_value = {
            'CompositeAlarms': [
                {
                    'AlarmName': 'multi-service-failure-test',
                    'StateValue': 'OK',
                    'AlarmRule': 'ALARM(alarm1) OR ALARM(alarm2)',
                    'AlarmActions': ['arn:aws:sns:us-east-1:123456789:topic']
                }
            ]
        }
        mock_boto_client.return_value = mock_cloudwatch

        analyzer = InfrastructureAnalyzer('test')
        analyzer.cloudwatch_client = mock_cloudwatch

        result = analyzer.analyze_composite_alarms()

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['status'], 'found')
        self.assertTrue(result[0]['has_sns_action'])

    @patch('analyse.boto3.client')
    def test_analyze_composite_alarms_missing(self, mock_boto_client):
        """Test when composite alarm is missing"""
        mock_cloudwatch = Mock()
        mock_cloudwatch.describe_alarms.return_value = {'CompositeAlarms': []}
        mock_boto_client.return_value = mock_cloudwatch

        analyzer = InfrastructureAnalyzer('test')
        analyzer.cloudwatch_client = mock_cloudwatch

        result = analyzer.analyze_composite_alarms()

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['status'], 'missing')


class TestAnalyzeDashboards(unittest.TestCase):
    """Test analyze_dashboards method"""

    @patch('analyse.boto3.client')
    def test_analyze_dashboards_found_compliant(self, mock_boto_client):
        """Test when dashboard is found and compliant"""
        mock_cloudwatch = Mock()
        mock_cloudwatch.get_dashboard.return_value = {
            'DashboardBody': json.dumps({
                'widgets': [{'type': 'metric'}] * 9
            })
        }
        mock_boto_client.return_value = mock_cloudwatch

        analyzer = InfrastructureAnalyzer('test')
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
            'DashboardBody': json.dumps({
                'widgets': [{'type': 'metric'}] * 5
            })
        }
        mock_boto_client.return_value = mock_cloudwatch

        analyzer = InfrastructureAnalyzer('test')
        analyzer.cloudwatch_client = mock_cloudwatch

        result = analyzer.analyze_dashboards()

        self.assertEqual(result[0]['widget_count'], 5)
        self.assertFalse(result[0]['compliant'])


class TestAnalyzeMetricFilters(unittest.TestCase):
    """Test analyze_metric_filters method"""

    @patch('analyse.boto3.client')
    def test_analyze_metric_filters_found(self, mock_boto_client):
        """Test when metric filters are found"""
        mock_logs = Mock()
        mock_logs.describe_metric_filters.return_value = {
            'metricFilters': [
                {'filterName': 'error-filter'},
                {'filterName': 'latency-filter'}
            ]
        }
        mock_boto_client.return_value = mock_logs

        analyzer = InfrastructureAnalyzer('test')
        analyzer.logs_client = mock_logs

        result = analyzer.analyze_metric_filters()

        self.assertEqual(len(result), 3)
        for mf in result:
            self.assertEqual(mf['status'], 'found')
            self.assertEqual(mf['filter_count'], 2)

    @patch('analyse.boto3.client')
    def test_analyze_metric_filters_log_group_not_found(self, mock_boto_client):
        """Test when log group is not found"""
        mock_logs = Mock()
        mock_logs.exceptions = Mock()
        mock_logs.exceptions.ResourceNotFoundException = Exception
        mock_logs.describe_metric_filters.side_effect = \
            mock_logs.exceptions.ResourceNotFoundException("Not found")
        mock_boto_client.return_value = mock_logs

        analyzer = InfrastructureAnalyzer('test')
        analyzer.logs_client = mock_logs

        result = analyzer.analyze_metric_filters()

        for mf in result:
            self.assertEqual(mf['status'], 'log_group_not_found')


class TestGenerateRecommendations(unittest.TestCase):
    """Test recommendation generation"""

    @patch('analyse.boto3.client')
    def test_generates_recommendation_for_missing_log_group(self, mock_boto_client):
        """Test recommendation is generated for missing log group"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [{'name': '/aws/test', 'status': 'missing'}],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': [],
            'sns_topics': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        high_priority = [r for r in recommendations if r['priority'] == 'high']
        self.assertTrue(any('logging' in r['category'] for r in high_priority))

    @patch('analyse.boto3.client')
    def test_generates_recommendation_for_unencrypted_log_group(self, mock_boto_client):
        """Test recommendation is generated for unencrypted log group"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [{
                'name': '/aws/test',
                'status': 'found',
                'kms_encrypted': False,
                'retention_days': 7
            }],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': [],
            'sns_topics': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        security_recs = [r for r in recommendations if r['category'] == 'security']
        self.assertTrue(len(security_recs) > 0)

    @patch('analyse.boto3.client')
    def test_generates_recommendation_for_missing_alarms(self, mock_boto_client):
        """Test recommendation is generated for missing alarms"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [],
            'alarms': [{'name': 'test-alarm', 'status': 'missing'}],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': [],
            'sns_topics': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        monitoring_recs = [r for r in recommendations if r['category'] == 'monitoring']
        self.assertTrue(len(monitoring_recs) > 0)

    @patch('analyse.boto3.client')
    def test_generates_recommendation_for_missing_dashboard(self, mock_boto_client):
        """Test recommendation is generated for missing dashboard"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [{'name': 'test-dashboard', 'status': 'missing'}],
            'metric_filters': [],
            'sns_topics': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        visibility_recs = [r for r in recommendations if r['category'] == 'visibility']
        self.assertTrue(len(visibility_recs) > 0)


class TestCalculateComplianceScore(unittest.TestCase):
    """Test compliance score calculation"""

    @patch('analyse.boto3.client')
    def test_full_compliance_score(self, mock_boto_client):
        """Test 100% compliance score"""
        analyzer = InfrastructureAnalyzer('test')

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
            ],
            'sns_topics': [
                {'status': 'found', 'kms_encrypted': True, 'subscription_count': 2}
            ]
        }

        score = analyzer._calculate_compliance_score(analysis)
        self.assertEqual(score, 100.0)

    @patch('analyse.boto3.client')
    def test_zero_compliance_score(self, mock_boto_client):
        """Test 0% compliance score"""
        analyzer = InfrastructureAnalyzer('test')

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
            ],
            'sns_topics': [
                {'status': 'missing'}
            ]
        }

        score = analyzer._calculate_compliance_score(analysis)
        self.assertEqual(score, 0.0)

    @patch('analyse.boto3.client')
    def test_partial_compliance_score(self, mock_boto_client):
        """Test partial compliance score"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [
                {'status': 'found', 'kms_encrypted': True, 'retention_days': 14}
            ],
            'alarms': [
                {'status': 'found', 'has_sns_action': False}
            ],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': [],
            'sns_topics': []
        }

        score = analyzer._calculate_compliance_score(analysis)
        self.assertGreater(score, 0)
        self.assertLess(score, 100)

    @patch('analyse.boto3.client')
    def test_empty_analysis_returns_zero(self, mock_boto_client):
        """Test that empty analysis returns zero score"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': [],
            'sns_topics': []
        }

        score = analyzer._calculate_compliance_score(analysis)
        self.assertEqual(score, 0.0)


class TestAnalyzeInfrastructure(unittest.TestCase):
    """Test complete infrastructure analysis"""

    @patch('analyse.boto3.client')
    def test_analyze_infrastructure_returns_complete_structure(self, mock_boto_client):
        """Test that analyze_infrastructure returns complete structure"""
        mock_client = Mock()
        mock_client.describe_log_groups.return_value = {'logGroups': []}
        mock_client.describe_alarms.return_value = {
            'MetricAlarms': [],
            'CompositeAlarms': []
        }
        mock_client.get_dashboard.side_effect = Exception("Not found")
        mock_client.describe_metric_filters.return_value = {'metricFilters': []}
        mock_client.list_topics.return_value = {'Topics': []}
        mock_client.exceptions = Mock()
        mock_client.exceptions.DashboardNotFoundError = Exception
        mock_client.exceptions.ResourceNotFoundException = Exception
        mock_boto_client.return_value = mock_client

        analyzer = InfrastructureAnalyzer('test')

        result = analyzer.analyze_infrastructure()

        required_keys = [
            'environment_suffix',
            'region',
            'timestamp',
            'log_groups',
            'alarms',
            'composite_alarms',
            'dashboards',
            'metric_filters',
            'sns_topics',
            'recommendations',
            'compliance_score'
        ]

        for key in required_keys:
            self.assertIn(key, result)


class TestPrintReport(unittest.TestCase):
    """Test report printing"""

    @patch('analyse.boto3.client')
    def test_print_report_outputs_to_console(self, mock_boto_client):
        """Test that print_report outputs to console without errors"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'environment_suffix': 'test',
            'region': 'us-east-1',
            'timestamp': '2024-01-01T00:00:00Z',
            'compliance_score': 75.0,
            'log_groups': [
                {'name': '/aws/test', 'status': 'found', 'kms_encrypted': True,
                 'retention_days': 7}
            ],
            'alarms': [
                {'name': 'test-alarm', 'status': 'found', 'state': 'OK'}
            ],
            'composite_alarms': [
                {'name': 'test-composite', 'status': 'found'}
            ],
            'dashboards': [
                {'name': 'test-dashboard', 'status': 'found', 'widget_count': 9}
            ],
            'sns_topics': [
                {'name': 'test-topic', 'status': 'found', 'subscription_count': 2}
            ],
            'recommendations': [
                {'priority': 'high', 'message': 'Test recommendation'}
            ]
        }

        # Should not raise any exception
        try:
            analyzer.print_report(analysis)
        except Exception as e:
            self.fail(f"print_report raised an exception: {e}")


class TestExportJsonReport(unittest.TestCase):
    """Test JSON report export"""

    @patch('analyse.boto3.client')
    def test_export_json_report_writes_file(self, mock_boto_client):
        """Test that export_json_report writes valid JSON file"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'environment_suffix': 'test',
            'region': 'us-east-1',
            'compliance_score': 75.0
        }

        with tempfile.NamedTemporaryFile(mode='w', suffix='.json',
                                         delete=False) as f:
            temp_path = f.name

        try:
            analyzer.export_json_report(analysis, temp_path)

            with open(temp_path, 'r', encoding='utf-8') as f:
                exported = json.load(f)

            self.assertEqual(exported['environment_suffix'], 'test')
            self.assertEqual(exported['compliance_score'], 75.0)
        finally:
            os.unlink(temp_path)


class TestMainFunction(unittest.TestCase):
    """Test main function"""

    @patch.dict(os.environ, {
        'ENVIRONMENT_SUFFIX': 'test123',
        'AWS_REGION': 'us-east-1'
    })
    @patch('analyse.InfrastructureAnalyzer')
    def test_main_uses_environment_variables(self, mock_analyzer_class):
        """Test that main uses environment variables"""
        mock_instance = Mock()
        mock_instance.analyze_infrastructure.return_value = {'compliance_score': 85}
        mock_analyzer_class.return_value = mock_instance

        result = main()

        mock_analyzer_class.assert_called_once_with('test123', 'us-east-1')
        self.assertEqual(result, 0)

    @patch.dict(os.environ, {
        'ENVIRONMENT_SUFFIX': 'test',
        'AWS_REGION': 'us-east-1'
    })
    @patch('analyse.InfrastructureAnalyzer')
    def test_main_returns_0_for_compliant(self, mock_analyzer_class):
        """Test that main returns 0 for compliant infrastructure"""
        mock_instance = Mock()
        mock_instance.analyze_infrastructure.return_value = {'compliance_score': 85}
        mock_analyzer_class.return_value = mock_instance

        result = main()
        self.assertEqual(result, 0)

    @patch.dict(os.environ, {
        'ENVIRONMENT_SUFFIX': 'test',
        'AWS_REGION': 'us-east-1'
    })
    @patch('analyse.InfrastructureAnalyzer')
    def test_main_returns_1_for_warnings(self, mock_analyzer_class):
        """Test that main returns 1 for infrastructure with warnings"""
        mock_instance = Mock()
        mock_instance.analyze_infrastructure.return_value = {'compliance_score': 60}
        mock_analyzer_class.return_value = mock_instance

        result = main()
        self.assertEqual(result, 1)

    @patch.dict(os.environ, {
        'ENVIRONMENT_SUFFIX': 'test',
        'AWS_REGION': 'us-east-1'
    })
    @patch('analyse.InfrastructureAnalyzer')
    def test_main_returns_2_for_non_compliant(self, mock_analyzer_class):
        """Test that main returns 2 for non-compliant infrastructure"""
        mock_instance = Mock()
        mock_instance.analyze_infrastructure.return_value = {'compliance_score': 30}
        mock_analyzer_class.return_value = mock_instance

        result = main()
        self.assertEqual(result, 2)

    @patch.dict(os.environ, {
        'ENVIRONMENT_SUFFIX': 'test',
        'AWS_REGION': 'us-east-1',
        'OUTPUT_FILE': '/tmp/test-output.json'
    })
    @patch('analyse.InfrastructureAnalyzer')
    def test_main_exports_report_when_output_file_specified(self, mock_analyzer_class):
        """Test that main exports report when OUTPUT_FILE is specified"""
        mock_instance = Mock()
        mock_instance.analyze_infrastructure.return_value = {'compliance_score': 85}
        mock_analyzer_class.return_value = mock_instance

        result = main()

        mock_instance.export_json_report.assert_called_once()
        self.assertEqual(result, 0)


class TestEdgeCases(unittest.TestCase):
    """Test edge cases and boundary conditions"""

    @patch('analyse.boto3.client')
    def test_handles_empty_environment_suffix(self, mock_boto_client):
        """Test handling of empty environment suffix"""
        analyzer = InfrastructureAnalyzer('')
        self.assertEqual(analyzer.environment_suffix, '')

    @patch('analyse.boto3.client')
    def test_handles_special_characters_in_suffix(self, mock_boto_client):
        """Test handling of special characters in environment suffix"""
        analyzer = InfrastructureAnalyzer('test-123_abc')
        self.assertEqual(analyzer.environment_suffix, 'test-123_abc')

    @patch('analyse.boto3.client')
    def test_recommendations_empty_when_all_compliant(self, mock_boto_client):
        """Test that recommendations are empty when all resources are compliant"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [{
                'name': '/aws/test',
                'status': 'found',
                'kms_encrypted': True,
                'retention_days': 7
            }],
            'alarms': [{
                'name': 'test-alarm',
                'status': 'found',
                'has_sns_action': True
            }],
            'composite_alarms': [{'name': 'test-composite', 'status': 'found'}],
            'dashboards': [{
                'name': 'test-dashboard',
                'status': 'found',
                'compliant': True
            }],
            'metric_filters': [{
                'log_group': '/aws/test',
                'status': 'found',
                'filter_count': 2
            }],
            'sns_topics': [{
                'name': 'test-topic',
                'status': 'found',
                'kms_encrypted': True,
                'subscription_count': 1
            }]
        }

        recommendations = analyzer._generate_recommendations(analysis)
        self.assertEqual(len(recommendations), 0)


class TestAnalyzeSnsTopics(unittest.TestCase):
    """Test analyze_sns_topics method"""

    @patch('analyse.boto3.client')
    def test_analyze_sns_topics_found(self, mock_boto_client):
        """Test when SNS topic is found"""
        mock_sns = Mock()
        mock_sns.list_topics.return_value = {
            'Topics': [
                {'TopicArn': 'arn:aws:sns:us-east-1:123456789:payment-alerts-test'}
            ]
        }
        mock_sns.get_topic_attributes.return_value = {
            'Attributes': {
                'KmsMasterKeyId': 'arn:aws:kms:us-east-1:123456789:key/abc'
            }
        }
        mock_sns.list_subscriptions_by_topic.return_value = {
            'Subscriptions': [
                {'Protocol': 'email', 'Endpoint': 'test@example.com'}
            ]
        }
        mock_boto_client.return_value = mock_sns

        analyzer = InfrastructureAnalyzer('test')
        analyzer.sns_client = mock_sns

        result = analyzer.analyze_sns_topics()

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['status'], 'found')
        self.assertTrue(result[0]['kms_encrypted'])
        self.assertEqual(result[0]['subscription_count'], 1)

    @patch('analyse.boto3.client')
    def test_analyze_sns_topics_missing(self, mock_boto_client):
        """Test when SNS topic is missing"""
        mock_sns = Mock()
        mock_sns.list_topics.return_value = {'Topics': []}
        mock_boto_client.return_value = mock_sns

        analyzer = InfrastructureAnalyzer('test')
        analyzer.sns_client = mock_sns

        result = analyzer.analyze_sns_topics()

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['status'], 'missing')

    @patch('analyse.boto3.client')
    def test_analyze_sns_topics_error(self, mock_boto_client):
        """Test SNS topic analysis error handling"""
        mock_sns = Mock()
        mock_sns.list_topics.side_effect = Exception("API Error")
        mock_boto_client.return_value = mock_sns

        analyzer = InfrastructureAnalyzer('test')
        analyzer.sns_client = mock_sns

        result = analyzer.analyze_sns_topics()

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['status'], 'error')


class TestAnalyzeCompositeAlarmsExtended(unittest.TestCase):
    """Extended tests for composite alarm analysis"""

    @patch('analyse.boto3.client')
    def test_analyze_composite_alarms_error(self, mock_boto_client):
        """Test composite alarm analysis error handling"""
        mock_cloudwatch = Mock()
        mock_cloudwatch.describe_alarms.side_effect = Exception("API Error")
        mock_boto_client.return_value = mock_cloudwatch

        analyzer = InfrastructureAnalyzer('test')
        analyzer.cloudwatch_client = mock_cloudwatch

        result = analyzer.analyze_composite_alarms()

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['status'], 'error')


class TestAnalyzeDashboardsExtended(unittest.TestCase):
    """Extended tests for dashboard analysis"""

    @patch('analyse.boto3.client')
    def test_analyze_dashboards_not_found(self, mock_boto_client):
        """Test when dashboard is not found via DashboardNotFoundError"""
        mock_cloudwatch = Mock()
        mock_cloudwatch.exceptions = Mock()
        mock_cloudwatch.exceptions.DashboardNotFoundError = Exception
        mock_cloudwatch.get_dashboard.side_effect = \
            mock_cloudwatch.exceptions.DashboardNotFoundError("Not found")
        mock_boto_client.return_value = mock_cloudwatch

        analyzer = InfrastructureAnalyzer('test')
        analyzer.cloudwatch_client = mock_cloudwatch

        result = analyzer.analyze_dashboards()

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['status'], 'missing')

    @patch('analyse.boto3.client')
    def test_analyze_dashboards_error(self, mock_boto_client):
        """Test dashboard analysis error handling"""
        mock_cloudwatch = Mock()
        mock_cloudwatch.exceptions = Mock()
        mock_cloudwatch.exceptions.DashboardNotFoundError = type('DashboardNotFoundError', (Exception,), {})
        mock_cloudwatch.get_dashboard.side_effect = Exception("API Error")
        mock_boto_client.return_value = mock_cloudwatch

        analyzer = InfrastructureAnalyzer('test')
        analyzer.cloudwatch_client = mock_cloudwatch

        result = analyzer.analyze_dashboards()

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['status'], 'error')


class TestAnalyzeMetricFiltersExtended(unittest.TestCase):
    """Extended tests for metric filter analysis"""

    @patch('analyse.boto3.client')
    def test_analyze_metric_filters_error(self, mock_boto_client):
        """Test metric filter analysis error handling"""
        mock_logs = Mock()
        mock_logs.exceptions = Mock()
        mock_logs.exceptions.ResourceNotFoundException = type('ResourceNotFoundException', (Exception,), {})
        mock_logs.describe_metric_filters.side_effect = Exception("API Error")
        mock_boto_client.return_value = mock_logs

        analyzer = InfrastructureAnalyzer('test')
        analyzer.logs_client = mock_logs

        result = analyzer.analyze_metric_filters()

        for mf in result:
            self.assertEqual(mf['status'], 'error')


class TestGenerateRecommendationsExtended(unittest.TestCase):
    """Extended tests for recommendation generation"""

    @patch('analyse.boto3.client')
    def test_generates_recommendation_for_missing_composite_alarm(self, mock_boto_client):
        """Test recommendation is generated for missing composite alarm"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [{'name': 'test-composite', 'status': 'missing'}],
            'dashboards': [],
            'metric_filters': [],
            'sns_topics': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        monitoring_recs = [r for r in recommendations if r['category'] == 'monitoring']
        self.assertTrue(len(monitoring_recs) > 0)

    @patch('analyse.boto3.client')
    def test_generates_recommendation_for_alarm_without_sns(self, mock_boto_client):
        """Test recommendation is generated for alarm without SNS action"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [],
            'alarms': [{'name': 'test-alarm', 'status': 'found', 'has_sns_action': False}],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': [],
            'sns_topics': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        alerting_recs = [r for r in recommendations if r['category'] == 'alerting']
        self.assertTrue(len(alerting_recs) > 0)

    @patch('analyse.boto3.client')
    def test_generates_recommendation_for_non_compliant_dashboard(self, mock_boto_client):
        """Test recommendation is generated for non-compliant dashboard"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [{'name': 'test-dashboard', 'status': 'found', 'compliant': False, 'widget_count': 5}],
            'metric_filters': [],
            'sns_topics': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        compliance_recs = [r for r in recommendations if r['category'] == 'compliance']
        self.assertTrue(len(compliance_recs) > 0)

    @patch('analyse.boto3.client')
    def test_generates_recommendation_for_missing_metric_filters(self, mock_boto_client):
        """Test recommendation is generated for missing metric filters"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': [{'log_group': '/aws/test', 'status': 'log_group_not_found', 'filter_count': 0}],
            'sns_topics': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        logging_recs = [r for r in recommendations if r['category'] == 'logging']
        self.assertTrue(len(logging_recs) > 0)

    @patch('analyse.boto3.client')
    def test_generates_recommendation_for_zero_metric_filters(self, mock_boto_client):
        """Test recommendation is generated when metric filter count is zero"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': [{'log_group': '/aws/test', 'status': 'found', 'filter_count': 0}],
            'sns_topics': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        monitoring_recs = [r for r in recommendations if r['category'] == 'monitoring']
        self.assertTrue(len(monitoring_recs) > 0)

    @patch('analyse.boto3.client')
    def test_generates_recommendation_for_missing_sns_topic(self, mock_boto_client):
        """Test recommendation is generated for missing SNS topic"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': [],
            'sns_topics': [{'name': 'test-topic', 'status': 'missing'}]
        }

        recommendations = analyzer._generate_recommendations(analysis)

        alerting_recs = [r for r in recommendations if r['category'] == 'alerting']
        self.assertTrue(len(alerting_recs) > 0)

    @patch('analyse.boto3.client')
    def test_generates_recommendation_for_unencrypted_sns(self, mock_boto_client):
        """Test recommendation is generated for unencrypted SNS topic"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': [],
            'sns_topics': [{'name': 'test-topic', 'status': 'found', 'kms_encrypted': False, 'subscription_count': 1}]
        }

        recommendations = analyzer._generate_recommendations(analysis)

        security_recs = [r for r in recommendations if r['category'] == 'security']
        self.assertTrue(len(security_recs) > 0)

    @patch('analyse.boto3.client')
    def test_generates_recommendation_for_sns_without_subscriptions(self, mock_boto_client):
        """Test recommendation is generated for SNS topic without subscriptions"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': [],
            'sns_topics': [{'name': 'test-topic', 'status': 'found', 'kms_encrypted': True, 'subscription_count': 0}]
        }

        recommendations = analyzer._generate_recommendations(analysis)

        alerting_recs = [r for r in recommendations if r['category'] == 'alerting']
        self.assertTrue(len(alerting_recs) > 0)

    @patch('analyse.boto3.client')
    def test_generates_recommendation_for_wrong_retention(self, mock_boto_client):
        """Test recommendation is generated for wrong log group retention"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [{
                'name': '/aws/test',
                'status': 'found',
                'kms_encrypted': True,
                'retention_days': 14
            }],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': [],
            'sns_topics': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        compliance_recs = [r for r in recommendations if r['category'] == 'compliance']
        self.assertTrue(len(compliance_recs) > 0)


class TestPrintReportExtended(unittest.TestCase):
    """Extended tests for report printing"""

    @patch('analyse.boto3.client')
    def test_print_report_with_missing_resources(self, mock_boto_client):
        """Test print_report with missing resources"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'environment_suffix': 'test',
            'region': 'us-east-1',
            'timestamp': '2024-01-01T00:00:00Z',
            'compliance_score': 25.0,
            'log_groups': [
                {'name': '/aws/test', 'status': 'missing'}
            ],
            'alarms': [
                {'name': 'test-alarm', 'status': 'missing'}
            ],
            'composite_alarms': [
                {'name': 'test-composite', 'status': 'missing'}
            ],
            'dashboards': [
                {'name': 'test-dashboard', 'status': 'missing'}
            ],
            'sns_topics': [
                {'name': 'test-topic', 'status': 'missing'}
            ],
            'recommendations': []
        }

        try:
            analyzer.print_report(analysis)
        except Exception as e:
            self.fail(f"print_report raised an exception: {e}")

    @patch('analyse.boto3.client')
    def test_print_report_with_no_recommendations(self, mock_boto_client):
        """Test print_report with empty recommendations"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'environment_suffix': 'test',
            'region': 'us-east-1',
            'timestamp': '2024-01-01T00:00:00Z',
            'compliance_score': 100.0,
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'sns_topics': [],
            'recommendations': []
        }

        try:
            analyzer.print_report(analysis)
        except Exception as e:
            self.fail(f"print_report raised an exception: {e}")


class TestComplianceScoreExtended(unittest.TestCase):
    """Extended tests for compliance score calculation"""

    @patch('analyse.boto3.client')
    def test_compliance_score_with_all_resource_types(self, mock_boto_client):
        """Test compliance score with all resource types present"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [
                {'status': 'found', 'kms_encrypted': True, 'retention_days': 7},
                {'status': 'found', 'kms_encrypted': False, 'retention_days': 30},
                {'status': 'missing'}
            ],
            'alarms': [
                {'status': 'found', 'has_sns_action': True},
                {'status': 'found', 'has_sns_action': False},
                {'status': 'missing'}
            ],
            'composite_alarms': [
                {'status': 'found', 'has_sns_action': True}
            ],
            'dashboards': [
                {'status': 'found', 'compliant': True}
            ],
            'metric_filters': [
                {'filter_count': 2},
                {'filter_count': 0}
            ],
            'sns_topics': [
                {'status': 'found', 'kms_encrypted': True, 'subscription_count': 1}
            ]
        }

        score = analyzer._calculate_compliance_score(analysis)
        self.assertGreater(score, 0)
        self.assertLess(score, 100)


if __name__ == '__main__':
    unittest.main()
