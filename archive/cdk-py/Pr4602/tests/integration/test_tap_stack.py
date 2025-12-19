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
    """Integration tests for the deployed TapStack serverless resources"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and resource information from outputs"""
        cls.outputs = flat_outputs
        print(f"Loaded CloudFormation outputs: {cls.outputs}")

        # Extract resource information from flat-outputs.json
        cls.api_endpoint = cls.outputs.get('ApiEndpoint', '')
        cls.s3_bucket_name = cls.outputs.get('S3BucketName', '')
        cls.dynamodb_table_name = cls.outputs.get('DynamoDBTableName', '')
        cls.lambda_function_name = cls.outputs.get('LambdaFunctionName', '')

        # Initialize AWS clients
        cls.dynamodb_client = boto3.client('dynamodb')
        cls.dynamodb_resource = boto3.resource('dynamodb')
        cls.lambda_client = boto3.client('lambda')
        cls.s3_client = boto3.client('s3')
        cls.iam_client = boto3.client('iam')
        cls.apigateway_client = boto3.client('apigateway')
        cls.logs_client = boto3.client('logs')

        # Ensure API endpoint has proper format for data resource
        if cls.api_endpoint and not cls.api_endpoint.endswith('/'):
            cls.api_endpoint += 'data'
        else:
            cls.api_endpoint += 'data'

        print(f"API Endpoint: {cls.api_endpoint}")
        print(f"S3 Bucket: {cls.s3_bucket_name}")
        print(f"DynamoDB Table: {cls.dynamodb_table_name}")
        print(f"Lambda Function: {cls.lambda_function_name}")

    def setUp(self):
        """Set up test data for each test"""
        self.test_user_id = f"test-user-{uuid.uuid4().hex[:8]}"
        self.test_users_created = []

    def tearDown(self):
        """Clean up test data after each test"""
        # Clean up any test users created during tests
        table = self.dynamodb_resource.Table(self.dynamodb_table_name)
        for user_id in self.test_users_created:
            try:
                table.delete_item(Key={'userId': user_id})
                print(f"Cleaned up user: {user_id}")
            except Exception as e:
                print(f"Error cleaning up user {user_id}: {e}")

    @mark.it("validates that S3 bucket exists and has correct configuration")
    def test_s3_bucket_exists_and_configured(self):
        """Test that the S3 bucket exists and is properly configured"""
        if not self.s3_bucket_name:
            self.skipTest("S3 bucket name not found in outputs")
            
        try:
            # Check bucket exists
            response = self.s3_client.head_bucket(Bucket=self.s3_bucket_name)
            self.assertIsNotNone(response)

            # Check versioning is enabled
            versioning = self.s3_client.get_bucket_versioning(Bucket=self.s3_bucket_name)
            self.assertEqual(versioning.get('Status'), 'Enabled', "S3 bucket versioning should be enabled")

            # Check encryption
            encryption = self.s3_client.get_bucket_encryption(Bucket=self.s3_bucket_name)
            self.assertIn('ServerSideEncryptionConfiguration', encryption)
            sse_config = encryption['ServerSideEncryptionConfiguration']['Rules'][0]
            self.assertEqual(sse_config['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'], 'AES256')

            # Check public access block (should be completely private)
            public_access_block = self.s3_client.get_public_access_block(Bucket=self.s3_bucket_name)
            pab_config = public_access_block['PublicAccessBlockConfiguration']
            self.assertTrue(pab_config['BlockPublicAcls'])
            self.assertTrue(pab_config['IgnorePublicAcls'])
            self.assertTrue(pab_config['BlockPublicPolicy'])
            self.assertTrue(pab_config['RestrictPublicBuckets'])

            print("✅ S3 bucket configuration validated")

        except ClientError as e:
            self.fail(f"S3 bucket validation failed: {e}")

    @mark.it("validates that DynamoDB table exists with correct schema and configuration")
    def test_dynamodb_table_exists_and_configured(self):
        """Test that the DynamoDB table exists with correct configuration"""
        try:
            response = self.dynamodb_client.describe_table(TableName=self.dynamodb_table_name)
            table = response['Table']

            # Validate table properties
            self.assertEqual(table['TableStatus'], 'ACTIVE')
            self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

            # Validate key schema - should have userId as partition key only
            key_schema = table['KeySchema']
            self.assertEqual(len(key_schema), 1, "Should have only one key (partition key)")
            
            partition_key = key_schema[0]
            self.assertEqual(partition_key['AttributeName'], 'userId')
            self.assertEqual(partition_key['KeyType'], 'HASH')

            # Validate attribute definitions
            attributes = {attr['AttributeName']: attr['AttributeType'] for attr in table['AttributeDefinitions']}
            self.assertEqual(attributes['userId'], 'S', "userId should be of type String")

            # Validate encryption
            self.assertIn('SSEDescription', table)
            self.assertEqual(table['SSEDescription']['Status'], 'ENABLED')

            print("✅ DynamoDB table configuration validated")

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
            self.assertEqual(function_config['Handler'], 'index.main')
            self.assertEqual(function_config['Timeout'], 30)
            self.assertEqual(function_config['MemorySize'], 256)

            # Validate environment variables
            env_vars = function_config.get('Environment', {}).get('Variables', {})
            self.assertIn('S3_BUCKET_NAME', env_vars)
            self.assertIn('DYNAMODB_TABLE_NAME', env_vars)
            self.assertIn('LOG_LEVEL', env_vars)
            self.assertEqual(env_vars['S3_BUCKET_NAME'], self.s3_bucket_name)
            self.assertEqual(env_vars['DYNAMODB_TABLE_NAME'], self.dynamodb_table_name)
            self.assertEqual(env_vars['LOG_LEVEL'], 'WARNING')

            # Validate X-Ray tracing is enabled
            self.assertEqual(function_config.get('TracingConfig', {}).get('Mode'), 'Active')

            print("✅ Lambda function configuration validated")

        except ClientError as e:
            self.fail(f"Lambda function validation failed: {e}")

    @mark.it("validates CloudWatch Log Group exists for Lambda")
    def test_cloudwatch_log_group_exists(self):
        """Test that CloudWatch Log Group exists for Lambda"""
        try:
            log_group_name = f"/aws/lambda/{self.lambda_function_name}"
            
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
            
            log_groups = [lg for lg in response['logGroups'] if lg['logGroupName'] == log_group_name]
            self.assertTrue(len(log_groups) > 0, f"Log group {log_group_name} not found")
            
            log_group = log_groups[0]
            self.assertEqual(log_group['logGroupName'], log_group_name)
            
            # Validate retention policy (7 days = ONE_WEEK)
            if 'retentionInDays' in log_group:
                self.assertEqual(log_group['retentionInDays'], 7)

            print("✅ CloudWatch log group validated")

        except ClientError as e:
            self.fail(f"CloudWatch Log Group validation failed: {e}")

    @mark.it("validates IAM role has least-privilege permissions")
    def test_lambda_iam_permissions(self):
        """Test that Lambda function has appropriate IAM permissions"""
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
            self.assertIsNotNone(lambda_statement, "Lambda assume role policy not found")
            
            # Check attached policies
            attached_policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
            policy_arns = [policy['PolicyArn'] for policy in attached_policies['AttachedPolicies']]
            
            # Should have basic execution role
            basic_execution = any('AWSLambdaBasicExecutionRole' in arn for arn in policy_arns)
            self.assertTrue(basic_execution, "Missing AWSLambdaBasicExecutionRole")

            print("✅ Lambda IAM permissions validated")

        except ClientError as e:
            self.fail(f"IAM permissions validation failed: {e}")

    @mark.it("validates API Gateway GET endpoint - successful request")
    def test_api_gateway_get_request_success(self):
        """Test successful GET request to API Gateway endpoint"""
        try:
            # Test with required userId parameter
            test_user_id = self.test_user_id
            self.test_users_created.append(test_user_id)
            
            response = requests.get(
                f"{self.api_endpoint}?userId={test_user_id}", 
                timeout=10
            )
            
            self.assertEqual(response.status_code, 200)
            
            response_data = response.json()
            self.assertIn('userId', response_data)
            self.assertEqual(response_data['userId'], test_user_id)
            self.assertIn('status', response_data)
            
            # Check CORS headers
            self.assertIn('Access-Control-Allow-Origin', response.headers)
            self.assertIn('Access-Control-Allow-Methods', response.headers)
            
            print(f"✅ API Gateway GET request successful for user: {test_user_id}")

        except requests.RequestException as e:
            self.fail(f"API Gateway GET request failed: {e}")

    @mark.it("validates API Gateway GET endpoint - missing userId parameter")
    def test_api_gateway_get_request_missing_userid(self):
        """Test GET request without required userId parameter"""
        try:
            response = requests.get(f"{self.api_endpoint}", timeout=10)
            
            self.assertEqual(response.status_code, 400)
            
            response_data = response.json()
            self.assertIn('error', response_data)
            self.assertIn('userId parameter is required', response_data['error'])
            
            print("✅ API Gateway correctly handles missing userId parameter")

        except requests.RequestException as e:
            self.fail(f"API Gateway error handling test failed: {e}")

    @mark.it("validates API Gateway GET endpoint - list-files action")
    def test_api_gateway_list_files_action(self):
        """Test GET request with list-files action"""
        try:
            test_user_id = f"files-test-{uuid.uuid4().hex[:8]}"
            self.test_users_created.append(test_user_id)
            
            response = requests.get(
                f"{self.api_endpoint}?userId={test_user_id}&action=list-files", 
                timeout=10
            )
            
            self.assertEqual(response.status_code, 200)
            
            response_data = response.json()
            self.assertIn('userId', response_data)
            self.assertIn('files', response_data)
            self.assertIn('count', response_data)
            self.assertEqual(response_data['userId'], test_user_id)
            self.assertIsInstance(response_data['files'], list)
            self.assertIsInstance(response_data['count'], int)
            
            print(f"✅ API Gateway list-files action successful for user: {test_user_id}")

        except requests.RequestException as e:
            self.fail(f"API Gateway list-files action failed: {e}")

    @mark.it("validates API Gateway rejects non-GET methods")
    def test_api_gateway_rejects_non_get_methods(self):
        """Test that API Gateway rejects POST, PUT, DELETE methods"""
        try:
            test_user_id = self.test_user_id
            
            # Test POST method (should be rejected)
            post_response = requests.post(
                f"{self.api_endpoint}?userId={test_user_id}", 
                json={"test": "data"}, 
                timeout=10
            )
            self.assertIn(post_response.status_code, [403, 405, 501], 
                         "POST method should be rejected")
            
            # Test PUT method (should be rejected)
            put_response = requests.put(
                f"{self.api_endpoint}?userId={test_user_id}", 
                json={"test": "data"}, 
                timeout=10
            )
            self.assertIn(put_response.status_code, [403, 405, 501], 
                         "PUT method should be rejected")
            
            # Test DELETE method (should be rejected)
            delete_response = requests.delete(
                f"{self.api_endpoint}?userId={test_user_id}", 
                timeout=10
            )
            self.assertIn(delete_response.status_code, [403, 405, 501], 
                         "DELETE method should be rejected")
            
            print("✅ API Gateway correctly rejects non-GET methods")

        except requests.RequestException as e:
            self.fail(f"Method rejection test failed: {e}")

    @mark.it("validates DynamoDB integration - data persistence")
    def test_dynamodb_data_persistence(self):
        """Test that user data persists in DynamoDB through multiple API calls"""
        try:
            test_user_id = f"persist-test-{uuid.uuid4().hex[:8]}"
            self.test_users_created.append(test_user_id)
            
            # First API call - should create new user data
            response1 = requests.get(
                f"{self.api_endpoint}?userId={test_user_id}", 
                timeout=10
            )
            self.assertEqual(response1.status_code, 200)
            data1 = response1.json()
            
            # Wait a moment and make second call
            time.sleep(1)
            response2 = requests.get(
                f"{self.api_endpoint}?userId={test_user_id}", 
                timeout=10
            )
            self.assertEqual(response2.status_code, 200)
            data2 = response2.json()
            
            # Data should be the same (persisted)
            self.assertEqual(data1['userId'], data2['userId'])
            self.assertEqual(data1['created'], data2['created'])  # Should be same request ID
            
            # Verify data exists in DynamoDB directly
            table = self.dynamodb_resource.Table(self.dynamodb_table_name)
            db_response = table.get_item(Key={'userId': test_user_id})
            self.assertIn('Item', db_response)
            self.assertEqual(db_response['Item']['userId'], test_user_id)
            
            print(f"✅ DynamoDB data persistence validated for user: {test_user_id}")

        except (requests.RequestException, ClientError) as e:
            self.fail(f"DynamoDB integration test failed: {e}")

    @mark.it("validates S3 integration - file operations")
    def test_s3_integration(self):
        """Test S3 integration by creating a test file and listing it"""
        try:
            test_user_id = f"s3-test-{uuid.uuid4().hex[:8]}"
            test_file_key = f"users/{test_user_id}/test-file.txt"
            test_content = "This is a test file for S3 integration testing"
            
            # Create a test file in S3
            self.s3_client.put_object(
                Bucket=self.s3_bucket_name,
                Key=test_file_key,
                Body=test_content,
                ContentType='text/plain'
            )
            
            # Use API to list files for this user
            response = requests.get(
                f"{self.api_endpoint}?userId={test_user_id}&action=list-files", 
                timeout=10
            )
            
            self.assertEqual(response.status_code, 200)
            response_data = response.json()
            
            # Verify the file appears in the list
            files = response_data['files']
            self.assertGreater(len(files), 0, "Should find at least one file")
            
            test_file = next((f for f in files if f['key'] == test_file_key), None)
            self.assertIsNotNone(test_file, "Test file should be found in S3 listing")
            self.assertGreater(test_file['size'], 0)
            self.assertIn('lastModified', test_file)
            
            # Clean up
            self.s3_client.delete_object(Bucket=self.s3_bucket_name, Key=test_file_key)
            
            print(f"✅ S3 integration validated for user: {test_user_id}")

        except (requests.RequestException, ClientError) as e:
            self.fail(f"S3 integration test failed: {e}")

    @mark.it("validates API Gateway performance and response times")
    def test_api_gateway_performance(self):
        """Test API Gateway performance characteristics"""
        try:
            test_user_id = f"perf-test-{uuid.uuid4().hex[:8]}"
            self.test_users_created.append(test_user_id)
            
            response_times = []
            
            # Make multiple requests to test performance
            for i in range(3):
                start_time = time.time()
                response = requests.get(
                    f"{self.api_endpoint}?userId={test_user_id}", 
                    timeout=10
                )
                end_time = time.time()
                
                self.assertEqual(response.status_code, 200)
                response_times.append(end_time - start_time)
                
                time.sleep(0.5)  # Small delay between requests
            
            # Average response time should be reasonable (under 5 seconds)
            avg_response_time = sum(response_times) / len(response_times)
            self.assertLess(avg_response_time, 5.0, 
                           f"Average response time too high: {avg_response_time:.2f}s")
            
            print(f"✅ API Gateway performance validated - avg response time: {avg_response_time:.2f}s")

        except requests.RequestException as e:
            self.fail(f"API Gateway performance test failed: {e}")

    @mark.it("validates end-to-end serverless application workflow")
    def test_end_to_end_workflow(self):
        """Test complete end-to-end workflow of the serverless application"""
        try:
            test_user_id = f"e2e-test-{uuid.uuid4().hex[:8]}"
            self.test_users_created.append(test_user_id)
            
            # Step 1: Create user data via API
            response1 = requests.get(
                f"{self.api_endpoint}?userId={test_user_id}", 
                timeout=10
            )
            self.assertEqual(response1.status_code, 200)
            user_data = response1.json()
            self.assertEqual(user_data['userId'], test_user_id)
            self.assertEqual(user_data['status'], 'new')
            
            # Step 2: Create a file in S3 for this user
            test_file_key = f"users/{test_user_id}/document.json"
            test_file_content = {"type": "document", "version": 1}
            
            self.s3_client.put_object(
                Bucket=self.s3_bucket_name,
                Key=test_file_key,
                Body=json.dumps(test_file_content),
                ContentType='application/json'
            )
            
            # Step 3: List files via API
            response2 = requests.get(
                f"{self.api_endpoint}?userId={test_user_id}&action=list-files", 
                timeout=10
            )
            self.assertEqual(response2.status_code, 200)
            files_data = response2.json()
            self.assertEqual(files_data['count'], 1)
            self.assertEqual(files_data['files'][0]['key'], test_file_key)
            
            # Step 4: Verify data persists in DynamoDB
            table = self.dynamodb_resource.Table(self.dynamodb_table_name)
            db_item = table.get_item(Key={'userId': test_user_id})
            self.assertIn('Item', db_item)
            self.assertEqual(db_item['Item']['userId'], test_user_id)
            
            # Step 5: Verify file exists in S3
            s3_object = self.s3_client.get_object(
                Bucket=self.s3_bucket_name, 
                Key=test_file_key
            )
            retrieved_content = json.loads(s3_object['Body'].read())
            self.assertEqual(retrieved_content, test_file_content)
            
            # Cleanup
            self.s3_client.delete_object(Bucket=self.s3_bucket_name, Key=test_file_key)
            
            print(f"✅ End-to-end workflow validated for user: {test_user_id}")

        except (requests.RequestException, ClientError) as e:
            self.fail(f"End-to-end workflow test failed: {e}")


if __name__ == '__main__':
    unittest.main()
