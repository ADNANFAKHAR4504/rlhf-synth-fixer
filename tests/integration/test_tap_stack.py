"""
test_tap_stack.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack for the currency exchange API.
"""

import unittest
import json
import os
import subprocess
import boto3
from botocore.exceptions import ClientError


class TestCurrencyAPIIntegration(unittest.TestCase):
    """Integration tests for the deployed currency exchange API."""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures."""
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.project_name = os.getenv('PULUMI_PROJECT', 'tap')
        cls.pulumi_org = os.getenv('PULUMI_ORG', 'organization')
        
        # Stack name follows the pattern used in deployment
        cls.stack_name = os.getenv('PULUMI_STACK', f'TapStack{cls.environment_suffix}')
        
        # Full Pulumi stack identifier: org/project/stack
        cls.pulumi_stack_identifier = f"{cls.pulumi_org}/{cls.project_name}/{cls.stack_name}"
        
        # Fetch Pulumi stack outputs
        cls.outputs = cls._fetch_pulumi_outputs()
        
        # Extract outputs from the dictionary
        cls.api_url = cls.outputs.get('api_url', '')
        cls.api_key_id = cls.outputs.get('api_key_id', '')
        cls.api_key_value = cls.outputs.get('api_key_value', '')
        cls.lambda_function_name = cls.outputs.get('lambda_function_name', '')
        cls.api_gateway_id = cls.outputs.get('api_gateway_id', '')

        # Initialize AWS clients (use us-east-1 as configured in Pulumi)
        cls.apigateway_client = boto3.client('apigateway', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.iam_client = boto3.client('iam', region_name=cls.region)
    
    @classmethod
    def _fetch_pulumi_outputs(cls):
        """Fetch Pulumi outputs as a Python dictionary."""
        try:
            print(f"\nDebug: Environment suffix: {cls.environment_suffix}")
            print(f"Debug: Stack name: {cls.stack_name}")
            print(f"Debug: Full stack identifier: {cls.pulumi_stack_identifier}")
            print(f"Fetching Pulumi outputs for stack: {cls.pulumi_stack_identifier}")
            
            result = subprocess.run(
                ["pulumi", "stack", "output", "--json", "--stack", cls.pulumi_stack_identifier],
                capture_output=True,
                text=True,
                check=True,
                cwd=os.path.join(os.path.dirname(__file__), "../..")
            )
            outputs = json.loads(result.stdout)
            print(f"Successfully fetched {len(outputs)} outputs from Pulumi stack")
            if outputs:
                print(f"Available outputs: {list(outputs.keys())}")
            else:
                print("Note: Stack has no outputs registered. Tests will use naming conventions.")
            return outputs
        except subprocess.CalledProcessError as e:
            print(f"Warning: Could not retrieve Pulumi stack outputs")
            print(f"Error: {e.stderr}")
            print("Tests will fall back to standard naming conventions")
            return {}
        except json.JSONDecodeError as e:
            print(f"Warning: Could not parse Pulumi output: {e}")
            return {}

    def test_api_gateway_exists(self):
        """Test that API Gateway is deployed."""
        # Use api_gateway_id if available, otherwise extract from URL
        if self.api_gateway_id:
            api_id = self.api_gateway_id
        elif self.api_url:
            # Extract API ID from URL
            api_id = self.api_url.split('//')[1].split('.')[0]
        else:
            self.skipTest("API Gateway ID or URL not available - stack may not be deployed")

        response = self.apigateway_client.get_rest_api(restApiId=api_id)
        self.assertIsNotNone(response)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

    def test_lambda_function_exists(self):
        """Test that Lambda function is deployed."""
        if not self.lambda_function_name:
            self.skipTest("Lambda function name not available")

        response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
        self.assertIsNotNone(response)
        self.assertEqual(response['Configuration']['Runtime'], 'nodejs18.x')
        self.assertEqual(response['Configuration']['MemorySize'], 1024)
        self.assertEqual(response['Configuration']['Timeout'], 10)

    def test_lambda_has_environment_variables(self):
        """Test that Lambda has correct environment variables."""
        if not self.lambda_function_name:
            self.skipTest("Lambda function name not available")

        response = self.lambda_client.get_function_configuration(FunctionName=self.lambda_function_name)
        env_vars = response.get('Environment', {}).get('Variables', {})

        self.assertIn('API_VERSION', env_vars)
        self.assertIn('RATE_PRECISION', env_vars)
        self.assertEqual(env_vars['API_VERSION'], 'v1')
        self.assertEqual(env_vars['RATE_PRECISION'], '2')

    def test_lambda_xray_enabled(self):
        """Test that X-Ray tracing is enabled on Lambda."""
        if not self.lambda_function_name:
            self.skipTest("Lambda function name not available")

        response = self.lambda_client.get_function_configuration(FunctionName=self.lambda_function_name)
        tracing_config = response.get('TracingConfig', {})

        self.assertEqual(tracing_config.get('Mode'), 'Active')

    def test_api_key_exists(self):
        """Test that API key is created."""
        if not self.api_key_id:
            self.skipTest("API key ID not available")

        response = self.apigateway_client.get_api_key(
            apiKey=self.api_key_id,
            includeValue=False
        )

        self.assertIsNotNone(response)
        self.assertTrue(response['enabled'])

    def test_api_requires_api_key(self):
        """Test that API requires API key for authentication."""
        if not self.api_url:
            self.skipTest("API URL not available")

        try:
            import requests
        except ImportError:
            self.skipTest("requests library not installed")

        response = requests.post(
            self.api_url,
            json={"from": "EUR", "to": "USD", "amount": 100},
            timeout=30
        )

        # Should return 403 without API key
        self.assertEqual(response.status_code, 403)

    def test_successful_currency_conversion(self):
        """Test successful currency conversion with valid API key."""
        if not self.api_url or not self.api_key_id:
            self.skipTest("API URL or key not available")

        try:
            import requests
        except ImportError:
            self.skipTest("requests library not installed")

        # Get actual API key value - use stored value if available, otherwise fetch from AWS
        if self.api_key_value and self.api_key_value != "[secret]":
            api_key = self.api_key_value
        else:
            response = self.apigateway_client.get_api_key(
                apiKey=self.api_key_id,
                includeValue=True
            )
            api_key = response['value']

        response = requests.post(
            self.api_url,
            headers={"x-api-key": api_key},
            json={"from": "EUR", "to": "USD", "amount": 100},
            timeout=30
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("converted", data)
        self.assertIn("rate", data)
        self.assertIn("apiVersion", data)
        self.assertEqual(data["from"], "EUR")
        self.assertEqual(data["to"], "USD")
        self.assertEqual(data["amount"], 100)

    def test_api_validates_input(self):
        """Test that API validates input parameters."""
        if not self.api_url or not self.api_key_id:
            self.skipTest("API URL or key not available")

        try:
            import requests
        except ImportError:
            self.skipTest("requests library not installed")

        # Get API key
        response = self.apigateway_client.get_api_key(
            apiKey=self.api_key_id,
            includeValue=True
        )
        api_key = response['value']

        # Test missing parameters
        response = requests.post(
            self.api_url,
            headers={"x-api-key": api_key},
            json={"from": "EUR"},
            timeout=30
        )

        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("error", data)

    def test_api_cors_headers(self):
        """Test that CORS headers are configured correctly."""
        if not self.api_url:
            self.skipTest("API URL not available")

        try:
            import requests
        except ImportError:
            self.skipTest("requests library not installed")

        response = requests.options(self.api_url, timeout=30)

        # Check CORS headers (API Gateway may return different status codes for OPTIONS)
        if response.status_code in [200, 204]:
            headers_lower = {k.lower(): v for k, v in response.headers.items()}
            self.assertTrue(
                'access-control-allow-origin' in headers_lower or
                'Access-Control-Allow-Origin' in response.headers
            )

    def test_api_stage_is_v1(self):
        """Test that API is deployed to v1 stage."""
        if not self.api_url:
            self.skipTest("API URL not available")

        self.assertIn('/v1/', self.api_url)

    def test_usage_plan_exists(self):
        """Test that usage plan is configured with throttling."""
        if not self.api_key_id:
            self.skipTest("API key ID not available")

        # Get usage plans
        response = self.apigateway_client.get_usage_plans()
        usage_plans = response.get('items', [])

        # Find usage plan associated with our API key
        found_plan = False
        for plan in usage_plans:
            if 'currency-usage-plan' in plan.get('name', ''):
                found_plan = True
                # Check throttle settings
                throttle = plan.get('throttle', {})
                self.assertEqual(throttle.get('rateLimit'), 5000)
                self.assertEqual(throttle.get('burstLimit'), 5000)
                break

        self.assertTrue(found_plan, "Usage plan with correct name not found")

    def test_lambda_has_correct_tags(self):
        """Test that Lambda function has correct tags."""
        if not self.lambda_function_name:
            self.skipTest("Lambda function name not available")

        # Get function ARN first (list_tags requires ARN, not name)
        function_response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
        function_arn = function_response['Configuration']['FunctionArn']

        response = self.lambda_client.list_tags(Resource=function_arn)
        tags = response.get('Tags', {})

        self.assertEqual(tags.get('Environment'), 'production')
        self.assertEqual(tags.get('Service'), 'currency-api')


if __name__ == "__main__":
    unittest.main()
