import json
import os
import unittest
import boto3
import requests
import time
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
    """Integration test cases for the deployed TapStack CDK stack"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and stack outputs for all tests"""
        cls.region = 'us-west-2'
        
        # Initialize AWS clients
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.apigateway_client = boto3.client('apigateway', region_name=cls.region)
        cls.iam_client = boto3.client('iam', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)
        
        # Extract outputs from flat-outputs.json
        cls.bucket_name = flat_outputs.get('BucketName')
        cls.lambda_function_name = flat_outputs.get('LambdaFunctionName')
        cls.lambda_function_arn = flat_outputs.get('LambdaFunctionArn')
        cls.api_endpoint = flat_outputs.get('ApiEndpoint')
        cls.environment_suffix = flat_outputs.get('EnvironmentSuffix', 'dev')
        
        # Validate required outputs exist
        required_outputs = [cls.bucket_name, cls.lambda_function_name, cls.api_endpoint]
        if not all(required_outputs):
            raise ValueError(f"Missing required CloudFormation outputs: {flat_outputs}")

    def setUp(self):
        """Set up for each test"""
        pass

    @mark.it("validates S3 bucket exists and has correct configuration")
    def test_s3_bucket_configuration(self):
        """Test that the S3 bucket is properly configured"""
        # ARRANGE & ACT
        bucket_name = self.bucket_name
        
        # ASSERT - Check bucket exists
        try:
            bucket_response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertIsNotNone(bucket_response)
        except ClientError as e:
            self.fail(f"S3 bucket {bucket_name} does not exist: {e}")
        
        # Check versioning is enabled
        versioning_response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning_response['Status'], 'Enabled', 
                        "S3 bucket versioning should be enabled")
        
        # Check encryption is configured
        try:
            encryption_response = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            rules = encryption_response['ServerSideEncryptionConfiguration']['Rules']
            self.assertTrue(len(rules) > 0, "S3 bucket should have encryption rules")
            self.assertIn('SSEAlgorithm', str(rules), "S3 bucket should have encryption algorithm")
        except ClientError as e:
            if e.response['Error']['Code'] != 'ServerSideEncryptionConfigurationNotFoundError':
                self.fail(f"Unexpected error checking S3 encryption: {e}")
        
        # Check public access is blocked
        try:
            public_access_block = self.s3_client.get_public_access_block(Bucket=bucket_name)
            config = public_access_block['PublicAccessBlockConfiguration']
            self.assertTrue(config['BlockPublicAcls'], "S3 should block public ACLs")
            self.assertTrue(config['BlockPublicPolicy'], "S3 should block public policy")
            self.assertTrue(config['IgnorePublicAcls'], "S3 should ignore public ACLs")
            self.assertTrue(config['RestrictPublicBuckets'], "S3 should restrict public buckets")
        except ClientError as e:
            self.fail(f"Error checking S3 public access block: {e}")

    @mark.it("validates Lambda function exists and has correct configuration")
    def test_lambda_function_configuration(self):
        """Test that the Lambda function is properly configured"""
        # ARRANGE & ACT
        function_name = self.lambda_function_name
        
        try:
            # Get Lambda function configuration
            function_response = self.lambda_client.get_function(FunctionName=function_name)
            function_config = function_response['Configuration']
            
            # ASSERT - Basic configuration
            self.assertEqual(function_config['Runtime'], 'python3.9', 
                           "Lambda should use Python 3.9 runtime")
            self.assertEqual(function_config['Handler'], 'index.lambda_handler',
                           "Lambda handler should be index.lambda_handler")
            self.assertEqual(function_config['Timeout'], 30,
                           "Lambda timeout should be 30 seconds")
            self.assertEqual(function_config['MemorySize'], 256,
                           "Lambda memory should be 256 MB")
            
            # Check environment variables
            env_vars = function_config.get('Environment', {}).get('Variables', {})
            self.assertIn('BUCKET_NAME', env_vars, "Lambda should have BUCKET_NAME env var")
            self.assertIn('REGION', env_vars, "Lambda should have REGION env var")
            self.assertIn('LOG_LEVEL', env_vars, "Lambda should have LOG_LEVEL env var")
            self.assertIn('STAGE', env_vars, "Lambda should have STAGE env var")
            
            # Validate environment variable values
            self.assertEqual(env_vars['BUCKET_NAME'], self.bucket_name)
            self.assertEqual(env_vars['REGION'], self.region)
            self.assertEqual(env_vars['LOG_LEVEL'], 'INFO')
            self.assertEqual(env_vars['STAGE'], self.environment_suffix.lower())
            
        except ClientError as e:
            self.fail(f"Lambda function {function_name} not found or error: {e}")

    @mark.it("validates Lambda function IAM role has correct permissions")
    def test_lambda_iam_permissions(self):
        """Test that the Lambda function has the correct IAM permissions"""
        # ARRANGE & ACT
        try:
            function_response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            role_arn = function_response['Configuration']['Role']
            role_name = role_arn.split('/')[-1]
            
            # Get role policies
            role_policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
            inline_policies = self.iam_client.list_role_policies(RoleName=role_name)
            
            # ASSERT - Should have AWS Lambda basic execution role
            managed_policies = [p['PolicyName'] for p in role_policies['AttachedPolicies']]
            self.assertIn('AWSLambdaBasicExecutionRole', managed_policies,
                         "Lambda role should have AWSLambdaBasicExecutionRole")
            
            # Should have inline S3 policy
            self.assertTrue(len(inline_policies['PolicyNames']) > 0,
                          "Lambda role should have inline policies for S3 access")
            
        except ClientError as e:
            self.fail(f"Error checking Lambda IAM permissions: {e}")

    @mark.it("validates CloudWatch log groups exist")
    def test_cloudwatch_log_groups(self):
        """Test that CloudWatch log groups are created"""
        # ARRANGE
        expected_log_groups = [
            f"/aws/lambda/serverless-api-handler-{self.environment_suffix.lower()}",
            f"/aws/apigateway/serverless-api-{self.environment_suffix.lower()}"
        ]
        
        # ACT & ASSERT
        for log_group_name in expected_log_groups:
            try:
                response = self.logs_client.describe_log_groups(
                    logGroupNamePrefix=log_group_name
                )
                log_groups = response['logGroups']
                matching_groups = [lg for lg in log_groups if lg['logGroupName'] == log_group_name]
                self.assertTrue(len(matching_groups) > 0,
                              f"Log group {log_group_name} should exist")
                
                # Check retention policy
                log_group = matching_groups[0]
                self.assertEqual(log_group.get('retentionInDays'), 30,
                               f"Log group {log_group_name} should have 30 days retention")
                
            except ClientError as e:
                self.fail(f"Error checking log group {log_group_name}: {e}")

    @mark.it("validates API Gateway endpoint responds to health check")
    def test_api_gateway_health_endpoint(self):
        """Test that the API Gateway health endpoint works"""
        # ARRANGE
        health_url = f"{self.api_endpoint}health"
        
        # ACT
        try:
            response = requests.get(health_url, timeout=10)
            
            # ASSERT
            self.assertEqual(response.status_code, 200, 
                           "Health endpoint should return 200")
            
            response_data = response.json()
            self.assertEqual(response_data['status'], 'healthy',
                           "Health endpoint should return healthy status")
            self.assertIn('timestamp', response_data,
                         "Health response should include timestamp")
            self.assertEqual(response_data['region'], self.region,
                           "Health response should include correct region")
            self.assertEqual(response_data['stage'], self.environment_suffix.lower(),
                           "Health response should include correct stage")
            self.assertEqual(response_data['bucket'], self.bucket_name,
                           "Health response should include bucket name")
            
        except requests.RequestException as e:
            self.fail(f"Error calling health endpoint: {e}")
        except json.JSONDecodeError as e:
            self.fail(f"Invalid JSON response from health endpoint: {e}")

    @mark.it("validates API Gateway data endpoint accepts POST requests")
    def test_api_gateway_data_post(self):
        """Test that the API Gateway data endpoint accepts POST requests"""
        # ARRANGE
        data_url = f"{self.api_endpoint}data"
        test_data = {
            "message": "Integration test data",
            "timestamp": "2024-01-01T00:00:00Z",
            "test_type": "integration"
        }
        
        # ACT
        try:
            response = requests.post(data_url, 
                                   json=test_data, 
                                   headers={'Content-Type': 'application/json'},
                                   timeout=10)
            
            # ASSERT
            self.assertEqual(response.status_code, 201,
                           "Data POST should return 201 created")
            
            response_data = response.json()
            self.assertEqual(response_data['message'], 'Data stored successfully',
                           "POST should return success message")
            self.assertIn('id', response_data,
                         "POST response should include generated ID")
            self.assertIn('s3_key', response_data,
                         "POST response should include S3 key")
            self.assertEqual(response_data['bucket'], self.bucket_name,
                           "POST response should include bucket name")
            
            # Verify data was actually stored in S3
            s3_key = response_data['s3_key']
            time.sleep(2)  # Wait for S3 eventual consistency
            
            try:
                s3_object = self.s3_client.get_object(Bucket=self.bucket_name, Key=s3_key)
                stored_data = json.loads(s3_object['Body'].read())
                self.assertIn('data', stored_data,
                             "Stored object should contain data field")
                self.assertEqual(stored_data['data'], test_data,
                               "Stored data should match posted data")
                
            except ClientError as s3_error:
                self.fail(f"Data was not stored in S3: {s3_error}")
            
        except requests.RequestException as e:
            self.fail(f"Error calling data POST endpoint: {e}")

    @mark.it("validates API Gateway data endpoint returns GET requests")
    def test_api_gateway_data_get(self):
        """Test that the API Gateway data endpoint returns data"""
        # ARRANGE
        data_url = f"{self.api_endpoint}data"
        
        # ACT
        try:
            response = requests.get(data_url, timeout=10)
            
            # ASSERT
            self.assertEqual(response.status_code, 200,
                           "Data GET should return 200")
            
            response_data = response.json()
            self.assertEqual(response_data['message'], 'Data retrieved successfully',
                           "GET should return success message")
            self.assertIn('objects', response_data,
                         "GET response should include objects list")
            self.assertIn('count', response_data,
                         "GET response should include count")
            self.assertEqual(response_data['bucket'], self.bucket_name,
                           "GET response should include bucket name")
            
            # Objects list should be a list (can be empty)
            self.assertIsInstance(response_data['objects'], list,
                                "Objects should be a list")
            self.assertEqual(len(response_data['objects']), response_data['count'],
                           "Object count should match list length")
            
        except requests.RequestException as e:
            self.fail(f"Error calling data GET endpoint: {e}")

    @mark.it("validates API Gateway CORS headers")
    def test_api_gateway_cors_headers(self):
        """Test that the API Gateway returns proper CORS headers"""
        # ARRANGE
        health_url = f"{self.api_endpoint}health"
        
        # ACT - Test preflight OPTIONS request
        try:
            options_response = requests.options(health_url, timeout=10)
            
            # ASSERT - Check CORS headers in OPTIONS response
            self.assertIn('Access-Control-Allow-Origin', options_response.headers,
                         "OPTIONS response should include CORS origin header")
            self.assertIn('Access-Control-Allow-Methods', options_response.headers,
                         "OPTIONS response should include CORS methods header")
            self.assertIn('Access-Control-Allow-Headers', options_response.headers,
                         "OPTIONS response should include CORS headers header")
            
        except requests.RequestException as e:
            self.fail(f"Error testing CORS preflight: {e}")
        
        # ACT - Test actual GET request CORS headers
        try:
            get_response = requests.get(health_url, timeout=10)
            
            # ASSERT - Check CORS headers in actual response
            self.assertIn('Access-Control-Allow-Origin', get_response.headers,
                         "GET response should include CORS origin header")
            
        except requests.RequestException as e:
            self.fail(f"Error testing GET CORS headers: {e}")

    @mark.it("validates end-to-end workflow: POST data and retrieve via GET")
    def test_end_to_end_data_workflow(self):
        """Test complete workflow of posting data and retrieving it"""
        # ARRANGE
        data_url = f"{self.api_endpoint}data"
        unique_message = f"E2E test data {int(time.time())}"
        test_data = {
            "message": unique_message,
            "workflow": "end-to-end",
            "timestamp": time.time()
        }
        
        # ACT - Post data
        try:
            post_response = requests.post(data_url,
                                        json=test_data,
                                        headers={'Content-Type': 'application/json'},
                                        timeout=10)
            
            self.assertEqual(post_response.status_code, 201)
            post_data = post_response.json()
            posted_id = post_data['id']
            s3_key = post_data['s3_key']
            
            # Wait for eventual consistency
            time.sleep(3)
            
            # ACT - Get data list
            get_response = requests.get(data_url, timeout=10)
            self.assertEqual(get_response.status_code, 200)
            
            get_data = get_response.json()
            objects = get_data['objects']
            
            # ASSERT - Verify posted data appears in list
            matching_objects = [obj for obj in objects if s3_key in obj['key']]
            self.assertTrue(len(matching_objects) > 0,
                          f"Posted object with key {s3_key} should appear in GET response")
            
            # ASSERT - Verify data exists in S3
            try:
                s3_response = self.s3_client.get_object(Bucket=self.bucket_name, Key=s3_key)
                stored_content = json.loads(s3_response['Body'].read())
                
                self.assertEqual(stored_content['id'], posted_id,
                               "Stored data should have correct ID")
                self.assertEqual(stored_content['data']['message'], unique_message,
                               "Stored data should contain original message")
                
            except ClientError as e:
                self.fail(f"Cannot retrieve stored data from S3: {e}")
            
        except requests.RequestException as e:
            self.fail(f"Error in end-to-end workflow: {e}")

    @mark.it("validates error handling for invalid requests")
    def test_error_handling(self):
        """Test that the API handles errors gracefully"""
        # ARRANGE
        data_url = f"{self.api_endpoint}data"
        
        # ACT & ASSERT - Test POST with invalid JSON
        try:
            response = requests.post(data_url,
                                   data="invalid json",
                                   headers={'Content-Type': 'application/json'},
                                   timeout=10)
            
            # Should still return a valid response (Lambda handles the error)
            self.assertIn(response.status_code, [400, 500],
                         "Invalid JSON should return 400 or 500")
            
        except requests.RequestException as e:
            self.fail(f"Error testing invalid JSON handling: {e}")
        
        # ACT & ASSERT - Test non-existent endpoint
        try:
            invalid_url = f"{self.api_endpoint}nonexistent"
            response = requests.get(invalid_url, timeout=10)
            # Should return 403 with default Lambda response
            self.assertEqual(response.status_code, 403,
                           "Non-existent path should return 403 with default response")
            
        except requests.RequestException as e:
            self.fail(f"Error testing non-existent endpoint: {e}")


if __name__ == '__main__':
    unittest.main()
