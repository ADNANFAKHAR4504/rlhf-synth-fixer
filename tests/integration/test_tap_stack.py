"""Integration test cases for the TapStack CDK stack."""

import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError, BotoCoreError
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
LAMBDA_FUNCTION_NAME = flat_outputs.get("LambdaFunctionName")
LAMBDA_ROLE_ARN = flat_outputs.get("LambdaRoleArn")  # Optional, if used

s3_client = boto3.client("s3")
lambda_client = boto3.client("lambda")
cloudwatch_client = boto3.client("cloudwatch")


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for S3, Lambda, and CloudWatch in TapStack."""

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
    test_object_key = "integration/test/object.txt"
    payload = {
      "Records": [
        {
          "eventSource": "aws:s3",
          "s3": {
            "bucket": {"name": S3_BUCKET_NAME},
            "object": {"key": test_object_key}
          }
        }
      ]
    }

    try:
      response = lambda_client.invoke(
        FunctionName=LAMBDA_FUNCTION_NAME,
        InvocationType="RequestResponse",
        Payload=json.dumps(payload)
      )
      function_response = json.loads(response["Payload"].read())
      self.assertEqual(response["StatusCode"], 200)
      self.assertEqual(function_response.get("statusCode"), 200)
      self.assertEqual(
        function_response.get("body"), "Successfully processed S3 event"
      )
    except (ClientError, BotoCoreError, json.JSONDecodeError) as ex:
      self.fail(f"Lambda test failed: {ex}")

  @mark.it("confirms CloudWatch alarms exist for Lambda function")
  def test_cloudwatch_alarms_exist(self):
    """Ensure CloudWatch alarms for Lambda errors, throttles, and duration exist."""
    parts = LAMBDA_FUNCTION_NAME.split('-')
    if len(parts) < 3:
      self.fail(f"Unexpected Lambda function name format: {LAMBDA_FUNCTION_NAME}")
    env_suffix = parts[1]

    prefix = f"tap-{env_suffix}-lambda-"
    expected_alarm_names = [
      f"{prefix}LambdaErrorAlarm",
      f"{prefix}LambdaThrottlesAlarm",
      f"{prefix}LambdaDurationAlarm"
    ]

    found_alarms = []

    try:
      response = cloudwatch_client.describe_alarms(AlarmNamePrefix=prefix)
      for alarm in response.get("MetricAlarms", []):
        dimensions = alarm.get("Dimensions", [])
        if any(
          d.get("Name") == "FunctionName" and d.get("Value") == LAMBDA_FUNCTION_NAME
          for d in dimensions
        ):
          if alarm.get("AlarmName") in expected_alarm_names:
            found_alarms.append(alarm)

      self.assertEqual(
        len(found_alarms),
        len(expected_alarm_names),
        f"Expected {len(expected_alarm_names)} alarms, found {len(found_alarms)}. "
        f"Missing: {set(expected_alarm_names) - {a['AlarmName'] for a in found_alarms}}"
      )

      for alarm_detail in found_alarms:
        name = alarm_detail["AlarmName"]
        self.assertEqual(alarm_detail["ComparisonOperator"], "GreaterThanOrEqualToThreshold")
        self.assertEqual(alarm_detail["EvaluationPeriods"], 1)
        if "Error" in name or "Throttles" in name:
          self.assertEqual(alarm_detail["Threshold"], 1.0)
        elif "Duration" in name:
          self.assertEqual(alarm_detail["Threshold"], 5000.0)
          self.assertEqual(alarm_detail["Period"], 60)

    except (ClientError, BotoCoreError) as ex:
      self.fail(f"CloudWatch alarms test failed: {ex}")
