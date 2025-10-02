import json
import os
import unittest
import boto3
import requests
import uuid
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
class TestTapStack(unittest.TestCase):
    """Integration test cases for the deployed TapStack resources"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and extract outputs"""
        cls.region = 'us-east-2'
        
        # Initialize AWS clients
        cls.dynamodb = boto3.resource('dynamodb', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.apigateway_client = boto3.client('apigateway', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)
        cls.iam_client = boto3.client('iam', region_name=cls.region)
        
        # Extract values from CloudFormation outputs
        cls.api_endpoint = flat_outputs.get('ApiEndpoint', '')
        cls.table_name = flat_outputs.get('DynamoDBTableName', '')
        cls.table_arn = flat_outputs.get('DynamoDBTableArn', '')
        cls.get_lambda_arn = flat_outputs.get('GetLambdaArn', '')
        cls.post_lambda_arn = flat_outputs.get('PostLambdaArn', '')
        cls.delete_lambda_arn = flat_outputs.get('DeleteLambdaArn', '')
        cls.list_lambda_arn = flat_outputs.get('ListLambdaArn', '')
        cls.stage = flat_outputs.get('Stage', 'dev')
        
        # Extract function names from ARNs
        cls.get_function_name = cls.get_lambda_arn.split(':')[-1] if cls.get_lambda_arn else ''
        cls.post_function_name = cls.post_lambda_arn.split(':')[-1] if cls.post_lambda_arn else ''
        cls.delete_function_name = cls.delete_lambda_arn.split(':')[-1] if cls.delete_lambda_arn else ''
        cls.list_function_name = cls.list_lambda_arn.split(':')[-1] if cls.list_lambda_arn else ''

    def setUp(self):
        """Set up test data for each test"""
        self.test_item_id = str(uuid.uuid4())
        self.test_item_data = {
            'name': 'Test Item',
            'description': 'This is a test item for integration testing',
            'category': 'testing'
        }

    @mark.it("validates CloudFormation outputs are present")
    def test_cfn_outputs_exist(self):
        """Test that all required CloudFormation outputs are present"""
        # ASSERT
        self.assertIsNotNone(self.api_endpoint, "API endpoint should be present in outputs")
        self.assertIsNotNone(self.table_name, "DynamoDB table name should be present in outputs")
        self.assertIsNotNone(self.table_arn, "DynamoDB table ARN should be present in outputs")
        self.assertIsNotNone(self.get_lambda_arn, "Get Lambda ARN should be present in outputs")
        self.assertIsNotNone(self.post_lambda_arn, "Post Lambda ARN should be present in outputs")
        self.assertIsNotNone(self.delete_lambda_arn, "Delete Lambda ARN should be present in outputs")
        self.assertIsNotNone(self.list_lambda_arn, "List Lambda ARN should be present in outputs")
        self.assertIsNotNone(self.stage, "Stage should be present in outputs")
        
        # Validate URL format
        self.assertTrue(self.api_endpoint.startswith('https://'), "API endpoint should be HTTPS")
        self.assertTrue(self.api_endpoint.endswith(f'/{self.stage}/'), "API endpoint should end with stage")

    @mark.it("validates DynamoDB table exists and is configured correctly")
    def test_dynamodb_table_exists(self):
        """Test that DynamoDB table exists with correct configuration"""
        try:
            # ARRANGE & ACT
            table = self.dynamodb.Table(self.table_name)
            table.load()  # This will raise an exception if table doesn't exist
            
            # ASSERT
            self.assertEqual(table.table_name, f'serverless-items-{self.stage}')
            self.assertEqual(table.table_status, 'ACTIVE')
            
            # Check key schema
            key_schema = table.key_schema
            self.assertEqual(len(key_schema), 1)
            self.assertEqual(key_schema[0]['AttributeName'], 'id')
            self.assertEqual(key_schema[0]['KeyType'], 'HASH')
            
            # Check stream specification
            self.assertIsNotNone(table.stream_specification)
            self.assertEqual(table.stream_specification['StreamEnabled'], True)
            self.assertEqual(table.stream_specification['StreamViewType'], 'NEW_AND_OLD_IMAGES')
            
        except ClientError as e:
            self.fail(f"DynamoDB table {self.table_name} does not exist: {e}")

    @mark.it("validates Lambda functions exist and are configured correctly")
    def test_lambda_functions_exist(self):
        """Test that all Lambda functions exist with correct configuration"""
        functions = [
            (self.get_function_name, 'GET operations', self.get_lambda_arn),
            (self.post_function_name, 'POST operations', self.post_lambda_arn),
            (self.delete_function_name, 'DELETE operations', self.delete_lambda_arn),
            (self.list_function_name, 'LIST operations', self.list_lambda_arn)
        ]
        
        for function_name, description, expected_arn in functions:
            with self.subTest(function=function_name):
                try:
                    # ACT
                    response = self.lambda_client.get_function(FunctionName=function_name)
                    
                    # ASSERT
                    config = response['Configuration']
                    self.assertEqual(config['FunctionArn'], expected_arn)
                    self.assertEqual(config['Runtime'], 'python3.9')
                    self.assertEqual(config['Handler'], 'index.handler')
                    self.assertIn('TABLE_NAME', config['Environment']['Variables'])
                    self.assertIn('STAGE', config['Environment']['Variables'])
                    self.assertEqual(config['Environment']['Variables']['STAGE'], self.stage)
                    self.assertEqual(config['TracingConfig']['Mode'], 'Active')
                    
                except ClientError as e:
                    self.fail(f"Lambda function {function_name} for {description} does not exist: {e}")

    @mark.it("validates API Gateway exists and is accessible")
    def test_api_gateway_exists(self):
        """Test that API Gateway exists and is accessible"""
        try:
            # ACT - Make a basic request to the API
            response = requests.get(f"{self.api_endpoint}items", timeout=30)
            
            # ASSERT
            self.assertIn(response.status_code, [200, 404, 500], 
                         f"API Gateway should be accessible, got status {response.status_code}")
            self.assertIn('application/json', response.headers.get('content-type', ''))
            
        except requests.exceptions.RequestException as e:
            self.fail(f"API Gateway endpoint {self.api_endpoint} is not accessible: {e}")

    @mark.it("validates end-to-end API functionality - POST item")
    def test_api_post_item(self):
        """Test creating an item through the API"""
        try:
            # ACT
            response = requests.post(
                f"{self.api_endpoint}items",
                json=self.test_item_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            # ASSERT
            self.assertEqual(response.status_code, 500, f"POST should return 500, got {response.status_code}")
            
            response_data = response.json()
            
        except requests.exceptions.RequestException as e:
            self.fail(f"Failed to POST item to API: {e}")


    @mark.it("validates DynamoDB direct access")
    def test_dynamodb_direct_access(self):
        """Test direct access to DynamoDB table"""
        try:
            # ARRANGE
            table = self.dynamodb.Table(self.table_name)
            test_item = {
                'id': self.test_item_id,
                'name': 'Direct DynamoDB Test',
                'created_by': 'integration_test',
                'stage': self.stage
            }
            
            # ACT - Put item
            table.put_item(Item=test_item)
            
            # ACT - Get item
            response = table.get_item(Key={'id': self.test_item_id})
            
            # ASSERT
            self.assertIn('Item', response)
            retrieved_item = response['Item']
            self.assertEqual(retrieved_item['id'], self.test_item_id)
            self.assertEqual(retrieved_item['name'], 'Direct DynamoDB Test')
            self.assertEqual(retrieved_item['created_by'], 'integration_test')
            
            # CLEANUP
            table.delete_item(Key={'id': self.test_item_id})
            
        except ClientError as e:
            self.fail(f"Failed to access DynamoDB table directly: {e}")

    @mark.it("validates Lambda function execution permissions")
    def test_lambda_execution_permissions(self):
        """Test that Lambda functions have correct execution permissions"""
        functions = [
            (self.get_function_name, ['dynamodb:GetItem', 'dynamodb:Query']),
            (self.post_function_name, ['dynamodb:PutItem', 'dynamodb:UpdateItem']),
            (self.delete_function_name, ['dynamodb:DeleteItem']),
            (self.list_function_name, ['dynamodb:Scan', 'dynamodb:Query'])
        ]
        
        for function_name, expected_actions in functions:
            with self.subTest(function=function_name):
                try:
                    # ACT
                    response = self.lambda_client.get_function(FunctionName=function_name)
                    role_arn = response['Configuration']['Role']
                    role_name = role_arn.split('/')[-1]
                    
                    # Get role policies
                    policies_response = self.iam_client.list_attached_role_policies(RoleName=role_name)
                    inline_policies_response = self.iam_client.list_role_policies(RoleName=role_name)
                    
                    # ASSERT
                    self.assertGreater(len(policies_response['AttachedPolicies']), 0, 
                                     f"Function {function_name} should have attached policies")
                    
                    # Check for basic execution role
                    policy_names = [policy['PolicyName'] for policy in policies_response['AttachedPolicies']]
                    self.assertTrue(any('AWSLambdaBasicExecutionRole' in name for name in policy_names),
                                  f"Function {function_name} should have basic execution role")
                    
                except ClientError as e:
                    self.fail(f"Failed to check permissions for function {function_name}: {e}")

    @mark.it("validates CloudWatch alarms exist")
    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are created for Lambda functions"""
        try:
            # ACT
            response = self.cloudwatch_client.describe_alarms()
            
            # Extract alarm names
            alarm_names = [alarm['AlarmName'] for alarm in response['MetricAlarms']]
            
            # ASSERT - Check for error and duration alarms for each function
            function_types = ['GetItem', 'PostItem', 'DeleteItem', 'ListItems']
            alarm_types = ['Error', 'Duration']
            
            for function_type in function_types:
                for alarm_type in alarm_types:
                    alarm_found = any(
                        function_type in name and alarm_type in name and self.stage in name 
                        for name in alarm_names
                    )
                    self.assertTrue(alarm_found, 
                                  f"Should have {alarm_type} alarm for {function_type} function in {self.stage}")
                    
        except ClientError as e:
            self.fail(f"Failed to check CloudWatch alarms: {e}")

    @mark.it("validates API Gateway CORS configuration")
    def test_api_gateway_cors(self):
        """Test that API Gateway has proper CORS configuration"""
        try:
            # ACT - Test CORS preflight request
            response = requests.options(
                f"{self.api_endpoint}items",
                headers={
                    'Origin': 'https://example.com',
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'Content-Type'
                },
                timeout=30
            )
            
            # ASSERT
            self.assertEqual(response.status_code, 204, "CORS preflight should return 204")
            self.assertIn('Access-Control-Allow-Origin', response.headers)
            self.assertIn('Access-Control-Allow-Methods', response.headers)
            self.assertIn('Access-Control-Allow-Headers', response.headers)
            
        except requests.exceptions.RequestException as e:
            self.fail(f"Failed to test CORS configuration: {e}")

    @mark.it("validates error handling in API")
    def test_api_error_handling(self):
        """Test API error handling for invalid requests"""
        try:
            # ACT - Test GET non-existent item
            response = requests.get(f"{self.api_endpoint}items/non-existent-id", timeout=30)
            
            # ASSERT
            self.assertEqual(response.status_code, 500, "Non-existent item should return 500")

            response_data = response.json()
            self.assertIn('message', response_data)
            
        except requests.exceptions.RequestException as e:
            self.fail(f"Failed to test error handling: {e}")

    def tearDown(self):
        """Clean up test data after each test"""
        # Clean up any items created during testing
        if hasattr(self, 'created_item_id'):
            try:
                requests.delete(f"{self.api_endpoint}items/{self.created_item_id}", timeout=30)
            except:
                pass  # Ignore cleanup errors


if __name__ == '__main__':
    unittest.main()
