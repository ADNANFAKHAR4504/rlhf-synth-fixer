import json
import os
import unittest
import requests
import base64

import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Load the flat-outputs.json file
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.load(f)
else:
    flat_outputs = {}

# Initialize boto3 clients
lambda_client = boto3.client("lambda")
s3_client = boto3.client("s3")
dynamodb_client = boto3.client("dynamodb")
kms_client = boto3.client("kms")


@mark.describe("TapStack Integration Tests")
class TestTapStack(unittest.TestCase):
    """Integration tests for the TapStack CDK stack"""

    def setUp(self):
        """Set up the test environment"""
        self.flat_outputs = flat_outputs

    @mark.it("Validates the S3 bucket exists and has correct encryption")
    def test_s3_bucket_exists(self):
        bucket_name = self.flat_outputs.get("BucketName")
        self.assertIsNotNone(bucket_name, "BucketName is missing in flat-outputs.json")

        try:
            # Check if the bucket exists
            s3_client.head_bucket(Bucket=bucket_name)

            # Check if encryption is enabled
            response = s3_client.get_bucket_encryption(Bucket=bucket_name)
            self.assertIn("ServerSideEncryptionConfiguration", response, 
                         "S3 bucket encryption is not configured")
            
            # Verify KMS encryption
            encryption_config = response["ServerSideEncryptionConfiguration"]["Rules"][0]
            self.assertEqual(encryption_config["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"], 
                           "aws:kms", "S3 bucket is not using KMS encryption")
            
        except ClientError as e:
            self.fail(f"Failed to validate S3 bucket: {e}")

    @mark.it("Validates the KMS key exists and has correct properties")
    def test_kms_key_exists(self):
        key_arn = self.flat_outputs.get("EncryptionKeyArn")
        self.assertIsNotNone(key_arn, "EncryptionKeyArn is missing in flat-outputs.json")

        try:
            # Extract key ID from ARN
            key_id = key_arn.split("/")[-1]
            
            # Get key metadata
            response = kms_client.describe_key(KeyId=key_id)
            key_metadata = response["KeyMetadata"]
            
            # Check key properties
            self.assertEqual(key_metadata["KeyUsage"], "ENCRYPT_DECRYPT", 
                           "KMS key usage is incorrect")
            self.assertTrue(key_metadata["Enabled"], "KMS key is not enabled")
            
        except ClientError as e:
            self.fail(f"Failed to validate KMS key: {e}")

    @mark.it("Validates DynamoDB tables exist and have correct configuration")
    def test_dynamodb_tables_exist(self):
        users_table_name = self.flat_outputs.get("UsersTableName")
        orders_table_name = self.flat_outputs.get("OrdersTableName")
        
        self.assertIsNotNone(users_table_name, "UsersTableName is missing in flat-outputs.json")
        self.assertIsNotNone(orders_table_name, "OrdersTableName is missing in flat-outputs.json")

        try:
            # Validate Users table
            users_response = dynamodb_client.describe_table(TableName=users_table_name)
            users_table = users_response["Table"]
            
            self.assertEqual(users_table["TableStatus"], "ACTIVE", "Users table is not active")
            
            # Check primary key
            users_key_schema = users_table["KeySchema"]
            primary_key = next((key for key in users_key_schema if key["KeyType"] == "HASH"), None)
            self.assertIsNotNone(primary_key, "Users table primary key not found")
            self.assertEqual(primary_key["AttributeName"], "user_id", 
                           "Users table primary key is not user_id")
            
            # Validate Orders table
            orders_response = dynamodb_client.describe_table(TableName=orders_table_name)
            orders_table = orders_response["Table"]
            
            self.assertEqual(orders_table["TableStatus"], "ACTIVE", "Orders table is not active")
            
            # Check composite key
            orders_key_schema = orders_table["KeySchema"]
            hash_key = next((key for key in orders_key_schema if key["KeyType"] == "HASH"), None)
            range_key = next((key for key in orders_key_schema if key["KeyType"] == "RANGE"), None)
            
            self.assertIsNotNone(hash_key, "Orders table hash key not found")
            self.assertIsNotNone(range_key, "Orders table range key not found")
            self.assertEqual(hash_key["AttributeName"], "order_id", 
                           "Orders table hash key is not order_id")
            self.assertEqual(range_key["AttributeName"], "timestamp", 
                           "Orders table range key is not timestamp")
            
        except ClientError as e:
            self.fail(f"Failed to validate DynamoDB tables: {e}")

    @mark.it("Validates Lambda functions exist and are configured correctly")
    def test_lambda_functions_exist(self):
        get_user_arn = self.flat_outputs.get("GetUserLambdaArn")
        create_user_arn = self.flat_outputs.get("CreateUserLambdaArn")
        get_orders_arn = self.flat_outputs.get("GetOrdersLambdaArn")
        upload_file_arn = self.flat_outputs.get("UploadFileLambdaArn")
        
        lambda_arns = [get_user_arn, create_user_arn, get_orders_arn, upload_file_arn]
        
        for arn in lambda_arns:
            self.assertIsNotNone(arn, f"Lambda ARN is missing in flat-outputs.json")

        try:
            for arn in lambda_arns:
                # Extract function name from ARN
                function_name = arn.split(":")[-1]
                
                # Get function configuration
                response = lambda_client.get_function(FunctionName=function_name)
                config = response["Configuration"]
                
                # Check runtime and other properties
                self.assertEqual(config["Runtime"], "python3.9", 
                               f"Lambda function {function_name} runtime is incorrect")
                self.assertIn("ENVIRONMENT", config["Environment"]["Variables"], 
                             f"Lambda function {function_name} missing ENVIRONMENT variable")
                
                # Check if X-Ray tracing is enabled
                self.assertEqual(config["TracingConfig"]["Mode"], "Active", 
                               f"Lambda function {function_name} X-Ray tracing is not active")
                
        except ClientError as e:
            self.fail(f"Failed to validate Lambda functions: {e}")

    @mark.it("Tests API Gateway endpoints functionality")
    def test_api_endpoints_functionality(self):
        """Test actual API calls to validate functionality"""
        api_url = self.flat_outputs.get("ApiUrl")
        self.assertIsNotNone(api_url, "ApiUrl is missing in flat-outputs.json")
        
        try:
            # Test POST /users endpoint
            post_url = f"{api_url}users"
            test_user_data = {
                "name": "Integration Test User",
                "email": "integration@test.com"
            }
            
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            
            print(f"Making POST request to: {post_url}")
            response = requests.post(post_url, json=test_user_data, headers=headers, timeout=30)
            
            print(f"POST Response status: {response.status_code}")
            print(f"POST Response text: {response.text}")
            
            self.assertEqual(response.status_code, 201, 
                           f"POST request failed with status {response.status_code}: {response.text}")
            
            # Get user_id from response
            response_data = response.json()
            user_id = response_data.get("user_id")
            self.assertIsNotNone(user_id, "user_id not returned in POST response")
            
            # Test GET /users/{user_id} endpoint
            get_url = f"{api_url}users/{user_id}"
            print(f"Making GET request to: {get_url}")
            
            response = requests.get(get_url, timeout=30)
            print(f"GET Response status: {response.status_code}")
            print(f"GET Response text: {response.text}")
            
            self.assertEqual(response.status_code, 200, f"GET request failed: {response.text}")
            
            # Verify returned data
            user_data = response.json()
            self.assertEqual(user_data["user_id"], user_id, "Retrieved user ID doesn't match")
            self.assertEqual(user_data["email"], "integration@test.com", 
                           "Retrieved email doesn't match")
            
        except requests.exceptions.RequestException as e:
            self.fail(f"API endpoint test failed: {e}")

    @mark.it("Tests file upload functionality")
    def test_file_upload_functionality(self):
        """Test file upload via API Gateway"""
        api_url = self.flat_outputs.get("ApiUrl")
        self.assertIsNotNone(api_url, "ApiUrl is missing in flat-outputs.json")
        
        try:
            # Test POST /files endpoint
            files_url = f"{api_url}files"
            
            # Create test file content
            test_content = "This is a test file for integration testing"
            encoded_content = base64.b64encode(test_content.encode()).decode()
            
            file_data = {
                "file_content": encoded_content,
                "file_name": "integration-test.txt"
            }
            
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            
            print(f"Making POST request to: {files_url}")
            response = requests.post(files_url, json=file_data, headers=headers, timeout=30)
            
            print(f"File upload response status: {response.status_code}")
            print(f"File upload response text: {response.text}")
            
            self.assertEqual(response.status_code, 200, 
                           f"File upload failed with status {response.status_code}: {response.text}")
            
            # Verify file was uploaded
            response_data = response.json()
            file_key = response_data.get("file_key")
            self.assertIsNotNone(file_key, "file_key not returned in upload response")
            
            # Verify file exists in S3
            bucket_name = self.flat_outputs.get("BucketName")
            s3_response = s3_client.head_object(Bucket=bucket_name, Key=file_key)
            self.assertIsNotNone(s3_response, "Uploaded file not found in S3")
            
        except requests.exceptions.RequestException as e:
            self.fail(f"File upload test failed: {e}")
        except ClientError as e:
            self.fail(f"S3 file verification failed: {e}")

    @mark.it("Tests orders endpoint functionality")
    def test_orders_endpoint_functionality(self):
        """Test orders endpoint"""
        api_url = self.flat_outputs.get("ApiUrl")
        self.assertIsNotNone(api_url, "ApiUrl is missing in flat-outputs.json")
        
        try:
            # Test GET /orders endpoint
            orders_url = f"{api_url}orders"
            
            print(f"Making GET request to: {orders_url}")
            response = requests.get(orders_url, timeout=30)
            
            print(f"Orders response status: {response.status_code}")
            print(f"Orders response text: {response.text}")
            
            self.assertEqual(response.status_code, 200, 
                           f"Orders request failed with status {response.status_code}: {response.text}")
            
            # Verify response structure
            response_data = response.json()
            self.assertIn("environment", response_data, "Environment not in orders response")
            self.assertIn("files", response_data, "Files list not in orders response")
            
        except requests.exceptions.RequestException as e:
            self.fail(f"Orders endpoint test failed: {e}")

    @mark.it("Validates DynamoDB data operations")
    def test_dynamodb_operations(self):
        """Test DynamoDB operations directly"""
        users_table_name = self.flat_outputs.get("UsersTableName")
        self.assertIsNotNone(users_table_name, "UsersTableName is missing in flat-outputs.json")
        
        try:
            # Test putting an item
            test_item = {
                "user_id": {"S": "integration-test-user-direct"},
                "email": {"S": "direct@integration.com"},
                "name": {"S": "Direct Integration Test User"}
            }
            
            dynamodb_client.put_item(TableName=users_table_name, Item=test_item)
            
            # Test getting the item
            response = dynamodb_client.get_item(
                TableName=users_table_name,
                Key={"user_id": {"S": "integration-test-user-direct"}}
            )
            
            self.assertIn("Item", response, "Item not found in DynamoDB")
            item = response["Item"]
            self.assertEqual(item["user_id"]["S"], "integration-test-user-direct", 
                           "Retrieved userId doesn't match")
            
            # Clean up - delete the test item
            dynamodb_client.delete_item(
                TableName=users_table_name,
                Key={"user_id": {"S": "integration-test-user-direct"}}
            )
            
        except ClientError as e:
            self.fail(f"DynamoDB operations test failed: {e}")
