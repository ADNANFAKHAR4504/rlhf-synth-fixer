"""Integration test cases for the TapStack CDK stack."""

import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError, BotoCoreError
from pytest import mark

# Load CDK outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
outputs_path = os.path.join(
  base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

flat_outputs = {}
if os.path.exists(outputs_path):
  try:
    with open(outputs_path, 'r', encoding='utf-8') as f:
      flat_outputs = json.load(f)
  except json.JSONDecodeError:
    print(f"Warning: Failed to parse JSON from {outputs_path}")
else:
  print(f"Warning: CDK outputs file not found at {outputs_path}")

S3_BUCKET_NAME = flat_outputs.get("S3BucketName")
LAMBDA_FUNCTION_NAME = flat_outputs.get("LambdaFunctionName")

s3_client = boto3.client("s3")
lambda_client = boto3.client("lambda")


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for S3, and Lambda components in TapStack."""

  def setUp(self):
    """Ensure required outputs are available before running tests."""
    if not S3_BUCKET_NAME:
      self.fail("Missing S3BucketName in flat-outputs.json")
    if not LAMBDA_FUNCTION_NAME:
      self.fail("Missing LambdaFunctionName in flat-outputs.json")

  @mark.it("confirms S3 bucket is accessible")
  def test_s3_bucket_access(self):
    """Test that the S3 bucket allows upload and retrieval of an object."""
    test_key = "integration-test.txt"
    content = b"hello from integration test"

    try:
      s3_client.put_object(Bucket=S3_BUCKET_NAME, Key=test_key, Body=content)
      result = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=test_key)
      self.assertEqual(result["Body"].read(), content)
    except (ClientError, BotoCoreError) as ex:
      self.fail(f"S3 test failed: {ex}")
    finally:
      try:
        s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=test_key)
      except (ClientError, BotoCoreError) as ex:
        print(f"Warning: Failed to delete test object: {ex}")

  @mark.it("invokes the Lambda function successfully")
  def test_lambda_invocation(self):
    """Test invoking the Lambda function returns expected results."""
    payload = {"test": "value"}

    try:
      response = lambda_client.invoke(
        FunctionName=LAMBDA_FUNCTION_NAME,
        InvocationType="RequestResponse",
        Payload=json.dumps(payload)
      )
      body = json.loads(response["Payload"].read())
      self.assertEqual(response["StatusCode"], 200)
      self.assertEqual(body.get("statusCode"), 200)
    except (ClientError, BotoCoreError, json.JSONDecodeError) as ex:
      self.fail(f"Lambda test failed: {ex}")
