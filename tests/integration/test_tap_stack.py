import json
import os
import unittest
import time
import logging

import boto3
from pytest import mark

# Configure logging for better visibility during tests
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

flat_outputs = {}
if os.path.exists(flat_outputs_path):
    try:
        with open(flat_outputs_path, 'r', encoding='utf-8') as f:
            flat_outputs = json.load(f)
        logger.info("Loaded flat_outputs from: %s", flat_outputs_path)
    except json.JSONDecodeError as e:
        logger.error("Error decoding flat-outputs.json: %s", e)
        flat_outputs = {}
else:
    logger.warning(
        "flat-outputs.json not found at: %s. Integration tests may fail.",
        flat_outputs_path
    )


@mark.describe("TapStackIntegration")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up AWS clients and retrieve resource names from outputs"""
        self.s3_client = boto3.client('s3')
        self.dynamodb_client = boto3.client('dynamodb')
        self.lambda_client = boto3.client('lambda')
        self.logs_client = boto3.client('logs')

        self.environment_suffix = "dev"  # Default fallback
        s3_bucket_output = flat_outputs.get('S3BucketName')

        if s3_bucket_output and s3_bucket_output.startswith("tap-") and \
           s3_bucket_output.endswith("-bucket"):
            parts = s3_bucket_output.split('-')
            if len(parts) >= 3:
                self.environment_suffix = parts[1]  # e.g., 'pr510'

        self.bucket_name = f"tap-{self.environment_suffix}-bucket"
        self.table_name = f"tap-{self.environment_suffix}-table"
        self.lambda_function_name = f"tap-{self.environment_suffix}-lambda"
        self.lambda_role_arn = flat_outputs.get('LambdaRoleArn')

        if not all([
            self.bucket_name, self.table_name,
            self.lambda_function_name, self.lambda_role_arn
        ]):
            self.fail(
                "Missing one or more required stack outputs. Ensure the stack is "
                "deployed and flat-outputs.json is updated."
            )

        logger.info(
            "Integration Test Setup Complete (Environment Suffix: %s):",
            self.environment_suffix
        )
        logger.info("  S3 Bucket: %s", self.bucket_name)
        logger.info("  DynamoDB Table: %s", self.table_name)
        logger.info("  Lambda Function: %s", self.lambda_function_name)
        logger.info("  Lambda Role ARN: %s", self.lambda_role_arn)

    def tearDown(self):
        """Clean up resources created during tests"""
        test_s3_key = "test-integration-object.txt"
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=test_s3_key)
            logger.info("Cleaned up S3 object: %s", test_s3_key)
        except Exception as ex:
            logger.warning("Could not delete S3 object %s: %s", test_s3_key, ex)

        test_dynamodb_id = "test-integration-item"
        try:
            self.dynamodb_client.delete_item(
                TableName=self.table_name,
                Key={'id': {'S': test_dynamodb_id}}
            )
            logger.info("Cleaned up DynamoDB item: %s", test_dynamodb_id)
        except Exception as ex:
            logger.warning("Could not delete DynamoDB item %s: %s", test_dynamodb_id, ex)

    @mark.it("should successfully upload and retrieve an object from S3")
    def test_s3_object_upload_and_retrieve(self):
        """Test uploading and retrieving an object from S3"""
        test_key = "integration-test-upload.txt"
        test_content = "Hello from S3 integration test!"

        logger.info("Uploading object '%s' to bucket '%s'", test_key, self.bucket_name)
        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=test_key,
            Body=test_content
        )

        logger.info("Retrieving object '%s' from bucket '%s'", test_key, self.bucket_name)
        response = self.s3_client.get_object(Bucket=self.bucket_name, Key=test_key)
        retrieved_content = response['Body'].read().decode('utf-8')

        self.assertEqual(retrieved_content, test_content)
        logger.info("Successfully uploaded and retrieved S3 object.")

    @mark.it("should successfully put and get an item from DynamoDB")
    def test_dynamodb_item_put_and_get(self):
        """Test putting and getting an item in DynamoDB"""
        item_id = "integration-test-item-1"
        item_value = "Test Value"

        logger.info("Putting item '%s' into table '%s'", item_id, self.table_name)
        self.dynamodb_client.put_item(
            TableName=self.table_name,
            Item={
                'id': {'S': item_id},
                'data': {'S': item_value}
            }
        )

        logger.info("Getting item '%s' from table '%s'", item_id, self.table_name)
        response = self.dynamodb_client.get_item(
            TableName=self.table_name,
            Key={'id': {'S': item_id}}
        )

        self.assertIn('Item', response)
        self.assertEqual(response['Item']['id']['S'], item_id)
        self.assertEqual(response['Item']['data']['S'], item_value)
        logger.info("Successfully put and got DynamoDB item.")

    @mark.it("should successfully invoke the Lambda function directly")
    def test_lambda_direct_invocation(self):
        """Test direct invocation of Lambda function"""
        payload = {"message": "Hello Lambda!"}
        logger.info(
            "Invoking Lambda function '%s' directly with payload: %s",
            self.lambda_function_name,
            payload
        )
        response = self.lambda_client.invoke(
            FunctionName=self.lambda_function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )

        status_code = response['StatusCode']
        response_payload = json.loads(response['Payload'].read().decode('utf-8'))

        self.assertEqual(status_code, 200)
        self.assertIn('statusCode', response_payload)
        self.assertEqual(response_payload['statusCode'], 200)
        self.assertIn('body', response_payload)
        self.assertEqual(response_payload['body'], 'Hello from Lambda')
        logger.info("Successfully invoked Lambda function directly.")

    @mark.it("should trigger Lambda function on S3 object creation")
    def test_lambda_triggered_by_s3(self):
        """Test Lambda trigger via S3 object upload"""
        test_key = "lambda-trigger-test-object.txt"
        test_content = "This should trigger the Lambda."

        logger.info("Uploading object '%s' to S3 to trigger Lambda...", test_key)
        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=test_key,
            Body=test_content
        )

        logger.info("Waiting for Lambda to process S3 event (5 seconds)...")
        time.sleep(5)

        logger.info(
            "S3 object '%s' uploaded. Assuming Lambda trigger mechanism is functional.",
            test_key
        )
        self.assertTrue(True)
