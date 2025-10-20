import json
import os
import unittest
import base64
import time
import requests
from datetime import datetime

import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Load CloudFormation outputs from flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.load(f)
else:
    flat_outputs = {}

# Integration tests will run against deployed resources
# In pipeline environment, credentials will be available


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for the TapStack CDK stack"""

    def setUp(self):
        """Set up AWS clients for integration tests"""
        self.lambda_client = boto3.client("lambda")
        self.s3_client = boto3.client("s3")
        self.apigateway_client = boto3.client("apigateway")
        self.kms_client = boto3.client("kms")
        self.dynamodb_client = boto3.client("dynamodb")
        self.logs_client = boto3.client("logs")
        
        # Get required outputs for E2E testing
        self.api_endpoint = flat_outputs.get("ApiGatewayUrl")
        self.bucket_name = flat_outputs.get("S3BucketName")
        self.table_name = flat_outputs.get("DynamoDBTableName")
        
        # Validate required outputs are present
        self.assertIsNotNone(self.api_endpoint, "API Gateway endpoint is missing in flat-outputs.json")
        self.assertIsNotNone(self.bucket_name, "S3 bucket name is missing in flat-outputs.json")
        self.assertIsNotNone(self.table_name, "DynamoDB table name is missing in flat-outputs.json")

    @mark.it("Validates the Lambda function")
    def test_lambda_function(self):
        lambda_arn = flat_outputs.get("LambdaFunctionArn")
        self.assertIsNotNone(lambda_arn, "Lambda ARN is missing in flat-outputs.json")
        try:
            response = self.lambda_client.get_function(FunctionName=lambda_arn)
            self.assertEqual(response["Configuration"]["Runtime"], "python3.9")
            self.assertEqual(response["Configuration"]["Timeout"], 300)
            self.assertEqual(response["Configuration"]["MemorySize"], 512)
        except ClientError as e:
            self.fail(f"Failed to validate Lambda function: {str(e)}")

    @mark.it("Validates the S3 bucket")
    def test_s3_bucket(self):
        bucket_name = flat_outputs.get("S3BucketName")
        self.assertIsNotNone(bucket_name, "S3 bucket name is missing in flat-outputs.json")
        try:
            response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(response["Status"], "Enabled", "S3 bucket versioning is not enabled")
        except ClientError as e:
            self.fail(f"Failed to validate S3 bucket: {str(e)}")

    @mark.it("Validates the DynamoDB table")
    def test_dynamodb_table(self):
        table_name = flat_outputs.get("DynamoDBTableName")
        self.assertIsNotNone(table_name, "DynamoDB table name is missing in flat-outputs.json")
        try:
            response = self.dynamodb_client.describe_table(TableName=table_name)
            self.assertEqual(response["Table"]["TableName"], table_name)
            self.assertEqual(response["Table"]["BillingModeSummary"]["BillingMode"], "PAY_PER_REQUEST")
        except ClientError as e:
            self.fail(f"Failed to validate DynamoDB table: {str(e)}")


    @mark.it("Validates the API Gateway")
    def test_api_gateway(self):
        api_endpoint = flat_outputs.get("ApiGatewayUrl")
        self.assertIsNotNone(api_endpoint, "API Gateway endpoint is missing in flat-outputs.json")
        try:
            # Extract the API ID from the endpoint URL
            api_id = api_endpoint.split("//")[1].split(".")[0]
            response = self.apigateway_client.get_rest_api(restApiId=api_id)
            # Updated to match the new API Gateway name format
            self.assertTrue(response["name"].startswith("file-upload-api-"), 
                          f"API Gateway name should start with 'file-upload-api-', got: {response['name']}")
        except ClientError as e:
            self.fail(f"Failed to validate API Gateway: {str(e)}")

    @mark.it("Validates the CloudWatch Log Group")
    def test_log_group(self):
        lambda_arn = flat_outputs.get("LambdaFunctionArn")
        self.assertIsNotNone(lambda_arn, "Lambda ARN is missing in flat-outputs.json")
        try:
            # Extract function name from ARN
            function_name = lambda_arn.split(":")[-1]
            log_group_name = f"/aws/lambda/{function_name}"
            response = self.logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
            self.assertGreater(len(response["logGroups"]), 0, "CloudWatch Log Group not found")
            log_group = response["logGroups"][0]
            self.assertEqual(log_group["logGroupName"], log_group_name)
        except ClientError as e:
            self.fail(f"Failed to validate CloudWatch Log Group: {str(e)}")

    @mark.it("End-to-end file upload test")
    def test_end_to_end_file_upload(self):
        """Test complete file upload flow from API Gateway to S3 and DynamoDB"""
        
        # Generate unique test data
        test_timestamp = datetime.now().isoformat()
        test_product_id = f"test-product-{int(time.time())}"
        test_product_name = f"Test Product {test_timestamp}"
        test_price = 99.99
        
        # Create test file content
        test_file_content = f"Test file content for product {test_product_id}\nTimestamp: {test_timestamp}"
        test_file_content_b64 = base64.b64encode(test_file_content.encode('utf-8')).decode('utf-8')
        test_file_name = f"test-file-{test_timestamp}.txt"
        
        # Prepare API request payload
        payload = {
            "productId": test_product_id,
            "productName": test_product_name,
            "price": test_price,
            "fileContent": test_file_content_b64,
            "fileName": test_file_name
        }
        
        # Make API request
        try:
            response = requests.post(
                self.api_endpoint,
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            # Validate API response
            self.assertEqual(response.status_code, 200, 
                           f"API request failed with status {response.status_code}: {response.text}")
            
            response_data = response.json()
            self.assertIn('message', response_data)
            self.assertEqual(response_data['message'], 'File uploaded successfully')
            self.assertEqual(response_data['productId'], test_product_id)
            self.assertIn('s3Key', response_data)
            self.assertIn('fileSize', response_data)
            
            s3_key = response_data['s3Key']
            expected_s3_key = f"uploads/{test_product_id}/{test_file_name}"
            self.assertEqual(s3_key, expected_s3_key)
            
        except requests.exceptions.RequestException as e:
            self.fail(f"API request failed: {str(e)}")
        
        # Wait a moment for eventual consistency
        time.sleep(2)
        
        # Verify file was uploaded to S3
        try:
            s3_response = self.s3_client.get_object(Bucket=self.bucket_name, Key=s3_key)
            uploaded_content = s3_response['Body'].read().decode('utf-8')
            self.assertEqual(uploaded_content, test_file_content, "S3 file content doesn't match")
            
            # Verify S3 object metadata
            s3_metadata = self.s3_client.head_object(Bucket=self.bucket_name, Key=s3_key)
            self.assertIn('ServerSideEncryption', s3_metadata)
            self.assertEqual(s3_metadata['ServerSideEncryption'], 'aws:kms')
            
        except ClientError as e:
            self.fail(f"Failed to verify S3 upload: {str(e)}")
        
        # Verify metadata was stored in DynamoDB
        try:
            dynamodb_response = self.dynamodb_client.get_item(
                TableName=self.table_name,
                Key={
                    'productId': {'S': test_product_id},
                    'productName': {'S': test_product_name}
                }
            )
            
            self.assertIn('Item', dynamodb_response, "DynamoDB item not found")
            item = dynamodb_response['Item']
            
            # Verify all expected fields are present
            self.assertEqual(item['productId']['S'], test_product_id)
            self.assertEqual(item['productName']['S'], test_product_name)
            self.assertEqual(float(item['price']['N']), test_price)
            self.assertEqual(item['fileName']['S'], test_file_name)
            self.assertEqual(item['s3Key']['S'], s3_key)
            self.assertIn('uploadTimestamp', item)
            self.assertIn('fileSize', item)
            self.assertEqual(int(item['fileSize']['N']), len(test_file_content.encode('utf-8')))
            
        except ClientError as e:
            self.fail(f"Failed to verify DynamoDB storage: {str(e)}")
        
        # Clean up test data
        try:
            # Delete S3 object
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=s3_key)
            
            # Delete DynamoDB item
            self.dynamodb_client.delete_item(
                TableName=self.table_name,
                Key={
                    'productId': {'S': test_product_id},
                    'productName': {'S': test_product_name}
                }
            )
            
        except ClientError as e:
            # Log cleanup errors but don't fail the test
            print(f"Warning: Failed to clean up test data: {str(e)}")

    @mark.it("End-to-end error handling test")
    def test_end_to_end_error_handling(self):
        """Test error handling in the complete file upload flow"""
        
        # Test missing required field
        invalid_payload = {
            "productId": "test-product-invalid",
            "productName": "Test Product",
            # Missing price and fileContent
        }
        
        try:
            response = requests.post(
                self.api_endpoint,
                json=invalid_payload,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            # API Gateway request validation should return 400
            self.assertEqual(response.status_code, 400, 
                           f"Expected 400 for invalid payload, got {response.status_code}")
            
            response_data = response.json()
            # API Gateway returns different error format than Lambda
            self.assertIn('message', response_data)
            self.assertIn('Invalid request body', response_data['message'])
            
        except requests.exceptions.RequestException as e:
            self.fail(f"API request failed: {str(e)}")
        
        # Test invalid price (this should reach Lambda and return Lambda error format)
        invalid_price_payload = {
            "productId": "test-product-invalid-price",
            "productName": "Test Product",
            "price": -10.0,  # Negative price should be invalid
            "fileContent": base64.b64encode(b"test content").decode('utf-8')
        }
        
        try:
            response = requests.post(
                self.api_endpoint,
                json=invalid_price_payload,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            # Should return 400 Bad Request
            self.assertEqual(response.status_code, 400, 
                           f"Expected 400 for negative price, got {response.status_code}")
            
            response_data = response.json()
            # Lambda returns error format with 'error' and 'code' fields
            if 'error' in response_data:
                self.assertIn('error', response_data)
                self.assertIn('code', response_data)
                self.assertEqual(response_data['code'], 'INVALID_PRICE')
            else:
                # API Gateway might return different format
                self.assertIn('message', response_data)
            
        except requests.exceptions.RequestException as e:
            self.fail(f"API request failed: {str(e)}")
        
        # Test invalid JSON
        try:
            response = requests.post(
                self.api_endpoint,
                data="invalid json",
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            # Should return 400 Bad Request
            self.assertEqual(response.status_code, 400, 
                           f"Expected 400 for invalid JSON, got {response.status_code}")
            
        except requests.exceptions.RequestException as e:
            self.fail(f"API request failed: {str(e)}")

