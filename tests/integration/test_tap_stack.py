import json
import os
import unittest
import boto3

from pytest import mark


# Load CDK outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
outputs_path = os.path.join(base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json')

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
DYNAMODB_TABLE_NAME = flat_outputs.get("DynamoDBTableName")
LAMBDA_FUNCTION_NAME = flat_outputs.get("LambdaFunctionName")

s3_client = boto3.client("s3")
dynamodb_client = boto3.client("dynamodb")
lambda_client = boto3.client("lambda")


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
  """Integration test cases for TapStack CDK stack"""

  def setUp(self):
    if not S3_BUCKET_NAME:
      self.fail("Missing S3BucketName in flat-outputs.json")
    if not DYNAMODB_TABLE_NAME:
      self.fail("Missing DynamoDBTableName in flat-outputs.json")
    if not LAMBDA_FUNCTION_NAME:
      self.fail("Missing LambdaFunctionName in flat-outputs.json")

  @mark.it("confirms S3 bucket is accessible")
  def test_s3_bucket_access(self):
    test_key = "integration-test.txt"
    content = b"hello from integration test"

    try:
      s3_client.put_object(Bucket=S3_BUCKET_NAME, Key=test_key, Body=content)
      result = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=test_key)
      self.assertEqual(result["Body"].read(), content)
    except Exception as e:
      self.fail(f"S3 test failed: {e}")
    finally:
      try:
        s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=test_key)
      except Exception as e:
        print(f"Warning: Failed to delete test object: {e}")

  @mark.it("confirms DynamoDB table is writable")
  def test_dynamodb_put_item(self):
    test_id = "integration-id"
    item = {"id": {"S": test_id}, "status": {"S": "ok"}}

    try:
      dynamodb_client.put_item(TableName=DYNAMODB_TABLE_NAME, Item=item)
      result = dynamodb_client.get_item(TableName=DYNAMODB_TABLE_NAME, Key={"id": {"S": test_id}})
      self.assertEqual(result["Item"]["id"]["S"], test_id)
    except Exception as e:
      self.fail(f"DynamoDB test failed: {e}")
    finally:
      try:
        dynamodb_client.delete_item(TableName=DYNAMODB_TABLE_NAME, Key={"id": {"S": test_id}})
      except Exception as e:
        print(f"Warning: Failed to delete test item: {e}")

  @mark.it("invokes the Lambda function successfully")
  def test_lambda_invocation(self):
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
    except Exception as e:
      self.fail(f"Lambda test failed: {e}")
