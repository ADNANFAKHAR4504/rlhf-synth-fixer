#!/usr/bin/env python3
"""
Analysis tests for the Infrastructure Analysis Script (analyse.py)
These tests run against mocked AWS services (Moto) to validate the analysis functionality
"""

import unittest
import json
import os
import sys
import boto3
from unittest.mock import patch, Mock

# Add lib directory to path for importing
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))

from analyse import InfrastructureAnalyzer, main


class TestInfrastructureAnalyzerWithMoto(unittest.TestCase):
    """Analysis tests for InfrastructureAnalyzer using mocked AWS services"""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures"""
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'test')
        cls.region = os.getenv('AWS_REGION', 'us-east-1')

    def test_analyzer_initialization(self):
        """Test that analyzer can be initialized with valid parameters"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        self.assertEqual(analyzer.environment_suffix, self.environment_suffix)
        self.assertEqual(analyzer.region, self.region)

    def test_analyze_log_groups_returns_valid_structure(self):
        """Test that analyze_log_groups returns valid structure"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_log_groups()

        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 3)

        for lg in result:
            self.assertIn('name', lg)
            self.assertIn('status', lg)
            self.assertIn(lg['status'], ['found', 'missing', 'error'])

    def test_analyze_log_groups_payment_api_name_format(self):
        """Test that payment-api log group name format is correct"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_log_groups()

        payment_api_lg = next(
            (lg for lg in result if 'payment-api' in lg['name']),
            None
        )
        self.assertIsNotNone(payment_api_lg)
        self.assertIn(self.environment_suffix, payment_api_lg['name'])

    def test_analyze_log_groups_transaction_processor_name_format(self):
        """Test that transaction-processor log group name format is correct"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_log_groups()

        tx_processor_lg = next(
            (lg for lg in result if 'transaction-processor' in lg['name']),
            None
        )
        self.assertIsNotNone(tx_processor_lg)
        self.assertIn(self.environment_suffix, tx_processor_lg['name'])

    def test_analyze_log_groups_fraud_detector_name_format(self):
        """Test that fraud-detector log group name format is correct"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_log_groups()

        fraud_detector_lg = next(
            (lg for lg in result if 'fraud-detector' in lg['name']),
            None
        )
        self.assertIsNotNone(fraud_detector_lg)
        self.assertIn(self.environment_suffix, fraud_detector_lg['name'])

    def test_analyze_alarms_returns_valid_structure(self):
        """Test that analyze_alarms returns valid structure"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_alarms()

        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 6)

        for alarm in result:
            self.assertIn('name', alarm)
            self.assertIn('status', alarm)

    def test_analyze_alarms_api_error_rate_name_format(self):
        """Test api-error-rate alarm name format"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_alarms()

        api_error_alarm = next(
            (a for a in result if 'api-error-rate' in a['name']),
            None
        )
        self.assertIsNotNone(api_error_alarm)
        self.assertIn(self.environment_suffix, api_error_alarm['name'])

    def test_analyze_alarms_response_time_name_format(self):
        """Test response-time alarm name format"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_alarms()

        response_time_alarm = next(
            (a for a in result if 'response-time' in a['name']),
            None
        )
        self.assertIsNotNone(response_time_alarm)
        self.assertIn(self.environment_suffix, response_time_alarm['name'])

    def test_analyze_alarms_failed_transactions_name_format(self):
        """Test failed-transactions alarm name format"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_alarms()

        failed_tx_alarm = next(
            (a for a in result if 'failed-transactions' in a['name']),
            None
        )
        self.assertIsNotNone(failed_tx_alarm)
        self.assertIn(self.environment_suffix, failed_tx_alarm['name'])

    def test_analyze_composite_alarms_returns_valid_structure(self):
        """Test that analyze_composite_alarms returns valid structure"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_composite_alarms()

        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 1)

        composite = result[0]
        self.assertIn('name', composite)
        self.assertIn('status', composite)
        self.assertIn('multi-service-failure', composite['name'])

    def test_analyze_composite_alarms_name_format(self):
        """Test composite alarm name format includes environment suffix"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_composite_alarms()

        self.assertIn(self.environment_suffix, result[0]['name'])

    def test_analyze_dashboards_returns_valid_structure(self):
        """Test that analyze_dashboards returns valid structure"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_dashboards()

        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 1)

        dashboard = result[0]
        self.assertIn('name', dashboard)
        self.assertIn('status', dashboard)
        self.assertIn('payment-monitoring', dashboard['name'])

    def test_analyze_dashboards_name_format(self):
        """Test dashboard name format includes environment suffix"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_dashboards()

        self.assertIn(self.environment_suffix, result[0]['name'])

    def test_analyze_metric_filters_returns_valid_structure(self):
        """Test that analyze_metric_filters returns valid structure"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_metric_filters()

        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 3)

        for mf in result:
            self.assertIn('log_group', mf)
            self.assertIn('status', mf)

    def test_analyze_metric_filters_log_group_names(self):
        """Test that metric filter log group names are correct"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_metric_filters()

        log_group_names = [mf['log_group'] for mf in result]

        self.assertTrue(any('payment-api' in name for name in log_group_names))
        self.assertTrue(any('transaction-processor' in name for name in log_group_names))
        self.assertTrue(any('fraud-detector' in name for name in log_group_names))

    def test_analyze_infrastructure_returns_complete_structure(self):
        """Test complete infrastructure analysis returns all required keys"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
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
            'recommendations',
            'compliance_score'
        ]

        for key in required_keys:
            self.assertIn(key, result)

        self.assertEqual(result['environment_suffix'], self.environment_suffix)
        self.assertEqual(result['region'], self.region)

    def test_compliance_score_is_valid_percentage(self):
        """Test that compliance score is a valid percentage"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_infrastructure()

        score = result['compliance_score']
        self.assertIsInstance(score, float)
        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 100)

    def test_recommendations_have_valid_structure(self):
        """Test that recommendations have valid structure"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_infrastructure()

        for rec in result['recommendations']:
            self.assertIn('priority', rec)
            self.assertIn('category', rec)
            self.assertIn('message', rec)
            self.assertIn(rec['priority'], ['high', 'medium', 'low'])

    def test_all_log_groups_use_consistent_naming(self):
        """Test that all log groups use consistent naming with environment suffix"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_log_groups()

        for lg in result:
            self.assertIn(self.environment_suffix, lg['name'])

    def test_all_alarms_use_consistent_naming(self):
        """Test that all alarms use consistent naming with environment suffix"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_alarms()

        for alarm in result:
            self.assertIn(self.environment_suffix, alarm['name'])


class TestRecommendationGeneration(unittest.TestCase):
    """Tests for recommendation generation logic"""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures"""
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'test')
        cls.region = os.getenv('AWS_REGION', 'us-east-1')

    def test_generates_recommendation_for_missing_log_group(self):
        """Test recommendation is generated for missing log group"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        analysis = {
            'log_groups': [{'name': '/aws/test', 'status': 'missing'}],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        self.assertTrue(any(r['priority'] == 'high' and r['category'] == 'logging' for r in recommendations))

    def test_generates_recommendation_for_unencrypted_log_group(self):
        """Test recommendation is generated for unencrypted log group"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        analysis = {
            'log_groups': [{'name': '/aws/test', 'status': 'found', 'kms_encrypted': False, 'retention_days': 7}],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        self.assertTrue(any(r['priority'] == 'medium' and r['category'] == 'security' for r in recommendations))

    def test_generates_recommendation_for_wrong_retention(self):
        """Test recommendation is generated for wrong log retention"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        analysis = {
            'log_groups': [{'name': '/aws/test', 'status': 'found', 'kms_encrypted': True, 'retention_days': 14}],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        self.assertTrue(any(r['priority'] == 'low' and r['category'] == 'compliance' for r in recommendations))

    def test_generates_recommendation_for_missing_alarms(self):
        """Test recommendation is generated for missing alarms"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        analysis = {
            'log_groups': [],
            'alarms': [{'name': 'test-alarm', 'status': 'missing'}],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        self.assertTrue(any(r['priority'] == 'high' and r['category'] == 'monitoring' for r in recommendations))

    def test_generates_recommendation_for_alarm_without_sns(self):
        """Test recommendation is generated for alarm without SNS action"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        analysis = {
            'log_groups': [],
            'alarms': [{'name': 'test-alarm', 'status': 'found', 'has_sns_action': False}],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        self.assertTrue(any(r['priority'] == 'medium' and r['category'] == 'alerting' for r in recommendations))

    def test_generates_recommendation_for_missing_composite_alarm(self):
        """Test recommendation is generated for missing composite alarm"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        analysis = {
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [{'name': 'test-composite', 'status': 'missing'}],
            'dashboards': [],
            'metric_filters': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        self.assertTrue(any(r['priority'] == 'high' and r['category'] == 'monitoring' for r in recommendations))

    def test_generates_recommendation_for_missing_dashboard(self):
        """Test recommendation is generated for missing dashboard"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        analysis = {
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [{'name': 'test-dashboard', 'status': 'missing'}],
            'metric_filters': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        self.assertTrue(any(r['priority'] == 'medium' and r['category'] == 'visibility' for r in recommendations))

    def test_generates_recommendation_for_non_compliant_dashboard(self):
        """Test recommendation is generated for non-compliant dashboard"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        analysis = {
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [{'name': 'test-dashboard', 'status': 'found', 'compliant': False, 'widget_count': 5}],
            'metric_filters': []
        }

        recommendations = analyzer._generate_recommendations(analysis)

        self.assertTrue(any(r['priority'] == 'low' and r['category'] == 'compliance' for r in recommendations))

    def test_generates_recommendation_for_missing_metric_filters(self):
        """Test recommendation is generated for log group without metric filters"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        analysis = {
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': [{'log_group': '/aws/test', 'status': 'found', 'filter_count': 0}]
        }

        recommendations = analyzer._generate_recommendations(analysis)

        self.assertTrue(any(r['priority'] == 'medium' and r['category'] == 'monitoring' for r in recommendations))

    def test_no_recommendations_when_all_compliant(self):
        """Test that no recommendations are generated when all resources are compliant"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        analysis = {
            'log_groups': [{'name': '/aws/test', 'status': 'found', 'kms_encrypted': True, 'retention_days': 7}],
            'alarms': [{'name': 'test-alarm', 'status': 'found', 'has_sns_action': True}],
            'composite_alarms': [{'name': 'test-composite', 'status': 'found'}],
            'dashboards': [{'name': 'test-dashboard', 'status': 'found', 'compliant': True}],
            'metric_filters': [{'log_group': '/aws/test', 'status': 'found', 'filter_count': 2}]
        }

        recommendations = analyzer._generate_recommendations(analysis)
        self.assertEqual(len(recommendations), 0)


class TestComplianceScoring(unittest.TestCase):
    """Tests for compliance score calculation"""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures"""
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'test')
        cls.region = os.getenv('AWS_REGION', 'us-east-1')

    def test_full_compliance_score(self):
        """Test compliance score when all resources are compliant"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
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

    def test_zero_compliance_score(self):
        """Test compliance score when nothing is compliant"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
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

    def test_partial_compliance_score(self):
        """Test partial compliance score"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        analysis = {
            'log_groups': [
                {'status': 'found', 'kms_encrypted': True, 'retention_days': 14}
            ],
            'alarms': [
                {'status': 'found', 'has_sns_action': False}
            ],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': []
        }

        score = analyzer._calculate_compliance_score(analysis)
        self.assertGreater(score, 0)
        self.assertLess(score, 100)

    def test_empty_analysis_returns_zero(self):
        """Test that empty analysis returns zero score"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        analysis = {
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': []
        }

        score = analyzer._calculate_compliance_score(analysis)
        self.assertEqual(score, 0.0)


class TestReportGeneration(unittest.TestCase):
    """Tests for report generation"""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures"""
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'test')
        cls.region = os.getenv('AWS_REGION', 'us-east-1')

    def test_print_report_does_not_raise_exception(self):
        """Test that print_report executes without raising exceptions"""
        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        analysis = {
            'environment_suffix': self.environment_suffix,
            'region': self.region,
            'timestamp': '2024-01-01T00:00:00+00:00',
            'compliance_score': 75.0,
            'log_groups': [{'name': '/aws/test', 'status': 'found', 'kms_encrypted': True, 'retention_days': 7}],
            'alarms': [{'name': 'test-alarm', 'status': 'found', 'state': 'OK'}],
            'composite_alarms': [{'name': 'test-composite', 'status': 'found'}],
            'dashboards': [{'name': 'test-dashboard', 'status': 'found', 'widget_count': 9}],
            'recommendations': [{'priority': 'high', 'message': 'Test recommendation'}]
        }

        try:
            analyzer.print_report(analysis)
        except Exception as e:
            self.fail(f"print_report raised an exception: {e}")

    def test_export_json_report_creates_valid_json(self):
        """Test that export_json_report creates valid JSON file"""
        import tempfile

        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        analysis = {
            'environment_suffix': self.environment_suffix,
            'region': self.region,
            'timestamp': '2024-01-01T00:00:00+00:00',
            'compliance_score': 75.0,
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': [],
            'recommendations': []
        }

        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            temp_path = f.name

        try:
            analyzer.export_json_report(analysis, temp_path)

            with open(temp_path, 'r') as f:
                exported = json.load(f)

            self.assertEqual(exported['environment_suffix'], self.environment_suffix)
            self.assertIn('compliance_score', exported)
        finally:
            os.unlink(temp_path)


class TestMainFunction(unittest.TestCase):
    """Tests for main function"""

    def test_main_uses_environment_variables(self):
        """Test that main function uses environment variables"""
        with patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': 'test123', 'AWS_REGION': 'us-east-1'}):
            with patch('analyse.InfrastructureAnalyzer') as mock_analyzer_class:
                mock_instance = Mock()
                mock_instance.analyze_infrastructure.return_value = {'compliance_score': 85}
                mock_analyzer_class.return_value = mock_instance

                result = main()

                mock_analyzer_class.assert_called_once_with('test123', 'us-east-1')
                self.assertEqual(result, 0)

    def test_main_returns_0_for_compliant(self):
        """Test that main returns 0 for compliant infrastructure"""
        with patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': 'test', 'AWS_REGION': 'us-east-1'}):
            with patch('analyse.InfrastructureAnalyzer') as mock_analyzer_class:
                mock_instance = Mock()
                mock_instance.analyze_infrastructure.return_value = {'compliance_score': 85}
                mock_analyzer_class.return_value = mock_instance

                result = main()
                self.assertEqual(result, 0)

    def test_main_returns_1_for_warnings(self):
        """Test that main returns 1 for infrastructure with warnings"""
        with patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': 'test', 'AWS_REGION': 'us-east-1'}):
            with patch('analyse.InfrastructureAnalyzer') as mock_analyzer_class:
                mock_instance = Mock()
                mock_instance.analyze_infrastructure.return_value = {'compliance_score': 60}
                mock_analyzer_class.return_value = mock_instance

                result = main()
                self.assertEqual(result, 1)

    def test_main_returns_2_for_non_compliant(self):
        """Test that main returns 2 for non-compliant infrastructure"""
        with patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': 'test', 'AWS_REGION': 'us-east-1'}):
            with patch('analyse.InfrastructureAnalyzer') as mock_analyzer_class:
                mock_instance = Mock()
                mock_instance.analyze_infrastructure.return_value = {'compliance_score': 30}
                mock_analyzer_class.return_value = mock_instance

                result = main()
                self.assertEqual(result, 2)


if __name__ == '__main__':
    unittest.main()
