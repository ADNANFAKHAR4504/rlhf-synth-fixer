#!/usr/bin/env python3
"""
Integration tests for the Currency Exchange API Infrastructure Analysis Script
Tests against actual deployed AWS resources
"""

import unittest
import os
import sys
import json
import boto3
from botocore.exceptions import ClientError

# Add lib directory to path for importing
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))


class TestLambdaIntegration(unittest.TestCase):
    """Integration tests for Lambda function"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients"""
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.function_pattern = f"currency-converter-{cls.environment_suffix}"

    def test_lambda_function_exists(self):
        """Test that Lambda function exists"""
        response = self.lambda_client.list_functions()
        functions = response.get('Functions', [])

        matching = [
            f for f in functions
            if self.function_pattern in f['FunctionName']
        ]

        self.assertGreater(
            len(matching), 0,
            f"No Lambda function found matching pattern: {self.function_pattern}"
        )

    def test_lambda_runtime_is_nodejs18(self):
        """Test Lambda uses nodejs18.x runtime"""
        response = self.lambda_client.list_functions()
        functions = response.get('Functions', [])

        matching = [
            f for f in functions
            if self.function_pattern in f['FunctionName']
        ]

        if matching:
            for func in matching:
                self.assertEqual(
                    func['Runtime'], 'nodejs18.x',
                    f"Lambda {func['FunctionName']} should use nodejs18.x runtime"
                )

    def test_lambda_memory_configuration(self):
        """Test Lambda memory is at least 1024 MB"""
        response = self.lambda_client.list_functions()
        functions = response.get('Functions', [])

        matching = [
            f for f in functions
            if self.function_pattern in f['FunctionName']
        ]

        if matching:
            for func in matching:
                self.assertGreaterEqual(
                    func.get('MemorySize', 0), 1024,
                    f"Lambda {func['FunctionName']} memory should be >= 1024 MB"
                )

    def test_lambda_has_xray_tracing(self):
        """Test Lambda has X-Ray tracing enabled"""
        response = self.lambda_client.list_functions()
        functions = response.get('Functions', [])

        matching = [
            f for f in functions
            if self.function_pattern in f['FunctionName']
        ]

        if matching:
            for func in matching:
                func_config = self.lambda_client.get_function(
                    FunctionName=func['FunctionName']
                )
                tracing = func_config.get('Configuration', {}).get(
                    'TracingConfig', {}
                )
                self.assertEqual(
                    tracing.get('Mode'), 'Active',
                    f"Lambda {func['FunctionName']} should have X-Ray tracing active"
                )

    def test_lambda_has_environment_variables(self):
        """Test Lambda has required environment variables"""
        response = self.lambda_client.list_functions()
        functions = response.get('Functions', [])

        matching = [
            f for f in functions
            if self.function_pattern in f['FunctionName']
        ]

        if matching:
            for func in matching:
                func_config = self.lambda_client.get_function(
                    FunctionName=func['FunctionName']
                )
                env_vars = func_config.get('Configuration', {}).get(
                    'Environment', {}
                ).get('Variables', {})

                self.assertIn(
                    'API_VERSION', env_vars,
                    f"Lambda {func['FunctionName']} should have API_VERSION env var"
                )


class TestAPIGatewayIntegration(unittest.TestCase):
    """Integration tests for API Gateway"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients"""
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        cls.apigateway_client = boto3.client('apigateway', region_name=cls.region)
        cls.api_pattern = f"currency-exchange-api-{cls.environment_suffix}"

    def test_api_gateway_exists(self):
        """Test that API Gateway exists"""
        response = self.apigateway_client.get_rest_apis()
        apis = response.get('items', [])

        matching = [
            api for api in apis
            if self.api_pattern in api.get('name', '')
        ]

        self.assertGreater(
            len(matching), 0,
            f"No API Gateway found matching pattern: {self.api_pattern}"
        )

    def test_api_gateway_is_edge_optimized(self):
        """Test API Gateway is edge-optimized"""
        response = self.apigateway_client.get_rest_apis()
        apis = response.get('items', [])

        matching = [
            api for api in apis
            if self.api_pattern in api.get('name', '')
        ]

        if matching:
            for api in matching:
                endpoint_config = api.get('endpointConfiguration', {})
                types = endpoint_config.get('types', [])
                self.assertIn(
                    'EDGE', types,
                    f"API {api['name']} should be edge-optimized"
                )

    def test_api_gateway_has_convert_endpoint(self):
        """Test API Gateway has /convert endpoint"""
        response = self.apigateway_client.get_rest_apis()
        apis = response.get('items', [])

        matching = [
            api for api in apis
            if self.api_pattern in api.get('name', '')
        ]

        if matching:
            api_id = matching[0]['id']
            resources = self.apigateway_client.get_resources(restApiId=api_id)

            convert_resource = next(
                (r for r in resources.get('items', [])
                 if r.get('pathPart') == 'convert'),
                None
            )

            self.assertIsNotNone(
                convert_resource,
                "API Gateway should have /convert endpoint"
            )

    def test_api_gateway_has_v1_stage(self):
        """Test API Gateway has v1 stage"""
        response = self.apigateway_client.get_rest_apis()
        apis = response.get('items', [])

        matching = [
            api for api in apis
            if self.api_pattern in api.get('name', '')
        ]

        if matching:
            api_id = matching[0]['id']
            stages = self.apigateway_client.get_stages(restApiId=api_id)

            v1_stage = next(
                (s for s in stages.get('item', [])
                 if s.get('stageName') == 'v1'),
                None
            )

            self.assertIsNotNone(v1_stage, "API Gateway should have v1 stage")

    def test_api_gateway_has_api_key(self):
        """Test API Gateway has API key configured"""
        response = self.apigateway_client.get_api_keys()
        api_keys = response.get('items', [])

        matching = [
            k for k in api_keys
            if self.environment_suffix in k.get('name', '')
        ]

        self.assertGreater(
            len(matching), 0,
            "API Gateway should have an API key configured"
        )

    def test_api_gateway_has_usage_plan(self):
        """Test API Gateway has usage plan configured"""
        response = self.apigateway_client.get_usage_plans()
        usage_plans = response.get('items', [])

        matching = [
            p for p in usage_plans
            if self.environment_suffix in p.get('name', '')
        ]

        self.assertGreater(
            len(matching), 0,
            "API Gateway should have a usage plan configured"
        )


class TestCloudWatchLogsIntegration(unittest.TestCase):
    """Integration tests for CloudWatch Logs"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients"""
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        cls.logs_client = boto3.client('logs', region_name=cls.region)

    def test_lambda_log_group_exists(self):
        """Test Lambda log group exists"""
        prefix = f"/aws/lambda/currency-converter-{self.environment_suffix}"

        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=prefix
        )
        log_groups = response.get('logGroups', [])

        self.assertGreater(
            len(log_groups), 0,
            f"Lambda log group with prefix {prefix} should exist"
        )

    def test_api_gateway_log_group_exists(self):
        """Test API Gateway log group exists"""
        prefix = f"/aws/apigateway/currency-api-{self.environment_suffix}"

        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=prefix
        )
        log_groups = response.get('logGroups', [])

        self.assertGreater(
            len(log_groups), 0,
            f"API Gateway log group with prefix {prefix} should exist"
        )

    def test_log_groups_have_retention(self):
        """Test log groups have retention policy set"""
        prefix = f"/aws/lambda/currency-converter-{self.environment_suffix}"

        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=prefix
        )
        log_groups = response.get('logGroups', [])

        for lg in log_groups:
            self.assertIn(
                'retentionInDays', lg,
                f"Log group {lg['logGroupName']} should have retention policy"
            )


class TestIAMRolesIntegration(unittest.TestCase):
    """Integration tests for IAM roles"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients"""
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        cls.iam_client = boto3.client('iam', region_name=cls.region)

    def test_lambda_execution_role_exists(self):
        """Test Lambda execution role exists"""
        role_name = f"currency-converter-lambda-role-{self.environment_suffix}"

        try:
            response = self.iam_client.get_role(RoleName=role_name)
            self.assertIsNotNone(response.get('Role'))
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchEntity':
                self.fail(f"Lambda execution role {role_name} should exist")
            raise

    def test_lambda_role_has_basic_execution_policy(self):
        """Test Lambda role has basic execution policy"""
        role_name = f"currency-converter-lambda-role-{self.environment_suffix}"

        try:
            response = self.iam_client.list_attached_role_policies(
                RoleName=role_name
            )
            policies = response.get('AttachedPolicies', [])
            policy_names = [p['PolicyName'] for p in policies]

            has_basic_execution = any(
                'LambdaBasicExecutionRole' in name
                for name in policy_names
            )

            self.assertTrue(
                has_basic_execution,
                f"Role {role_name} should have Lambda basic execution policy"
            )
        except ClientError:
            pass  # Role might not exist

    def test_lambda_role_has_xray_policy(self):
        """Test Lambda role has X-Ray write policy"""
        role_name = f"currency-converter-lambda-role-{self.environment_suffix}"

        try:
            response = self.iam_client.list_attached_role_policies(
                RoleName=role_name
            )
            policies = response.get('AttachedPolicies', [])
            policy_names = [p['PolicyName'] for p in policies]

            has_xray = any('XRay' in name for name in policy_names)

            self.assertTrue(
                has_xray,
                f"Role {role_name} should have X-Ray write policy"
            )
        except ClientError:
            pass  # Role might not exist


class TestXRayIntegration(unittest.TestCase):
    """Integration tests for X-Ray tracing"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients"""
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        cls.xray_client = boto3.client('xray', region_name=cls.region)

    def test_xray_service_accessible(self):
        """Test X-Ray service is accessible"""
        from datetime import datetime, timezone, timedelta

        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(hours=1)

        try:
            response = self.xray_client.get_trace_summaries(
                StartTime=start_time,
                EndTime=end_time
            )
            # Just verify we can call the API
            self.assertIsNotNone(response)
        except ClientError as e:
            self.fail(f"X-Ray service should be accessible: {e}")


class TestAnalysisScriptIntegration(unittest.TestCase):
    """Integration tests for the analysis script itself"""

    @classmethod
    def setUpClass(cls):
        """Import and set up analyzer"""
        from analyse import CurrencyAPIAnalyzer

        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        cls.analyzer = CurrencyAPIAnalyzer(cls.environment_suffix, cls.region)

    def test_full_analysis_runs_without_error(self):
        """Test complete infrastructure analysis runs without errors"""
        try:
            analysis = self.analyzer.analyze_infrastructure()
            self.assertIsNotNone(analysis)
            self.assertIn('compliance_score', analysis)
            self.assertIn('recommendations', analysis)
        except Exception as e:
            self.fail(f"Full analysis should run without error: {e}")

    def test_analysis_returns_expected_structure(self):
        """Test analysis returns expected data structure"""
        analysis = self.analyzer.analyze_infrastructure()

        expected_keys = [
            'environment_suffix',
            'region',
            'timestamp',
            'lambda_functions',
            'api_gateways',
            'cloudwatch_logs',
            'iam_roles',
            'xray_tracing',
            'api_throttling',
            'recommendations',
            'compliance_score'
        ]

        for key in expected_keys:
            self.assertIn(
                key, analysis,
                f"Analysis should contain '{key}' key"
            )

    def test_compliance_score_is_valid(self):
        """Test compliance score is a valid percentage"""
        analysis = self.analyzer.analyze_infrastructure()

        score = analysis['compliance_score']
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 100.0)

    def test_print_report_executes(self):
        """Test print_report method executes without error"""
        analysis = self.analyzer.analyze_infrastructure()

        try:
            self.analyzer.print_report(analysis)
        except Exception as e:
            self.fail(f"print_report should execute without error: {e}")

    def test_json_export_creates_valid_json(self):
        """Test JSON export creates valid JSON file"""
        import tempfile

        analysis = self.analyzer.analyze_infrastructure()

        with tempfile.NamedTemporaryFile(
            mode='w', suffix='.json', delete=False
        ) as f:
            temp_path = f.name

        try:
            self.analyzer.export_json_report(analysis, temp_path)

            with open(temp_path, 'r') as f:
                loaded = json.load(f)

            self.assertEqual(
                loaded['environment_suffix'],
                self.environment_suffix
            )
        finally:
            os.unlink(temp_path)


if __name__ == '__main__':
    unittest.main()
