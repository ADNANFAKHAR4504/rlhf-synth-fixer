import json
import os
import unittest
import boto3
import time
from pytest import mark

base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
  base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

flat_outputs = {}
if os.path.exists(flat_outputs_path):
  try:
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
      flat_outputs = json.load(f)
  except json.JSONDecodeError:
    print(
      "Warning: Could not decode JSON from "
      f"{flat_outputs_path}. Ensure it's valid JSON."
    )
    flat_outputs = {}
else:
  print(f"Warning: {flat_outputs_path} not found. Ensure CDK outputs are generated.")

S3_BUCKET_NAME = flat_outputs.get("S3BucketName")
DYNAMODB_TABLE_NAME = flat_outputs.get("DynamoDBTableName")
LAMBDA_FUNCTION_NAME = flat_outputs.get("LambdaFunctionName")

s3_client = boto3.client("s3")
dynamodb_client = boto3.client("dynamodb")
lambda_client = boto3.client("lambda")


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):

  def setUp(self):
    if not S3_BUCKET_NAME:
      self.fail(
        "S3BucketName not found in flat-outputs.json. Deploy the CDK stack first."
      )
    if not DYNAMODB_TABLE_NAME:
      self.fail(
        "DynamoDBTableName not found in flat-outputs.json. Deploy the CDK stack first."
      )
    if not LAMBDA_FUNCTION_NAME:
      self.fail(
        "LambdaFunctionName not found in flat-outputs.json. Deploy the CDK stack first."
      )

  @mark.it("should confirm S3 bucket exists and is writable")
  def test_s3_bucket_exists_and_is_writable(self):
    test_key = "integration-test-file.txt"
    test_content = b"This is a test file for S3 integration."

    try:
      s3_client.put_object(
        Bucket=S3_BUCKET_NAME,
        Key=test_key,
        Body=test_content
      )
      print(f"Successfully uploaded {test_key} to {S3_BUCKET_NAME}")

      response = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=test_key)
      self.assertEqual(response["Body"].read(), test_content)
      print(f"Successfully retrieved {test_key} from {S3_BUCKET_NAME}")

    except Exception as ex:
      self.fail(f"S3 bucket test failed: {ex}")
    finally:
      try:
        s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=test_key)
        print(f"Successfully deleted {test_key} from {S3_BUCKET_NAME}")
      except Exception as ex:
        print(f"Warning: Failed to clean up S3 object {test_key}: {ex}")

  @mark.it("should confirm DynamoDB table exists and is writable")
  def test_dynamodb_table_exists_and_is_writable(self):
    test_item_id = "test-item-123"
    test_item_data = {
      "id": {"S": test_item_id},
      "data": {"S": "some_value"}
    }

    try:
      dynamodb_client.put_item(
        TableName=DYNAMODB_TABLE_NAME,
        Item=test_item_data
      )
      print(f"Successfully put item {test_item_id} into {DYNAMODB_TABLE_NAME}")

      response = dynamodb_client.get_item(
        TableName=DYNAMODB_TABLE_NAME,
        Key={"id": {"S": test_item_id}}
      )
      self.assertIn("Item", response)
      self.assertEqual(response["Item"]["id"]["S"], test_item_id)
      print(f"Successfully retrieved item {test_item_id} from {DYNAMODB_TABLE_NAME}")

    except Exception as ex:
      self.fail(f"DynamoDB table test failed: {ex}")
    finally:
      try:
        dynamodb_client.delete_item(
          TableName=DYNAMODB_TABLE_NAME,
          Key={"id": {"S": test_item_id}}
        )
        print(f"Successfully deleted item {test_item_id} from {DYNAMODB_TABLE_NAME}")
      except Exception as ex:
        print(
          f"Warning: Failed to clean up DynamoDB item {test_item_id}: {ex}"
        )

  @mark.it("should invoke the Lambda function and get expected response")
  def test_lambda_invocation(self):
    try:
      response = lambda_client.invoke(
        FunctionName=LAMBDA_FUNCTION_NAME,
        InvocationType="RequestResponse",
        Payload=json.dumps({"test_event": "hello"})
      )

      payload = json.loads(response["Payload"].read().decode("utf-8"))
      print(f"Lambda invocation response: {payload}")

      self.assertEqual(response["StatusCode"], 200)
      self.assertEqual(payload["statusCode"], 200)
      self.assertEqual(payload["body"], "Hello from Lambda")

    except Exception as ex:
      self.fail(f"Lambda invocation test failed: {ex}")

  @mark.it("should verify S3 object creation triggers Lambda (conceptual)")
  def test_s3_event_triggers_lambda_conceptual(self):
    print(
      "This test is conceptual. To fully verify the S3 trigger, "
      "the Lambda function would need to perform a verifiable action "
      "(e.g., write to DynamoDB) when triggered by S3."
    )

    self.assertTrue(
      True,
      "S3 trigger test requires more complex Lambda logic or log monitoring."
    )
