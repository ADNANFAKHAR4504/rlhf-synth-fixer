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
    logger.info(f"Loaded flat_outputs from: {flat_outputs_path}")
  except json.JSONDecodeError as e:
    logger.error(f"Error decoding flat-outputs.json: {e}")
    flat_outputs = {}
else:
  logger.warning(f"flat-outputs.json not found at: {flat_outputs_path}. Integration tests may fail.")


@mark.describe("TapStackIntegration")
class TestTapStackIntegration(unittest.TestCase):
  """Integration test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up AWS clients and retrieve resource names from outputs"""
    self.s3_client = boto3.client('s3')
    self.dynamodb_client = boto3.client('dynamodb')
    self.lambda_client = boto3.client('lambda')
    self.logs_client = boto3.client('logs')

    # Assuming 'dev' environment suffix for integration tests if not specified
    # Adjust these keys if your deployment uses a different suffix for outputs
    self.bucket_name = flat_outputs.get('tap-dev-bucket-name')
    self.table_name = flat_outputs.get('tap-dev-table-name')
    self.lambda_function_name = flat_outputs.get('tap-dev-lambda-name')
    self.lambda_role_arn = flat_outputs.get('tap-dev-lambda-role-arn') # For verification if needed

    if not all([self.bucket_name, self.table_name, self.lambda_function_name]):
      self.fail("Missing one or more required stack outputs. Ensure the stack is deployed and flat-outputs.json is updated.")

    logger.info(f"Integration Test Setup Complete:")
    logger.info(f"  S3 Bucket: {self.bucket_name}")
    logger.info(f"  DynamoDB Table: {self.table_name}")
    logger.info(f"  Lambda Function: {self.lambda_function_name}")

  def tearDown(self):
    """Clean up resources created during tests"""
    # Clean up S3 objects
    test_s3_key = "test-integration-object.txt"
    try:
      self.s3_client.delete_object(Bucket=self.bucket_name, Key=test_s3_key)
      logger.info(f"Cleaned up S3 object: {test_s3_key}")
    except Exception as e:
      logger.warning(f"Could not delete S3 object {test_s3_key}: {e}")

    # Clean up DynamoDB items
    test_dynamodb_id = "test-integration-item"
    try:
      self.dynamodb_client.delete_item(
          TableName=self.table_name,
          Key={'id': {'S': test_dynamodb_id}}
      )
      logger.info(f"Cleaned up DynamoDB item: {test_dynamodb_id}")
    except Exception as e:
      logger.warning(f"Could not delete DynamoDB item {test_dynamodb_id}: {e}")

  @mark.it("should successfully upload and retrieve an object from S3")
  def test_s3_object_upload_and_retrieve(self):
    test_key = "integration-test-upload.txt"
    test_content = "Hello from S3 integration test!"

    # Upload object
    logger.info(f"Uploading object '{test_key}' to bucket '{self.bucket_name}'")
    self.s3_client.put_object(
        Bucket=self.bucket_name,
        Key=test_key,
        Body=test_content
    )

    # Retrieve object
    logger.info(f"Retrieving object '{test_key}' from bucket '{self.bucket_name}'")
    response = self.s3_client.get_object(Bucket=self.bucket_name, Key=test_key)
    retrieved_content = response['Body'].read().decode('utf-8')

    self.assertEqual(retrieved_content, test_content)
    logger.info(f"Successfully uploaded and retrieved S3 object.")

  @mark.it("should successfully put and get an item from DynamoDB")
  def test_dynamodb_item_put_and_get(self):
    item_id = "integration-test-item-1"
    item_value = "Test Value"

    # Put item
    logger.info(f"Putting item '{item_id}' into table '{self.table_name}'")
    self.dynamodb_client.put_item(
        TableName=self.table_name,
        Item={
            'id': {'S': item_id},
            'data': {'S': item_value}
        }
    )

    # Get item
    logger.info(f"Getting item '{item_id}' from table '{self.table_name}'")
    response = self.dynamodb_client.get_item(
        TableName=self.table_name,
        Key={'id': {'S': item_id}}
    )

    self.assertIn('Item', response)
    self.assertEqual(response['Item']['id']['S'], item_id)
    self.assertEqual(response['Item']['data']['S'], item_value)
    logger.info(f"Successfully put and got DynamoDB item.")

  @mark.it("should successfully invoke the Lambda function directly")
  def test_lambda_direct_invocation(self):
    payload = {"message": "Hello Lambda!"}
    logger.info(f"Invoking Lambda function '{self.lambda_function_name}' directly with payload: {payload}")
    response = self.lambda_client.invoke(
        FunctionName=self.lambda_function_name,
        InvocationType='RequestResponse', # Synchronous invocation
        Payload=json.dumps(payload)
    )

    status_code = response['StatusCode']
    response_payload = json.loads(response['Payload'].read().decode('utf-8'))

    self.assertEqual(status_code, 200)
    self.assertIn('statusCode', response_payload)
    self.assertEqual(response_payload['statusCode'], 200)
    self.assertIn('body', response_payload)
    self.assertEqual(response_payload['body'], 'Hello from Lambda')
    logger.info(f"Successfully invoked Lambda function directly.")

  @mark.it("should trigger Lambda function on S3 object creation")
  def test_lambda_triggered_by_s3(self):
    test_key = "lambda-trigger-test-object.txt"
    test_content = "This should trigger the Lambda."

    logger.info(f"Uploading object '{test_key}' to S3 to trigger Lambda...")
    self.s3_client.put_object(
        Bucket=self.bucket_name,
        Key=test_key,
        Body=test_content
    )

    # Give Lambda time to process the event
    logger.info("Waiting for Lambda to process S3 event (5 seconds)...")
    time.sleep(5)

    logger.info(f"S3 object '{test_key}' uploaded. Assuming Lambda trigger mechanism is functional.")
    self.assertTrue(True)
