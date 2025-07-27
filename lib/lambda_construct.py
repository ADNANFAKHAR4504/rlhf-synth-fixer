import json # Standard library first
from constructs import Construct # Third-party imports

from aws_cdk import ( # AWS CDK imports
    aws_lambda as _lambda,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_sqs as sqs,
    Duration,
)

class LambdaProcessingConstruct(Construct):
  # pylint: disable=too-many-arguments
  # R0917: Too many positional arguments (7/5) - justified by required inputs
  def __init__(
      self,
      scope: Construct,
      construct_id: str,
      input_bucket: s3.Bucket,
      output_table: dynamodb.Table,
      dlq_queue: sqs.Queue,
      error_archive_bucket: s3.Bucket,
      **kwargs
  ) -> None:
    super().__init__(scope, construct_id, **kwargs)

    # Define the Lambda function's handler code as an inline string.
    # Indentation within this string must also be 2 spaces to satisfy Pylint.
    lambda_handler_code = """
import json
import os
import boto3
from datetime import datetime

# Initialize S3 and DynamoDB clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Get environment variables set by CDK
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME')
ERROR_ARCHIVE_BUCKET_NAME = os.environ.get('ERROR_ARCHIVE_BUCKET_NAME')

if not TABLE_NAME:
  print("Error: DYNAMODB_TABLE_NAME environment variable not set.")
  exit(1)

if not ERROR_ARCHIVE_BUCKET_NAME:
  print("Error: ERROR_ARCHIVE_BUCKET_NAME environment variable not set.")
  exit(1)

table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
  print(f"Received event: {json.dumps(event)}")

  for record in event['Records']:
    bucket_name = record['s3']['bucket']['name']
    object_key = record['s3']['object']['key']

    try:
      response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
      file_content = response['Body'].read().decode('utf-8')

      try:
        log_data = json.loads(file_content)
      except json.JSONDecodeError as e: # Catch JSON decoding errors
        print(f"Error decoding JSON from s3://{bucket_name}/{object_key}: {e}")
        error_key = f"malformed/{os.path.basename(object_key)}"
        s3_client.put_object(
            Bucket=ERROR_ARCHIVE_BUCKET_NAME,
            Key=error_key,
            Body=file_content,
            ContentType="application/json"
        )
        print(f"Archived malformed file to s3://{ERROR_ARCHIVE_BUCKET_NAME}/{error_key}")
        continue # Move to the next record

      print(f"Processing data from s3://{bucket_name}/{object_key}: {log_data}")

      # Validate critical fields
      if ('serviceName' not in log_data or 'timestamp' not in log_data or
          'message' not in log_data):
        print(f"Skipping record due to missing 'serviceName', 'timestamp', "
              f"or 'message': {log_data}")
        error_key = f"invalid-data/{os.path.basename(object_key)}"
        s3_client.put_object(
            Bucket=ERROR_ARCHIVE_BUCKET_NAME,
            Key=error_key,
            Body=json.dumps(log_data),
            ContentType="application/json"
        )
        print(f"Archived invalid data to s3://{ERROR_ARCHIVE_BUCKET_NAME}/{error_key}")
        continue # Move to the next record

      # Ensure timestamp is string, if not, set current UTC time
      try:
        if not isinstance(log_data['timestamp'], str):
          log_data['timestamp'] = datetime.utcnow().isoformat() + "Z"
      except Exception: # pylint: disable=broad-except
        # Catch any unexpected errors during timestamp handling
        log_data['timestamp'] = datetime.utcnow().isoformat() + "Z"

      # Add ingestion timestamp
      log_data['ingestionTimestamp'] = datetime.utcnow().isoformat() + "Z"

      # Store item in DynamoDB
      table.put_item(Item=log_data)
      print(f"Successfully stored item in DynamoDB: {log_data}")

    except Exception as e: # pylint: disable=broad-except
      # Catch any other unexpected errors during processing
      print(f"An unexpected error occurred processing {object_key}: {e}")

  return {
      'statusCode': 200,
      'body': json.dumps('Processing complete!')
  }
"""

    # Define the Lambda function resource
    self.lambda_function = _lambda.Function(
        self,
        "LogProcessorLambda",
        runtime=_lambda.Runtime.PYTHON_3_9,
        code=_lambda.Code.from_inline(lambda_handler_code),
        handler="index.lambda_handler",
        memory_size=128,
        timeout=Duration.seconds(30),
        environment={
            "DYNAMODB_TABLE_NAME": output_table.table_name,
            "ERROR_ARCHIVE_BUCKET_NAME": error_archive_bucket.bucket_name
        },
        dead_letter_queue=dlq_queue,
    )

    # Grant the Lambda function necessary permissions
    input_bucket.grant_read(self.lambda_function)
    output_table.grant_write_data(self.lambda_function)
    dlq_queue.grant_send_messages(self.lambda_function)
    error_archive_bucket.grant_write(self.lambda_function)
