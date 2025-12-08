#!/usr/bin/env python3
"""
Unit tests for the Currency Exchange API Infrastructure Analysis Script
Tests the CurrencyAPIAnalyzer class with mocked AWS services
"""

import unittest
import os
import sys
import json
import tempfile
from unittest.mock import patch, Mock, MagicMock
from datetime import datetime, timezone

# Add lib directory to path for importing
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import CurrencyAPIAnalyzer, main


class TestCurrencyAPIAnalyzerInit(unittest.TestCase):
    """Test CurrencyAPIAnalyzer initialization"""

    @patch('analyse.boto3.client')
    def test_init_default_region(self, mock_boto_client):
        """Test initialization with default region"""
        analyzer = CurrencyAPIAnalyzer('test-suffix')
        self.assertEqual(analyzer.environment_suffix, 'test-suffix')
        self.assertEqual(analyzer.region, 'us-east-1')

    @patch('analyse.boto3.client')
    def test_init_custom_region(self, mock_boto_client):
        """Test initialization with custom region"""
        analyzer = CurrencyAPIAnalyzer('test-suffix', 'eu-west-1')
        self.assertEqual(analyzer.region, 'eu-west-1')

    @patch('analyse.boto3.client')
    def test_init_creates_aws_clients(self, mock_boto_client):
        """Test that AWS clients are created during initialization"""
        analyzer = CurrencyAPIAnalyzer('test-suffix')
        # Should create 6 clients: lambda, apigateway, logs, iam, xray, cloudwatch
        self.assertEqual(mock_boto_client.call_count, 6)

    @patch('analyse.boto3.client')
    def test_init_environment_suffix_stored(self, mock_boto_client):
        """Test environment suffix is stored correctly"""
        analyzer = CurrencyAPIAnalyzer('prod-abc123')
        self.assertEqual(analyzer.environment_suffix, 'prod-abc123')


class TestAnalyzeLambdaFunctions(unittest.TestCase):
    """Test analyze_lambda_functions method"""

    @patch('analyse.boto3.client')
    def test_analyze_lambda_function_found(self, mock_boto_client):
        """Test when Lambda function is found"""
        mock_lambda = Mock()
        mock_lambda.list_functions.return_value = {
            'Functions': [
                {'FunctionName': 'currency-converter-test-abc123'}
            ]
        }
        mock_lambda.get_function.return_value = {
            'Configuration': {
                'FunctionName': 'currency-converter-test-abc123',
                'Runtime': 'nodejs18.x',
                'MemorySize': 1024,
                'Timeout': 10,
                'Handler': 'index.handler',
                'Role': 'arn:aws:iam::123456789:role/lambda-role',
                'TracingConfig': {'Mode': 'Active'},
                'Environment': {
                    'Variables': {
                        'API_VERSION': '1.0.0',
                        'RATE_PRECISION': '4'
                    }
                },
                'LastModified': '2024-01-01T00:00:00Z',
                'CodeSize': 1024
            }
        }
        mock_boto_client.return_value = mock_lambda

        analyzer = CurrencyAPIAnalyzer('test')
        analyzer.lambda_client = mock_lambda

        result = analyzer.analyze_lambda_functions()

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['status'], 'found')
        self.assertEqual(result[0]['runtime'], 'nodejs18.x')
        self.assertTrue(result[0]['xray_enabled'])

    @patch('analyse.boto3.client')
    def test_analyze_lambda_function_missing(self, mock_boto_client):
        """Test when Lambda function is not found"""
        mock_lambda = Mock()
        mock_lambda.list_functions.return_value = {'Functions': []}
        mock_boto_client.return_value = mock_lambda

        analyzer = CurrencyAPIAnalyzer('test')
        analyzer.lambda_client = mock_lambda

        result = analyzer.analyze_lambda_functions()

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['status'], 'missing')

    @patch('analyse.boto3.client')
    def test_analyze_lambda_compliance_check(self, mock_boto_client):
        """Test Lambda compliance checking"""
        mock_lambda = Mock()
        mock_lambda.list_functions.return_value = {
            'Functions': [
                {'FunctionName': 'currency-converter-test-abc'}
            ]
        }
        mock_lambda.get_function.return_value = {
            'Configuration': {
                'FunctionName': 'currency-converter-test-abc',
                'Runtime': 'nodejs18.x',
                'MemorySize': 1024,
                'Timeout': 10,
                'TracingConfig': {'Mode': 'Active'},
                'Environment': {
                    'Variables': {
                        'API_VERSION': '1.0',
                        'RATE_PRECISION': '4'
                    }
                }
            }
        }
        mock_boto_client.return_value = mock_lambda

        analyzer = CurrencyAPIAnalyzer('test')
        analyzer.lambda_client = mock_lambda

        result = analyzer.analyze_lambda_functions()

        compliance = result[0]['compliant']
        self.assertTrue(compliance['runtime_nodejs18'])
        self.assertTrue(compliance['memory_1gb'])
        self.assertTrue(compliance['timeout_10s'])
        self.assertTrue(compliance['xray_active'])

    @patch('analyse.boto3.client')
    def test_analyze_lambda_handles_exception(self, mock_boto_client):
        """Test exception handling in Lambda analysis"""
        mock_lambda = Mock()
        mock_lambda.list_functions.side_effect = Exception("API Error")
        mock_boto_client.return_value = mock_lambda

        analyzer = CurrencyAPIAnalyzer('test')
        analyzer.lambda_client = mock_lambda

        result = analyzer.analyze_lambda_functions()

        self.assertEqual(result[0]['status'], 'error')
        self.assertIn('API Error', result[0]['error'])


class TestAnalyzeAPIGateway(unittest.TestCase):
    """Test analyze_api_gateway method"""

    @patch('analyse.boto3.client')
    def test_analyze_api_gateway_found(self, mock_boto_client):
        """Test when API Gateway is found"""
        mock_apigw = Mock()
        mock_apigw.get_rest_apis.return_value = {
            'items': [
                {
                    'id': 'api123',
                    'name': 'currency-exchange-api-test',
                    'endpointConfiguration': {'types': ['EDGE']}
                }
            ]
        }
        mock_apigw.get_resources.return_value = {
            'items': [
                {'id': 'root', 'path': '/'},
                {'id': 'convert', 'path': '/convert', 'pathPart': 'convert'}
            ]
        }
        mock_apigw.get_stages.return_value = {
            'item': [
                {
                    'stageName': 'v1',
                    'tracingEnabled': True,
                    'variables': {'lambdaAlias': 'production'}
                }
            ]
        }
        mock_apigw.get_api_keys.return_value = {
            'items': [
                {'name': 'currency-api-key-test', 'enabled': True}
            ]
        }
        mock_apigw.get_usage_plans.return_value = {
            'items': [
                {
                    'name': 'currency-api-usage-plan-test',
                    'throttle': {'rateLimit': 100, 'burstLimit': 200}
                }
            ]
        }
        mock_boto_client.return_value = mock_apigw

        analyzer = CurrencyAPIAnalyzer('test')
        analyzer.apigateway_client = mock_apigw

        result = analyzer.analyze_api_gateway()

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['status'], 'found')
        self.assertTrue(result[0]['has_convert_endpoint'])
        self.assertTrue(result[0]['has_v1_stage'])
        self.assertTrue(result[0]['xray_enabled'])

    @patch('analyse.boto3.client')
    def test_analyze_api_gateway_missing(self, mock_boto_client):
        """Test when API Gateway is not found"""
        mock_apigw = Mock()
        mock_apigw.get_rest_apis.return_value = {'items': []}
        mock_boto_client.return_value = mock_apigw

        analyzer = CurrencyAPIAnalyzer('test')
        analyzer.apigateway_client = mock_apigw

        result = analyzer.analyze_api_gateway()

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['status'], 'missing')

    @patch('analyse.boto3.client')
    def test_analyze_api_gateway_compliance_edge_optimized(self, mock_boto_client):
        """Test API Gateway edge optimization check"""
        mock_apigw = Mock()
        mock_apigw.get_rest_apis.return_value = {
            'items': [
                {
                    'id': 'api123',
                    'name': 'currency-exchange-api-test',
                    'endpointConfiguration': {'types': ['EDGE']}
                }
            ]
        }
        mock_apigw.get_resources.return_value = {
            'items': [{'pathPart': 'convert'}]
        }
        mock_apigw.get_stages.return_value = {
            'item': [{'stageName': 'v1', 'tracingEnabled': True}]
        }
        mock_apigw.get_api_keys.return_value = {'items': [{'name': 'key-test'}]}
        mock_apigw.get_usage_plans.return_value = {'items': [{'name': 'plan-test'}]}
        mock_boto_client.return_value = mock_apigw

        analyzer = CurrencyAPIAnalyzer('test')
        analyzer.apigateway_client = mock_apigw

        result = analyzer.analyze_api_gateway()

        compliance = result[0]['compliant']
        self.assertTrue(compliance['is_edge_optimized'])

    @patch('analyse.boto3.client')
    def test_analyze_api_gateway_handles_exception(self, mock_boto_client):
        """Test exception handling in API Gateway analysis"""
        mock_apigw = Mock()
        mock_apigw.get_rest_apis.side_effect = Exception("API Error")
        mock_boto_client.return_value = mock_apigw

        analyzer = CurrencyAPIAnalyzer('test')
        analyzer.apigateway_client = mock_apigw

        result = analyzer.analyze_api_gateway()

        self.assertEqual(result[0]['status'], 'error')


class TestAnalyzeCloudWatchLogs(unittest.TestCase):
    """Test analyze_cloudwatch_logs method"""

    @patch('analyse.boto3.client')
    def test_analyze_log_groups_found(self, mock_boto_client):
        """Test when log groups are found"""
        mock_logs = Mock()
        mock_logs.describe_log_groups.return_value = {
            'logGroups': [
                {
                    'logGroupName': '/aws/lambda/currency-converter-test-abc',
                    'retentionInDays': 14,
                    'storedBytes': 1024
                }
            ]
        }
        mock_boto_client.return_value = mock_logs

        analyzer = CurrencyAPIAnalyzer('test')
        analyzer.logs_client = mock_logs

        result = analyzer.analyze_cloudwatch_logs()

        found_groups = [lg for lg in result if lg.get('status') == 'found']
        self.assertGreater(len(found_groups), 0)

    @patch('analyse.boto3.client')
    def test_analyze_log_groups_missing(self, mock_boto_client):
        """Test when log groups are missing"""
        mock_logs = Mock()
        mock_logs.describe_log_groups.return_value = {'logGroups': []}
        mock_boto_client.return_value = mock_logs

        analyzer = CurrencyAPIAnalyzer('test')
        analyzer.logs_client = mock_logs

        result = analyzer.analyze_cloudwatch_logs()

        # Should report 2 missing (Lambda and API Gateway log groups)
        self.assertEqual(len(result), 2)
        for lg in result:
            self.assertEqual(lg['status'], 'missing')

    @patch('analyse.boto3.client')
    def test_analyze_log_groups_retention_detected(self, mock_boto_client):
        """Test log group retention detection"""
        mock_logs = Mock()
        mock_logs.describe_log_groups.return_value = {
            'logGroups': [
                {
                    'logGroupName': '/aws/lambda/currency-converter-test',
                    'retentionInDays': 30
                }
            ]
        }
        mock_boto_client.return_value = mock_logs

        analyzer = CurrencyAPIAnalyzer('test')
        analyzer.logs_client = mock_logs

        result = analyzer.analyze_cloudwatch_logs()

        found = next((lg for lg in result if lg.get('status') == 'found'), None)
        if found:
            self.assertEqual(found['retention_days'], 30)

    @patch('analyse.boto3.client')
    def test_analyze_log_groups_handles_exception(self, mock_boto_client):
        """Test exception handling in log group analysis"""
        mock_logs = Mock()
        mock_logs.describe_log_groups.side_effect = Exception("API Error")
        mock_boto_client.return_value = mock_logs

        analyzer = CurrencyAPIAnalyzer('test')
        analyzer.logs_client = mock_logs

        result = analyzer.analyze_cloudwatch_logs()

        error_results = [lg for lg in result if lg.get('status') == 'error']
        self.assertGreater(len(error_results), 0)


class TestAnalyzeIAMRoles(unittest.TestCase):
    """Test analyze_iam_roles method"""

    @patch('analyse.boto3.client')
    def test_analyze_iam_role_found(self, mock_boto_client):
        """Test when IAM role is found"""
        mock_iam = Mock()
        mock_iam.get_role.return_value = {
            'Role': {
                'RoleName': 'currency-converter-lambda-role-test',
                'Arn': 'arn:aws:iam::123456789:role/currency-converter-lambda-role-test',
                'CreateDate': datetime.now(timezone.utc)
            }
        }
        mock_iam.list_attached_role_policies.return_value = {
            'AttachedPolicies': [
                {'PolicyName': 'AWSLambdaBasicExecutionRole'},
                {'PolicyName': 'AWSXRayDaemonWriteAccess'}
            ]
        }
        mock_boto_client.return_value = mock_iam

        analyzer = CurrencyAPIAnalyzer('test')
        analyzer.iam_client = mock_iam

        result = analyzer.analyze_iam_roles()

        found_roles = [r for r in result if r.get('status') == 'found']
        self.assertGreater(len(found_roles), 0)

    @patch('analyse.boto3.client')
    def test_analyze_iam_role_missing(self, mock_boto_client):
        """Test when IAM role is missing"""
        mock_iam = Mock()
        mock_iam.get_role.side_effect = mock_iam.exceptions.NoSuchEntityException(
            {'Error': {'Code': 'NoSuchEntity'}}, 'GetRole'
        )
        mock_iam.exceptions = Mock()
        mock_iam.exceptions.NoSuchEntityException = Exception
        mock_boto_client.return_value = mock_iam

        # Need to properly mock the exception
        class NoSuchEntityException(Exception):
            pass

        mock_iam.exceptions.NoSuchEntityException = NoSuchEntityException
        mock_iam.get_role.side_effect = NoSuchEntityException("Role not found")

        analyzer = CurrencyAPIAnalyzer('test')
        analyzer.iam_client = mock_iam

        result = analyzer.analyze_iam_roles()

        missing_roles = [r for r in result if r.get('status') == 'missing']
        self.assertGreater(len(missing_roles), 0)

    @patch('analyse.boto3.client')
    def test_analyze_iam_role_policies_detected(self, mock_boto_client):
        """Test IAM role policy detection"""
        mock_iam = Mock()
        mock_iam.get_role.return_value = {
            'Role': {
                'RoleName': 'currency-converter-lambda-role-test',
                'Arn': 'arn:aws:iam::123456789:role/test',
                'CreateDate': datetime.now(timezone.utc)
            }
        }
        mock_iam.list_attached_role_policies.return_value = {
            'AttachedPolicies': [
                {'PolicyName': 'AWSLambdaBasicExecutionRole'},
                {'PolicyName': 'AWSXRayDaemonWriteAccess'}
            ]
        }
        mock_boto_client.return_value = mock_iam

        analyzer = CurrencyAPIAnalyzer('test')
        analyzer.iam_client = mock_iam

        result = analyzer.analyze_iam_roles()

        found = next((r for r in result if r.get('status') == 'found'), None)
        if found:
            self.assertTrue(found.get('has_lambda_basic_execution', False))
            self.assertTrue(found.get('has_xray_write_access', False))


class TestAnalyzeXRayTracing(unittest.TestCase):
    """Test analyze_xray_tracing method"""

    @patch('analyse.boto3.client')
    def test_analyze_xray_active_traces(self, mock_boto_client):
        """Test when X-Ray has active traces"""
        mock_xray = Mock()
        mock_xray.get_trace_summaries.return_value = {
            'TraceSummaries': [
                {
                    'Id': 'trace-123',
                    'Duration': 0.5,
                    'ResponseTime': 0.3,
                    'HasError': False,
                    'HasFault': False
                }
            ]
        }
        mock_boto_client.return_value = mock_xray

        analyzer = CurrencyAPIAnalyzer('test')
        analyzer.xray_client = mock_xray

        result = analyzer.analyze_xray_tracing()

        self.assertEqual(result['status'], 'active')
        self.assertEqual(result['trace_count'], 1)

    @patch('analyse.boto3.client')
    def test_analyze_xray_no_traces(self, mock_boto_client):
        """Test when X-Ray has no recent traces"""
        mock_xray = Mock()
        mock_xray.get_trace_summaries.return_value = {'TraceSummaries': []}
        mock_boto_client.return_value = mock_xray

        analyzer = CurrencyAPIAnalyzer('test')
        analyzer.xray_client = mock_xray

        result = analyzer.analyze_xray_tracing()

        self.assertEqual(result['status'], 'no_recent_traces')

    @patch('analyse.boto3.client')
    def test_analyze_xray_handles_exception(self, mock_boto_client):
        """Test exception handling in X-Ray analysis"""
        mock_xray = Mock()
        mock_xray.get_trace_summaries.side_effect = Exception("API Error")
        mock_boto_client.return_value = mock_xray

        analyzer = CurrencyAPIAnalyzer('test')
        analyzer.xray_client = mock_xray

        result = analyzer.analyze_xray_tracing()

        self.assertEqual(result['status'], 'error')


class TestAnalyzeAPIThrottling(unittest.TestCase):
    """Test analyze_api_throttling method"""

    @patch('analyse.boto3.client')
    def test_analyze_throttling_configured(self, mock_boto_client):
        """Test when throttling is configured"""
        mock_apigw = Mock()
        mock_apigw.get_usage_plans.return_value = {
            'items': [
                {
                    'id': 'plan123',
                    'name': 'currency-api-usage-plan-test',
                    'throttle': {'rateLimit': 100, 'burstLimit': 200},
                    'quota': {'limit': 10000, 'period': 'MONTH'}
                }
            ]
        }
        mock_boto_client.return_value = mock_apigw

        analyzer = CurrencyAPIAnalyzer('test')
        analyzer.apigateway_client = mock_apigw

        result = analyzer.analyze_api_throttling()

        self.assertEqual(result['status'], 'configured')
        self.assertEqual(len(result['usage_plans']), 1)
        self.assertEqual(result['usage_plans'][0]['rate_limit'], 100)

    @patch('analyse.boto3.client')
    def test_analyze_throttling_not_configured(self, mock_boto_client):
        """Test when throttling is not configured"""
        mock_apigw = Mock()
        mock_apigw.get_usage_plans.return_value = {'items': []}
        mock_boto_client.return_value = mock_apigw

        analyzer = CurrencyAPIAnalyzer('test')
        analyzer.apigateway_client = mock_apigw

        result = analyzer.analyze_api_throttling()

        self.assertEqual(result['status'], 'no_usage_plans')

    @patch('analyse.boto3.client')
    def test_analyze_throttling_handles_exception(self, mock_boto_client):
        """Test exception handling in throttling analysis"""
        mock_apigw = Mock()
        mock_apigw.get_usage_plans.side_effect = Exception("API Error")
        mock_boto_client.return_value = mock_apigw

        analyzer = CurrencyAPIAnalyzer('test')
        analyzer.apigateway_client = mock_apigw

        result = analyzer.analyze_api_throttling()

        self.assertEqual(result['status'], 'error')


class TestGenerateRecommendations(unittest.TestCase):
    """Test recommendation generation"""

    @patch('analyse.boto3.client')
    def test_generates_critical_recommendation_for_missing_lambda(self, mock_boto_client):
        """Test critical recommendation for missing Lambda"""
        mock_boto_client.return_value = Mock()

        analyzer = CurrencyAPIAnalyzer('test')

        analysis = {
            'lambda_functions': [{'name': 'test-func', 'status': 'missing'}],
            'api_gateways': [],
            'cloudwatch_logs': [],
            'iam_roles': [],
            'xray_tracing': {},
            'api_throttling': {}
        }

        recommendations = analyzer._generate_recommendations(analysis)

        critical_recs = [r for r in recommendations if r['priority'] == 'critical']
        self.assertGreater(len(critical_recs), 0)

    @patch('analyse.boto3.client')
    def test_generates_security_recommendation_for_missing_api_key(self, mock_boto_client):
        """Test security recommendation for missing API key"""
        mock_boto_client.return_value = Mock()

        analyzer = CurrencyAPIAnalyzer('test')

        analysis = {
            'lambda_functions': [],
            'api_gateways': [
                {
                    'name': 'test-api',
                    'status': 'found',
                    'compliant': {'has_api_key': False}
                }
            ],
            'cloudwatch_logs': [],
            'iam_roles': [],
            'xray_tracing': {},
            'api_throttling': {}
        }

        recommendations = analyzer._generate_recommendations(analysis)

        security_recs = [r for r in recommendations if r['category'] == 'security']
        self.assertGreater(len(security_recs), 0)


class TestCalculateComplianceScore(unittest.TestCase):
    """Test compliance score calculation"""

    @patch('analyse.boto3.client')
    def test_perfect_compliance_score(self, mock_boto_client):
        """Test 100% compliance score"""
        mock_boto_client.return_value = Mock()

        analyzer = CurrencyAPIAnalyzer('test')

        analysis = {
            'lambda_functions': [
                {
                    'status': 'found',
                    'compliant': {
                        'runtime_nodejs18': True,
                        'memory_1gb': True,
                        'timeout_10s': True,
                        'xray_active': True,
                        'has_api_version_env': True,
                        'has_rate_precision_env': True
                    }
                }
            ],
            'api_gateways': [
                {
                    'status': 'found',
                    'compliant': {
                        'is_edge_optimized': True,
                        'has_convert_endpoint': True,
                        'has_v1_stage': True,
                        'xray_tracing_enabled': True,
                        'has_api_key': True,
                        'has_usage_plan': True
                    }
                }
            ],
            'cloudwatch_logs': [
                {'status': 'found'},
                {'status': 'found'}
            ],
            'iam_roles': [
                {'status': 'found'},
                {'status': 'found'}
            ],
            'xray_tracing': {'status': 'active'},
            'api_throttling': {'status': 'configured'}
        }

        score = analyzer._calculate_compliance_score(analysis)

        self.assertEqual(score, 100.0)

    @patch('analyse.boto3.client')
    def test_zero_compliance_score(self, mock_boto_client):
        """Test 0% compliance score when nothing found"""
        mock_boto_client.return_value = Mock()

        analyzer = CurrencyAPIAnalyzer('test')

        analysis = {
            'lambda_functions': [{'status': 'missing'}],
            'api_gateways': [{'status': 'missing'}],
            'cloudwatch_logs': [{'status': 'missing'}],
            'iam_roles': [{'status': 'missing'}],
            'xray_tracing': {'status': 'error'},
            'api_throttling': {'status': 'error'}
        }

        score = analyzer._calculate_compliance_score(analysis)

        self.assertEqual(score, 0.0)


class TestPrintReport(unittest.TestCase):
    """Test report printing"""

    @patch('analyse.boto3.client')
    def test_print_report_no_errors(self, mock_boto_client):
        """Test print_report executes without errors"""
        mock_boto_client.return_value = Mock()

        analyzer = CurrencyAPIAnalyzer('test')

        analysis = {
            'environment_suffix': 'test',
            'region': 'us-east-1',
            'timestamp': '2024-01-01T00:00:00Z',
            'compliance_score': 75.0,
            'lambda_functions': [{'name': 'test', 'status': 'found'}],
            'api_gateways': [{'name': 'test', 'status': 'found'}],
            'cloudwatch_logs': [],
            'iam_roles': [],
            'xray_tracing': {'status': 'active', 'trace_count': 5},
            'api_throttling': {'status': 'configured', 'usage_plans': []},
            'recommendations': []
        }

        # Should not raise any exceptions
        analyzer.print_report(analysis)


class TestExportJSONReport(unittest.TestCase):
    """Test JSON report export"""

    @patch('analyse.boto3.client')
    def test_export_json_report(self, mock_boto_client):
        """Test JSON report export creates valid JSON file"""
        mock_boto_client.return_value = Mock()

        analyzer = CurrencyAPIAnalyzer('test')

        analysis = {
            'environment_suffix': 'test',
            'region': 'us-east-1',
            'timestamp': '2024-01-01T00:00:00Z',
            'compliance_score': 75.0
        }

        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            temp_path = f.name

        try:
            analyzer.export_json_report(analysis, temp_path)

            with open(temp_path, 'r') as f:
                loaded = json.load(f)

            self.assertEqual(loaded['environment_suffix'], 'test')
            self.assertEqual(loaded['compliance_score'], 75.0)
        finally:
            os.unlink(temp_path)


class TestMainFunction(unittest.TestCase):
    """Test main entry point"""

    @patch('analyse.CurrencyAPIAnalyzer')
    @patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': 'test', 'AWS_REGION': 'us-east-1'})
    def test_main_returns_zero_for_compliant(self, mock_analyzer_class):
        """Test main returns 0 for compliant infrastructure"""
        mock_analyzer = Mock()
        mock_analyzer.analyze_infrastructure.return_value = {
            'compliance_score': 85.0,
            'recommendations': []
        }
        mock_analyzer_class.return_value = mock_analyzer

        result = main()

        self.assertEqual(result, 0)

    @patch('analyse.CurrencyAPIAnalyzer')
    @patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': 'test', 'AWS_REGION': 'us-east-1'})
    def test_main_returns_one_for_warnings(self, mock_analyzer_class):
        """Test main returns 1 for infrastructure with warnings"""
        mock_analyzer = Mock()
        mock_analyzer.analyze_infrastructure.return_value = {
            'compliance_score': 65.0,
            'recommendations': []
        }
        mock_analyzer_class.return_value = mock_analyzer

        result = main()

        self.assertEqual(result, 1)

    @patch('analyse.CurrencyAPIAnalyzer')
    @patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': 'test', 'AWS_REGION': 'us-east-1'})
    def test_main_returns_two_for_non_compliant(self, mock_analyzer_class):
        """Test main returns 2 for non-compliant infrastructure"""
        mock_analyzer = Mock()
        mock_analyzer.analyze_infrastructure.return_value = {
            'compliance_score': 30.0,
            'recommendations': []
        }
        mock_analyzer_class.return_value = mock_analyzer

        result = main()

        self.assertEqual(result, 2)


class TestLambdaComplianceChecks(unittest.TestCase):
    """Test individual Lambda compliance checks"""

    @patch('analyse.boto3.client')
    def test_check_lambda_compliance_all_pass(self, mock_boto_client):
        """Test all Lambda compliance checks pass"""
        mock_boto_client.return_value = Mock()

        analyzer = CurrencyAPIAnalyzer('test')

        config = {
            'Runtime': 'nodejs18.x',
            'MemorySize': 1024,
            'Timeout': 10,
            'TracingConfig': {'Mode': 'Active'},
            'Environment': {
                'Variables': {
                    'API_VERSION': '1.0',
                    'RATE_PRECISION': '4'
                }
            }
        }

        compliance = analyzer._check_lambda_compliance(config)

        self.assertTrue(compliance['runtime_nodejs18'])
        self.assertTrue(compliance['memory_1gb'])
        self.assertTrue(compliance['timeout_10s'])
        self.assertTrue(compliance['xray_active'])
        self.assertTrue(compliance['has_api_version_env'])
        self.assertTrue(compliance['has_rate_precision_env'])

    @patch('analyse.boto3.client')
    def test_check_lambda_compliance_wrong_runtime(self, mock_boto_client):
        """Test Lambda compliance fails for wrong runtime"""
        mock_boto_client.return_value = Mock()

        analyzer = CurrencyAPIAnalyzer('test')

        config = {
            'Runtime': 'python3.9',
            'MemorySize': 1024,
            'Timeout': 10,
            'TracingConfig': {'Mode': 'Active'},
            'Environment': {'Variables': {}}
        }

        compliance = analyzer._check_lambda_compliance(config)

        self.assertFalse(compliance['runtime_nodejs18'])


class TestAPIComplianceChecks(unittest.TestCase):
    """Test individual API Gateway compliance checks"""

    @patch('analyse.boto3.client')
    def test_check_api_compliance_all_pass(self, mock_boto_client):
        """Test all API compliance checks pass"""
        mock_boto_client.return_value = Mock()

        analyzer = CurrencyAPIAnalyzer('test')

        api = {'endpointConfiguration': {'types': ['EDGE']}}
        convert_resource = {'pathPart': 'convert'}
        v1_stage = {'stageName': 'v1', 'tracingEnabled': True}
        api_keys = [{'name': 'key'}]
        usage_plans = [{'name': 'plan'}]

        compliance = analyzer._check_api_compliance(
            api, convert_resource, v1_stage, api_keys, usage_plans
        )

        self.assertTrue(compliance['is_edge_optimized'])
        self.assertTrue(compliance['has_convert_endpoint'])
        self.assertTrue(compliance['has_v1_stage'])
        self.assertTrue(compliance['xray_tracing_enabled'])
        self.assertTrue(compliance['has_api_key'])
        self.assertTrue(compliance['has_usage_plan'])


if __name__ == '__main__':
    unittest.main()
