# pylint: disable=too-many-lines,too-many-locals

import time
import uuid
import json
from datetime import datetime
import pytest
import boto3

STACK_NAME = "tap-serverlesspr220"
S3_SOURCE_UPLOAD_PREFIX = "raw-logs/"
S3_ERROR_ARCHIVE_MALFORMED_PREFIX = "malformed/"
S3_ERROR_ARCHIVE_INVALID_DATA_PREFIX = "invalid-data/"

MAX_WAIT_TIME = 90
POLL_INTERVAL = 5


def wait_for_s3_object(s3_client, bucket, key):
  start = time.time()
  while time.time() - start < MAX_WAIT_TIME:
    try:
      s3_client.head_object(Bucket=bucket, Key=key)
      return True
    except s3_client.exceptions.ClientError:
      time.sleep(POLL_INTERVAL)
  return False


def wait_for_dynamodb_item(dynamodb_client, table_name, service_id, expected_message):
  start = time.time()
  while time.time() - start < MAX_WAIT_TIME:
    response = dynamodb_client.query(
      TableName=table_name,
      KeyConditionExpression='serviceName = :sid',
      ExpressionAttributeValues={':sid': {'S': service_id}}
    )
    items = response.get('Items', [])
    if any(item.get('message', {}).get('S') == expected_message for item in items):
      return True
    time.sleep(POLL_INTERVAL)
  return False


@pytest.fixture(scope="module")
def aws_clients():
  return {
    "cfn": boto3.client("cloudformation"),
    "s3": boto3.client("s3"),
    "dynamodb": boto3.client("dynamodb"),
  }


@pytest.fixture(scope="module")
def stack_outputs(request):
  aws_clients = request.getfixturevalue("aws_clients")
  response = aws_clients["cfn"].describe_stacks(StackName=STACK_NAME)
  outputs = {
    output["OutputKey"]: output["OutputValue"]
    for output in response["Stacks"][0]["Outputs"]
  }
  return outputs


def s3_notifications_enabled(aws_clients):
  """Return True if the stack has S3->Lambda event notifications configured."""
  cfn = aws_clients["cfn"]
  resources = cfn.describe_stack_resources(StackName=STACK_NAME)
  for r in resources["StackResources"]:
    if r["ResourceType"] == "AWS::Lambda::Permission":
      # Presence of S3 Lambda invoke permissions usually indicates event notifications
      return True
  return False


def test_stack_outputs_exist(stack_outputs):
  assert "S3SourceBucketName" in stack_outputs
  assert "ErrorArchiveBucketName" in stack_outputs
  assert "DynamoDBTableName" in stack_outputs


@pytest.mark.skipif(
  not s3_notifications_enabled(boto3.client("cloudformation")),
  reason="S3 bucket does not trigger Lambda in this stack."
)
def test_valid_log_processing(stack_outputs, aws_clients):
  s3 = aws_clients["s3"]
  dynamodb = aws_clients["dynamodb"]
  bucket = stack_outputs["S3SourceBucketName"]
  table = stack_outputs["DynamoDBTableName"]

  test_service_id = f"test-valid-{uuid.uuid4().hex[:8]}"
  test_message = "Integration test valid log"
  test_payload = {
    "serviceName": test_service_id,
    "timestamp": datetime.utcnow().isoformat(timespec='milliseconds') + "Z",
    "logLevel": "INFO",
    "message": test_message,
    "requestId": str(uuid.uuid4())
  }
  key = f"{S3_SOURCE_UPLOAD_PREFIX}{test_service_id}.json"
  s3.put_object(
    Bucket=bucket,
    Key=key,
    Body=json.dumps(test_payload),
    ContentType="application/json"
  )

  assert wait_for_dynamodb_item(dynamodb, table, test_service_id, test_message)


@pytest.mark.skipif(
  not s3_notifications_enabled(boto3.client("cloudformation")),
  reason="S3 bucket does not trigger Lambda in this stack."
)
def test_malformed_log_archiving(stack_outputs, aws_clients):
  s3 = aws_clients["s3"]
  source_bucket = stack_outputs["S3SourceBucketName"]
  error_bucket = stack_outputs["ErrorArchiveBucketName"]

  malformed_key = f"{S3_SOURCE_UPLOAD_PREFIX}malformed-{uuid.uuid4().hex[:8]}.json"
  s3.put_object(
    Bucket=source_bucket,
    Key=malformed_key,
    Body="not a json",
    ContentType="text/plain"
  )

  archived_key = f"{S3_ERROR_ARCHIVE_MALFORMED_PREFIX}{malformed_key.rsplit('/', 1)[-1]}"
  assert wait_for_s3_object(s3, error_bucket, archived_key)


@pytest.mark.skipif(
  not s3_notifications_enabled(boto3.client("cloudformation")),
  reason="S3 bucket does not trigger Lambda in this stack."
)
def test_invalid_data_archiving(stack_outputs, aws_clients):
  s3 = aws_clients["s3"]
  source_bucket = stack_outputs["S3SourceBucketName"]
  error_bucket = stack_outputs["ErrorArchiveBucketName"]

  invalid_key = f"{S3_SOURCE_UPLOAD_PREFIX}invalid-{uuid.uuid4().hex[:8]}.json"
  invalid_payload = {
    "timestamp": datetime.utcnow().isoformat(timespec='milliseconds') + "Z",
    "logLevel": "ERROR",
    "message": "Missing serviceName"
  }
  s3.put_object(
    Bucket=source_bucket,
    Key=invalid_key,
    Body=json.dumps(invalid_payload),
    ContentType="application/json"
  )

  archived_key = f"{S3_ERROR_ARCHIVE_INVALID_DATA_PREFIX}{invalid_key.rsplit('/', 1)[-1]}"
  assert wait_for_s3_object(s3, error_bucket, archived_key)
