#!/usr/bin/env python3
"""
Integration tests for the Infrastructure Analysis Script (analyse.py)
Tests the InfrastructureAnalyzer against actual AWS resources
These tests require actual AWS credentials and deployed infrastructure
"""

import unittest
import json
import os
import sys
from pathlib import Path

# Add lib directory to path for importing
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import InfrastructureAnalyzer

# Load deployment outputs
OUTPUTS_FILE = Path(__file__).parent.parent.parent / 'cfn-outputs' / 'flat-outputs.json'


class TestInfrastructureAnalyzerIntegration(unittest.TestCase):
    """Integration tests for InfrastructureAnalyzer"""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures"""
        cls.outputs = {}
        if OUTPUTS_FILE.exists():
            with open(OUTPUTS_FILE, 'r') as f:
                cls.outputs = json.load(f)

        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', '')
        if not cls.environment_suffix and cls.outputs:
            # Try to extract suffix from outputs
            sns_topic = cls.outputs.get('sns_topic_arn', '')
            if sns_topic:
                cls.environment_suffix = sns_topic.split('-')[-1]

        cls.region = os.getenv('AWS_REGION', 'us-east-1')

    def test_analyzer_initialization(self):
        """Test that analyzer can be initialized with valid parameters"""
        if not self.environment_suffix:
            self.skipTest("No environment suffix available")

        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        self.assertEqual(analyzer.environment_suffix, self.environment_suffix)
        self.assertEqual(analyzer.region, self.region)

    def test_analyze_log_groups_returns_valid_structure(self):
        """Test that analyze_log_groups returns valid structure"""
        if not self.environment_suffix:
            self.skipTest("No environment suffix available")

        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_log_groups()

        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 3)

        for lg in result:
            self.assertIn('name', lg)
            self.assertIn('status', lg)
            self.assertIn(lg['status'], ['found', 'missing', 'error'])

    def test_analyze_log_groups_payment_api(self):
        """Test that payment-api log group analysis is correct"""
        if not self.environment_suffix:
            self.skipTest("No environment suffix available")

        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_log_groups()

        payment_api_lg = next(
            (lg for lg in result if 'payment-api' in lg['name']),
            None
        )
        self.assertIsNotNone(payment_api_lg)

        if payment_api_lg['status'] == 'found':
            self.assertEqual(payment_api_lg['retention_days'], 7)
            self.assertTrue(payment_api_lg['kms_encrypted'])

    def test_analyze_log_groups_transaction_processor(self):
        """Test that transaction-processor log group analysis is correct"""
        if not self.environment_suffix:
            self.skipTest("No environment suffix available")

        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_log_groups()

        tx_processor_lg = next(
            (lg for lg in result if 'transaction-processor' in lg['name']),
            None
        )
        self.assertIsNotNone(tx_processor_lg)

        if tx_processor_lg['status'] == 'found':
            self.assertEqual(tx_processor_lg['retention_days'], 7)

    def test_analyze_log_groups_fraud_detector(self):
        """Test that fraud-detector log group analysis is correct"""
        if not self.environment_suffix:
            self.skipTest("No environment suffix available")

        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_log_groups()

        fraud_detector_lg = next(
            (lg for lg in result if 'fraud-detector' in lg['name']),
            None
        )
        self.assertIsNotNone(fraud_detector_lg)

    def test_analyze_alarms_returns_valid_structure(self):
        """Test that analyze_alarms returns valid structure"""
        if not self.environment_suffix:
            self.skipTest("No environment suffix available")

        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_alarms()

        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 6)

        for alarm in result:
            self.assertIn('name', alarm)
            self.assertIn('status', alarm)

    def test_analyze_alarms_api_error_rate(self):
        """Test api-error-rate alarm analysis"""
        if not self.environment_suffix:
            self.skipTest("No environment suffix available")

        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_alarms()

        api_error_alarm = next(
            (a for a in result if 'api-error-rate' in a['name']),
            None
        )
        self.assertIsNotNone(api_error_alarm)

        if api_error_alarm['status'] == 'found':
            self.assertTrue(api_error_alarm['has_sns_action'])

    def test_analyze_alarms_response_time(self):
        """Test response-time alarm analysis"""
        if not self.environment_suffix:
            self.skipTest("No environment suffix available")

        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_alarms()

        response_time_alarm = next(
            (a for a in result if 'response-time' in a['name']),
            None
        )
        self.assertIsNotNone(response_time_alarm)

    def test_analyze_composite_alarms_returns_valid_structure(self):
        """Test that analyze_composite_alarms returns valid structure"""
        if not self.environment_suffix:
            self.skipTest("No environment suffix available")

        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_composite_alarms()

        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 1)

        composite = result[0]
        self.assertIn('name', composite)
        self.assertIn('status', composite)
        self.assertIn('multi-service-failure', composite['name'])

    def test_analyze_composite_alarms_has_sns_action(self):
        """Test that composite alarm has SNS action configured"""
        if not self.environment_suffix:
            self.skipTest("No environment suffix available")

        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_composite_alarms()

        if result[0]['status'] == 'found':
            self.assertTrue(result[0]['has_sns_action'])

    def test_analyze_dashboards_returns_valid_structure(self):
        """Test that analyze_dashboards returns valid structure"""
        if not self.environment_suffix:
            self.skipTest("No environment suffix available")

        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_dashboards()

        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 1)

        dashboard = result[0]
        self.assertIn('name', dashboard)
        self.assertIn('status', dashboard)
        self.assertIn('payment-monitoring', dashboard['name'])

    def test_analyze_dashboards_widget_count(self):
        """Test that dashboard has correct widget count"""
        if not self.environment_suffix:
            self.skipTest("No environment suffix available")

        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_dashboards()

        if result[0]['status'] == 'found':
            self.assertGreaterEqual(result[0]['widget_count'], 9)
            self.assertTrue(result[0]['compliant'])

    def test_analyze_metric_filters_returns_valid_structure(self):
        """Test that analyze_metric_filters returns valid structure"""
        if not self.environment_suffix:
            self.skipTest("No environment suffix available")

        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_metric_filters()

        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 3)

        for mf in result:
            self.assertIn('log_group', mf)
            self.assertIn('status', mf)

    def test_analyze_metric_filters_payment_api_has_filters(self):
        """Test that payment-api log group has metric filters"""
        if not self.environment_suffix:
            self.skipTest("No environment suffix available")

        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_metric_filters()

        payment_api_mf = next(
            (mf for mf in result if 'payment-api' in mf['log_group']),
            None
        )
        self.assertIsNotNone(payment_api_mf)

        if payment_api_mf['status'] == 'found':
            self.assertGreater(payment_api_mf['filter_count'], 0)

    def test_analyze_infrastructure_complete(self):
        """Test complete infrastructure analysis"""
        if not self.environment_suffix:
            self.skipTest("No environment suffix available")

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

    def test_compliance_score_is_valid(self):
        """Test that compliance score is a valid percentage"""
        if not self.environment_suffix:
            self.skipTest("No environment suffix available")

        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_infrastructure()

        score = result['compliance_score']
        self.assertIsInstance(score, float)
        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 100)

    def test_recommendations_are_valid(self):
        """Test that recommendations have valid structure"""
        if not self.environment_suffix:
            self.skipTest("No environment suffix available")

        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_infrastructure()

        for rec in result['recommendations']:
            self.assertIn('priority', rec)
            self.assertIn('category', rec)
            self.assertIn('message', rec)
            self.assertIn(rec['priority'], ['high', 'medium', 'low'])

    def test_all_log_groups_use_consistent_naming(self):
        """Test that all log groups use consistent naming with environment suffix"""
        if not self.environment_suffix:
            self.skipTest("No environment suffix available")

        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_log_groups()

        for lg in result:
            self.assertIn(self.environment_suffix, lg['name'])

    def test_all_alarms_use_consistent_naming(self):
        """Test that all alarms use consistent naming with environment suffix"""
        if not self.environment_suffix:
            self.skipTest("No environment suffix available")

        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_alarms()

        for alarm in result:
            self.assertIn(self.environment_suffix, alarm['name'])


class TestComplianceScoring(unittest.TestCase):
    """Integration tests for compliance scoring"""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures"""
        cls.outputs = {}
        if OUTPUTS_FILE.exists():
            with open(OUTPUTS_FILE, 'r') as f:
                cls.outputs = json.load(f)

        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', '')
        if not cls.environment_suffix and cls.outputs:
            sns_topic = cls.outputs.get('sns_topic_arn', '')
            if sns_topic:
                cls.environment_suffix = sns_topic.split('-')[-1]

        cls.region = os.getenv('AWS_REGION', 'us-east-1')

    def test_high_compliance_score_when_all_resources_exist(self):
        """Test that compliance score is high when all resources are properly configured"""
        if not self.environment_suffix:
            self.skipTest("No environment suffix available")

        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_infrastructure()

        # If all resources are found and properly configured, score should be >= 80
        all_found = True
        for lg in result['log_groups']:
            if lg['status'] != 'found':
                all_found = False
                break

        if all_found:
            self.assertGreaterEqual(result['compliance_score'], 80)


class TestReportGeneration(unittest.TestCase):
    """Integration tests for report generation"""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures"""
        cls.outputs = {}
        if OUTPUTS_FILE.exists():
            with open(OUTPUTS_FILE, 'r') as f:
                cls.outputs = json.load(f)

        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', '')
        if not cls.environment_suffix and cls.outputs:
            sns_topic = cls.outputs.get('sns_topic_arn', '')
            if sns_topic:
                cls.environment_suffix = sns_topic.split('-')[-1]

        cls.region = os.getenv('AWS_REGION', 'us-east-1')

    def test_print_report_does_not_raise_exception(self):
        """Test that print_report executes without raising exceptions"""
        if not self.environment_suffix:
            self.skipTest("No environment suffix available")

        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_infrastructure()

        # Should not raise any exception
        try:
            analyzer.print_report(result)
        except Exception as e:
            self.fail(f"print_report raised an exception: {e}")

    def test_export_json_report_creates_valid_json(self):
        """Test that export_json_report creates valid JSON file"""
        if not self.environment_suffix:
            self.skipTest("No environment suffix available")

        import tempfile

        analyzer = InfrastructureAnalyzer(self.environment_suffix, self.region)
        result = analyzer.analyze_infrastructure()

        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            temp_path = f.name

        try:
            analyzer.export_json_report(result, temp_path)

            with open(temp_path, 'r') as f:
                exported = json.load(f)

            self.assertEqual(exported['environment_suffix'], self.environment_suffix)
            self.assertIn('compliance_score', exported)
        finally:
            os.unlink(temp_path)


if __name__ == '__main__':
    unittest.main()
