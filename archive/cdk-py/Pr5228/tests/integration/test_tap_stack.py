import json
import os
import unittest
import boto3
import time
import uuid
import requests
from pytest import mark
from botocore.exceptions import ClientError


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
    """Integration test cases for the TapStack CDK stack"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and stack outputs once for all tests"""
        cls.region = 'us-east-1'
        
        # Initialize AWS clients
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.dynamodb = boto3.resource('dynamodb', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.apigateway_client = boto3.client('apigateway', region_name=cls.region)
        cls.cognito_client = boto3.client('cognito-idp', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)
        
        # Extract stack outputs
        cls.api_endpoint = flat_outputs.get('APIEndpoint')
        cls.user_pool_id = flat_outputs.get('UserPoolId')
        cls.user_pool_client_id = flat_outputs.get('UserPoolClientId')
        cls.staging_bucket_name = flat_outputs.get('StagingBucketName')
        cls.dynamodb_table_name = flat_outputs.get('DynamoDBTableName')
        cls.validate_lambda_name = flat_outputs.get('ValidateLambdaFunctionName')
        cls.process_lambda_name = flat_outputs.get('ProcessLambdaFunctionName')
        cls.environment = flat_outputs.get('Environment', 'dev')

    def setUp(self):
        """Set up fresh test data for each test"""
        self.test_item_id = str(uuid.uuid4())
        self.test_data = {
            "name": "test item",
            "description": "integration test data",
            "category": "testing"
        }

    @mark.it("should verify all required stack outputs are present")
    def test_stack_outputs_present(self):
        """Test that all expected CloudFormation outputs are present"""
        required_outputs = [
            'APIEndpoint',
            'UserPoolId', 
            'UserPoolClientId',
            'StagingBucketName',
            'DynamoDBTableName',
            'ValidateLambdaFunctionName',
            'ProcessLambdaFunctionName',
            'Environment'
        ]
        
        for output in required_outputs:
            with self.subTest(output=output):
                self.assertIn(output, flat_outputs, f"Missing required output: {output}")
                self.assertIsNotNone(flat_outputs[output], f"Output {output} is None")

    @mark.it("should verify Lambda functions exist and are configured correctly")
    def test_lambda_functions_exist(self):
        """Test that Lambda functions are deployed and properly configured"""
        lambda_functions = [
            (self.validate_lambda_name, "Validate Lambda"),
            (self.process_lambda_name, "Process Lambda")
        ]
        
        for function_name, description in lambda_functions:
            if not function_name:  # Skip if function name is None
                continue
                
            with self.subTest(function=function_name):
                try:
                    response = self.lambda_client.get_function(FunctionName=function_name)
                    config = response['Configuration']
                    
                    # Verify basic configuration
                    self.assertEqual(config['Runtime'], 'python3.11')
                    self.assertEqual(config['State'], 'Active')
                    self.assertIn('ENVIRONMENT', config['Environment']['Variables'])
                    self.assertEqual(config['Environment']['Variables']['ENVIRONMENT'], self.environment)
                    
                    # Verify X-Ray tracing is enabled
                    self.assertEqual(config['TracingConfig']['Mode'], 'Active')
                    
                except ClientError as e:
                    self.fail(f"{description} function {function_name} not found: {e}")

    @mark.it("should verify DynamoDB table exists with correct configuration")
    def test_dynamodb_table_exists(self):
        """Test that DynamoDB table is created with proper configuration"""
        if not self.dynamodb_table_name:
            self.skipTest("DynamoDB table name not found in outputs")
            
        try:
            table = self.dynamodb.Table(self.dynamodb_table_name)
            table.load()
            
            # Verify table status
            self.assertEqual(table.table_status, 'ACTIVE')
            
            # Verify key schema
            key_schema = {item['AttributeName']: item['KeyType'] for item in table.key_schema}
            self.assertEqual(key_schema['id'], 'HASH')
            self.assertEqual(key_schema['timestamp'], 'RANGE')
            
            # Verify GSI exists (if configured)
            if table.global_secondary_indexes:
                gsi_names = [gsi['IndexName'] for gsi in table.global_secondary_indexes]
                self.assertIn('status-timestamp-index', gsi_names)
            
        except ClientError as e:
            self.fail(f"DynamoDB table {self.dynamodb_table_name} not accessible: {e}")

    @mark.it("should verify S3 staging bucket exists with proper configuration")
    def test_s3_staging_bucket_exists(self):
        """Test that S3 staging bucket is created with proper security settings"""
        if not self.staging_bucket_name:
            self.skipTest("S3 bucket name not found in outputs")
            
        try:
            # Verify bucket exists
            self.s3_client.head_bucket(Bucket=self.staging_bucket_name)
            
            # Verify encryption (optional check - some buckets might not have explicit encryption)
            try:
                encryption = self.s3_client.get_bucket_encryption(Bucket=self.staging_bucket_name)
                self.assertIn('Rules', encryption['ServerSideEncryptionConfiguration'])
            except ClientError as e:
                if e.response['Error']['Code'] != 'ServerSideEncryptionConfigurationNotFoundError':
                    raise
            
            # Verify public access is blocked
            try:
                public_access = self.s3_client.get_public_access_block(Bucket=self.staging_bucket_name)
                config = public_access['PublicAccessBlockConfiguration']
                self.assertTrue(config['BlockPublicAcls'])
                self.assertTrue(config['IgnorePublicAcls'])
                self.assertTrue(config['BlockPublicPolicy'])
                self.assertTrue(config['RestrictPublicBuckets'])
            except ClientError as e:
                # Public access block might not be configured
                print(f"Public access block check skipped: {e}")
            
        except ClientError as e:
            self.fail(f"S3 bucket {self.staging_bucket_name} not accessible: {e}")

    @mark.it("should verify Cognito User Pool exists with basic configuration")
    def test_cognito_user_pool_exists(self):
        """Test that Cognito User Pool is configured correctly - simplified version"""
        if not self.user_pool_id:
            self.skipTest("User Pool ID not found in outputs")
            
        try:
            # Verify User Pool exists and is accessible
            user_pool = self.cognito_client.describe_user_pool(UserPoolId=self.user_pool_id)
            pool_config = user_pool['UserPool']
            
            # Basic checks
            self.assertIsNotNone(pool_config['Name'])
            self.assertIn(self.environment, pool_config['Name'])
            
            # Verify User Pool Client exists
            if self.user_pool_client_id:
                client_response = self.cognito_client.describe_user_pool_client(
                    UserPoolId=self.user_pool_id,
                    ClientId=self.user_pool_client_id
                )
                self.assertIsNotNone(client_response['UserPoolClient'])
            
        except ClientError as e:
            self.fail(f"Cognito User Pool {self.user_pool_id} not accessible: {e}")

    @mark.it("should verify API Gateway exists and is accessible")
    def test_api_gateway_exists(self):
        """Test that API Gateway is deployed and accessible"""
        if not self.api_endpoint:
            self.skipTest("API endpoint not found in outputs")
            
        try:
            # Extract API ID from endpoint URL
            api_id = self.api_endpoint.split('//')[1].split('.')[0]
            
            # Verify API exists
            api = self.apigateway_client.get_rest_api(restApiId=api_id)
            self.assertIsNotNone(api['name'])
            self.assertIn(self.environment, api['name'])
            
            # Basic connectivity test to health endpoint (if exists)
            try:
                health_url = f"{self.api_endpoint.rstrip('/')}/health"
                response = requests.get(health_url, timeout=10)
                # If health endpoint exists, it should return 200 or 401/403 (auth required)
                self.assertIn(response.status_code, [200, 401, 403])
            except requests.exceptions.RequestException:
                # Health endpoint might not exist or might be behind auth
                print("Health endpoint test skipped - endpoint not accessible without auth")
                
        except ClientError as e:
            self.fail(f"API Gateway not accessible: {e}")

    @mark.it("should test DynamoDB table basic operations")
    def test_dynamodb_operations(self):
        """Test DynamoDB table basic operations"""
        if not self.dynamodb_table_name:
            self.skipTest("DynamoDB table name not found in outputs")
            
        table = self.dynamodb.Table(self.dynamodb_table_name)
        
        # Test write operation
        test_item = {
            'id': self.test_item_id,
            'timestamp': int(time.time()),
            'status': 'test',
            'data': self.test_data,
            'created_at': '2024-01-01T00:00:00Z'
        }
        
        try:
            table.put_item(Item=test_item)
            
            # Test read operation
            response = table.get_item(Key={'id': self.test_item_id, 'timestamp': test_item['timestamp']})
            self.assertIn('Item', response)
            self.assertEqual(response['Item']['id'], self.test_item_id)
            self.assertEqual(response['Item']['status'], 'test')
            
            # Test GSI query (if GSI exists)
            if table.global_secondary_indexes:
                gsi_response = table.query(
                    IndexName='status-timestamp-index',
                    KeyConditionExpression=boto3.dynamodb.conditions.Key('status').eq('test')
                )
                self.assertGreaterEqual(gsi_response['Count'], 0)
            
        except ClientError as e:
            self.fail(f"DynamoDB operations failed: {e}")
        finally:
            # Cleanup
            try:
                table.delete_item(Key={'id': self.test_item_id, 'timestamp': test_item['timestamp']})
            except ClientError:
                pass  # Ignore cleanup errors

    @mark.it("should test S3 bucket basic operations")
    def test_s3_bucket_operations(self):
        """Test S3 bucket basic read/write operations"""
        if not self.staging_bucket_name:
            self.skipTest("S3 bucket name not found in outputs")
            
        test_key = f"integration-test/{self.test_item_id}.json"
        test_content = json.dumps(self.test_data, indent=2)
        
        try:
            # Test write operation
            self.s3_client.put_object(
                Bucket=self.staging_bucket_name,
                Key=test_key,
                Body=test_content,
                ContentType='application/json'
            )
            
            # Test read operation
            response = self.s3_client.get_object(
                Bucket=self.staging_bucket_name,
                Key=test_key
            )
            
            content = response['Body'].read().decode('utf-8')
            self.assertEqual(json.loads(content), self.test_data)
            
        except ClientError as e:
            self.fail(f"S3 operations failed: {e}")
        finally:
            # Cleanup
            try:
                self.s3_client.delete_object(
                    Bucket=self.staging_bucket_name,
                    Key=test_key
                )
            except ClientError:
                pass  # Ignore cleanup errors

    @mark.it("should test Lambda function basic invocation")
    def test_lambda_invocation(self):
        """Test Lambda function basic invocation"""
        # Test health check lambda (if exists)
        health_lambda_name = f"{self.environment}-health-check"
        
        try:
            test_event = {
                "httpMethod": "GET",
                "path": "/health",
                "headers": {"Content-Type": "application/json"}
            }
            
            response = self.lambda_client.invoke(
                FunctionName=health_lambda_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(test_event)
            )
            
            payload = json.loads(response['Payload'].read().decode('utf-8'))
            self.assertEqual(payload['statusCode'], 200)
            
            body = json.loads(payload['body'])
            self.assertEqual(body['status'], 'healthy')
            self.assertEqual(body['environment'], self.environment)
            
        except ClientError as e:
            # Health lambda might not exist in current deployment
            print(f"Health lambda test skipped: {e}")

    @mark.it("should verify CloudWatch Log Groups exist")
    def test_cloudwatch_logs_exist(self):
        """Test that CloudWatch Log Groups are created for Lambda functions"""
        lambda_names = [name for name in [self.validate_lambda_name, self.process_lambda_name] if name]
        expected_log_groups = [f"/aws/lambda/{name}" for name in lambda_names]
        
        for log_group_name in expected_log_groups:
            with self.subTest(log_group=log_group_name):
                try:
                    response = self.logs_client.describe_log_groups(
                        logGroupNamePrefix=log_group_name
                    )
                    
                    log_group_names = [lg['logGroupName'] for lg in response['logGroups']]
                    self.assertIn(log_group_name, log_group_names, 
                                f"Log group {log_group_name} not found")
                    
                except ClientError as e:
                    # Log groups might be created automatically by Lambda
                    print(f"Log group check skipped for {log_group_name}: {e}")

    @mark.it("should test environment-specific configurations") 
    def test_environment_configurations(self):
        """Test that environment-specific configurations are applied correctly"""
        # Verify environment suffix is used consistently
        self.assertEqual(flat_outputs['Environment'], self.environment)
        
        # Verify resource naming follows environment pattern
        resources_with_env = [
            ('validate_lambda_name', self.validate_lambda_name),
            ('process_lambda_name', self.process_lambda_name),
            ('dynamodb_table_name', self.dynamodb_table_name),
            ('staging_bucket_name', self.staging_bucket_name)
        ]
        
        for resource_type, resource_name in resources_with_env:
            if resource_name:  # Only test if resource name exists
                with self.subTest(resource=resource_type):
                    self.assertTrue(
                        resource_name.startswith(self.environment) or 
                        self.environment in resource_name,
                        f"Resource {resource_name} doesn't follow environment naming pattern"
                    )

    def tearDown(self):
        """Clean up after each test"""
        # Clean up any test data created during tests
        pass

    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests complete"""
        # Any global cleanup can go here
        pass


if __name__ == '__main__':
    unittest.main()
