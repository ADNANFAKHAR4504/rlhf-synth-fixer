import json
import os
import unittest
import boto3
import uuid
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
  """Integration test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up AWS clients and check for required outputs"""
    self.api_client = boto3.client('apigateway')
    self.s3_client = boto3.client('s3')
    self.dynamodb_client = boto3.client('dynamodb')
    self.lambda_client = boto3.client('lambda')
    self.stepfunctions_client = boto3.client('stepfunctions')
    
    # Check if we have deployment outputs
    self.has_outputs = bool(flat_outputs)
    
  @mark.it("verifies S3 bucket exists and is accessible")
  def test_s3_bucket_exists(self):
    # SKIP if no deployment outputs
    if not self.has_outputs:
      self.skipTest("No deployment outputs available - deployment required")
      
    # ARRANGE
    bucket_name = flat_outputs.get('BucketName')
    self.assertIsNotNone(bucket_name, "BucketName not found in outputs")

    # ACT & ASSERT
    try:
      response = self.s3_client.head_bucket(Bucket=bucket_name)
      self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
    except ClientError as e:
      self.fail(f"S3 bucket {bucket_name} does not exist or is not accessible: {e}")

  @mark.it("verifies DynamoDB table exists and is accessible")
  def test_dynamodb_table_exists(self):
    # SKIP if no deployment outputs
    if not self.has_outputs:
      self.skipTest("No deployment outputs available - deployment required")
      
    # ARRANGE
    table_name = flat_outputs.get('TableName')
    self.assertIsNotNone(table_name, "TableName not found in outputs")

    # ACT & ASSERT
    try:
      response = self.dynamodb_client.describe_table(TableName=table_name)
      self.assertEqual(response['Table']['TableStatus'], 'ACTIVE')
      self.assertEqual(response['Table']['KeySchema'][0]['AttributeName'], 'request_id')
    except ClientError as e:
      self.fail(f"DynamoDB table {table_name} does not exist or is not accessible: {e}")

  @mark.it("verifies Lambda function exists and is accessible")
  def test_lambda_function_exists(self):
    # SKIP if no deployment outputs
    if not self.has_outputs:
      self.skipTest("No deployment outputs available - deployment required")
      
    # ARRANGE
    function_name = flat_outputs.get('LambdaFunctionName')
    self.assertIsNotNone(function_name, "LambdaFunctionName not found in outputs")

    # ACT & ASSERT
    try:
      response = self.lambda_client.get_function(FunctionName=function_name)
      self.assertEqual(response['Configuration']['State'], 'Active')
      self.assertEqual(response['Configuration']['Runtime'], 'python3.12')
    except ClientError as e:
      self.fail(f"Lambda function {function_name} does not exist or is not accessible: {e}")

  @mark.it("verifies Step Functions state machine exists and is accessible")
  def test_stepfunctions_statemachine_exists(self):
    # SKIP if no deployment outputs
    if not self.has_outputs:
      self.skipTest("No deployment outputs available - deployment required")
      
    state_machine_arn = flat_outputs.get('StateMachineArn')
    self.assertIsNotNone(state_machine_arn, "StateMachineArn not found in outputs")

    try:
      response = self.stepfunctions_client.describe_state_machine(
        stateMachineArn=state_machine_arn
      )
      self.assertEqual(response['status'], 'ACTIVE')
    except ClientError as e:
      self.fail(f"Step Functions state machine {state_machine_arn} does not exist or is not accessible: {e}")

  @mark.it("verifies API Gateway endpoint is accessible")
  def test_api_gateway_endpoint_accessible(self):
    # SKIP if no deployment outputs
    if not self.has_outputs:
      self.skipTest("No deployment outputs available - deployment required")
      
    # ARRANGE
    api_endpoint = flat_outputs.get('ApiEndpoint')
    self.assertIsNotNone(api_endpoint, "ApiEndpoint not found in outputs")

    # ASSERT - Just check that we have a valid endpoint URL
    self.assertTrue(api_endpoint.startswith('https://'))
    self.assertIn('execute-api', api_endpoint)
    self.assertIn('us-west-2', api_endpoint)

  @mark.it("tests end-to-end workflow - POST request processing")
  def test_end_to_end_request_processing(self):
    # SKIP if no deployment outputs  
    if not self.has_outputs:
      self.skipTest("No deployment outputs available - deployment required")
      
    # ARRANGE
    bucket_name = flat_outputs.get('BucketName')
    table_name = flat_outputs.get('TableName')
    function_name = flat_outputs.get('LambdaFunctionName')
    
    self.assertIsNotNone(bucket_name, "BucketName not found in outputs")
    self.assertIsNotNone(table_name, "TableName not found in outputs")
    self.assertIsNotNone(function_name, "LambdaFunctionName not found in outputs")

    # Create test payload
    test_payload = {
      "test_data": "integration_test",
      "timestamp": "2025-01-01T00:00:00Z",
      "test_id": str(uuid.uuid4())
    }

    # ACT - Invoke Lambda function directly (simulating API Gateway)
    try:
      response = self.lambda_client.invoke(
        FunctionName=function_name,
        Payload=json.dumps({
          "body": json.dumps(test_payload),
          "httpMethod": "POST"
        })
      )
      
      # Parse Lambda response
      response_payload = json.loads(response['Payload'].read())
      self.assertEqual(response_payload['statusCode'], 200)
      
      response_body = json.loads(response_payload['body'])
      request_id = response_body['request_id']
      execution_arn = response_body['execution_arn']
      
      # ASSERT - Check S3 object was created
      s3_key = f"requests/{request_id}.json"
      s3_response = self.s3_client.get_object(Bucket=bucket_name, Key=s3_key)
      stored_data = json.loads(s3_response['Body'].read())
      self.assertEqual(stored_data, test_payload)
      
      # ASSERT - Check DynamoDB record was created
      db_response = self.dynamodb_client.get_item(
        TableName=table_name,
        Key={'request_id': {'S': request_id}}
      )
      self.assertIn('Item', db_response)
      item = db_response['Item']
      self.assertEqual(item['request_id']['S'], request_id)
      self.assertEqual(item['s3_key']['S'], s3_key)
      self.assertEqual(item['status']['S'], 'processing')
      self.assertEqual(item['step_function_execution_arn']['S'], execution_arn)
      
      # ASSERT - Check Step Functions execution was started
      execution_response = self.stepfunctions_client.describe_execution(
        executionArn=execution_arn
      )
      self.assertIn(execution_response['status'], ['SUCCEEDED', 'RUNNING'])
      
    except Exception as e:
      self.fail(f"End-to-end test failed: {e}")

  @mark.it("tests Lambda function handles malformed input gracefully")
  def test_lambda_handles_malformed_input(self):
    # SKIP if no deployment outputs
    if not self.has_outputs:
      self.skipTest("No deployment outputs available - deployment required")
      
    # ARRANGE
    function_name = flat_outputs.get('LambdaFunctionName')
    self.assertIsNotNone(function_name, "LambdaFunctionName not found in outputs")

    # ACT - Send malformed input
    try:
      response = self.lambda_client.invoke(
        FunctionName=function_name,
        Payload=json.dumps({
          "body": "invalid json",
          "httpMethod": "POST"
        })
      )
      
      # Parse Lambda response
      response_payload = json.loads(response['Payload'].read())
      
      # ASSERT - Should handle error gracefully
      self.assertEqual(response_payload['statusCode'], 500)
      response_body = json.loads(response_payload['body'])
      self.assertIn('error', response_body)
      
    except Exception as e:
      self.fail(f"Malformed input test failed: {e}")
