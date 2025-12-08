#!/usr/bin/env python3
"""
Analysis tests for the Infrastructure Analysis Script (analyse.py)
These tests run against mocked AWS services for CI/CD pipeline validation
"""

import unittest
import os
import sys
import json
import tempfile
from unittest.mock import patch, Mock

# Add lib directory to path for importing
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))

from analyse import InfrastructureAnalyzer, main


class TestLogGroupAnalysis(unittest.TestCase):
    """Tests for CloudWatch Log Group analysis"""

    @patch('analyse.boto3.client')
    def test_analyze_log_groups_returns_three_groups(self, mock_boto_client):
        """Test that analyze_log_groups returns exactly 3 log groups"""
        mock_logs = Mock()
        mock_logs.describe_log_groups.return_value = {'logGroups': []}
        mock_boto_client.return_value = mock_logs

        analyzer = InfrastructureAnalyzer('test')
        analyzer.logs_client = mock_logs

        result = analyzer.analyze_log_groups()
        self.assertEqual(len(result), 3)

    @patch('analyse.boto3.client')
    def test_analyze_log_groups_payment_api_name_format(self, mock_boto_client):
        """Test that payment-api log group name format is correct"""
        analyzer = InfrastructureAnalyzer('test-suffix')
        result = analyzer.analyze_log_groups()

        payment_api = next(
            (lg for lg in result if 'payment-api' in lg['name']),
            None
        )
        self.assertIsNotNone(payment_api)
        self.assertIn('test-suffix', payment_api['name'])

    @patch('analyse.boto3.client')
    def test_analyze_log_groups_transaction_processor_name(self, mock_boto_client):
        """Test transaction-processor log group name format"""
        analyzer = InfrastructureAnalyzer('test-suffix')
        result = analyzer.analyze_log_groups()

        tx_processor = next(
            (lg for lg in result if 'transaction-processor' in lg['name']),
            None
        )
        self.assertIsNotNone(tx_processor)

    @patch('analyse.boto3.client')
    def test_analyze_log_groups_fraud_detector_name(self, mock_boto_client):
        """Test fraud-detector log group name format"""
        analyzer = InfrastructureAnalyzer('test-suffix')
        result = analyzer.analyze_log_groups()

        fraud_detector = next(
            (lg for lg in result if 'fraud-detector' in lg['name']),
            None
        )
        self.assertIsNotNone(fraud_detector)


class TestAlarmAnalysis(unittest.TestCase):
    """Tests for CloudWatch Alarm analysis"""

    @patch('analyse.boto3.client')
    def test_analyze_alarms_returns_six_alarms(self, mock_boto_client):
        """Test that analyze_alarms returns exactly 6 alarms"""
        mock_cloudwatch = Mock()
        mock_cloudwatch.describe_alarms.return_value = {'MetricAlarms': []}
        mock_boto_client.return_value = mock_cloudwatch

        analyzer = InfrastructureAnalyzer('test')
        analyzer.cloudwatch_client = mock_cloudwatch

        result = analyzer.analyze_alarms()
        self.assertEqual(len(result), 6)

    @patch('analyse.boto3.client')
    def test_analyze_alarms_api_error_rate_name_format(self, mock_boto_client):
        """Test api-error-rate alarm name format"""
        analyzer = InfrastructureAnalyzer('test-suffix')
        result = analyzer.analyze_alarms()

        api_error_alarm = next(
            (a for a in result if 'api-error-rate' in a['name']),
            None
        )
        self.assertIsNotNone(api_error_alarm)
        self.assertIn('test-suffix', api_error_alarm['name'])

    @patch('analyse.boto3.client')
    def test_analyze_alarms_response_time_name(self, mock_boto_client):
        """Test response-time alarm name format"""
        analyzer = InfrastructureAnalyzer('test-suffix')
        result = analyzer.analyze_alarms()

        response_time = next(
            (a for a in result if 'response-time' in a['name']),
            None
        )
        self.assertIsNotNone(response_time)


class TestCompositeAlarmAnalysis(unittest.TestCase):
    """Tests for Composite Alarm analysis"""

    @patch('analyse.boto3.client')
    def test_analyze_composite_alarms_returns_one(self, mock_boto_client):
        """Test that analyze_composite_alarms returns exactly 1 alarm"""
        mock_cloudwatch = Mock()
        mock_cloudwatch.describe_alarms.return_value = {'CompositeAlarms': []}
        mock_boto_client.return_value = mock_cloudwatch

        analyzer = InfrastructureAnalyzer('test')
        analyzer.cloudwatch_client = mock_cloudwatch

        result = analyzer.analyze_composite_alarms()
        self.assertEqual(len(result), 1)

    @patch('analyse.boto3.client')
    def test_analyze_composite_alarms_name_format(self, mock_boto_client):
        """Test composite alarm name format"""
        mock_cloudwatch = Mock()
        mock_cloudwatch.describe_alarms.return_value = {'CompositeAlarms': []}
        mock_boto_client.return_value = mock_cloudwatch

        analyzer = InfrastructureAnalyzer('test-suffix')
        analyzer.cloudwatch_client = mock_cloudwatch

        result = analyzer.analyze_composite_alarms()

        self.assertIn('multi-service-failure', result[0]['name'])
        self.assertIn('test-suffix', result[0]['name'])


class TestDashboardAnalysis(unittest.TestCase):
    """Tests for CloudWatch Dashboard analysis"""

    @patch('analyse.boto3.client')
    def test_analyze_dashboards_returns_one(self, mock_boto_client):
        """Test that analyze_dashboards returns exactly 1 dashboard"""
        mock_cloudwatch = Mock()
        # Create proper exception class for DashboardNotFoundError
        mock_cloudwatch.exceptions = Mock()
        mock_cloudwatch.exceptions.DashboardNotFoundError = type(
            'DashboardNotFoundError', (Exception,), {}
        )
        mock_cloudwatch.get_dashboard.side_effect = \
            mock_cloudwatch.exceptions.DashboardNotFoundError("Not found")
        mock_boto_client.return_value = mock_cloudwatch

        analyzer = InfrastructureAnalyzer('test')
        analyzer.cloudwatch_client = mock_cloudwatch

        result = analyzer.analyze_dashboards()
        self.assertEqual(len(result), 1)

    @patch('analyse.boto3.client')
    def test_analyze_dashboards_name_format(self, mock_boto_client):
        """Test dashboard name format"""
        mock_cloudwatch = Mock()
        # Create proper exception class for DashboardNotFoundError
        mock_cloudwatch.exceptions = Mock()
        mock_cloudwatch.exceptions.DashboardNotFoundError = type(
            'DashboardNotFoundError', (Exception,), {}
        )
        mock_cloudwatch.get_dashboard.side_effect = \
            mock_cloudwatch.exceptions.DashboardNotFoundError("Not found")
        mock_boto_client.return_value = mock_cloudwatch

        analyzer = InfrastructureAnalyzer('test-suffix')
        analyzer.cloudwatch_client = mock_cloudwatch

        result = analyzer.analyze_dashboards()

        self.assertIn('payment-monitoring', result[0]['name'])
        self.assertIn('test-suffix', result[0]['name'])


class TestMetricFilterAnalysis(unittest.TestCase):
    """Tests for Metric Filter analysis"""

    @patch('analyse.boto3.client')
    def test_analyze_metric_filters_returns_three(self, mock_boto_client):
        """Test that analyze_metric_filters returns exactly 3 entries"""
        mock_logs = Mock()
        mock_logs.describe_metric_filters.return_value = {'metricFilters': []}
        mock_logs.exceptions = Mock()
        mock_logs.exceptions.ResourceNotFoundException = Exception
        mock_boto_client.return_value = mock_logs

        analyzer = InfrastructureAnalyzer('test')
        analyzer.logs_client = mock_logs

        result = analyzer.analyze_metric_filters()
        self.assertEqual(len(result), 3)


class TestInfrastructureAnalysis(unittest.TestCase):
    """Tests for complete infrastructure analysis"""

    @patch('analyse.boto3.client')
    def test_analyze_infrastructure_returns_all_keys(self, mock_boto_client):
        """Test that analyze_infrastructure returns all required keys"""
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

    @patch('analyse.boto3.client')
    def test_compliance_score_is_valid_percentage(self, mock_boto_client):
        """Test that compliance score is a valid percentage"""
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

        score = result['compliance_score']
        self.assertIsInstance(score, float)
        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 100)


class TestRecommendations(unittest.TestCase):
    """Tests for recommendation generation"""

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
        logging_recs = [r for r in recommendations
                        if r['priority'] == 'high' and r['category'] == 'logging']
        self.assertTrue(len(logging_recs) > 0)

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
        security_recs = [r for r in recommendations
                         if r['priority'] == 'medium' and r['category'] == 'security']
        self.assertTrue(len(security_recs) > 0)

    @patch('analyse.boto3.client')
    def test_generates_recommendation_for_wrong_retention(self, mock_boto_client):
        """Test recommendation is generated for wrong log retention"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [{
                'name': '/aws/test',
                'status': 'found',
                'kms_encrypted': True,
                'retention_days': 30
            }],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': [],
            'sns_topics': []
        }

        recommendations = analyzer._generate_recommendations(analysis)
        compliance_recs = [r for r in recommendations
                           if r['priority'] == 'low' and r['category'] == 'compliance']
        self.assertTrue(len(compliance_recs) > 0)

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
        monitoring_recs = [r for r in recommendations
                           if r['priority'] == 'high' and r['category'] == 'monitoring']
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
        visibility_recs = [r for r in recommendations
                           if r['priority'] == 'medium' and r['category'] == 'visibility']
        self.assertTrue(len(visibility_recs) > 0)

    @patch('analyse.boto3.client')
    def test_generates_recommendation_for_non_compliant_dashboard(self, mock_boto_client):
        """Test recommendation is generated for non-compliant dashboard"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [{
                'name': 'test-dashboard',
                'status': 'found',
                'compliant': False,
                'widget_count': 5
            }],
            'metric_filters': [],
            'sns_topics': []
        }

        recommendations = analyzer._generate_recommendations(analysis)
        compliance_recs = [r for r in recommendations
                           if r['priority'] == 'low' and r['category'] == 'compliance']
        self.assertTrue(len(compliance_recs) > 0)

    @patch('analyse.boto3.client')
    def test_no_recommendations_when_compliant(self, mock_boto_client):
        """Test no recommendations when all resources are compliant"""
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


class TestComplianceScore(unittest.TestCase):
    """Tests for compliance score calculation"""

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


class TestReportGeneration(unittest.TestCase):
    """Tests for report generation"""

    @patch('analyse.boto3.client')
    def test_print_report_no_exception(self, mock_boto_client):
        """Test that print_report does not raise exceptions"""
        analyzer = InfrastructureAnalyzer('test')

        analysis = {
            'environment_suffix': 'test',
            'region': 'us-east-1',
            'timestamp': '2024-01-01T00:00:00Z',
            'compliance_score': 75.0,
            'log_groups': [{
                'name': '/aws/test',
                'status': 'found',
                'kms_encrypted': True,
                'retention_days': 7
            }],
            'alarms': [{'name': 'test-alarm', 'status': 'found', 'state': 'OK'}],
            'composite_alarms': [{'name': 'test-composite', 'status': 'found'}],
            'dashboards': [{
                'name': 'test-dashboard',
                'status': 'found',
                'widget_count': 9
            }],
            'sns_topics': [{
                'name': 'test-topic',
                'status': 'found',
                'subscription_count': 2
            }],
            'recommendations': [{'priority': 'high', 'message': 'Test recommendation'}]
        }

        try:
            analyzer.print_report(analysis)
        except Exception as e:
            self.fail(f"print_report raised an exception: {e}")

    @patch('analyse.boto3.client')
    def test_export_json_report_creates_valid_file(self, mock_boto_client):
        """Test that export_json_report creates valid JSON file"""
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
    """Tests for main function"""

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


if __name__ == '__main__':
    unittest.main()
