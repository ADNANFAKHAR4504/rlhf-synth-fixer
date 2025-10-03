import json
import os
import unittest
import uuid
import time
import boto3
import requests
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
    """Integration tests for the deployed TapStack resources"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and resource information from outputs"""
        cls.outputs = flat_outputs
        
        # Extract resource information from outputs
        cls.api_gateway_url = cls.outputs.get('ApiGatewayUrl', '')
        cls.api_gateway_rest_api_id = cls.outputs.get('ApiGatewayRestApiId', '')
        cls.lambda_function_arn = cls.outputs.get('LambdaFunctionArn', '')
        cls.lambda_function_name = cls.outputs.get('LambdaFunctionName', '')
        cls.s3_bucket_name = cls.outputs.get('S3BucketName', '')
        cls.s3_bucket_arn = cls.outputs.get('S3BucketArn', '')
        cls.api_gateway_stage_name = cls.outputs.get('ApiGatewayStageName', '')
        cls.cloudwatch_log_group_name = cls.outputs.get('CloudWatchLogGroupName', '')
        
        # Extract region from Lambda ARN or S3 bucket ARN
        if cls.lambda_function_arn:
            arn_parts = cls.lambda_function_arn.split(':')
            cls.region = arn_parts[3] if len(arn_parts) > 3 else 'us-west-2'
        else:
            cls.region = 'us-west-2'
        
        # Initialize AWS clients
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.apigateway_client = boto3.client('apigateway', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)
        
        # Test items for cleanup
        cls.created_items = []

    def setUp(self):
        """Set up for each test"""
        self.maxDiff = None

    def tearDown(self):
        """Clean up test items after each test"""
        # Clean up any S3 objects created during testing
        for item_key in self.created_items:
            try:
                self.s3_client.delete_object(Bucket=self.s3_bucket_name, Key=item_key)
            except Exception:
                pass  # Ignore cleanup errors
        self.created_items.clear()

    @mark.it("validates that all required outputs exist")
    def test_outputs_exist(self):
        """Test that all required stack outputs are present"""
        required_outputs = [
            'ApiGatewayUrl',
            'ApiGatewayRestApiId',
            'LambdaFunctionArn',
            'LambdaFunctionName',
            'S3BucketName',
            'S3BucketArn',
            'ApiGatewayStageName',
            'CloudWatchLogGroupName'
        ]
        
        for output in required_outputs:
            self.assertIn(output, self.outputs, f"Missing required output: {output}")
            self.assertIsNotNone(self.outputs[output], f"Output {output} is None")
            self.assertNotEqual(self.outputs[output], '', f"Output {output} is empty")

    @mark.it("validates Lambda function exists and has correct configuration")
    def test_lambda_function_exists(self):
        """Test that the Lambda function exists with correct configuration"""
        try:
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            
            # Validate function configuration
            config = response['Configuration']
            self.assertEqual(config['Runtime'], 'python3.9')
            self.assertEqual(config['Handler'], 'index.handler')
            self.assertEqual(config['Timeout'], 30)
            self.assertEqual(config['MemorySize'], 512)
            
            # Validate environment variables
            env_vars = config.get('Environment', {}).get('Variables', {})
            self.assertIn('BUCKET_NAME', env_vars)
            self.assertEqual(env_vars['BUCKET_NAME'], self.s3_bucket_name)
            self.assertIn('ENVIRONMENT', env_vars)
            
            # Validate tracing is enabled
            tracing_config = config.get('TracingConfig', {})
            self.assertEqual(tracing_config.get('Mode'), 'Active')
            
        except ClientError as e:
            self.fail(f"Lambda function not found or error occurred: {e}")

    @mark.it("validates S3 bucket exists with correct configuration")
    def test_s3_bucket_exists(self):
        """Test that the S3 bucket exists with correct configuration"""
        try:
            # Check bucket exists
            response = self.s3_client.head_bucket(Bucket=self.s3_bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
            
            # Validate versioning is enabled
            versioning = self.s3_client.get_bucket_versioning(Bucket=self.s3_bucket_name)
            self.assertEqual(versioning.get('Status'), 'Enabled')
            
            # Validate encryption
            encryption = self.s3_client.get_bucket_encryption(Bucket=self.s3_bucket_name)
            rules = encryption['ServerSideEncryptionConfiguration']['Rules']
            self.assertTrue(any(rule['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'AES256' for rule in rules))
            
            # Validate public access block
            public_access_block = self.s3_client.get_public_access_block(Bucket=self.s3_bucket_name)
            config = public_access_block['PublicAccessBlockConfiguration']
            self.assertTrue(config['BlockPublicAcls'])
            self.assertTrue(config['BlockPublicPolicy'])
            self.assertTrue(config['IgnorePublicAcls'])
            self.assertTrue(config['RestrictPublicBuckets'])
            
        except ClientError as e:
            self.fail(f"S3 bucket not found or error occurred: {e}")

    @mark.it("validates API Gateway exists with correct configuration")
    def test_api_gateway_exists(self):
        """Test that the API Gateway exists with correct configuration"""
        try:
            # Get REST API
            response = self.apigateway_client.get_rest_api(restApiId=self.api_gateway_rest_api_id)
            
            # Validate API name
            self.assertIn('tap-items-api', response['name'])
            self.assertEqual(response['description'], 'API Gateway for managing items')
            
            # Get stage information
            stage_response = self.apigateway_client.get_stage(
                restApiId=self.api_gateway_rest_api_id,
                stageName=self.api_gateway_stage_name
            )
            
            # Validate stage configuration
            self.assertEqual(stage_response['stageName'], 'v1')
            self.assertTrue(stage_response.get('tracingEnabled', False))
            
            # Validate method settings
            method_settings = stage_response.get('methodSettings', {})
            if '*/*' in method_settings:
                settings = method_settings['*/*']
                self.assertTrue(settings.get('dataTraceEnabled', False))
                self.assertTrue(settings.get('metricsEnabled', False))
            
        except ClientError as e:
            self.fail(f"API Gateway not found or error occurred: {e}")

    @mark.it("validates CloudWatch log group exists")
    def test_cloudwatch_log_group_exists(self):
        """Test that the CloudWatch log group exists"""
        try:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=self.cloudwatch_log_group_name
            )
            
            log_groups = response['logGroups']
            self.assertTrue(len(log_groups) > 0, "CloudWatch log group not found")
            
            # Find the specific log group
            log_group = next((lg for lg in log_groups if lg['logGroupName'] == self.cloudwatch_log_group_name), None)
            self.assertIsNotNone(log_group, f"Log group {self.cloudwatch_log_group_name} not found")
            
            # Validate retention policy
            self.assertEqual(log_group.get('retentionInDays'), 7)
            
        except ClientError as e:
            self.fail(f"CloudWatch log group not found or error occurred: {e}")

    @mark.it("validates API Gateway endpoints are accessible")
    def test_api_gateway_accessibility(self):
        """Test that API Gateway endpoints are accessible"""
        try:
            # Test GET /items
            response = requests.get(f"{self.api_gateway_url}items", timeout=30)
            self.assertEqual(response.status_code, 200)
            
            # Validate response structure
            data = response.json()
            self.assertIn('items', data)
            
        except requests.exceptions.RequestException as e:
            self.fail(f"API Gateway endpoint not accessible: {e}")

    @mark.it("validates Lambda function can be invoked directly")
    def test_lambda_direct_invocation(self):
        """Test direct Lambda function invocation"""
        test_event = {
            "httpMethod": "GET",
            "path": "/items",
            "pathParameters": None,
            "body": None,
            "headers": {}
        }
        
        try:
            response = self.lambda_client.invoke(
                FunctionName=self.lambda_function_name,
                Payload=json.dumps(test_event)
            )
            
            self.assertEqual(response['StatusCode'], 200)
            
            # Parse response payload
            payload = json.loads(response['Payload'].read())
            self.assertEqual(payload['statusCode'], 200)
            
            # Parse body
            body = json.loads(payload['body'])
            self.assertIn('items', body)
            
        except ClientError as e:
            self.fail(f"Error invoking Lambda function: {e}")

    @mark.it("validates S3 direct operations")
    def test_s3_direct_operations(self):
        """Test direct S3 operations"""
        test_item_key = f"items/test-direct-{uuid.uuid4()}.json"
        test_item_data = {
            "name": "Direct S3 Test",
            "description": "Testing direct S3 access"
        }
        
        try:
            # PUT object
            self.s3_client.put_object(
                Bucket=self.s3_bucket_name,
                Key=test_item_key,
                Body=json.dumps(test_item_data),
                ContentType='application/json'
            )
            self.created_items.append(test_item_key)  # Track for cleanup
            
            # GET object
            response = self.s3_client.get_object(Bucket=self.s3_bucket_name, Key=test_item_key)
            retrieved_data = json.loads(response['Body'].read())
            
            self.assertEqual(retrieved_data['name'], test_item_data['name'])
            self.assertEqual(retrieved_data['description'], test_item_data['description'])
            
            # LIST objects
            list_response = self.s3_client.list_objects_v2(
                Bucket=self.s3_bucket_name,
                Prefix='items/'
            )
            
            self.assertIn('Contents', list_response)
            object_keys = [obj['Key'] for obj in list_response['Contents']]
            self.assertIn(test_item_key, object_keys)
            
            # DELETE object
            self.s3_client.delete_object(Bucket=self.s3_bucket_name, Key=test_item_key)
            self.created_items.remove(test_item_key)  # Remove from cleanup list
            
            # Verify deletion
            with self.assertRaises(ClientError):
                self.s3_client.get_object(Bucket=self.s3_bucket_name, Key=test_item_key)
                
        except ClientError as e:
            self.fail(f"Error with direct S3 operations: {e}")

    @mark.it("validates error handling for invalid requests")
    def test_error_handling(self):
        """Test API error handling for invalid requests"""
        base_url = self.api_gateway_url
        
        # Test 403 for invalid path
        response = requests.get(f"{base_url}invalid-path", timeout=30)
        self.assertEqual(response.status_code, 403)
        
        error_data = response.json()
        
        # Test invalid method on /items
        response = requests.put(f"{base_url}items", timeout=30)
        self.assertIn(response.status_code, [403, 404, 405])  # Not Found or Method Not Allowed

    @mark.it("validates performance and response times")
    def test_performance_benchmarks(self):
        """Test API performance benchmarks"""
        base_url = self.api_gateway_url
        
        # Test response time for GET /items
        start_time = time.time()
        response = requests.get(f"{base_url}items", timeout=30)
        end_time = time.time()
        
        self.assertEqual(response.status_code, 200)
        response_time = end_time - start_time
        
        # API should respond within 10 seconds (generous for cold start)
        self.assertLess(response_time, 10.0, 
                       f"API response time {response_time:.2f}s exceeds 10s threshold")


if __name__ == "__main__":
    unittest.main()
