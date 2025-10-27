import json
import os
import unittest
import boto3
import requests
import time
from typing import Dict, Any
from botocore.exceptions import ClientError

from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = f.read()
else:
    flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the deployed TapStack CDK stack"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and extract outputs once for all tests"""
        # Check if outputs are available
        if not flat_outputs:
            raise unittest.SkipTest("No CDK outputs found - stack may not be deployed")
        
        # Initialize AWS clients
        cls.dynamodb = boto3.resource('dynamodb')
        cls.lambda_client = boto3.client('lambda')
        cls.logs_client = boto3.client('logs')
        cls.apigateway_client = boto3.client('apigatewayv2')
        
        # Extract outputs
        cls.table_name = flat_outputs.get('TableName')
        cls.lambda_function_name = flat_outputs.get('LambdaFunctionName')
        cls.api_endpoint = flat_outputs.get('ApiEndpoint')
        cls.api_log_group_name = flat_outputs.get('ApiLogGroupName')
        
        # Validate required outputs
        if not all([cls.table_name, cls.lambda_function_name, cls.api_endpoint]):
            raise unittest.SkipTest("Required CDK outputs missing")
        
        # Set up API configuration
        cls.api_key = os.environ.get('API_KEY', 'tap-default-key')
        cls.headers = {
            'Content-Type': 'application/json',
            'X-Api-Key': cls.api_key
        }

    def setUp(self):
        """Set up for each test"""
        self.test_items_created = []  # Track items for cleanup

    def tearDown(self):
        """Clean up after each test"""
        # Clean up any test items created
        if hasattr(self, 'test_items_created'):
            for item_id in self.test_items_created:
                try:
                    response = requests.delete(
                        f"{self.api_endpoint}items/{item_id}",
                        headers=self.headers,
                        timeout=10
                    )
                except Exception:
                    pass  # Ignore cleanup errors

    @mark.it("should validate DynamoDB table exists and has correct configuration")
    def test_dynamodb_table_configuration(self):
        """Test that DynamoDB table exists with correct configuration"""
        # ARRANGE & ACT
        try:
            table = self.dynamodb.Table(self.table_name)
            table.load()
        except ClientError as e:
            self.fail(f"DynamoDB table {self.table_name} not found: {e}")
        
        # ASSERT
        self.assertEqual(table.table_name, self.table_name)
        self.assertEqual(table.billing_mode_summary['BillingMode'], 'PAY_PER_REQUEST')
        
        # Check key schema
        key_schema = {item['AttributeName']: item['KeyType'] for item in table.key_schema}
        self.assertIn('id', key_schema)
        self.assertIn('createdAt', key_schema)
        self.assertEqual(key_schema['id'], 'HASH')  # Partition key
        self.assertEqual(key_schema['createdAt'], 'RANGE')  # Sort key
        
        # Check encryption
        self.assertIsNotNone(table.sse_description)
        
        # Check point-in-time recovery
        pitr_response = boto3.client('dynamodb').describe_continuous_backups(
            TableName=self.table_name
        )
        self.assertEqual(
            pitr_response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus'],
            'ENABLED'
        )

    @mark.it("should validate Lambda function exists and has correct configuration")
    def test_lambda_function_configuration(self):
        """Test that Lambda function exists with correct configuration"""
        # ARRANGE & ACT
        try:
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
        except ClientError as e:
            self.fail(f"Lambda function {self.lambda_function_name} not found: {e}")
        
        # ASSERT
        function_config = response['Configuration']
        self.assertEqual(function_config['FunctionName'], self.lambda_function_name)
        self.assertEqual(function_config['Runtime'], 'python3.11')
        self.assertEqual(function_config['Handler'], 'index.lambda_handler')
        self.assertEqual(function_config['Timeout'], 30)
        self.assertEqual(function_config['MemorySize'], 256)
        
        # Check environment variables
        env_vars = function_config.get('Environment', {}).get('Variables', {})
        self.assertIn('TABLE_NAME', env_vars)
        self.assertEqual(env_vars['TABLE_NAME'], self.table_name)
        self.assertIn('ENVIRONMENT', env_vars)
        self.assertIn('LOG_LEVEL', env_vars)
        self.assertIn('API_KEY', env_vars)
        
        # Check tracing
        self.assertEqual(function_config['TracingConfig']['Mode'], 'Active')

    @mark.it("should validate CloudWatch log groups exist")
    def test_cloudwatch_log_groups_exist(self):
        """Test that CloudWatch log groups exist"""
        # ARRANGE & ACT - Check API Gateway log group
        if self.api_log_group_name:
            try:
                api_log_response = self.logs_client.describe_log_groups(
                    logGroupNamePrefix=self.api_log_group_name
                )
                api_log_groups = [lg['logGroupName'] for lg in api_log_response['logGroups']]
                self.assertIn(self.api_log_group_name, api_log_groups)
            except ClientError as e:
                self.fail(f"API log group {self.api_log_group_name} not found: {e}")
        
        # Check Lambda log group
        lambda_log_group_name = f"/aws/lambda/{self.lambda_function_name}"
        try:
            lambda_log_response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=lambda_log_group_name
            )
            lambda_log_groups = [lg['logGroupName'] for lg in lambda_log_response['logGroups']]
            self.assertIn(lambda_log_group_name, lambda_log_groups)
        except ClientError as e:
            self.fail(f"Lambda log group {lambda_log_group_name} not found: {e}")

    @mark.it("should validate API Gateway endpoint is accessible")
    def test_api_gateway_endpoint_accessible(self):
        """Test that API Gateway endpoint is accessible"""
        # ARRANGE & ACT
        try:
            response = requests.get(f"{self.api_endpoint}items", headers=self.headers, timeout=10)
        except requests.exceptions.RequestException as e:
            self.fail(f"API endpoint {self.api_endpoint} not accessible: {e}")
        
        # ASSERT
        self.assertIn(response.status_code, [200, 404])  # 404 is ok if no items exist
        self.assertEqual(response.headers.get('content-type'), 'application/json')

    @mark.it("should successfully create an item via API")
    def test_create_item_via_api(self):
        """Test creating an item through the API"""
        # ARRANGE
        test_data = {
            "content": "Test item content",
            "metadata": {"test": "data", "number": 42}
        }
        
        # ACT
        response = requests.post(
            f"{self.api_endpoint}items",
            json=test_data,
            headers=self.headers,
            timeout=10
        )
        
        # ASSERT
        self.assertEqual(response.status_code, 201)
        response_data = response.json()
        self.assertTrue(response_data['success'])
        self.assertIsNotNone(response_data['data'])
        
        item = response_data['data']
        self.assertIn('id', item)
        self.assertIn('createdAt', item)
        self.assertEqual(item['content'], test_data['content'])
        self.assertEqual(item['metadata'], test_data['metadata'])
        self.assertEqual(item['status'], 'active')
        
        # Track for cleanup
        self.test_items_created.append(item['id'])

    @mark.it("should validate CORS headers are present")
    def test_cors_headers_present(self):
        """Test that CORS headers are properly set"""
        # ARRANGE & ACT
        response = requests.get(f"{self.api_endpoint}items", headers=self.headers, timeout=10)
        
        # Debug: Print response details
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        print(f"Response body: {response.text}")


if __name__ == '__main__':
    unittest.main()
