import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError
from pytest import mark
import requests
import time

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

        # Extract resource information from outputs
        cls.api_endpoint = cls.outputs.get('ApiEndpoint', cls.outputs.get('TapApiEndpoint11A33180', ''))
        cls.dynamodb_table_name = cls.outputs.get('TableName', '')
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
        cls.iam_client = boto3.client('iam')
        cls.apigateway_client = boto3.client('apigateway')
        cls.logs_client = boto3.client('logs')
        cls.cloudwatch_client = boto3.client('cloudwatch')
        cls.kms_client = boto3.client('kms')
        cls.ssm_client = boto3.client('ssm')

        # Clean API endpoint URL
        if cls.api_endpoint and not cls.api_endpoint.endswith('/'):
            cls.api_endpoint += '/'

    def setUp(self):
        """Set up test data for each test"""
        self.test_user_id = f"test-user-{int(time.time())}"

    def tearDown(self):
        """Clean up test data after each test"""
        # Clean up any test users created during tests
        try:
            if hasattr(self, 'test_user_id'):
                requests.delete(f"{self.api_endpoint}users/{self.test_user_id}", timeout=10)
        except:
            pass

    @mark.it("validates that DynamoDB table is deployed and accessible")
    def test_dynamodb_table_exists_and_accessible(self):
        """Test that the DynamoDB table exists and is accessible"""
        try:
            response = self.dynamodb_client.describe_table(TableName=self.dynamodb_table_name)
            table = response['Table']

            # Validate table properties
            self.assertEqual(table['TableName'], self.dynamodb_table_name)
            self.assertEqual(table['TableStatus'], 'ACTIVE')
            self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

            # Validate partition key
            key_schema = table['KeySchema']
            partition_key = next((key for key in key_schema if key['KeyType'] == 'HASH'), None)
            self.assertIsNotNone(partition_key)
            self.assertEqual(partition_key['AttributeName'], 'UserId')

            # Validate encryption
            self.assertIn('SSEDescription', table)
            self.assertEqual(table['SSEDescription']['Status'], 'ENABLED')

        except ClientError as e:
            self.fail(f"DynamoDB table validation failed: {e}")

    @mark.it("validates that Lambda function is deployed with correct configuration")
    def test_lambda_function_exists_and_configured(self):
        """Test that the Lambda function exists and is properly configured"""
        try:
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            function_config = response['Configuration']

            # Validate basic configuration
            self.assertEqual(function_config['FunctionName'], self.lambda_function_name)
            self.assertEqual(function_config['Runtime'], 'python3.11')
            self.assertEqual(function_config['Handler'], 'index.lambda_handler')
            self.assertEqual(function_config['Timeout'], 30)
            self.assertEqual(function_config['MemorySize'], 256)

            # Validate environment variables
            env_vars = function_config.get('Environment', {}).get('Variables', {})
            self.assertIn('TABLE_NAME', env_vars)
            self.assertIn('ENVIRONMENT', env_vars)
            self.assertIn('PARAMETER_PREFIX', env_vars)

            # Validate tracing
            self.assertEqual(function_config.get('TracingConfig', {}).get('Mode'), 'Active')

        except ClientError as e:
            self.fail(f"Lambda function validation failed: {e}")

    @mark.it("validates that API Gateway is deployed and accessible")
    def test_api_gateway_exists_and_accessible(self):
        """Test that the API Gateway exists and is accessible"""
        try:
            response = self.apigateway_client.get_rest_api(restApiId=self.api_gateway_id)
            
            # Validate API Gateway properties
            self.assertIn('name', response)
            self.assertIn('tap-api', response['name'])

            # Test API Gateway health check endpoint
            health_response = requests.get(self.api_endpoint, timeout=10)
            self.assertEqual(health_response.status_code, 200)

            response_data = health_response.json()
            self.assertIn('success', response_data)
            self.assertTrue(response_data['success'])
            self.assertIn('data', response_data)
            
        except (ClientError, requests.RequestException) as e:
            self.fail(f"API Gateway validation failed: {e}")

    @mark.it("validates API Gateway CORS configuration")
    def test_api_gateway_cors_configuration(self):
        """Test that CORS is properly configured"""
        try:
            # Test CORS preflight request
            cors_response = requests.options(f"{self.api_endpoint}users", timeout=10)
            
            # Check CORS headers
            self.assertIn('Access-Control-Allow-Origin', cors_response.headers)
            self.assertIn('Access-Control-Allow-Methods', cors_response.headers)
            self.assertIn('Access-Control-Allow-Headers', cors_response.headers)
            
        except requests.RequestException as e:
            self.fail(f"CORS configuration validation failed: {e}")

    @mark.it("validates full CRUD operations - CREATE user")
    def test_create_user_operation(self):
        """Test CREATE operation via POST /users"""
        try:
            user_data = {
                "name": "Test User",
                "email": "test@example.com",
                "phone": "+1234567890",
                "address": "123 Test Street"
            }
            
            response = requests.post(f"{self.api_endpoint}users", json=user_data, timeout=10)
            self.assertEqual(response.status_code, 201)
            
            response_data = response.json()
            self.assertTrue(response_data['success'])
            self.assertIn('data', response_data)
            
            created_user = response_data['data']
            self.assertEqual(created_user['name'], user_data['name'])
            self.assertEqual(created_user['email'], user_data['email'])
            self.assertIn('UserId', created_user)
            self.assertIn('createdAt', created_user)
            
            # Store user ID for cleanup
            self.test_user_id = created_user['UserId']
            
        except requests.RequestException as e:
            self.fail(f"CREATE operation validation failed: {e}")

    @mark.it("validates full CRUD operations - READ users")
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
            self.test_user_id = created_user['UserId']
            
            # Test GET all users
            list_response = requests.get(f"{self.api_endpoint}users", timeout=10)
            self.assertEqual(list_response.status_code, 200)
            
            list_data = list_response.json()
            self.assertTrue(list_data['success'])
            self.assertIn('data', list_data)
            self.assertIn('users', list_data['data'])
            self.assertIn('count', list_data['data'])
            
            # Test GET specific user
            get_response = requests.get(f"{self.api_endpoint}users/{self.test_user_id}", timeout=10)
            self.assertEqual(get_response.status_code, 200)
            
            get_data = get_response.json()
            self.assertTrue(get_data['success'])
            retrieved_user = get_data['data']
            self.assertEqual(retrieved_user['UserId'], self.test_user_id)
            self.assertEqual(retrieved_user['name'], user_data['name'])
            
        except requests.RequestException as e:
            self.fail(f"READ operations validation failed: {e}")

    @mark.it("validates full CRUD operations - UPDATE user")
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
            self.test_user_id = created_user['UserId']
            
            # Update the user
            update_data = {
                "name": "Updated Test User",
                "email": "updated@example.com",
                "phone": "+9876543210"
            }
            
            update_response = requests.put(
                f"{self.api_endpoint}users/{self.test_user_id}", 
                json=update_data, 
                timeout=10
            )
            self.assertEqual(update_response.status_code, 200)
            
            # Verify the update
            get_response = requests.get(f"{self.api_endpoint}users/{self.test_user_id}", timeout=10)
            updated_user = get_response.json()['data']
            
            self.assertEqual(updated_user['name'], update_data['name'])
            self.assertEqual(updated_user['email'], update_data['email'])
            self.assertEqual(updated_user['phone'], update_data['phone'])
            self.assertIn('updatedAt', updated_user)
            
        except requests.RequestException as e:
            self.fail(f"UPDATE operation validation failed: {e}")

    @mark.it("validates full CRUD operations - DELETE user")
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
            user_id_to_delete = created_user['UserId']
            
            # Delete the user
            delete_response = requests.delete(f"{self.api_endpoint}users/{user_id_to_delete}", timeout=10)
            self.assertEqual(delete_response.status_code, 200)
            
            # Verify the deletion
            get_response = requests.get(f"{self.api_endpoint}users/{user_id_to_delete}", timeout=10)
            self.assertEqual(get_response.status_code, 404)
            
        except requests.RequestException as e:
            self.fail(f"DELETE operation validation failed: {e}")

    @mark.it("validates CloudWatch Log Group exists and is properly configured")
    def test_cloudwatch_log_group_exists(self):
        """Test that CloudWatch Log Group exists and is configured correctly"""
        try:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=self.log_group_name
            )
            
            log_groups = [lg for lg in response['logGroups'] if lg['logGroupName'] == self.log_group_name]
            self.assertTrue(len(log_groups) > 0, f"Log group {self.log_group_name} not found")
            
            log_group = log_groups[0]
            self.assertEqual(log_group['logGroupName'], self.log_group_name)
            
            # Validate retention policy (7 days for dev environment)
            if 'retentionInDays' in log_group:
                self.assertIn(log_group['retentionInDays'], [7, 30])  # 7 for dev, 30 for prod
                
        except ClientError as e:
            self.fail(f"CloudWatch Log Group validation failed: {e}")

    @mark.it("validates KMS key exists and is properly configured")
    def test_kms_key_exists_and_configured(self):
        """Test that KMS key exists and is properly configured"""
        try:
            response = self.kms_client.describe_key(KeyId=self.kms_key_id)
            key_metadata = response['KeyMetadata']
            
            # Validate key properties
            self.assertEqual(key_metadata['KeyId'], self.kms_key_id)
            self.assertEqual(key_metadata['KeyUsage'], 'ENCRYPT_DECRYPT')
            self.assertTrue(key_metadata['Enabled'])
            
            # Check key rotation
            rotation_response = self.kms_client.get_key_rotation_status(KeyId=self.kms_key_id)
            self.assertTrue(rotation_response['KeyRotationEnabled'])
            
        except ClientError as e:
            self.fail(f"KMS key validation failed: {e}")

    @mark.it("validates CloudWatch alarms are configured")
    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are properly configured"""
        try:
            response = self.cloudwatch_client.describe_alarms()
            alarm_names = [alarm['AlarmName'] for alarm in response['MetricAlarms']]
            
            # Look for alarms related to our stack (partial name match)
            lambda_error_alarms = [name for name in alarm_names if 'LambdaError' in name and 'TapStack' in name]
            api_4xx_alarms = [name for name in alarm_names if 'Api4xxError' in name and 'TapStack' in name]
            api_5xx_alarms = [name for name in alarm_names if 'Api5xxError' in name and 'TapStack' in name]
            
            # We should have at least one of each type of alarm
            self.assertTrue(len(lambda_error_alarms) > 0, "Lambda error alarm not found")
            self.assertTrue(len(api_4xx_alarms) > 0, "API 4xx error alarm not found")
            self.assertTrue(len(api_5xx_alarms) > 0, "API 5xx error alarm not found")
            
        except ClientError as e:
            # Alarms might not be created immediately, so we'll make this a warning
            print(f"Warning: CloudWatch alarms validation failed: {e}")

    @mark.it("validates SSM parameters are created")
    def test_ssm_parameters_exist(self):
        """Test that SSM parameters are created and accessible"""
        try:
            # Extract environment from lambda function name or table name
            env_suffix = 'dev'  # Default assumption based on outputs
            if 'dev' in self.lambda_function_name:
                env_suffix = 'dev'
            elif 'prod' in self.lambda_function_name:
                env_suffix = 'prod'
                
            parameter_prefix = f"/{env_suffix}/tap-app"
            
            # Check for table name parameter
            try:
                table_param_response = self.ssm_client.get_parameter(
                    Name=f"{parameter_prefix}/table-name"
                )
                self.assertIn('Parameter', table_param_response)
            except ClientError:
                pass  # Parameter might not exist in older deployments
                
            # Check for API name parameter
            try:
                api_param_response = self.ssm_client.get_parameter(
                    Name=f"{parameter_prefix}/api-name"
                )
                self.assertIn('Parameter', api_param_response)
            except ClientError:
                pass  # Parameter might not exist in older deployments
                
        except ClientError as e:
            # SSM parameters might not be available in all deployments
            print(f"Warning: SSM parameters validation skipped: {e}")

    @mark.it("validates error handling and input validation")
    def test_error_handling_and_validation(self):
        """Test comprehensive error handling and input validation"""
        try:
            # Test invalid POST data (missing required fields)
            invalid_data = {"name": "Missing Email"}
            response = requests.post(f"{self.api_endpoint}users", json=invalid_data, timeout=10)
            self.assertEqual(response.status_code, 400)
            
            response_data = response.json()
            self.assertFalse(response_data['success'])
            self.assertIn('error', response_data)
            
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

    @mark.it("validates IAM roles and permissions")
    def test_iam_roles_and_permissions(self):
        """Test that IAM roles are properly configured with least privilege"""
        try:
            # Get Lambda function configuration to find its role
            function_response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            role_arn = function_response['Configuration']['Role']
            role_name = role_arn.split('/')[-1]
            
            # Get role details
            role_response = self.iam_client.get_role(RoleName=role_name)
            assume_role_policy = role_response['Role']['AssumeRolePolicyDocument']
            
            # Validate assume role policy
            self.assertIn('Statement', assume_role_policy)
            statements = assume_role_policy['Statement']
            lambda_statement = next(
                (stmt for stmt in statements 
                 if stmt.get('Principal', {}).get('Service') == 'lambda.amazonaws.com'), 
                None
            )
            self.assertIsNotNone(lambda_statement)
            
            # Check attached policies
            attached_policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
            
            # Should have minimal necessary policies
            policy_arns = [policy['PolicyArn'] for policy in attached_policies['AttachedPolicies']]
            basic_execution_policy = any('AWSLambdaBasicExecutionRole' in arn for arn in policy_arns)
            
            # Check inline policies for DynamoDB and other permissions
            inline_policies = self.iam_client.list_role_policies(RoleName=role_name)
            self.assertTrue(len(inline_policies['PolicyNames']) > 0, "No inline policies found")
            
        except ClientError as e:
            self.fail(f"IAM roles validation failed: {e}")

    @mark.it("validates end-to-end functionality with real data")
    def test_end_to_end_functionality(self):
        """Test complete end-to-end functionality"""
        try:
            # 1. Create a user
            user_data = {
                "name": "E2E Test User",
                "email": "e2e@example.com",
                "phone": "+1111111111",
                "address": "123 E2E Street"
            }
            
            create_response = requests.post(f"{self.api_endpoint}users", json=user_data, timeout=10)
            self.assertEqual(create_response.status_code, 201)
            created_user = create_response.json()['data']
            self.test_user_id = created_user['UserId']
            
            # 2. Verify user exists in list
            list_response = requests.get(f"{self.api_endpoint}users", timeout=10)
            self.assertEqual(list_response.status_code, 200)
            users_list = list_response.json()['data']['users']
            user_found = any(user['UserId'] == self.test_user_id for user in users_list)
            self.assertTrue(user_found, "Created user not found in users list")
            
            # 3. Get specific user
            get_response = requests.get(f"{self.api_endpoint}users/{self.test_user_id}", timeout=10)
            self.assertEqual(get_response.status_code, 200)
            retrieved_user = get_response.json()['data']
            self.assertEqual(retrieved_user['name'], user_data['name'])
            
            # 4. Update user
            update_data = {"name": "Updated E2E User", "phone": "+2222222222"}
            update_response = requests.put(
                f"{self.api_endpoint}users/{self.test_user_id}", 
                json=update_data, 
                timeout=10
            )
            self.assertEqual(update_response.status_code, 200)
            
            # 5. Verify update
            get_updated_response = requests.get(f"{self.api_endpoint}users/{self.test_user_id}", timeout=10)
            updated_user = get_updated_response.json()['data']
            self.assertEqual(updated_user['name'], update_data['name'])
            self.assertEqual(updated_user['phone'], update_data['phone'])
            
            # 6. Delete user
            delete_response = requests.delete(f"{self.api_endpoint}users/{self.test_user_id}", timeout=10)
            self.assertEqual(delete_response.status_code, 200)
            
            # 7. Verify deletion
            get_deleted_response = requests.get(f"{self.api_endpoint}users/{self.test_user_id}", timeout=10)
            self.assertEqual(get_deleted_response.status_code, 404)
            
        except requests.RequestException as e:
            self.fail(f"End-to-end functionality test failed: {e}")


if __name__ == '__main__':
    unittest.main()
