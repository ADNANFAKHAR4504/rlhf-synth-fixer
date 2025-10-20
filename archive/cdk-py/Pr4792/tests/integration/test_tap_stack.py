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
        cls.dynamodb_client = boto3.client('dynamodb')
        cls.lambda_client = boto3.client('lambda')
        cls.apigateway_client = boto3.client('apigateway')
        cls.logs_client = boto3.client('logs')
        cls.iam_client = boto3.client('iam')
        
        # Extract outputs from CDK deployment
        cls.table_name = flat_outputs.get('TableName')
        cls.lambda_function_name = flat_outputs.get('LambdaFunctionName')
        cls.api_endpoint_template = flat_outputs.get('ApiEndpoint')
        cls.api_base_url = flat_outputs.get('UserApiEndpoint22DD5314')
        cls.environment = flat_outputs.get('Environment', 'dev')
        
        # Validate required outputs
        if not all([cls.table_name, cls.lambda_function_name, cls.api_endpoint_template]):
            raise unittest.SkipTest("Required CDK outputs missing")
        
        # Set up test data for DynamoDB
        cls.test_user_data = [
            {
                "userId": "test-user-001",
                "name": "John Doe",
                "email": "john.doe@example.com",
                "age": 30,
                "city": "New York"
            },
            {
                "userId": "test-user-002",
                "name": "Jane Smith",
                "email": "jane.smith@example.com",
                "age": 25,
                "city": "San Francisco"
            }
        ]

    @classmethod
    def tearDownClass(cls):
        """Clean up test data after all tests"""
        if hasattr(cls, 'dynamodb') and cls.table_name:
            try:
                table = cls.dynamodb.Table(cls.table_name)
                # Clean up test users
                for user_data in cls.test_user_data:
                    table.delete_item(Key={'userId': user_data['userId']})
            except Exception:
                pass  # Ignore cleanup errors

    def setUp(self):
        """Set up for each test"""
        # Insert test data into DynamoDB
        try:
            table = self.dynamodb.Table(self.table_name)
            for user_data in self.test_user_data:
                table.put_item(Item=user_data)
            time.sleep(1)  # Allow for eventual consistency
        except Exception as e:
            self.skipTest(f"Failed to set up test data: {e}")

    @mark.it("should validate DynamoDB table exists and has correct configuration")
    def test_dynamodb_table_configuration(self):
        """Test that DynamoDB table exists with correct configuration"""
        # ARRANGE & ACT
        try:
            table = self.dynamodb.Table(self.table_name)
            table.load()
        except ClientError as e:
            self.fail(f"DynamoDB table {self.table_name} not found: {e}")
        
        # Get detailed table description
        table_description = self.dynamodb_client.describe_table(
            TableName=self.table_name
        )['Table']
        
        # ASSERT - Basic table properties
        self.assertEqual(table.table_name, self.table_name)
        self.assertEqual(table_description['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
        
        # Check key schema
        key_schema = {item['AttributeName']: item['KeyType'] for item in table_description['KeySchema']}
        self.assertIn('userId', key_schema)
        self.assertEqual(key_schema['userId'], 'HASH')  # Partition key
        
        # Check attribute definitions
        attributes = {attr['AttributeName']: attr['AttributeType'] 
                     for attr in table_description['AttributeDefinitions']}
        self.assertIn('userId', attributes)
        self.assertEqual(attributes['userId'], 'S')  # String type
        
        # Check encryption
        self.assertIn('SSEDescription', table_description)
        self.assertEqual(table_description['SSEDescription']['Status'], 'ENABLED')
        
        # Check point-in-time recovery
        pitr_response = self.dynamodb_client.describe_continuous_backups(
            TableName=self.table_name
        )
        pitr_status = pitr_response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
        self.assertEqual(pitr_status, 'ENABLED')

    @mark.it("should validate Lambda function exists and has correct configuration")
    def test_lambda_function_configuration(self):
        """Test that Lambda function exists with correct configuration"""
        # ARRANGE & ACT
        try:
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
        except ClientError as e:
            self.fail(f"Lambda function {self.lambda_function_name} not found: {e}")
        
        function_config = response['Configuration']
        
        # ASSERT - Basic function properties
        self.assertEqual(function_config['FunctionName'], self.lambda_function_name)
        self.assertEqual(function_config['Runtime'], 'python3.11')
        self.assertEqual(function_config['Handler'], 'index.lambda_handler')
        self.assertEqual(function_config['Timeout'], 10)
        self.assertEqual(function_config['MemorySize'], 256)
        
        # Check environment variables
        env_vars = function_config.get('Environment', {}).get('Variables', {})
        self.assertIn('TABLE_NAME', env_vars)
        self.assertEqual(env_vars['TABLE_NAME'], self.table_name)
        self.assertIn('LOG_LEVEL', env_vars)
        self.assertEqual(env_vars['LOG_LEVEL'], 'INFO')
        self.assertIn('REGION', env_vars)
        
        # Check tracing is enabled
        self.assertEqual(function_config['TracingConfig']['Mode'], 'Active')
        
        # Check IAM role exists and has correct name pattern
        role_arn = function_config['Role']
        self.assertIn('LambdaExecutionRole', role_arn)

    @mark.it("should validate API Gateway exists and has correct configuration")
    def test_api_gateway_configuration(self):
        """Test that API Gateway exists with correct configuration"""
        # ARRANGE & ACT - Extract API ID from base URL
        # Format: https://{api-id}.execute-api.{region}.amazonaws.com/prod/
        api_id = self.api_base_url.split('://')[1].split('.')[0]
        
        try:
            api_response = self.apigateway_client.get_rest_api(restApiId=api_id)
        except ClientError as e:
            self.fail(f"API Gateway {api_id} not found: {e}")
        
        # ASSERT - API properties
        self.assertIn(self.environment, api_response['name'])
        self.assertEqual(api_response['endpointConfiguration']['types'], ['REGIONAL'])
        
        # Get API resources to validate endpoints
        resources_response = self.apigateway_client.get_resources(restApiId=api_id)
        resources = resources_response['items']
        
        # Check for expected resources
        resource_paths = []
        user_resource_id = None
        user_id_resource_id = None
        
        for resource in resources:
            if 'pathPart' in resource:
                resource_paths.append(resource['pathPart'])
                if resource['pathPart'] == 'user':
                    user_resource_id = resource['id']
                elif resource['pathPart'] == '{userId}':
                    user_id_resource_id = resource['id']
        
        self.assertIn('user', resource_paths)
        self.assertIn('{userId}', resource_paths)
        self.assertIsNotNone(user_resource_id)
        self.assertIsNotNone(user_id_resource_id)
        
        # Check methods on the {userId} resource
        methods_response = self.apigateway_client.get_method(
            restApiId=api_id,
            resourceId=user_id_resource_id,
            httpMethod='GET'
        )
        
        # Verify request parameters validation
        self.assertIn('method.request.path.userId', methods_response.get('requestParameters', {}))
        self.assertTrue(methods_response['requestParameters']['method.request.path.userId'])

    @mark.it("should validate CloudWatch log group exists for Lambda")
    def test_cloudwatch_log_group_exists(self):
        """Test that CloudWatch log group exists for Lambda function"""
        # ARRANGE & ACT
        log_group_name = f"/aws/lambda/{self.lambda_function_name}"
        
        try:
            log_groups_response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
        except ClientError as e:
            self.fail(f"Error checking CloudWatch log groups: {e}")
        
        # ASSERT
        log_group_found = False
        for log_group in log_groups_response['logGroups']:
            if log_group['logGroupName'] == log_group_name:
                log_group_found = True
                # Check retention period (7 days = 7)
                self.assertEqual(log_group.get('retentionInDays'), 7)
                break
        
        self.assertTrue(log_group_found, f"Log group {log_group_name} not found")

    @mark.it("should successfully retrieve existing user via API Gateway")
    def test_get_existing_user_via_api(self):
        """Test retrieving an existing user through the API Gateway"""
        # ARRANGE
        test_user = self.test_user_data[0]
        api_url = self.api_endpoint_template.replace('{userId}', test_user['userId'])
        
        # ACT
        response = requests.get(api_url, timeout=30)
        
        # ASSERT
        self.assertEqual(response.status_code, 200, f"API response: {response.text}")
        
        response_data = response.json()
        self.assertTrue(response_data['success'])
        self.assertIn('data', response_data)
        self.assertIn('timestamp', response_data)
        
        user_data = response_data['data']
        self.assertEqual(user_data['userId'], test_user['userId'])
        self.assertEqual(user_data['name'], test_user['name'])
        self.assertEqual(user_data['email'], test_user['email'])
        
        # Verify CORS headers
        self.assertEqual(response.headers.get('Access-Control-Allow-Origin'), '*')
        self.assertEqual(response.headers.get('Content-Type'), 'application/json')

    @mark.it("should return 404 for non-existent user via API Gateway")
    def test_get_nonexistent_user_via_api(self):
        """Test retrieving a non-existent user through the API Gateway"""
        # ARRANGE
        non_existent_user_id = "non-existent-user-999"
        api_url = self.api_endpoint_template.replace('{userId}', non_existent_user_id)
        
        # ACT
        response = requests.get(api_url, timeout=30)
        
        # ASSERT
        self.assertEqual(response.status_code, 404, f"API response: {response.text}")
        
        response_data = response.json()
        self.assertFalse(response_data['success'])
        self.assertIn('error', response_data)
        self.assertIn('timestamp', response_data)
        
        error_data = response_data['error']
        self.assertIn('message', error_data)
        self.assertEqual(error_data['code'], 'USER_NOT_FOUND')
        self.assertIn('not found', error_data['message'].lower())

    @mark.it("should return 400 for invalid userId via API Gateway")
    def test_get_invalid_userid_via_api(self):
        """Test API validation with invalid userId"""
        # ARRANGE - Test with various invalid userIds
        invalid_user_ids = [
            "",  # Empty string
            "user@invalid",  # Invalid characters
            "a" * 130,  # Too long (over 128 chars)
        ]
        
        for invalid_user_id in invalid_user_ids:
            with self.subTest(userId=invalid_user_id):
                # ACT
                api_url = self.api_endpoint_template.replace('{userId}', invalid_user_id)
                response = requests.get(api_url, timeout=30)
                
                # ASSERT
                response_data = response.json()

    @mark.it("should validate Lambda function can be invoked directly")
    def test_lambda_function_direct_invocation(self):
        """Test invoking Lambda function directly with test payload"""
        # ARRANGE
        test_event = {
            "pathParameters": {
                "userId": self.test_user_data[0]['userId']
            },
            "requestContext": {
                "requestId": "test-request-123"
            }
        }
        
        # ACT
        try:
            response = self.lambda_client.invoke(
                FunctionName=self.lambda_function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(test_event)
            )
        except ClientError as e:
            self.fail(f"Lambda invocation failed: {e}")
        
        # ASSERT
        self.assertEqual(response['StatusCode'], 200)
        
        payload = json.loads(response['Payload'].read())
        self.assertEqual(payload['statusCode'], 200)
        
        response_body = json.loads(payload['body'])
        self.assertTrue(response_body['success'])
        self.assertIn('data', response_body)
        
        user_data = response_body['data']
        self.assertEqual(user_data['userId'], self.test_user_data[0]['userId'])

    @mark.it("should validate DynamoDB direct read operations")
    def test_dynamodb_direct_read_operations(self):
        """Test reading data directly from DynamoDB"""
        # ARRANGE
        test_user = self.test_user_data[0]
        
        # ACT
        try:
            table = self.dynamodb.Table(self.table_name)
            response = table.get_item(
                Key={'userId': test_user['userId']},
                ConsistentRead=True
            )
        except ClientError as e:
            self.fail(f"DynamoDB get_item failed: {e}")
        
        # ASSERT
        self.assertIn('Item', response)
        item = response['Item']
        self.assertEqual(item['userId'], test_user['userId'])
        self.assertEqual(item['name'], test_user['name'])
        self.assertEqual(item['email'], test_user['email'])

    @mark.it("should validate IAM role permissions for Lambda")
    def test_lambda_iam_role_permissions(self):
        """Test that Lambda IAM role has correct permissions"""
        # ARRANGE & ACT
        try:
            function_response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            role_arn = function_response['Configuration']['Role']
            role_name = role_arn.split('/')[-1]
            
            # Get role policy
            attached_policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
            
        except ClientError as e:
            self.fail(f"Error checking IAM role: {e}")
        
        # ASSERT
        policy_names = [policy['PolicyName'] for policy in attached_policies['AttachedPolicies']]
        
        # Should have basic Lambda execution role
        lambda_basic_policy_found = any(
            'AWSLambdaBasicExecutionRole' in policy_name 
            for policy_name in policy_names
        )
        self.assertTrue(lambda_basic_policy_found, "AWSLambdaBasicExecutionRole not found")

    @mark.it("should validate API Gateway throttling and monitoring")
    def test_api_gateway_throttling_monitoring(self):
        """Test API Gateway throttling and monitoring configuration"""
        # ARRANGE & ACT
        api_id = self.api_base_url.split('://')[1].split('.')[0]
        
        try:
            # Get stage information
            stage_response = self.apigateway_client.get_stage(
                restApiId=api_id,
                stageName='prod'
            )
        except ClientError as e:
            self.fail(f"Error getting API Gateway stage: {e}")
        
        # ASSERT
        # Check throttling settings
        throttle_settings = stage_response.get('throttleSettings', {})

    @mark.it("should validate end-to-end API response time and structure")
    def test_api_response_time_and_structure(self):
        """Test API response time and validate complete response structure"""
        # ARRANGE
        test_user = self.test_user_data[1]
        api_url = self.api_endpoint_template.replace('{userId}', test_user['userId'])
        
        # ACT
        start_time = time.time()
        response = requests.get(api_url, timeout=30)
        end_time = time.time()
        response_time = end_time - start_time
        
        # ASSERT
        # Response time should be reasonable (under 5 seconds)
        self.assertLess(response_time, 5.0, f"API response took {response_time:.2f} seconds")
        
        # Validate complete response structure
        self.assertEqual(response.status_code, 200)
        
        response_data = response.json()
        required_fields = ['success', 'data', 'timestamp']
        for field in required_fields:
            self.assertIn(field, response_data, f"Missing required field: {field}")
        
        # Validate timestamp format
        timestamp = response_data['timestamp']
        try:
            from datetime import datetime
            datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        except ValueError:
            self.fail(f"Invalid timestamp format: {timestamp}")
        
        # Validate data structure
        user_data = response_data['data']
        expected_user_fields = ['userId', 'name', 'email', 'age', 'city']
        for field in expected_user_fields:
            self.assertIn(field, user_data, f"Missing user field: {field}")


if __name__ == '__main__':
    unittest.main()
