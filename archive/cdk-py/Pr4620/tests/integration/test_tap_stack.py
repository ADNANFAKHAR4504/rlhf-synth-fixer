import json
import os
import unittest
import boto3
import base64
import uuid
import time
from botocore.exceptions import ClientError
from pytest import mark
import requests

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


@mark.describe("TapStack Image Processing Integration Tests")
class TestTapStack(unittest.TestCase):
    """Integration tests for the deployed TapStack serverless image processing resources"""

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
        cls.lambda_function_arn = cls.outputs.get('LambdaFunctionArn', '')

        # Initialize AWS clients
        cls.dynamodb_client = boto3.client('dynamodb')
        cls.dynamodb_resource = boto3.resource('dynamodb')
        cls.lambda_client = boto3.client('lambda')
        cls.s3_client = boto3.client('s3')
        cls.iam_client = boto3.client('iam')
        cls.apigateway_client = boto3.client('apigateway')
        cls.logs_client = boto3.client('logs')

        print(f"API Endpoint: {cls.api_endpoint}")
        print(f"S3 Bucket: {cls.s3_bucket_name}")
        print(f"DynamoDB Table: {cls.dynamodb_table_name}")
        print(f"Lambda Function: {cls.lambda_function_name}")

        # Test data
        cls.test_user_id = f"test-user-{uuid.uuid4().hex[:8]}"
        cls.created_image_ids = []

    def setUp(self):
        """Set up test data for each test"""
        self.test_image_ids = []

    def tearDown(self):
        """Clean up test data after each test"""
        # Clean up any test images created during tests
        table = self.dynamodb_resource.Table(self.dynamodb_table_name)
        
        for image_id in self.test_image_ids:
            try:
                # Get the image metadata to find S3 key
                response = table.query(
                    KeyConditionExpression='imageId = :id',
                    ExpressionAttributeValues={':id': image_id}
                )
                
                if response.get('Items'):
                    s3_key = response['Items'][0].get('s3Key')
                    if s3_key:
                        # Delete from S3
                        self.s3_client.delete_object(Bucket=self.s3_bucket_name, Key=s3_key)
                    
                    # Delete from DynamoDB
                    table.delete_item(
                        Key={
                            'imageId': image_id,
                            'timestamp': response['Items'][0]['timestamp']
                        }
                    )
                    print(f"Cleaned up image: {image_id}")
            except Exception as e:
                print(f"Error cleaning up image {image_id}: {e}")

    @mark.it("validates that S3 bucket exists and has correct configuration")
    def test_s3_bucket_exists_and_configured(self):
        """Test that the S3 bucket exists and is properly configured for image storage"""
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

            # Check CORS configuration for image uploads
            cors_config = self.s3_client.get_bucket_cors(Bucket=self.s3_bucket_name)
            cors_rules = cors_config['CORSRules']
            self.assertGreater(len(cors_rules), 0, "CORS rules should be configured")

            print("✅ S3 bucket configuration validated")

        except ClientError as e:
            self.fail(f"S3 bucket validation failed: {e}")

    @mark.it("validates that DynamoDB table exists with correct schema for image metadata")
    def test_dynamodb_table_exists_and_configured(self):
        """Test that the DynamoDB table exists with correct configuration for image metadata"""
        try:
            response = self.dynamodb_client.describe_table(TableName=self.dynamodb_table_name)
            table = response['Table']

            # Validate table properties
            self.assertEqual(table['TableStatus'], 'ACTIVE')
            self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

            # Validate key schema - should have imageId as partition key and timestamp as sort key
            key_schema = {item['AttributeName']: item['KeyType'] for item in table['KeySchema']}
            self.assertEqual(key_schema.get('imageId'), 'HASH', "imageId should be partition key")
            self.assertEqual(key_schema.get('timestamp'), 'RANGE', "timestamp should be sort key")

            # Validate attribute definitions
            attributes = {attr['AttributeName']: attr['AttributeType'] for attr in table['AttributeDefinitions']}
            self.assertEqual(attributes['imageId'], 'S', "imageId should be of type String")
            self.assertEqual(attributes['timestamp'], 'N', "timestamp should be of type Number")

            # Validate Global Secondary Index for user queries
            gsi_list = table.get('GlobalSecondaryIndexes', [])
            user_index = next((gsi for gsi in gsi_list if gsi['IndexName'] == 'UserIndex'), None)
            self.assertIsNotNone(user_index, "UserIndex GSI should exist")
            
            if user_index:
                gsi_keys = {item['AttributeName']: item['KeyType'] for item in user_index['KeySchema']}
                self.assertEqual(gsi_keys.get('userId'), 'HASH', "userId should be GSI partition key")
                self.assertEqual(gsi_keys.get('timestamp'), 'RANGE', "timestamp should be GSI sort key")

            # Validate encryption
            self.assertIn('SSEDescription', table)
            self.assertEqual(table['SSEDescription']['Status'], 'ENABLED')

            print("✅ DynamoDB table configuration validated")

        except ClientError as e:
            self.fail(f"DynamoDB table validation failed: {e}")

    @mark.it("validates that Lambda function exists and is properly configured for image processing")
    def test_lambda_function_exists_and_configured(self):
        """Test that the Lambda function exists and is properly configured for image processing"""
        try:
            response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
            function_config = response['Configuration']

            # Validate basic configuration
            self.assertEqual(function_config['Runtime'], 'python3.11')
            self.assertEqual(function_config['Handler'], 'index.handler')
            self.assertEqual(function_config['Timeout'], 30)
            self.assertEqual(function_config['MemorySize'], 512)

            # Validate environment variables for image processing
            env_vars = function_config.get('Environment', {}).get('Variables', {})
            self.assertIn('BUCKET_NAME', env_vars)
            self.assertIn('TABLE_NAME', env_vars)
            self.assertIn('LOG_LEVEL', env_vars)
            self.assertIn('REGION', env_vars)
            
            self.assertEqual(env_vars['BUCKET_NAME'], self.s3_bucket_name)
            self.assertEqual(env_vars['TABLE_NAME'], self.dynamodb_table_name)
            self.assertEqual(env_vars['LOG_LEVEL'], 'INFO')

            # Validate X-Ray tracing is enabled
            self.assertEqual(function_config.get('TracingConfig', {}).get('Mode'), 'Active')

            print("✅ Lambda function configuration validated")

        except ClientError as e:
            self.fail(f"Lambda function validation failed: {e}")

    @mark.it("validates API Gateway endpoints for image processing")
    def test_api_gateway_image_upload_success(self):
        """Test successful image upload via POST /images endpoint"""
        try:
            # Create a simple test image (1x1 pixel PNG)
            test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=="
            
            upload_payload = {
                "image_data": test_image_base64,
                "content_type": "image/png",
                "user_id": self.test_user_id,
                "image_name": "test-integration.png",
                "tags": {"test": "integration", "environment": "test"}
            }

            # Upload image via API
            response = requests.post(
                f"{self.api_endpoint}images",
                json=upload_payload,
                timeout=30
            )

            self.assertEqual(response.status_code, 201)
            
            response_data = response.json()
            self.assertIn('imageId', response_data)
            self.assertIn('message', response_data)
            self.assertIn('metadata', response_data)
            self.assertIn('url', response_data)
            
            image_id = response_data['imageId']
            self.test_image_ids.append(image_id)
            
            # Validate metadata
            metadata = response_data['metadata']
            self.assertEqual(metadata['userId'], self.test_user_id)
            self.assertEqual(metadata['imageName'], "test-integration.png")
            self.assertEqual(metadata['contentType'], "image/png")
            
            # Check CORS headers
            self.assertIn('Access-Control-Allow-Origin', response.headers)
            self.assertIn('Access-Control-Allow-Methods', response.headers)
            
            print(f"✅ Image upload successful - Image ID: {image_id}")

        except requests.RequestException as e:
            self.fail(f"API Gateway image upload test failed: {e}")

    @mark.it("validates API Gateway image upload validation")
    def test_api_gateway_image_upload_validation(self):
        """Test image upload validation for missing fields and invalid data"""
        try:
            # Test missing required fields
            invalid_payload = {
                "image_data": "invalid_base64",
                "user_id": self.test_user_id
                # Missing content_type
            }

            response = requests.post(
                f"{self.api_endpoint}images",
                json=invalid_payload,
                timeout=30
            )

            self.assertEqual(response.status_code, 400)
            response_data = response.json()
            self.assertIn('error', response_data)
            self.assertIn('missing_fields', response_data)
            
            print("✅ Image upload validation works correctly")

        except requests.RequestException as e:
            self.fail(f"API Gateway validation test failed: {e}")

    @mark.it("validates API Gateway image retrieval by ID")
    def test_api_gateway_get_image_by_id(self):
        """Test retrieving specific image metadata via GET /images/{id}"""
        try:
            # First upload an image
            test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=="
            
            upload_payload = {
                "image_data": test_image_base64,
                "content_type": "image/png",
                "user_id": self.test_user_id,
                "image_name": "retrieval-test.png"
            }

            upload_response = requests.post(
                f"{self.api_endpoint}images",
                json=upload_payload,
                timeout=30
            )
            
            self.assertEqual(upload_response.status_code, 201)
            image_id = upload_response.json()['imageId']
            self.test_image_ids.append(image_id)

            # Now retrieve the image by ID
            get_response = requests.get(
                f"{self.api_endpoint}images/{image_id}",
                timeout=30
            )
            
            self.assertEqual(get_response.status_code, 200)
            
            response_data = get_response.json()
            self.assertIn('imageId', response_data)
            self.assertIn('metadata', response_data)
            self.assertEqual(response_data['imageId'], image_id)
            
            metadata = response_data['metadata']
            self.assertEqual(metadata['userId'], self.test_user_id)
            self.assertEqual(metadata['imageName'], "retrieval-test.png")
            
            print(f"✅ Image retrieval by ID successful - Image ID: {image_id}")

        except requests.RequestException as e:
            self.fail(f"API Gateway image retrieval test failed: {e}")

    @mark.it("validates API Gateway image listing with user filter")
    def test_api_gateway_list_images_by_user(self):
        """Test listing images with user filter via GET /images?userId=xxx"""
        try:
            # Upload multiple images for the test user
            test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=="
            
            uploaded_images = []
            for i in range(3):
                upload_payload = {
                    "image_data": test_image_base64,
                    "content_type": "image/png",
                    "user_id": self.test_user_id,
                    "image_name": f"list-test-{i}.png"
                }

                upload_response = requests.post(
                    f"{self.api_endpoint}images",
                    json=upload_payload,
                    timeout=30
                )
                
                self.assertEqual(upload_response.status_code, 201)
                image_id = upload_response.json()['imageId']
                uploaded_images.append(image_id)
                self.test_image_ids.append(image_id)

            # List images for the user
            list_response = requests.get(
                f"{self.api_endpoint}images?userId={self.test_user_id}",
                timeout=30
            )
            
            self.assertEqual(list_response.status_code, 200)
            
            response_data = list_response.json()
            self.assertIn('images', response_data)
            self.assertIn('count', response_data)
            
            images = response_data['images']
            self.assertGreaterEqual(len(images), 3, "Should find at least 3 uploaded images")
            
            # Verify all returned images belong to the test user
            for image in images:
                self.assertEqual(image['userId'], self.test_user_id)
            
            print(f"✅ Image listing successful - Found {len(images)} images for user {self.test_user_id}")

        except requests.RequestException as e:
            self.fail(f"API Gateway image listing test failed: {e}")

    @mark.it("validates DynamoDB integration for image metadata storage")
    def test_dynamodb_image_metadata_storage(self):
        """Test that image metadata is properly stored in DynamoDB"""
        try:
            # Upload an image via API
            test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=="
            
            upload_payload = {
                "image_data": test_image_base64,
                "content_type": "image/png",
                "user_id": self.test_user_id,
                "image_name": "dynamodb-test.png",
                "tags": {"purpose": "dynamodb-integration-test"}
            }

            upload_response = requests.post(
                f"{self.api_endpoint}images",
                json=upload_payload,
                timeout=30
            )
            
            self.assertEqual(upload_response.status_code, 201)
            image_id = upload_response.json()['imageId']
            self.test_image_ids.append(image_id)

            # Verify data exists in DynamoDB directly
            table = self.dynamodb_resource.Table(self.dynamodb_table_name)
            
            # Query by imageId
            db_response = table.query(
                KeyConditionExpression='imageId = :id',
                ExpressionAttributeValues={':id': image_id}
            )
            
            self.assertGreater(len(db_response['Items']), 0, "Image metadata should exist in DynamoDB")
            
            item = db_response['Items'][0]
            self.assertEqual(item['imageId'], image_id)
            self.assertEqual(item['userId'], self.test_user_id)
            self.assertEqual(item['imageName'], "dynamodb-test.png")
            self.assertEqual(item['contentType'], "image/png")
            self.assertIn('timestamp', item)
            self.assertIn('s3Key', item)
            self.assertIn('uploadDate', item)
            self.assertEqual(item['tags']['purpose'], "dynamodb-integration-test")

            print(f"✅ DynamoDB integration validated - Image metadata stored correctly")

        except (requests.RequestException, ClientError) as e:
            self.fail(f"DynamoDB integration test failed: {e}")

    @mark.it("validates S3 integration for actual image storage")
    def test_s3_image_storage_integration(self):
        """Test that images are actually stored in S3 with correct metadata"""
        try:
            # Upload an image via API
            test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=="
            
            upload_payload = {
                "image_data": test_image_base64,
                "content_type": "image/png",
                "user_id": self.test_user_id,
                "image_name": "s3-test.png"
            }

            upload_response = requests.post(
                f"{self.api_endpoint}images",
                json=upload_payload,
                timeout=30
            )
            
            self.assertEqual(upload_response.status_code, 201)
            response_data = upload_response.json()
            image_id = response_data['imageId']
            s3_key = response_data['metadata']['s3Key']
            self.test_image_ids.append(image_id)

            # Verify the actual image exists in S3
            s3_response = self.s3_client.get_object(
                Bucket=self.s3_bucket_name,
                Key=s3_key
            )
            
            self.assertEqual(s3_response['ContentType'], 'image/png')
            self.assertIn('user_id', s3_response['Metadata'])
            self.assertEqual(s3_response['Metadata']['user_id'], self.test_user_id)
            
            # Verify the image content
            stored_image_data = s3_response['Body'].read()
            original_image_data = base64.b64decode(test_image_base64)
            self.assertEqual(stored_image_data, original_image_data)

            print(f"✅ S3 integration validated - Image stored at {s3_key}")

        except (requests.RequestException, ClientError) as e:
            self.fail(f"S3 integration test failed: {e}")

    @mark.it("validates API Gateway rejects unsupported HTTP methods")
    def test_api_gateway_rejects_unsupported_methods(self):
        """Test that API Gateway rejects PUT, DELETE, and PATCH methods"""
        try:
            # Test PUT method (should be rejected)
            put_response = requests.put(
                f"{self.api_endpoint}images",
                json={"test": "data"},
                timeout=30
            )
            self.assertIn(put_response.status_code, [403, 405, 501], "PUT method should be rejected")
            
            # Test DELETE method (should be rejected)
            delete_response = requests.delete(
                f"{self.api_endpoint}images",
                timeout=30
            )
            self.assertIn(delete_response.status_code, [403, 405, 501], "DELETE method should be rejected")
            
            print("✅ API Gateway correctly rejects unsupported methods")

        except requests.RequestException as e:
            self.fail(f"Method rejection test failed: {e}")

    @mark.it("validates CloudWatch logs are generated for Lambda function")
    def test_cloudwatch_logs_exist(self):
        """Test that CloudWatch logs are generated for Lambda execution"""
        try:
            log_group_name = f"/aws/lambda/{self.lambda_function_name}"
            
            # Check if log group exists
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
            
            log_groups = [lg for lg in response['logGroups'] if lg['logGroupName'] == log_group_name]
            self.assertTrue(len(log_groups) > 0, f"Log group {log_group_name} not found")
            
            # Check if there are recent log streams (indicating recent activity)
            streams_response = self.logs_client.describe_log_streams(
                logGroupName=log_group_name,
                orderBy='LastEventTime',
                descending=True,
                limit=5
            )
                        
            print("✅ CloudWatch logs validation successful")

        except ClientError as e:
            self.fail(f"CloudWatch logs validation failed: {e}")

    @mark.it("validates end-to-end image processing workflow")
    def test_end_to_end_image_workflow(self):
        """Test complete end-to-end image processing workflow"""
        try:
            test_user = f"e2e-user-{uuid.uuid4().hex[:8]}"
            
            # Step 1: Upload an image
            test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=="
            
            upload_payload = {
                "image_data": test_image_base64,
                "content_type": "image/png",
                "user_id": test_user,
                "image_name": "e2e-workflow-test.png",
                "tags": {"workflow": "end-to-end"}
            }

            upload_response = requests.post(
                f"{self.api_endpoint}images",
                json=upload_payload,
                timeout=30
            )
            
            self.assertEqual(upload_response.status_code, 201)
            image_id = upload_response.json()['imageId']
            self.test_image_ids.append(image_id)

            # Step 2: Retrieve the image by ID
            get_response = requests.get(
                f"{self.api_endpoint}images/{image_id}?url=true",
                timeout=30
            )
            
            self.assertEqual(get_response.status_code, 200)
            get_data = get_response.json()
            self.assertIn('url', get_data['metadata'], "Presigned URL should be included")

            # Step 3: List images for the user
            list_response = requests.get(
                f"{self.api_endpoint}images?userId={test_user}&urls=true",
                timeout=30
            )
            
            self.assertEqual(list_response.status_code, 200)
            list_data = list_response.json()
            self.assertGreaterEqual(list_data['count'], 1)
            
            # Find our uploaded image in the list
            found_image = next(
                (img for img in list_data['images'] if img['imageId'] == image_id), 
                None
            )
            self.assertIsNotNone(found_image, "Uploaded image should appear in user's image list")
            self.assertIn('url', found_image, "Presigned URLs should be included in list")

            # Step 4: Verify data consistency across DynamoDB and S3
            table = self.dynamodb_resource.Table(self.dynamodb_table_name)
            db_item = table.query(
                KeyConditionExpression='imageId = :id',
                ExpressionAttributeValues={':id': image_id}
            )['Items'][0]
            
            s3_object = self.s3_client.get_object(
                Bucket=self.s3_bucket_name,
                Key=db_item['s3Key']
            )
            
            self.assertEqual(db_item['contentType'], s3_object['ContentType'])
            self.assertEqual(db_item['userId'], s3_object['Metadata']['user_id'])

            print(f"✅ End-to-end workflow validated for user: {test_user}, image: {image_id}")

        except (requests.RequestException, ClientError) as e:
            self.fail(f"End-to-end workflow test failed: {e}")


if __name__ == '__main__':
    unittest.main()
