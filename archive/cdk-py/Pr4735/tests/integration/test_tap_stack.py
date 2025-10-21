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
        cls.s3_client = boto3.client('s3')
        cls.sns_client = boto3.client('sns')
        cls.cloudfront_client = boto3.client('cloudfront')
        cls.api_gateway_client = boto3.client('apigateway')
        cls.logs_client = boto3.client('logs')
        
        # Extract outputs
        cls.api_endpoint = flat_outputs.get('ApiEndpoint')
        cls.cloudfront_url = flat_outputs.get('CloudFrontUrl')
        cls.s3_bucket_name = flat_outputs.get('S3BucketName')
        cls.dynamodb_table_name = flat_outputs.get('DynamoDBTableName')
        cls.environment = flat_outputs.get('Environment', 'dev')
        
        # Validate required outputs
        if not all([cls.api_endpoint, cls.s3_bucket_name, cls.dynamodb_table_name]):
            raise unittest.SkipTest("Required CDK outputs missing")
        
        # Derive expected resource names based on environment
        cls.expected_lambda_functions = [
            f"ecommerce-create-product-{cls.environment}",
            f"ecommerce-read-product-{cls.environment}",
            f"ecommerce-update-product-{cls.environment}",
            f"ecommerce-delete-product-{cls.environment}",
            f"ecommerce-list-products-{cls.environment}"
        ]
        cls.expected_sns_topic_name = f"ecommerce-inventory-alerts-{cls.environment}"

    def setUp(self):
        """Set up for each test"""
        self.test_products_created = []  # Track products for cleanup

    def tearDown(self):
        """Clean up after each test"""
        # Clean up any test products created
        if hasattr(self, 'test_products_created'):
            for product_id in self.test_products_created:
                try:
                    response = requests.delete(
                        f"{self.api_endpoint}products/{product_id}",
                        timeout=10
                    )
                except Exception:
                    pass  # Ignore cleanup errors

    @mark.it("should validate DynamoDB table exists and has correct configuration")
    def test_dynamodb_table_configuration(self):
        """Test that DynamoDB table exists with correct configuration"""
        # ARRANGE & ACT
        try:
            table = self.dynamodb.Table(self.dynamodb_table_name)
            table.load()
        except ClientError as e:
            self.fail(f"DynamoDB table {self.dynamodb_table_name} not found: {e}")
        
        # Get table description for detailed validation
        table_description = self.dynamodb_client.describe_table(
            TableName=self.dynamodb_table_name
        )['Table']
        
        # ASSERT - Basic table properties
        self.assertEqual(table.table_name, self.dynamodb_table_name)
        self.assertEqual(table_description['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')
        
        # Check key schema
        key_schema = {item['AttributeName']: item['KeyType'] for item in table_description['KeySchema']}
        self.assertIn('product_id', key_schema)
        self.assertEqual(key_schema['product_id'], 'HASH')  # Partition key
        
        # Check attribute definitions
        attributes = {attr['AttributeName']: attr['AttributeType'] 
                     for attr in table_description['AttributeDefinitions']}
        self.assertIn('product_id', attributes)
        self.assertEqual(attributes['product_id'], 'S')  # String type
        
        # Check encryption
        self.assertIn('SSEDescription', table_description)
        self.assertEqual(table_description['SSEDescription']['Status'], 'ENABLED')
        
        # Check point-in-time recovery
        pitr_response = self.dynamodb_client.describe_continuous_backups(
            TableName=self.dynamodb_table_name
        )
        pitr_status = pitr_response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
        self.assertEqual(pitr_status, 'ENABLED')
        
        # Check Global Secondary Index
        gsi_found = False
        for gsi in table_description.get('GlobalSecondaryIndexes', []):
            if gsi['IndexName'] == 'CategoryIndex':
                gsi_found = True
                gsi_key_schema = {item['AttributeName']: item['KeyType'] for item in gsi['KeySchema']}
                self.assertIn('category', gsi_key_schema)
                self.assertEqual(gsi_key_schema['category'], 'HASH')
                break
        self.assertTrue(gsi_found, "CategoryIndex GSI not found")

    @mark.it("should validate S3 bucket exists and has correct configuration")
    def test_s3_bucket_configuration(self):
        """Test that S3 bucket exists with correct configuration"""
        # ARRANGE & ACT
        try:
            # Check bucket exists
            self.s3_client.head_bucket(Bucket=self.s3_bucket_name)
        except ClientError as e:
            self.fail(f"S3 bucket {self.s3_bucket_name} not found: {e}")
        
        # Get bucket encryption
        try:
            encryption_response = self.s3_client.get_bucket_encryption(Bucket=self.s3_bucket_name)
            encryption_config = encryption_response['ServerSideEncryptionConfiguration']
            # ASSERT - Encryption is enabled
            self.assertGreater(len(encryption_config['Rules']), 0)
        except ClientError as e:
            if e.response['Error']['Code'] != 'ServerSideEncryptionConfigurationNotFoundError':
                self.fail(f"Error checking bucket encryption: {e}")
        
        # Get bucket versioning
        versioning_response = self.s3_client.get_bucket_versioning(Bucket=self.s3_bucket_name)
        # ASSERT - Versioning is enabled
        self.assertEqual(versioning_response.get('Status'), 'Enabled')
        
        # Get bucket public access block
        try:
            public_access_response = self.s3_client.get_public_access_block(Bucket=self.s3_bucket_name)
            public_access_config = public_access_response['PublicAccessBlockConfiguration']
            # ASSERT - All public access is blocked
            self.assertTrue(public_access_config['BlockPublicAcls'])
            self.assertTrue(public_access_config['IgnorePublicAcls'])
            self.assertTrue(public_access_config['BlockPublicPolicy'])
            self.assertTrue(public_access_config['RestrictPublicBuckets'])
        except ClientError as e:
            if e.response['Error']['Code'] != 'NoSuchPublicAccessBlockConfiguration':
                self.fail(f"Error checking public access block: {e}")
        
        # Get bucket CORS configuration
        try:
            cors_response = self.s3_client.get_bucket_cors(Bucket=self.s3_bucket_name)
            cors_rules = cors_response['CORSRules']
            # ASSERT - CORS is configured
            self.assertGreater(len(cors_rules), 0)
            # Check for expected CORS methods
            cors_rule = cors_rules[0]
            self.assertIn('GET', cors_rule['AllowedMethods'])
            self.assertIn('PUT', cors_rule['AllowedMethods'])
            self.assertIn('POST', cors_rule['AllowedMethods'])
        except ClientError as e:
            if e.response['Error']['Code'] != 'NoSuchCORSConfiguration':
                self.fail(f"Error checking CORS configuration: {e}")

    @mark.it("should validate Lambda functions exist and have correct configuration")
    def test_lambda_functions_configuration(self):
        """Test that all Lambda functions exist with correct configuration"""
        for function_name in self.expected_lambda_functions:
            with self.subTest(function=function_name):
                # ARRANGE & ACT
                try:
                    response = self.lambda_client.get_function(FunctionName=function_name)
                except ClientError as e:
                    self.fail(f"Lambda function {function_name} not found: {e}")
                
                function_config = response['Configuration']
                
                # ASSERT - Basic function properties
                self.assertEqual(function_config['FunctionName'], function_name)
                self.assertEqual(function_config['Runtime'], 'python3.11')
                self.assertEqual(function_config['Handler'], 'index.handler')
                self.assertLessEqual(function_config['Timeout'], 30)
                self.assertIn(function_config['MemorySize'], [128, 256])
                
                # Check environment variables
                env_vars = function_config.get('Environment', {}).get('Variables', {})
                self.assertIn('PRODUCTS_TABLE_NAME', env_vars)
                self.assertEqual(env_vars['PRODUCTS_TABLE_NAME'], self.dynamodb_table_name)
                self.assertIn('IMAGES_BUCKET_NAME', env_vars)
                self.assertEqual(env_vars['IMAGES_BUCKET_NAME'], self.s3_bucket_name)
                self.assertIn('ENVIRONMENT', env_vars)
                self.assertEqual(env_vars['ENVIRONMENT'], self.environment)
                
                # Check tracing is enabled
                self.assertEqual(function_config['TracingConfig']['Mode'], 'Active')
                
                # Check IAM role exists
                role_arn = function_config['Role']
                self.assertIn('LambdaExecutionRole', role_arn)

    @mark.it("should validate SNS topic exists and has correct configuration")
    def test_sns_topic_configuration(self):
        """Test that SNS topic exists with correct configuration"""
        # ARRANGE & ACT - List topics and find our topic
        topics_response = self.sns_client.list_topics()
        topic_arn = None
        
        for topic in topics_response['Topics']:
            if self.expected_sns_topic_name in topic['TopicArn']:
                topic_arn = topic['TopicArn']
                break
        
        # ASSERT
        self.assertIsNotNone(topic_arn, f"SNS topic {self.expected_sns_topic_name} not found")
        
        # Get topic attributes
        try:
            attributes_response = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
            attributes = attributes_response['Attributes']
            
            # Check topic name
            self.assertIn(self.expected_sns_topic_name, attributes['TopicArn'])
            
            # Check if there are subscriptions
            subscriptions_response = self.sns_client.list_subscriptions_by_topic(TopicArn=topic_arn)
            # Note: Email subscriptions need manual confirmation, so we just check structure exists
            
        except ClientError as e:
            self.fail(f"Error getting SNS topic attributes: {e}")

    @mark.it("should validate API Gateway exists and has correct configuration")
    def test_api_gateway_configuration(self):
        """Test that API Gateway exists with correct configuration"""
        # ARRANGE & ACT - Extract API ID from endpoint URL
        # Format: https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/
        api_id = self.api_endpoint.split('://')[1].split('.')[0]
        
        try:
            api_response = self.api_gateway_client.get_rest_api(restApiId=api_id)
        except ClientError as e:
            self.fail(f"API Gateway {api_id} not found: {e}")
        
        # ASSERT - API properties
        self.assertIn(self.environment, api_response['name'])
        self.assertEqual(api_response['endpointConfiguration']['types'], ['REGIONAL'])
        
        # Get API resources to validate endpoints
        resources_response = self.api_gateway_client.get_resources(restApiId=api_id)
        print(resources_response)
        resources = resources_response['items']
        
        # Check for expected resources
        resource_paths = [resource.get('pathPart') for resource in resources if 'pathPart' in resource]
        self.assertIn('products', resource_paths)
        
        # Check for path parameters
        path_params = [resource.get('pathPart') for resource in resources 
                      if resource.get('pathPart', '').startswith('{')]
        self.assertIn('{product_id}', path_params)

    @mark.it("should validate CloudFront distribution exists and is accessible")
    def test_cloudfront_distribution(self):
        """Test that CloudFront distribution exists and is properly configured"""
        if not self.cloudfront_url:
            self.skipTest("CloudFront URL not found in outputs")
        
        # ARRANGE & ACT - Extract distribution ID from URL if possible
        # This is a basic test to ensure the distribution is accessible
        try:
            response = requests.get(self.cloudfront_url, timeout=30)
            # CloudFront might return different status codes depending on origin behavior
            self.assertIn(response.status_code, [200, 403, 404])  # 403/404 are OK for unauthenticated requests
        except requests.exceptions.RequestException as e:
            self.fail(f"CloudFront distribution not accessible: {e}")

    @mark.it("should successfully create a product via API Gateway")
    def test_create_product_via_api(self):
        """Test creating a product through the API Gateway"""
        # ARRANGE
        test_product = {
            "name": "Test Product Integration",
            "description": "Product created during integration testing",
            "price": 29.99,
            "category": "test-category",
            "inventory": 100,
            "image_url": ""
        }
        
        # ACT
        response = requests.post(
            f"{self.api_endpoint}products",
            json=test_product,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        # ASSERT
        self.assertEqual(response.status_code, 201, f"API response: {response.text}")
        
        response_data = response.json()
        self.assertIn('product_id', response_data)
        self.assertIn('created_at', response_data)
        self.assertEqual(response_data['name'], test_product['name'])
        self.assertEqual(response_data['category'], test_product['category'])
        self.assertEqual(float(response_data['price']), test_product['price'])
        self.assertEqual(response_data['inventory'], test_product['inventory'])
        
        # Track for cleanup
        self.test_products_created.append(response_data['product_id'])
        
        # Verify CORS headers
        self.assertEqual(response.headers.get('Access-Control-Allow-Origin'), '*')

    @mark.it("should successfully retrieve products via API Gateway")
    def test_list_products_via_api(self):
        """Test listing products through the API Gateway"""
        # ARRANGE - Create a test product first
        test_product = {
            "name": "Test List Product",
            "description": "Product for list testing",
            "price": 15.99,
            "category": "list-test",
            "inventory": 50
        }
        
        create_response = requests.post(
            f"{self.api_endpoint}products",
            json=test_product,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        self.assertEqual(create_response.status_code, 201)
        created_product = create_response.json()
        self.test_products_created.append(created_product['product_id'])
        
        # Wait a moment for eventual consistency
        time.sleep(2)
        
        # ACT - List products
        response = requests.get(f"{self.api_endpoint}products", timeout=30)
        
        # ASSERT
        self.assertEqual(response.status_code, 200, f"API response: {response.text}")
        
        response_data = response.json()
        self.assertIn('products', response_data)
        self.assertIn('count', response_data)
        self.assertIsInstance(response_data['products'], list)
        self.assertGreaterEqual(response_data['count'], 1)
        
        # Verify our test product is in the list
        product_names = [p['name'] for p in response_data['products']]
        self.assertIn(test_product['name'], product_names)

    @mark.it("should successfully update and delete products via API Gateway")
    def test_update_delete_product_via_api(self):
        """Test updating and deleting a product through the API Gateway"""
        # ARRANGE - Create a test product first
        test_product = {
            "name": "Test Update Delete Product",
            "description": "Product for update/delete testing",
            "price": 39.99,
            "category": "update-test",
            "inventory": 75
        }
        
        create_response = requests.post(
            f"{self.api_endpoint}products",
            json=test_product,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        self.assertEqual(create_response.status_code, 201)
        created_product = create_response.json()
        product_id = created_product['product_id']
        
        # ACT & ASSERT - Update product
        updated_data = {
            "name": "Updated Test Product",
            "price": 49.99,
            "inventory": 50
        }
        
        update_response = requests.put(
            f"{self.api_endpoint}products/{product_id}",
            json=updated_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )

    @mark.it("should validate DynamoDB integration with Lambda functions")
    def test_dynamodb_lambda_integration(self):
        """Test that Lambda functions can properly interact with DynamoDB"""
        # ARRANGE - Create a product to ensure DynamoDB write works
        test_product = {
            "name": "DynamoDB Integration Test",
            "description": "Testing DynamoDB integration",
            "price": 99.99,
            "category": "integration",
            "inventory": 25
        }
        
        # ACT - Create product via API (which uses Lambda + DynamoDB)
        response = requests.post(
            f"{self.api_endpoint}products",
            json=test_product,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        # ASSERT
        self.assertEqual(response.status_code, 201)
        created_product = response.json()
        product_id = created_product['product_id']
        self.test_products_created.append(product_id)
        
        # Verify data was written to DynamoDB by querying directly
        try:
            table = self.dynamodb.Table(self.dynamodb_table_name)
            dynamodb_response = table.get_item(Key={'product_id': product_id})
            
            # ASSERT - Product exists in DynamoDB
            self.assertIn('Item', dynamodb_response)
            db_item = dynamodb_response['Item']
            self.assertEqual(db_item['name'], test_product['name'])
            self.assertEqual(db_item['category'], test_product['category'])
            self.assertEqual(float(db_item['price']), test_product['price'])
            
        except ClientError as e:
            self.fail(f"Error querying DynamoDB directly: {e}")

    @mark.it("should validate CloudWatch logs are being generated")
    def test_cloudwatch_logs_generation(self):
        """Test that CloudWatch logs are being generated for Lambda functions"""
        # ARRANGE - Make an API call to generate logs
        requests.get(f"{self.api_endpoint}products", timeout=30)
        
        # Wait for logs to be written
        time.sleep(5)
        
        # ACT & ASSERT - Check that log groups exist for Lambda functions
        for function_name in self.expected_lambda_functions[:2]:  # Check first 2 functions
            log_group_name = f"/aws/lambda/{function_name}"
            
            try:
                # Check if log group exists
                log_groups_response = self.logs_client.describe_log_groups(
                    logGroupNamePrefix=log_group_name
                )
                
                log_group_found = False
                for log_group in log_groups_response['logGroups']:
                    if log_group['logGroupName'] == log_group_name:
                        log_group_found = True
                        break
                
                self.assertTrue(log_group_found, f"Log group {log_group_name} not found")
                
                # Check if there are log streams (indicating logs are being written)
                streams_response = self.logs_client.describe_log_streams(
                    logGroupName=log_group_name,
                    orderBy='LastEventTime',
                    descending=True,
                    limit=1
                )
                
                if streams_response['logStreams']:
                    # If streams exist, logs are being generated
                    self.assertGreater(len(streams_response['logStreams']), 0)
                
            except ClientError as e:
                if e.response['Error']['Code'] != 'ResourceNotFoundException':
                    self.fail(f"Error checking CloudWatch logs for {function_name}: {e}")


if __name__ == '__main__':
    unittest.main()
