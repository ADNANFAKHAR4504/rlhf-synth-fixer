#!/usr/bin/env python3
"""
Analysis tests for Currency Exchange API Infrastructure Analysis Script
This file is required by scripts/analysis.sh which looks for tests/test-analysis-*.py
"""

import unittest
import os
import sys
from unittest.mock import patch, Mock

# Add lib directory to path for importing
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))

from analyse import CurrencyAPIAnalyzer, main


class TestAnalysisScript(unittest.TestCase):
    """Basic tests for analysis script functionality"""

    @patch('analyse.boto3.client')
    def test_analyzer_initializes_successfully(self, mock_boto_client):
        """Test that analyzer initializes without errors"""
        mock_boto_client.return_value = Mock()
        analyzer = CurrencyAPIAnalyzer('test-env')
        self.assertIsNotNone(analyzer)
        self.assertEqual(analyzer.environment_suffix, 'test-env')

    @patch('analyse.boto3.client')
    def test_analyzer_creates_required_clients(self, mock_boto_client):
        """Test that analyzer creates all required AWS clients"""
        mock_boto_client.return_value = Mock()
        analyzer = CurrencyAPIAnalyzer('test')
        # Should create lambda, apigateway, logs, iam, xray, cloudwatch clients
        self.assertEqual(mock_boto_client.call_count, 6)

    @patch('analyse.boto3.client')
    def test_analyze_lambda_returns_list(self, mock_boto_client):
        """Test that Lambda analysis returns a list"""
        mock_client = Mock()
        mock_client.list_functions.return_value = {'Functions': []}
        mock_boto_client.return_value = mock_client

        analyzer = CurrencyAPIAnalyzer('test')
        result = analyzer.analyze_lambda_functions()

        self.assertIsInstance(result, list)

    @patch('analyse.boto3.client')
    def test_analyze_api_gateway_returns_list(self, mock_boto_client):
        """Test that API Gateway analysis returns a list"""
        mock_client = Mock()
        mock_client.get_rest_apis.return_value = {'items': []}
        mock_boto_client.return_value = mock_client

        analyzer = CurrencyAPIAnalyzer('test')
        result = analyzer.analyze_api_gateway()

        self.assertIsInstance(result, list)

    @patch('analyse.boto3.client')
    def test_analyze_cloudwatch_logs_returns_list(self, mock_boto_client):
        """Test that CloudWatch logs analysis returns a list"""
        mock_client = Mock()
        mock_client.describe_log_groups.return_value = {'logGroups': []}
        mock_boto_client.return_value = mock_client

        analyzer = CurrencyAPIAnalyzer('test')
        result = analyzer.analyze_cloudwatch_logs()

        self.assertIsInstance(result, list)

    @patch('analyse.boto3.client')
    def test_analyze_iam_roles_returns_list(self, mock_boto_client):
        """Test that IAM roles analysis returns a list"""
        mock_client = Mock()
        mock_client.exceptions = Mock()
        mock_client.exceptions.NoSuchEntityException = Exception
        mock_client.get_role.side_effect = Exception("Role not found")
        mock_boto_client.return_value = mock_client

        analyzer = CurrencyAPIAnalyzer('test')
        result = analyzer.analyze_iam_roles()

        self.assertIsInstance(result, list)

    @patch('analyse.boto3.client')
    def test_analyze_xray_tracing_returns_dict(self, mock_boto_client):
        """Test that X-Ray tracing analysis returns a dict"""
        mock_client = Mock()
        mock_client.get_trace_summaries.return_value = {'TraceSummaries': []}
        mock_boto_client.return_value = mock_client

        analyzer = CurrencyAPIAnalyzer('test')
        result = analyzer.analyze_xray_tracing()

        self.assertIsInstance(result, dict)

    @patch('analyse.boto3.client')
    def test_analyze_api_throttling_returns_dict(self, mock_boto_client):
        """Test that API throttling analysis returns a dict"""
        mock_client = Mock()
        mock_client.get_usage_plans.return_value = {'items': []}
        mock_boto_client.return_value = mock_client

        analyzer = CurrencyAPIAnalyzer('test')
        result = analyzer.analyze_api_throttling()

        self.assertIsInstance(result, dict)

    @patch('analyse.boto3.client')
    def test_generate_recommendations_returns_list(self, mock_boto_client):
        """Test that recommendation generation returns a list"""
        mock_boto_client.return_value = Mock()
        analyzer = CurrencyAPIAnalyzer('test')

        analysis = {
            'lambda_functions': [],
            'api_gateways': [],
            'cloudwatch_logs': [],
            'iam_roles': [],
            'xray_tracing': {},
            'api_throttling': {}
        }

        recommendations = analyzer._generate_recommendations(analysis)
        self.assertIsInstance(recommendations, list)

    @patch('analyse.boto3.client')
    def test_calculate_compliance_score_returns_float(self, mock_boto_client):
        """Test that compliance score calculation returns a float"""
        mock_boto_client.return_value = Mock()
        analyzer = CurrencyAPIAnalyzer('test')

        analysis = {
            'lambda_functions': [],
            'api_gateways': [],
            'cloudwatch_logs': [],
            'iam_roles': [],
            'xray_tracing': {},
            'api_throttling': {}
        }

        score = analyzer._calculate_compliance_score(analysis)
        self.assertIsInstance(score, float)
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 100.0)

    @patch('analyse.boto3.client')
    def test_analyze_infrastructure_returns_complete_result(self, mock_boto_client):
        """Test that full infrastructure analysis returns complete result"""
        mock_client = Mock()
        mock_client.list_functions.return_value = {'Functions': []}
        mock_client.get_rest_apis.return_value = {'items': []}
        mock_client.describe_log_groups.return_value = {'logGroups': []}
        mock_client.get_role.side_effect = Exception("Not found")
        mock_client.get_trace_summaries.return_value = {'TraceSummaries': []}
        mock_client.get_usage_plans.return_value = {'items': []}
        mock_client.exceptions = Mock()
        mock_client.exceptions.NoSuchEntityException = Exception
        mock_boto_client.return_value = mock_client

        analyzer = CurrencyAPIAnalyzer('test')
        result = analyzer.analyze_infrastructure()

        # Verify all expected keys are present
        self.assertIn('environment_suffix', result)
        self.assertIn('region', result)
        self.assertIn('timestamp', result)
        self.assertIn('lambda_functions', result)
        self.assertIn('api_gateways', result)
        self.assertIn('cloudwatch_logs', result)
        self.assertIn('iam_roles', result)
        self.assertIn('xray_tracing', result)
        self.assertIn('api_throttling', result)
        self.assertIn('recommendations', result)
        self.assertIn('compliance_score', result)

    @patch('analyse.CurrencyAPIAnalyzer')
    @patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': 'test', 'AWS_REGION': 'us-east-1'})
    def test_main_function_returns_zero_on_success(self, mock_analyzer_class):
        """Test that main function returns 0 on success"""
        mock_analyzer = Mock()
        mock_analyzer.analyze_infrastructure.return_value = {
            'compliance_score': 85.0,
            'recommendations': []
        }
        mock_analyzer_class.return_value = mock_analyzer

        result = main()
        self.assertEqual(result, 0)


if __name__ == '__main__':
    unittest.main()
