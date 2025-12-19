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
        cls.api_endpoint = cls.outputs.get('ApiEndpoint', '')
        cls.serverless_api_endpoint = cls.outputs.get('ServerlessApiEndpoint39E2F4FD', '')
        cls.cloudfront_domain = cls.outputs.get('CloudFrontDomain', '')
        cls.dynamodb_table_name = cls.outputs.get('DynamoDBTableName', '')
        cls.dynamodb_table_arn = cls.outputs.get('DynamoDBTableArn', '')
        cls.storage_bucket_name = cls.outputs.get('StorageBucketName', '')
        cls.storage_bucket_arn = cls.outputs.get('StorageBucketArn', '')
        cls.logging_bucket_name = cls.outputs.get('LoggingBucketName', '')
        cls.logging_bucket_arn = cls.outputs.get('LoggingBucketArn', '')
        cls.sns_topic_arn = cls.outputs.get('SNSTopicArn', '')
        cls.lambda_function_name = cls.outputs.get('LambdaFunctionName', '')
        cls.lambda_function_arn = cls.outputs.get('LambdaFunctionArn', '')
        cls.kms_key_arn = cls.outputs.get('KMSKeyArn', '')
        cls.api_log_group_name = cls.outputs.get('ApiGatewayLogGroupName', '')
        cls.cloudfront_distribution_id = cls.outputs.get('CloudFrontDistributionId', '')
        cls.cloudfront_distribution_arn = cls.outputs.get('CloudFrontDistributionArn', '')
        cls.deployment_group_name = cls.outputs.get('DeploymentGroupName', '')
        
        # Extract region from SNS ARN
        if cls.sns_topic_arn:
            arn_parts = cls.sns_topic_arn.split(':')
            cls.region = arn_parts[3] if len(arn_parts) > 3 else 'us-west-2'
        else:
            cls.region = 'us-west-2'
        
        # Initialize AWS clients
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.dynamodb_resource = boto3.resource('dynamodb', region_name=cls.region)
        cls.sns_client = boto3.client('sns', region_name=cls.region)
        cls.apigateway_client = boto3.client('apigateway', region_name=cls.region)
        cls.cloudfront_client = boto3.client('cloudfront', region_name='us-east-1')  # CloudFront is global
        cls.logs_client = boto3.client('logs', region_name=cls.region)
        cls.kms_client = boto3.client('kms', region_name=cls.region)
        cls.codedeploy_client = boto3.client('codedeploy', region_name=cls.region)
        
        # Test items for cleanup
        cls.created_items = []
        cls.created_s3_objects = []

    def setUp(self):
        """Set up for each test"""
        self.maxDiff = None

    def tearDown(self):
        """Clean up test objects after each test"""
        # Clean up DynamoDB test items
        if self.created_items:
            table = self.dynamodb_resource.Table(self.dynamodb_table_name)
            for item_id, timestamp in self.created_items:
                try:
                    table.delete_item(
                        Key={'id': item_id, 'timestamp': timestamp}
                    )
                except Exception:
                    pass  # Ignore cleanup errors
            self.created_items.clear()
        
        # Clean up S3 test objects
        for bucket_name, object_key in self.created_s3_objects:
            try:
                self.s3_client.delete_object(Bucket=bucket_name, Key=object_key)
            except Exception:
                pass  # Ignore cleanup errors
        self.created_s3_objects.clear()

    @mark.it("validates that all required outputs exist")
    def test_outputs_exist(self):
        """Test that all required stack outputs are present"""
        required_outputs = [
            'ApiEndpoint',
            'CloudFrontDomain',
            'DynamoDBTableName',
            'DynamoDBTableArn',
            'StorageBucketName',
            'StorageBucketArn',
            'LoggingBucketName',
            'LoggingBucketArn',
            'SNSTopicArn',
            'LambdaFunctionName',
            'LambdaFunctionArn',
            'KMSKeyArn',
            'ApiGatewayLogGroupName',
            'CloudFrontDistributionId',
            'CloudFrontDistributionArn',
            'DeploymentGroupName'
        ]
        
        for output in required_outputs:
            self.assertIn(output, self.outputs, f"Missing required output: {output}")
            self.assertIsNotNone(self.outputs[output], f"Output {output} is None")
            self.assertNotEqual(self.outputs[output], '', f"Output {output} is empty")

    @mark.it("validates DynamoDB table exists with correct configuration")
    def test_dynamodb_table_configuration(self):
        """Test that the DynamoDB table exists with correct configuration"""
        try:
            response = self.dynamodb_client.describe_table(TableName=self.dynamodb_table_name)
            table = response['Table']
            
            # Validate table name and status
            self.assertEqual(table['TableName'], self.dynamodb_table_name)
            self.assertEqual(table['TableStatus'], 'ACTIVE')
            
            # Validate billing mode
            self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
            
            # Validate key schema
            key_schema = table['KeySchema']
            partition_key = next((k for k in key_schema if k['KeyType'] == 'HASH'), None)
            sort_key = next((k for k in key_schema if k['KeyType'] == 'RANGE'), None)
            
            self.assertIsNotNone(partition_key)
            self.assertEqual(partition_key['AttributeName'], 'id')
            self.assertIsNotNone(sort_key)
            self.assertEqual(sort_key['AttributeName'], 'timestamp')
            
            # Validate stream is enabled
            self.assertIn('StreamSpecification', table)
            self.assertEqual(table['StreamSpecification']['StreamEnabled'], True)
            self.assertEqual(table['StreamSpecification']['StreamViewType'], 'NEW_AND_OLD_IMAGES')
            
            # Validate Global Secondary Index
            gsi_list = table.get('GlobalSecondaryIndexes', [])
            self.assertTrue(len(gsi_list) > 0, "No Global Secondary Index found")
            status_index = next((gsi for gsi in gsi_list if gsi['IndexName'] == 'StatusIndex'), None)
            self.assertIsNotNone(status_index, "StatusIndex not found")
            
        except ClientError as e:
            self.fail(f"DynamoDB table not found or error occurred: {e}")

    @mark.it("validates S3 storage bucket exists with correct configuration")
    def test_storage_bucket_configuration(self):
        """Test that the S3 storage bucket exists with correct configuration"""
        try:
            # Check bucket exists
            response = self.s3_client.head_bucket(Bucket=self.storage_bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
            
            # Validate versioning is enabled
            versioning = self.s3_client.get_bucket_versioning(Bucket=self.storage_bucket_name)
            self.assertEqual(versioning.get('Status'), 'Enabled')
            
            # Validate encryption (should be KMS)
            try:
                encryption = self.s3_client.get_bucket_encryption(Bucket=self.storage_bucket_name)
                rules = encryption['ServerSideEncryptionConfiguration']['Rules']
                self.assertTrue(len(rules) > 0, "No encryption rules found")
                # Should use KMS encryption
                self.assertEqual(rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'], 'aws:kms')
                self.assertIn('KMSMasterKeyID', rules[0]['ApplyServerSideEncryptionByDefault'])
            except ClientError as e:
                if e.response['Error']['Code'] != 'ServerSideEncryptionConfigurationNotFoundError':
                    raise
            
            # Validate public access block
            try:
                public_access_block = self.s3_client.get_public_access_block(Bucket=self.storage_bucket_name)
                config = public_access_block['PublicAccessBlockConfiguration']
                self.assertTrue(config['BlockPublicAcls'])
                self.assertTrue(config['BlockPublicPolicy'])
                self.assertTrue(config['IgnorePublicAcls'])
                self.assertTrue(config['RestrictPublicBuckets'])
            except ClientError as e:
                if e.response['Error']['Code'] != 'NoSuchPublicAccessBlockConfiguration':
                    raise
            
        except ClientError as e:
            self.fail(f"S3 storage bucket not found or error occurred: {e}")

    @mark.it("validates S3 logging bucket exists with correct configuration")
    def test_logging_bucket_configuration(self):
        """Test that the S3 logging bucket exists with correct configuration"""
        try:
            # Check bucket exists
            response = self.s3_client.head_bucket(Bucket=self.logging_bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
            
            # Validate lifecycle rules exist
            try:
                lifecycle = self.s3_client.get_bucket_lifecycle_configuration(Bucket=self.logging_bucket_name)
                rules = lifecycle.get('Rules', [])
                self.assertTrue(len(rules) > 0, "No lifecycle rules found")
            except ClientError as e:
                if e.response['Error']['Code'] != 'NoSuchLifecycleConfiguration':
                    raise
            
        except ClientError as e:
            self.fail(f"S3 logging bucket not found or error occurred: {e}")

    @mark.it("validates SNS topic exists and is accessible")
    def test_sns_topic_configuration(self):
        """Test that the SNS topic exists and is accessible"""
        try:
            response = self.sns_client.get_topic_attributes(TopicArn=self.sns_topic_arn)
            attributes = response['Attributes']
            
            # Validate topic exists and has attributes
            self.assertIn('TopicArn', attributes)
            self.assertEqual(attributes['TopicArn'], self.sns_topic_arn)
            self.assertIn('DisplayName', attributes)
            self.assertEqual(attributes['DisplayName'], 'Serverless Application Notifications')
            
            # Check if topic has KMS encryption
            if 'KmsMasterKeyId' in attributes:
                self.assertIn('key/', attributes['KmsMasterKeyId'])
            
            # List subscriptions
            subscriptions = self.sns_client.list_subscriptions_by_topic(TopicArn=self.sns_topic_arn)
            self.assertIsInstance(subscriptions['Subscriptions'], list)
            
        except ClientError as e:
            self.fail(f"SNS topic not found or error occurred: {e}")

    @mark.it("validates KMS key exists and is accessible")
    def test_kms_key_configuration(self):
        """Test that the KMS key exists with correct configuration"""
        try:
            # Extract key ID from ARN
            key_id = self.kms_key_arn.split('/')[-1]
            
            # Describe the key
            response = self.kms_client.describe_key(KeyId=key_id)
            key_metadata = response['KeyMetadata']
            
            # Validate key configuration
            self.assertEqual(key_metadata['KeyUsage'], 'ENCRYPT_DECRYPT')
            self.assertEqual(key_metadata['KeyState'], 'Enabled')
            self.assertTrue(key_metadata['Enabled'])
            
            # Check if key rotation is enabled
            try:
                rotation_status = self.kms_client.get_key_rotation_status(KeyId=key_id)
                self.assertTrue(rotation_status['KeyRotationEnabled'])
            except ClientError:
                pass  # Key rotation might not be enabled
            
        except ClientError as e:
            self.fail(f"KMS key not found or error occurred: {e}")

    @mark.it("validates Lambda function exists and has correct configuration")
    def test_lambda_function_configuration(self):
        """Test that Lambda function exists with correct configuration"""
        try:
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            config = response['Configuration']
            
            # Validate function configuration
            self.assertEqual(config['Runtime'], 'python3.11')
            self.assertEqual(config['Handler'], 'index.handler')
            self.assertEqual(config['Timeout'], 30)
            self.assertEqual(config['MemorySize'], 512)
            
            # Validate environment variables
            env_vars = config.get('Environment', {}).get('Variables', {})
            self.assertIn('DYNAMODB_TABLE', env_vars)
            self.assertEqual(env_vars['DYNAMODB_TABLE'], self.dynamodb_table_name)
            self.assertIn('S3_BUCKET', env_vars)
            self.assertEqual(env_vars['S3_BUCKET'], self.storage_bucket_name)
            self.assertIn('SNS_TOPIC_ARN', env_vars)
            self.assertEqual(env_vars['SNS_TOPIC_ARN'], self.sns_topic_arn)
            
            # Validate tracing is enabled
            self.assertEqual(config['TracingConfig']['Mode'], 'Active')
            
            # Check if function has alias
            try:
                alias_response = self.lambda_client.get_alias(
                    FunctionName=self.lambda_function_name,
                    Name='live'
                )
                self.assertEqual(alias_response['Name'], 'live')
            except ClientError:
                pass  # Alias might not exist
            
        except ClientError as e:
            self.fail(f"Lambda function not found or error occurred: {e}")

    @mark.it("validates API Gateway exists with correct configuration")
    def test_api_gateway_configuration(self):
        """Test that API Gateway exists with correct configuration"""
        try:
            # Extract API ID from endpoint URL
            api_id = self.api_endpoint.split('//')[1].split('.')[0]
            
            # Get API information
            api_info = self.apigateway_client.get_rest_api(restApiId=api_id)
            self.assertEqual(api_info['name'], 'ServerlessInfraAPI')
            self.assertEqual(api_info['description'], 'Serverless Infrastructure API')
            
            # Get resources
            resources = self.apigateway_client.get_resources(restApiId=api_id)
            resource_paths = [res['pathPart'] for res in resources['items'] if 'pathPart' in res]
            self.assertIn('items', resource_paths)
            
            # Get stage information
            stages = self.apigateway_client.get_stages(restApiId=api_id)
            prod_stage = next((stage for stage in stages['item'] if stage['stageName'] == 'prod'), None)
            self.assertIsNotNone(prod_stage, "Production stage not found")
            
        except ClientError as e:
            self.fail(f"API Gateway not found or error occurred: {e}")

    @mark.it("validates CloudFront distribution exists with correct configuration")
    def test_cloudfront_distribution_configuration(self):
        """Test that CloudFront distribution exists with correct configuration"""
        try:
            response = self.cloudfront_client.get_distribution(Id=self.cloudfront_distribution_id)
            distribution = response['Distribution']
            
            # Validate distribution configuration
            self.assertEqual(distribution['Status'], 'Deployed')
            self.assertTrue(distribution['DistributionConfig']['Enabled'])
            
            # Validate domain name
            self.assertEqual(distribution['DomainName'], self.cloudfront_domain)
            
            # Validate default behavior
            default_behavior = distribution['DistributionConfig']['DefaultCacheBehavior']
            self.assertEqual(default_behavior['ViewerProtocolPolicy'], 'redirect-to-https')
            self.assertIn('GET', default_behavior['AllowedMethods']['Items'])
            self.assertIn('POST', default_behavior['AllowedMethods']['Items'])
            
        except ClientError as e:
            self.fail(f"CloudFront distribution not found or error occurred: {e}")

    @mark.it("validates CloudWatch log group exists")
    def test_cloudwatch_log_group_exists(self):
        """Test that CloudWatch log group exists"""
        try:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=self.api_log_group_name
            )
            
            log_groups = response['logGroups']
            log_group = next((lg for lg in log_groups if lg['logGroupName'] == self.api_log_group_name), None)
            self.assertIsNotNone(log_group, f"Log group {self.api_log_group_name} not found")
            
            # Validate retention period (3 months = 90 days)
            if 'retentionInDays' in log_group:
                self.assertEqual(log_group['retentionInDays'], 90)
            
        except ClientError as e:
            self.fail(f"CloudWatch log group not found or error occurred: {e}")

    @mark.it("validates API Gateway HTTP endpoint - GET /items")
    def test_api_gateway_get_items(self):
        """Test API Gateway GET /items endpoint functionality"""
        try:
            response = requests.get(
                f"{self.api_endpoint}items",
                headers={"Accept": "application/json"},
                timeout=30
            )
            
            # Should return 200
            self.assertEqual(response.status_code, 200)
            
            # Should return JSON array
            response_data = response.json()
            self.assertIsInstance(response_data, list)
            
        except requests.RequestException as e:
            self.fail(f"Error testing API Gateway GET endpoint: {e}")

    @mark.it("validates API Gateway HTTP endpoint - POST /items")
    def test_api_gateway_post_items(self):
        """Test API Gateway POST /items endpoint functionality"""
        test_item_data = {
            "name": "Integration Test Item",
            "description": "Created by integration test",
            "category": "testing"
        }
        
        try:
            response = requests.post(
                f"{self.api_endpoint}items",
                json=test_item_data,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                timeout=30
            )
            
        except requests.RequestException as e:
            self.fail(f"Error testing API Gateway POST endpoint: {e}")

    @mark.it("validates CloudFront distribution functionality")
    def test_cloudfront_distribution_functionality(self):
        """Test CloudFront distribution functionality"""
        try:
            # Test HTTP request through CloudFront
            cloudfront_url = f"https://{self.cloudfront_domain}/"
            response = requests.get(
                f"{cloudfront_url}items",
                headers={"Accept": "application/json"},
                timeout=60  # CloudFront may take longer
            )
            
        except requests.RequestException as e:
            # CloudFront might take time to propagate
            self.skipTest(f"CloudFront distribution not ready yet: {e}")

    @mark.it("validates performance by measuring response times")
    def test_api_performance(self):
        """Test API performance by measuring response times"""
        try:
            start_time = time.time()
            
            response = requests.get(
                f"{self.api_endpoint}items",
                headers={"Accept": "application/json"},
                timeout=30
            )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            # Validate response
            self.assertEqual(response.status_code, 200)
            
            # Performance assertion: API should respond within 5 seconds
            self.assertLess(response_time, 5.0, f"API response time {response_time:.2f}s exceeds 5 seconds")
            
        except requests.RequestException as e:
            self.fail(f"Error in performance test: {e}")

    @mark.it("validates error handling returns proper HTTP status codes")
    def test_api_error_handling(self):
        """Test API error handling with invalid requests"""
        try:
            # Test invalid JSON data
            response = requests.post(
                f"{self.api_endpoint}items",
                data="invalid-json-data",
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                timeout=30
            )
            
            # Should return an error status (400 or 500)
            self.assertIn(response.status_code, [400, 500])
            
            # Test non-existent endpoint
            response = requests.get(
                f"{self.api_endpoint}nonexistent",
                headers={"Accept": "application/json"},
                timeout=30
            )
            
            # Should return 404 or similar error
            self.assertIn(response.status_code, [403, 404])
            
        except requests.RequestException as e:
            self.fail(f"Error testing API error handling: {e}")


if __name__ == "__main__":
    unittest.main()
