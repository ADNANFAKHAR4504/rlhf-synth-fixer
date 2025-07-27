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
  try:
    response = aws_clients["cfn"].describe_stacks(StackName=STACK_NAME)
    outputs = {output["OutputKey"]: output["OutputValue"]
               for output in response["Stacks"][0]["Outputs"]}
    return outputs
  except Exception as exc:
    pytest.fail(
      f"Stack '{STACK_NAME}' not found or not deployed. Error: {exc}"
    )

def test_stack_outputs_exist(stack_outputs):
  assert "S3SourceBucketName" in stack_outputs
  assert "ErrorArchiveBucketName" in stack_outputs
  assert "DynamoDBTableName" in stack_outputs

def test_valid_log_processing(stack_outputs, aws_clients):
  s3 = aws_clients["s3"]
  dynamodb = aws_clients["dynamodb"]
  bucket = stack_outputs["S3SourceBucketName"]
  table = stack_outputs["DynamoDBTableName"]

  test_service_id = f"test-valid-{uuid.uuid4().hex[:8]}"
  test_payload = {
    "serviceName": test_service_id,
    "timestamp": datetime.utcnow().isoformat(timespec='milliseconds') + "Z",
    "logLevel": "INFO",
    "message": "Integration test valid log",
    "requestId": str(uuid.uuid4())
  }
  key = f"{S3_SOURCE_UPLOAD_PREFIX}{test_service_id}.json"
  s3.put_object(
    Bucket=bucket,
    Key=key,
    Body=json.dumps(test_payload),
    ContentType="application/json"
  )
  time.sleep(20)

  response = dynamodb.query(
    TableName=table,
    KeyConditionExpression='serviceName = :sid',
    ExpressionAttributeValues={':sid': {'S': test_service_id}}
  )
  items = response.get('Items', [])
  assert any(
    item['message']['S'] == test_payload['message']
    for item in items
  )

def test_malformed_log_archiving(stack_outputs, aws_clients):
  s3 = aws_clients["s3"]
  source_bucket = stack_outputs["S3SourceBucketName"]
  error_bucket = stack_outputs["ErrorArchiveBucketName"]

  malformed_key = (
    f"{S3_SOURCE_UPLOAD_PREFIX}malformed-{uuid.uuid4().hex[:8]}.json"
  )
  s3.put_object(
    Bucket=source_bucket,
    Key=malformed_key,
    Body="not a json",
    ContentType="text/plain"
  )
  time.sleep(20)

  archived_key = (
    f"{S3_ERROR_ARCHIVE_MALFORMED_PREFIX}{malformed_key.rsplit('/', maxsplit=1)[-1]}"
  )
  try:
    s3.head_object(Bucket=error_bucket, Key=archived_key)
  except s3.exceptions.ClientError as exc:
    pytest.fail(
      f"Malformed log not found in error archive: {archived_key} ({exc})"
    )

def test_invalid_data_archiving(stack_outputs, aws_clients):
  s3 = aws_clients["s3"]
  source_bucket = stack_outputs["S3SourceBucketName"]
  error_bucket = stack_outputs["ErrorArchiveBucketName"]

  invalid_key = (
    f"{S3_SOURCE_UPLOAD_PREFIX}invalid-{uuid.uuid4().hex[:8]}.json"
  )
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
  time.sleep(20)

  archived_key = (
    f"{S3_ERROR_ARCHIVE_INVALID_DATA_PREFIX}{invalid_key.rsplit('/', maxsplit=1)[-1]}"
  )
  try:
    s3.head_object(Bucket=error_bucket, Key=archived_key)
  except s3.exceptions.ClientError as exc:
    pytest.fail(
      f"Invalid log not found in error archive: {archived_key} ({exc})"
    )
