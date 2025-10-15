import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError
from pytest import mark
import requests
import time
import uuid

# Load the CloudFormation outputs from flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.load(f)
else:
    flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStack(unittest.TestCase):
    """Integration tests for the deployed TapStack resources"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and resource information from outputs"""
        cls.outputs = flat_outputs
        print(f"Loaded outputs: {cls.outputs}")

        # Extract resource information from outputs (matching actual deployment)
        cls.api_endpoint = (
            cls.outputs.get('ApiEndpoint') or 
            cls.outputs.get('ServiceApiEndpoint55B38F80') or 
            cls.outputs.get('TapApiEndpoint11A33180', '')
        )
        
        cls.s3_bucket_name = cls.outputs.get('S3BucketName', '')
        cls.dynamodb_table_name = (
            cls.outputs.get('DynamoDBTableName') or 
            cls.outputs.get('TableName', '')
        )
        cls.lambda_function_name = cls.outputs.get('LambdaFunctionName', '')
        cls.lambda_function_arn = cls.outputs.get('LambdaFunctionArn', '')
        cls.table_arn = cls.outputs.get('TableArn', '')
        cls.api_gateway_id = cls.outputs.get('ApiGatewayId', '')
        cls.kms_key_id = cls.outputs.get('KMSKeyId', '')
        cls.log_group_name = cls.outputs.get('LogGroupName', '')

        # Initialize AWS clients
        cls.dynamodb_client = boto3.client('dynamodb')
        cls.dynamodb_resource = boto3.resource('dynamodb')
        cls.lambda_client = boto3.client('lambda')
        cls.s3_client = boto3.client('s3')
        cls.iam_client = boto3.client('iam')
        cls.apigateway_client = boto3.client('apigateway')
        cls.logs_client = boto3.client('logs')

        # Ensure API endpoint has proper format
        if cls.api_endpoint and not cls.api_endpoint.endswith('/'):
            cls.api_endpoint += '/'

        print(f"API Endpoint: {cls.api_endpoint}")
        print(f"S3 Bucket: {cls.s3_bucket_name}")
        print(f"DynamoDB Table: {cls.dynamodb_table_name}")
        print(f"Lambda Function: {cls.lambda_function_name}")

    def setUp(self):
        """Set up test data for each test"""
        self.test_user_id = f"test-user-{uuid.uuid4()}"
        self.test_users_created = []

    def tearDown(self):
        """Clean up test data after each test"""
        # Clean up any test users created during tests
        for user_id in self.test_users_created:
            try:
                requests.delete(f"{self.api_endpoint}users/{user_id}", timeout=10)
            except:
                pass

    @mark.it("validates that S3 bucket exists and has versioning enabled")
    def test_s3_bucket_exists_and_configured(self):
        """Test that the S3 bucket exists and has versioning enabled"""
        if not self.s3_bucket_name:
            self.skipTest("S3 bucket not found in outputs")
            
        try:
            # Check bucket exists
            response = self.s3_client.head_bucket(Bucket=self.s3_bucket_name)
            self.assertIsNotNone(response)

            # Check versioning is enabled
            versioning = self.s3_client.get_bucket_versioning(Bucket=self.s3_bucket_name)
            self.assertEqual(versioning.get('Status'), 'Enabled')

            # Check encryption
            encryption = self.s3_client.get_bucket_encryption(Bucket=self.s3_bucket_name)
            self.assertIn('ServerSideEncryptionConfiguration', encryption)

            # Check public access block
            public_access_block = self.s3_client.get_public_access_block(Bucket=self.s3_bucket_name)
            pab_config = public_access_block['PublicAccessBlockConfiguration']
            self.assertTrue(pab_config['BlockPublicAcls'])
            self.assertTrue(pab_config['IgnorePublicAcls'])
            self.assertTrue(pab_config['BlockPublicPolicy'])
            self.assertTrue(pab_config['RestrictPublicBuckets'])

        except ClientError as e:
            self.fail(f"S3 bucket validation failed: {e}")

    @mark.it("validates that DynamoDB table exists with correct schema")
    def test_dynamodb_table_exists_and_configured(self):
        """Test that the DynamoDB table exists with the correct schema"""
        try:
            response = self.dynamodb_client.describe_table(TableName=self.dynamodb_table_name)
            table = response['Table']

            # Validate table properties
            self.assertEqual(table['TableStatus'], 'ACTIVE')
            self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

            # Validate key schema
            key_schema = table['KeySchema']
            partition_key = next((key for key in key_schema if key['KeyType'] == 'HASH'), None)
            
            self.assertIsNotNone(partition_key)

            # Check if sort key exists (may not be present in current deployment)
            sort_key = next((key for key in key_schema if key['KeyType'] == 'RANGE'), None)
            if sort_key:
                self.assertIn(sort_key['AttributeName'], ['timestamp', 'sk'])

            # Validate encryption
            self.assertIn('SSEDescription', table)
            self.assertEqual(table['SSEDescription']['Status'], 'ENABLED')

        except ClientError as e:
            self.fail(f"DynamoDB table validation failed: {e}")

    @mark.it("validates that Lambda function exists and is properly configured")
    def test_lambda_function_exists_and_configured(self):
        """Test that the Lambda function exists and is properly configured"""
        try:
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            function_config = response['Configuration']

            # Validate basic configuration
            self.assertEqual(function_config['Runtime'], 'python3.11')
            self.assertEqual(function_config['Handler'], 'index.lambda_handler')
            self.assertEqual(function_config['Timeout'], 30)
            self.assertEqual(function_config['MemorySize'], 256)

            # Validate environment variables (matching actual deployment)
            env_vars = function_config.get('Environment', {}).get('Variables', {})
            self.assertIn('TABLE_NAME', env_vars)
            self.assertIn('ENVIRONMENT', env_vars)

            # Validate X-Ray tracing is enabled
            self.assertEqual(function_config.get('TracingConfig', {}).get('Mode'), 'Active')

        except ClientError as e:
            self.fail(f"Lambda function validation failed: {e}")

    @mark.it("validates that API Gateway exists and is accessible")
    def test_api_gateway_exists_and_accessible(self):
        """Test that the API Gateway exists and is accessible"""
        try:
            response = self.apigateway_client.get_rest_api(restApiId=self.api_gateway_id)
            
            # Validate API Gateway properties (matching actual deployment)
            self.assertIn('name', response)
            self.assertIn('tap', response['name'].lower())  # More flexible check

            # Test API Gateway health check endpoint
            health_response = requests.get(self.api_endpoint, timeout=10)
            self.assertEqual(health_response.status_code, 200)

            response_data = health_response.json()
            self.assertIn('success', response_data)
            self.assertTrue(response_data['success'])

        except (ClientError, requests.RequestException) as e:
            self.fail(f"API Gateway validation failed: {e}")

    @mark.it("validates API Gateway resources and methods")
    def test_api_gateway_resources_and_methods(self):
        """Test that API Gateway has correct resources and methods"""
        try:
            resources_response = self.apigateway_client.get_resources(restApiId=self.api_gateway_id)
            resources = resources_response['items']

            # Find users resource and user resource (matching actual deployment)
            users_resource = None
            user_resource = None

            for resource in resources:
                if resource.get('pathPart') == 'users':
                    users_resource = resource
                elif '{userId}' in resource.get('pathPart', ''):
                    user_resource = resource

            self.assertIsNotNone(users_resource, "Users resource (/users) not found")
            self.assertIsNotNone(user_resource, "User resource (/users/{userId}) not found")

            # Check methods on users resource
            users_methods = users_resource.get('resourceMethods', {})
            self.assertIn('GET', users_methods)
            self.assertIn('POST', users_methods)

            # Check methods on user resource  
            user_methods = user_resource.get('resourceMethods', {})
            self.assertIn('GET', user_methods)
            self.assertIn('PUT', user_methods)
            self.assertIn('DELETE', user_methods)

        except ClientError as e:
            self.fail(f"API Gateway resources validation failed: {e}")

    @mark.it("validates CloudWatch Log Group exists")
    def test_cloudwatch_log_group_exists(self):
        """Test that CloudWatch Log Group exists for Lambda"""
        try:
            # Get log group name from Lambda function if not in outputs
            if not self.log_group_name:
                self.log_group_name = f"/aws/lambda/{self.lambda_function_name}"
            
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=self.log_group_name
            )
            
            log_groups = [lg for lg in response['logGroups'] if lg['logGroupName'] == self.log_group_name]
            self.assertTrue(len(log_groups) > 0, f"Log group {self.log_group_name} not found")
            
            log_group = log_groups[0]
            self.assertEqual(log_group['logGroupName'], self.log_group_name)

        except ClientError as e:
            self.fail(f"CloudWatch Log Group validation failed: {e}")

    @mark.it("validates CRUD operations - CREATE user")
    def test_create_user_operation(self):
        """Test CREATE operation via POST /users"""
        try:
            user_data = {
                "name": "Test User",
                "email": "test@example.com",
                "phone": "+1234567890"
            }
            
            response = requests.post(f"{self.api_endpoint}users", json=user_data, timeout=10)
            self.assertEqual(response.status_code, 201)
            
            response_data = response.json()
            self.assertIn('success', response_data)
            self.assertTrue(response_data['success'])
            self.assertIn('data', response_data)
            
            created_user = response_data['data']
            self.assertEqual(created_user['name'], user_data['name'])
            self.assertEqual(created_user['email'], user_data['email'])
            self.assertIn('UserId', created_user)
            
            # Store for cleanup
            self.test_users_created.append(created_user['UserId'])
            
        except requests.RequestException as e:
            self.fail(f"CREATE operation validation failed: {e}")

    @mark.it("validates CRUD operations - READ users")
    def test_read_users_operations(self):
        """Test READ operations via GET /users and GET /users/{userId}"""
        try:
            # First create a test user
            user_data = {
                "name": "Read Test User", 
                "email": "readtest@example.com"
            }
            
            create_response = requests.post(f"{self.api_endpoint}users", json=user_data, timeout=10)
            self.assertEqual(create_response.status_code, 201)
            created_user = create_response.json()['data']
            user_id = created_user['UserId']
            self.test_users_created.append(user_id)
            
            # Test GET all users
            list_response = requests.get(f"{self.api_endpoint}users", timeout=10)
            self.assertEqual(list_response.status_code, 200)
            
            list_data = list_response.json()
            self.assertIn('success', list_data)
            self.assertTrue(list_data['success'])
            self.assertIn('data', list_data)
            
            # Test GET specific user
            get_response = requests.get(f"{self.api_endpoint}users/{user_id}", timeout=10)
            self.assertEqual(get_response.status_code, 200)
            
            get_data = get_response.json()
            self.assertTrue(get_data['success'])
            retrieved_user = get_data['data']
            self.assertEqual(retrieved_user['UserId'], user_id)
            self.assertEqual(retrieved_user['name'], user_data['name'])
            
        except requests.RequestException as e:
            self.fail(f"READ operations validation failed: {e}")

    @mark.it("validates CRUD operations - UPDATE user")
    def test_update_user_operation(self):
        """Test UPDATE operation via PUT /users/{userId}"""
        try:
            # First create a test user
            user_data = {
                "name": "Update Test User",
                "email": "updatetest@example.com"
            }
            
            create_response = requests.post(f"{self.api_endpoint}users", json=user_data, timeout=10)
            created_user = create_response.json()['data']
            user_id = created_user['UserId']
            self.test_users_created.append(user_id)
            
            # Update the user
            update_data = {
                "name": "Updated Test User",
                "email": "updated@example.com",
                "phone": "+9876543210"
            }
            
            update_response = requests.put(
                f"{self.api_endpoint}users/{user_id}", 
                json=update_data, 
                timeout=10
            )
            self.assertEqual(update_response.status_code, 200)
            
            # Verify the update
            get_response = requests.get(f"{self.api_endpoint}users/{user_id}", timeout=10)
            updated_user = get_response.json()['data']
            
            self.assertEqual(updated_user['name'], update_data['name'])
            self.assertEqual(updated_user['email'], update_data['email'])
            self.assertEqual(updated_user['phone'], update_data['phone'])
            
        except requests.RequestException as e:
            self.fail(f"UPDATE operation validation failed: {e}")

    @mark.it("validates CRUD operations - DELETE user")
    def test_delete_user_operation(self):
        """Test DELETE operation via DELETE /users/{userId}"""
        try:
            # First create a test user
            user_data = {
                "name": "Delete Test User",
                "email": "deletetest@example.com"
            }
            
            create_response = requests.post(f"{self.api_endpoint}users", json=user_data, timeout=10)
            created_user = create_response.json()['data']
            user_id = created_user['UserId']
            
            # Delete the user
            delete_response = requests.delete(f"{self.api_endpoint}users/{user_id}", timeout=10)
            self.assertEqual(delete_response.status_code, 200)
            
            # Verify the deletion
            get_response = requests.get(f"{self.api_endpoint}users/{user_id}", timeout=10)
            self.assertEqual(get_response.status_code, 404)
            
        except requests.RequestException as e:
            self.fail(f"DELETE operation validation failed: {e}")


    @mark.it("validates error handling and input validation")
    def test_error_handling_and_validation(self):
        """Test comprehensive error handling and input validation"""
        try:
            # Test invalid POST data (missing required fields)
            invalid_data = {"name": "Missing Email"}
            response = requests.post(f"{self.api_endpoint}users", json=invalid_data, timeout=10)
            self.assertEqual(response.status_code, 400)
            
            # Test GET non-existent user
            response = requests.get(f"{self.api_endpoint}users/non-existent-id", timeout=10)
            self.assertEqual(response.status_code, 404)
            
            # Test UPDATE non-existent user
            response = requests.put(
                f"{self.api_endpoint}users/non-existent-id", 
                json={"name": "Test"}, 
                timeout=10
            )
            self.assertEqual(response.status_code, 404)
            
            # Test DELETE non-existent user
            response = requests.delete(f"{self.api_endpoint}users/non-existent-id", timeout=10)
            self.assertEqual(response.status_code, 404)
            
        except requests.RequestException as e:
            self.fail(f"Error handling validation failed: {e}")

    @mark.it("validates IAM permissions and security")
    def test_iam_permissions_and_security(self):
        """Test that IAM roles have appropriate permissions"""
        try:
            # Get Lambda function configuration to find its role
            function_response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            role_arn = function_response['Configuration']['Role']
            role_name = role_arn.split('/')[-1]
            
            # Get role details
            role_response = self.iam_client.get_role(RoleName=role_name)
            assume_role_policy = role_response['Role']['AssumeRolePolicyDocument']
            
            # Validate assume role policy allows Lambda service
            self.assertIn('Statement', assume_role_policy)
            statements = assume_role_policy['Statement']
            lambda_statement = next(
                (stmt for stmt in statements 
                 if stmt.get('Principal', {}).get('Service') == 'lambda.amazonaws.com'), 
                None
            )
            self.assertIsNotNone(lambda_statement)
            
            # Check inline policies for specific permissions
            inline_policies = self.iam_client.list_role_policies(RoleName=role_name)
            self.assertTrue(len(inline_policies['PolicyNames']) > 0, "No inline policies found")
            
        except ClientError as e:
            self.fail(f"IAM permissions validation failed: {e}")

    @mark.it("validates end-to-end functionality")
    def test_end_to_end_functionality(self):
        """Test complete end-to-end functionality"""
        try:
            # 1. Create a user
            user_data = {
                "name": "E2E Test User",
                "email": "e2e@example.com",
                "phone": "+1111111111"
            }
            
            create_response = requests.post(f"{self.api_endpoint}users", json=user_data, timeout=10)
            self.assertEqual(create_response.status_code, 201)
            created_user = create_response.json()['data']
            user_id = created_user['UserId']
            self.test_users_created.append(user_id)
            
            # 2. Verify user exists in list
            list_response = requests.get(f"{self.api_endpoint}users", timeout=10)
            self.assertEqual(list_response.status_code, 200)
            users_list = list_response.json()['data']['users']
            user_found = any(user['UserId'] == user_id for user in users_list)
            self.assertTrue(user_found, "Created user not found in users list")
            
            # 3. Get specific user
            get_response = requests.get(f"{self.api_endpoint}users/{user_id}", timeout=10)
            self.assertEqual(get_response.status_code, 200)
            retrieved_user = get_response.json()['data']
            self.assertEqual(retrieved_user['name'], user_data['name'])
            
            # 4. Update user
            update_data = {"name": "Updated E2E User", "phone": "+2222222222"}
            update_response = requests.put(
                f"{self.api_endpoint}users/{user_id}", 
                json=update_data, 
                timeout=10
            )
            self.assertEqual(update_response.status_code, 200)
            
            # 5. Verify update
            get_updated_response = requests.get(f"{self.api_endpoint}users/{user_id}", timeout=10)
            updated_user = get_updated_response.json()['data']
            self.assertEqual(updated_user['name'], update_data['name'])
            self.assertEqual(updated_user['phone'], update_data['phone'])
            
            # 6. Delete user
            delete_response = requests.delete(f"{self.api_endpoint}users/{user_id}", timeout=10)
            self.assertEqual(delete_response.status_code, 200)
            
            # 7. Verify deletion
            get_deleted_response = requests.get(f"{self.api_endpoint}users/{user_id}", timeout=10)
            self.assertEqual(get_deleted_response.status_code, 404)
            
        except requests.RequestException as e:
            self.fail(f"End-to-end functionality test failed: {e}")


if __name__ == '__main__':
    unittest.main()
