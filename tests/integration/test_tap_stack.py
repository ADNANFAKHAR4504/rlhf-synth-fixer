import time
import uuid
import json
from datetime import datetime
import pytest
import boto3

# --- Configuration for the deployed stack ---
# This must accurately match the stack ID used when deploying your CDK app (e.g., in app.py).
# Based on lib/tap_stack.py, the main stack name is "tap-serverless".
STACK_NAME = "tap-serverless"

# S3 prefixes used by the Lambda function for input and error archiving.
# These must match the S3 notification filter in tap_stack.py and the Lambda's logic.
S3_SOURCE_UPLOAD_PREFIX = "raw-logs/"
S3_ERROR_ARCHIVE_MALFORMED_PREFIX = "malformed/"
S3_ERROR_ARCHIVE_INVALID_DATA_PREFIX = "invalid-data/"

# Unique IDs for test data to avoid conflicts across test runs and ensure isolation.
TEST_SERVICE_ID_VALID = f"test-service-valid-{uuid.uuid4().hex[:8]}"
TEST_SERVICE_ID_INVALID_DATA = f"test-service-invalid-data-{uuid.uuid4().hex[:8]}"
TEST_OBJECT_KEY_MALFORMED = f"malformed-log-{uuid.uuid4().hex[:8]}.json"
TEST_OBJECT_KEY_DLQ = f"dlq-test-file-{uuid.uuid4().hex[:8]}.bin"  # For the DLQ test

@pytest.fixture(scope="module")
def aws_clients():
  """
  Provides boto3 clients for necessary AWS services.
  Scoped to 'module' to initialize once per test run.
  """
  return {
    "cfn": boto3.client("cloudformation"),
    "s3": boto3.client("s3"),
    "dynamodb": boto3.client("dynamodb"),
    "sqs": boto3.client("sqs"),
    "lambda": boto3.client("lambda"),  # Useful for checking Lambda logs if needed
  }

@pytest.fixture(scope="module")
def stack_outputs(aws_clients):
  """
  Retrieves outputs from the deployed CloudFormation stack.
  These outputs provide the dynamic resource names/URLs needed for testing.
  """
  try:
    response = aws_clients["cfn"].describe_stacks(StackName=STACK_NAME)
    outputs = {output["OutputKey"]: output["OutputValue"]
               for output in response["Stacks"][0]["Outputs"]}
    print(f"\n--- Retrieved Stack Outputs for '{STACK_NAME}': ---")
    for key, value in outputs.items():
      print(f"  {key}: {value}")
    print("-------------------------------------------------")
    return outputs
  except aws_clients["cfn"].exceptions.ClientError as exc:
    if f"Stack with id {STACK_NAME} does not exist" in str(exc):
      pytest.fail(
        f"Stack '{STACK_NAME}' not found. Please ensure the CDK stack is "
        f"deployed and its name matches '{STACK_NAME}'. Error: {exc}"
      )
    raise

@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data(aws_clients, stack_outputs):
  """
  Fixture to clean up S3 objects and DynamoDB items created during the test.
  This runs automatically after all tests in the module have completed (`autouse=True`).
  It uses prefixes for S3 cleanup for robustness.
  """
  s3_client = aws_clients["s3"]
  dynamodb_client = aws_clients["dynamodb"]
  sqs_client = aws_clients["sqs"]

  # Retrieve bucket and table names from stack outputs
  s3_source_bucket_name = stack_outputs["S3SourceBucketName"]
  error_archive_bucket_name = stack_outputs["ErrorArchiveBucketName"]
  dynamodb_table_name = stack_outputs["DynamoDBTableName"]
  lambda_dlq_queue_url = stack_outputs["LambdaDLQQueueUrl"]

  # Yield control to the tests, cleanup happens after tests complete
  yield

  print("\n--- Starting cleanup of test data ---")

  # --- S3 Cleanup ---
  def delete_s3_objects_with_prefix(bucket, prefix):
    """Helper to list and delete all objects under a given S3 prefix."""
    paginator = s3_client.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=bucket, Prefix=prefix)
    for page in pages:
      if "Contents" in page:
        objects_to_delete = [{'Key': obj['Key']} for obj in page['Contents']]
        try:
          s3_client.delete_objects(Bucket=bucket, Delete={'Objects': objects_to_delete})
          print(f"Deleted {len(objects_to_delete)} objects from s3://{bucket}/{prefix}")
        except Exception as exc:  # pylint: disable=broad-except
          print(f"Failed to delete objects from s3://{bucket}/{prefix}: {exc}")

  print(f"Cleaning S3 source bucket: {s3_source_bucket_name}")
  # Clean up objects related to our test run in the source bucket
  delete_s3_objects_with_prefix(s3_source_bucket_name, S3_SOURCE_UPLOAD_PREFIX)

  print(f"Cleaning S3 error archive bucket: {error_archive_bucket_name}")
  # Clean up objects in the error archive bucket for malformed and invalid data
  delete_s3_objects_with_prefix(error_archive_bucket_name, S3_ERROR_ARCHIVE_MALFORMED_PREFIX)
  delete_s3_objects_with_prefix(error_archive_bucket_name, S3_ERROR_ARCHIVE_INVALID_DATA_PREFIX)

  # --- DynamoDB Cleanup ---
  print(f"Cleaning DynamoDB table: {dynamodb_table_name}")
  # Delete items using the serviceName (PK) and timestamp (SK)
  for service_id_to_clean in [TEST_SERVICE_ID_VALID, TEST_SERVICE_ID_INVALID_DATA]:
    try:
      # Query for items associated with the test service ID
      response = dynamodb_client.query(
        TableName=dynamodb_table_name,
        KeyConditionExpression='serviceName = :sid',
        ExpressionAttributeValues={
          ':sid': {'S': service_id_to_clean}
        }
      )
      for item in response.get('Items', []):
        # Delete each item using its full primary key (PK + SK)
        dynamodb_client.delete_item(
          TableName=dynamodb_table_name,
          Key={
            'serviceName': {'S': item['serviceName']['S']},
            'timestamp': {'S': item['timestamp']['S']}
          }
        )
        print(
          f"Deleted DynamoDB item: serviceName='{item['serviceName']['S']}', "
          f"timestamp='{item['timestamp']['S']}'"
        )
    except Exception as exc:  # pylint: disable=broad-except
      print(f"Failed to delete DynamoDB items for service ID {service_id_to_clean}: {exc}")

  # --- SQS DLQ Cleanup ---
  try:
    sqs_client.purge_queue(QueueUrl=lambda_dlq_queue_url)
    print(f"Purged SQS DLQ: {lambda_dlq_queue_url}")
  except Exception as exc:  # pylint: disable=broad-except
    print(
      f"Warning: Could not purge DLQ {lambda_dlq_queue_url}: {exc}. "
      "This might be due to a recent purge or queue state."
    )

  print("--- Cleanup complete ---")

def test_e2e_valid_log_processing(aws_clients, stack_outputs):
  """
  Tests end-to-end processing of a valid log file:
  1. Uploads a valid JSON file to S3 source bucket.
  2. Waits for Lambda to process it.
  3. Verifies the data is present in DynamoDB.
  """
  s3_client = aws_clients["s3"]
  dynamodb_client = aws_clients["dynamodb"]

  s3_source_bucket_name = stack_outputs["S3SourceBucketName"]
  dynamodb_table_name = stack_outputs["DynamoDBTableName"]

  print("\n--- Running E2E Test: Valid Log Processing ---")

  # 1. Prepare and upload a valid test JSON payload to S3
  current_time_iso = datetime.utcnow().isoformat(timespec='milliseconds') + "Z"
  test_payload = {
    "serviceName": TEST_SERVICE_ID_VALID,
    "timestamp": current_time_iso,
    "logLevel": "INFO",
    "message": "This is a valid log message from integration test.",
    "requestId": str(uuid.uuid4())
  }
  test_object_key = f"{S3_SOURCE_UPLOAD_PREFIX}{TEST_SERVICE_ID_VALID}.json"
  test_file_content = json.dumps(test_payload)

  print(f"Uploading valid test data to s3://{s3_source_bucket_name}/{test_object_key}")
  s3_client.put_object(
    Bucket=s3_source_bucket_name,
    Key=test_object_key,
    Body=test_file_content,
    ContentType="application/json"
  )
  print("Valid test data uploaded.")

  # 2. Wait for Lambda to process the S3 event
  # Increased sleep time (30s) for robustness in real cloud environments
  print("Waiting for Lambda to process the S3 event (up to 30 seconds)...")
  time.sleep(30)

  # 3. Verify the data in DynamoDB
  print(f"Querying DynamoDB table '{dynamodb_table_name}' for serviceName: {TEST_SERVICE_ID_VALID}")
  try:
    response = dynamodb_client.query(
      TableName=dynamodb_table_name,
      KeyConditionExpression='serviceName = :sid',
      ExpressionAttributeValues={
        ':sid': {'S': TEST_SERVICE_ID_VALID}
      }
    )
    items = response.get('Items', [])
    print(f"DynamoDB query response: {json.dumps(items, indent=2)}")

    assert len(items) > 0, f"No items found in DynamoDB for serviceName: {TEST_SERVICE_ID_VALID}"

    found_item = None
    for item in items:
      # Match by both serviceName and timestamp (PK and SK) for precise verification
      if (item.get('serviceName', {}).get('S') == test_payload['serviceName'] and
          item.get('timestamp', {}).get('S') == test_payload['timestamp']):
        found_item = item
        break

    assert found_item is not None, (
      f"Item with expected serviceName '{test_payload['serviceName']}' "
      f"and timestamp '{test_payload['timestamp']}' not found in DynamoDB."
    )

    # Verify the content of the found item, including the Lambda-added 'ingestionTimestamp'
    assert found_item['serviceName']['S'] == test_payload['serviceName']
    assert found_item['logLevel']['S'] == test_payload['logLevel']
    assert found_item['message']['S'] == test_payload['message']
    assert found_item['timestamp']['S'] == test_payload['timestamp']
    assert 'ingestionTimestamp' in found_item and found_item['ingestionTimestamp']['S'], (
      "ingestionTimestamp field missing or empty in processed item."
    )

    print("E2E test successful: Valid log data found and verified in DynamoDB.")

  except Exception as exc:  # pylint: disable=broad-except
    pytest.fail(f"E2E test failed during DynamoDB verification: {exc}")

def test_e2e_malformed_log_file_archiving(aws_clients, stack_outputs):
  """
  Tests end-to-end handling of a malformed log file:
  1. Uploads a non-JSON file to S3 source bucket.
  2. Waits for Lambda to attempt processing.
  3. Verifies the file is moved to the error archive S3 bucket under the 'malformed/' prefix.
  """
  s3_client = aws_clients["s3"]

  s3_source_bucket_name = stack_outputs["S3SourceBucketName"]
  error_archive_bucket_name = stack_outputs["ErrorArchiveBucketName"]

  print("\n--- Running E2E Test: Malformed Log File Archiving ---")

  # 1. Prepare and upload a malformed (non-JSON) file
  malformed_content = "This is not JSON data. {invalid: json"
  test_object_key = f"{S3_SOURCE_UPLOAD_PREFIX}{TEST_OBJECT_KEY_MALFORMED}"

  print(f"Uploading malformed test data to s3://{s3_source_bucket_name}/{test_object_key}")
  s3_client.put_object(
    Bucket=s3_source_bucket_name,
    Key=test_object_key,
    Body=malformed_content,
    ContentType="text/plain"  # Explicitly indicate it's not JSON
  )
  print("Malformed test data uploaded.")

  # 2. Wait for Lambda to attempt processing and archive
  print("Waiting for Lambda to process and archive malformed file (up to 30 seconds)...")
  time.sleep(30)

  # 3. Verify the file is in the error archive bucket
  error_archive_key = f"{S3_ERROR_ARCHIVE_MALFORMED_PREFIX}{TEST_OBJECT_KEY_MALFORMED}"
  print(f"Checking for malformed file in error archive: s3://{error_archive_bucket_name}/{error_archive_key}")
  try:
    s3_client.head_object(Bucket=error_archive_bucket_name, Key=error_archive_key)
    print("E2E test successful: Malformed log file found in error archive S3 bucket.")
  except s3_client.exceptions.ClientError as exc:
    if exc.response['Error']['Code'] == 'NotFound':
      pytest.fail(
        f"E2E test failed: Malformed log file '{error_archive_key}' not found in "
        f"error archive S3 bucket. Check Lambda logs for processing errors "
        "or if it's archiving to a different prefix."
      )
    else:
      pytest.fail(f"E2E test failed during error archive check: {exc}")

def test_e2e_invalid_data_archiving(aws_clients, stack_outputs):
  """
  Tests end-to-end handling of a JSON file with missing critical data:
  1. Uploads a JSON file missing 'serviceName' (or 'timestamp'/'message') to S3 source bucket.
  2. Waits for Lambda to attempt processing.
  3. Verifies the file is moved to the error archive S3 bucket under the 'invalid-data/' prefix.
  """
  s3_client = aws_clients["s3"]

  s3_source_bucket_name = stack_outputs["S3SourceBucketName"]
  error_archive_bucket_name = stack_outputs["ErrorArchiveBucketName"]

  print("\n--- Running E2E Test: Invalid Data Archiving ---")

  # 1. Prepare and upload a JSON file with missing critical fields (e.g., 'serviceName')
  invalid_payload = {
    # "serviceName": "missing-service-name",  # Intentionally missing to trigger invalid data path
    "timestamp": datetime.utcnow().isoformat(timespec='milliseconds') + "Z",
    "logLevel": "ERROR",
    "message": "This log is missing a critical field.",
    "requestId": str(uuid.uuid4())
  }
  test_object_key = f"{S3_SOURCE_UPLOAD_PREFIX}{TEST_SERVICE_ID_INVALID_DATA}.json"
  test_file_content = json.dumps(invalid_payload)

  print(f"Uploading invalid data test data to s3://{s3_source_bucket_name}/{test_object_key}")
  s3_client.put_object(
    Bucket=s3_source_bucket_name,
    Key=test_object_key,
    Body=test_file_content,
    ContentType="application/json"
  )
  print("Invalid data test data uploaded.")

  # 2. Wait for Lambda to attempt processing and archive
  print("Waiting for Lambda to process and archive invalid data (up to 30 seconds)...")
  time.sleep(30)

  # 3. Verify the file is in the error archive bucket
  error_archive_key = f"{S3_ERROR_ARCHIVE_INVALID_DATA_PREFIX}{TEST_SERVICE_ID_INVALID_DATA}.json"
  print(f"Checking for invalid data file in error archive: s3://{error_archive_bucket_name}/{error_archive_key}")
  try:
    s3_client.head_object(Bucket=error_archive_bucket_name, Key=error_archive_key)
    print("E2E test successful: Invalid data log file found in error archive S3 bucket.")
  except s3_client.exceptions.ClientError as exc:
    if exc.response['Error']['Code'] == 'NotFound':
      pytest.fail(
        f"E2E test failed: Invalid data log file '{error_archive_key}' not found in "
        f"error archive S3 bucket. Check Lambda logs for 'Skipping record due to missing...' "
        "and archiving path."
      )
    else:
      pytest.fail(f"E2E test failed during error archive check: {exc}")

def test_e2e_dlq_functionality(aws_clients, stack_outputs):
  """
  Tests DLQ functionality by attempting to force an unhandled Lambda invocation failure.
  This test aims to trigger an error that is *not* caught by the Lambda's explicit
  try-except blocks (e.g., JSON parsing or missing fields), leading to the S3 event
  being sent to the DLQ.
  """
  s3_client = aws_clients["s3"]
  sqs_client = aws_clients["sqs"]

  s3_source_bucket_name = stack_outputs["S3SourceBucketName"]
  lambda_dlq_queue_url = stack_outputs["LambdaDLQQueueUrl"]

  print("\n--- Running E2E Test: DLQ Functionality ---")

  # Purge the queue before the test to ensure we only count messages from this run
  try:
    sqs_client.purge_queue(QueueUrl=lambda_dlq_queue_url)
    print("DLQ purged before test.")
    time.sleep(5)  # Give SQS time to purge
  except Exception as exc:  # pylint: disable=broad-except
    print(
      f"Warning: Could not purge DLQ {lambda_dlq_queue_url}: {exc}. "
      "This might be due to a recent purge or queue state."
    )

  # 1. Upload a file designed to cause an unhandled exception in Lambda.
  # A simple non-JSON, non-UTF8 binary-like content might cause `read().decode('utf-8')` to fail
  # with an unhandled UnicodeDecodeError, leading to DLQ.
  dlq_test_content = b"\x80\x01\x02\x03" * 1000  # Binary data that's not valid UTF-8
  dlq_object_key = f"{S3_SOURCE_UPLOAD_PREFIX}{TEST_OBJECT_KEY_DLQ}"

  print(f"Uploading DLQ test data to s3://{s3_source_bucket_name}/{dlq_object_key}")
  s3_client.put_object(
    Bucket=s3_source_bucket_name,
    Key=dlq_object_key,
    Body=dlq_test_content,
    ContentType="application/octet-stream"  # Indicate it's binary
  )
  print("DLQ test data uploaded.")

  # 2. Wait for Lambda to process and potentially fail
  # Increased sleep time (45s) for potential Lambda retries and DLQ delivery
  print("Waiting for Lambda to process and potentially send to DLQ (up to 45 seconds)...")
  time.sleep(45)

  # 3. Check for messages in the DLQ
  print(f"Checking SQS DLQ for messages: {lambda_dlq_queue_url}")
  try:
    response = sqs_client.receive_message(
      QueueUrl=lambda_dlq_queue_url,
      MaxNumberOfMessages=1,
      WaitTimeSeconds=10  # Long polling to wait for messages
    )
    messages = response.get('Messages', [])
    print(f"Received {len(messages)} messages from DLQ.")

    assert len(messages) > 0, (
      "No messages found in DLQ. Lambda invocation might not have failed as expected "
      "or message not delivered to DLQ. Check Lambda CloudWatch logs for unhandled errors."
    )

    # The DLQ message body is the original S3 event payload, encoded as JSON string
    dlq_message_body = json.loads(messages[0]['Body'])
    assert 'Records' in dlq_message_body
    assert dlq_message_body['Records'][0]['s3']['object']['key'] == dlq_object_key

    print("E2E test successful: Message found in DLQ, indicating Lambda invocation failure.")

    # Delete the message from the queue to clean up
    sqs_client.delete_message(
      QueueUrl=lambda_dlq_queue_url,
      ReceiptHandle=messages[0]['ReceiptHandle']
    )
    print("DLQ message deleted.")

  except Exception as exc:  # pylint: disable=broad-except
    pytest.fail(f"E2E test failed during DLQ verification: {exc}")