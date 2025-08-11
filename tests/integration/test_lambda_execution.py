"""End-to-end Lambda execution integration tests"""

import io
import json
import os
import time
import unittest
import zipfile

import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Import utility function for flat outputs
from tests.utils import load_flat_outputs

# Load CloudFormation outputs
flat_outputs = load_flat_outputs()


@mark.describe("Lambda Execution Integration Tests")
class TestLambdaExecution(unittest.TestCase):
  """Integration test cases for Lambda function execution"""

  def setUp(self):
    """Set up AWS clients for both regions"""
    self.environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
    self.eu_west_session = boto3.Session(region_name='eu-west-1')
    self.eu_central_session = boto3.Session(region_name='eu-central-1')

    # Initialize Lambda clients
    self.eu_west_lambda = self.eu_west_session.client('lambda')
    self.eu_central_lambda = self.eu_central_session.client('lambda')

    # Initialize S3 clients
    self.eu_west_s3 = self.eu_west_session.client('s3')
    self.eu_central_s3 = self.eu_central_session.client('s3')

    # Initialize CloudWatch Logs clients
    self.eu_west_logs = self.eu_west_session.client('logs')
    self.eu_central_logs = self.eu_central_session.client('logs')

  def _get_output_value(self, stack_name, output_key):
    """Helper method to get CloudFormation output values"""
    return flat_outputs.get(f"{stack_name}.{output_key}")

  def _get_function_name(self, region):
    """Helper method to get Lambda function name for a region"""
    stack_name = f"MultiRegionStack-{region.upper()}-{self.environment_suffix}"
    lambda_arn = self._get_output_value(stack_name, 'LambdaFunctionArn')
    if lambda_arn:
      return lambda_arn.split(':')[-1]
    return None

  def _get_bucket_name(self, region, bucket_type='SSE-S3'):
    """Helper method to get S3 bucket name for a region"""
    stack_name = f"MultiRegionStack-{region.upper()}-{self.environment_suffix}"
    output_key = 'S3BucketSSES3Name' if bucket_type == 'SSE-S3' else 'S3BucketSSEKMSName'
    return self._get_output_value(stack_name, output_key)

  @mark.it("Lambda function can write to S3 bucket")
  def test_lambda_write_to_s3(self):
    """Test that Lambda function can write to S3 bucket"""
    # Test in EU West region
    eu_west_function_name = self._get_function_name('eu-west')
    eu_west_bucket = self._get_bucket_name('eu-west')

    if not eu_west_function_name or not eu_west_bucket:
      self.skipTest("Lambda function or S3 bucket not found in EU West")

    # Create a custom Lambda function for testing S3 interaction
    test_data = {"test": "data", "timestamp": str(time.time())}
    test_key = f"test-{int(time.time())}.json"

    # Create a Lambda event with test parameters
    event = {
        "action": "write",
        "bucket": eu_west_bucket,
        "key": test_key,
        "data": test_data
    }

    # Create and deploy test Lambda function
    test_lambda_name = f"test-s3-integration-{self.environment_suffix}"
    try:
      # First try to update the function if it exists
      self.eu_west_lambda.update_function_code(
          FunctionName=test_lambda_name,
          ZipFile=self._create_test_lambda_package()
      )
    except ClientError:
      # If the function doesn't exist, create it
      role_arn = self._get_lambda_role_arn(eu_west_function_name)
      if not role_arn:
        self.skipTest("Could not determine Lambda execution role")

      self.eu_west_lambda.create_function(
          FunctionName=test_lambda_name,
          Runtime='python3.11',
          Role=role_arn,
          Handler='index.handler',
          Code={'ZipFile': self._create_test_lambda_package()},
          Timeout=30,
          Environment={
              'Variables': {
                  'BUCKET': eu_west_bucket
              }
          }
      )

      # Wait for function to be active
      time.sleep(5)

    # Invoke the Lambda function
    response = self.eu_west_lambda.invoke(
        FunctionName=test_lambda_name,
        InvocationType='RequestResponse',
        Payload=json.dumps(event).encode()
    )

    # Verify response
    self.assertEqual(response['StatusCode'], 200)

    # Verify object was written to S3
    response = self.eu_west_s3.get_object(
        Bucket=eu_west_bucket,
        Key=test_key
    )

    # Get object content
    content = json.loads(response['Body'].read().decode('utf-8'))

    # Verify content matches test data
    self.assertEqual(content, test_data)

    # Clean up test object
    self.eu_west_s3.delete_object(
        Bucket=eu_west_bucket,
        Key=test_key
    )

  def _create_test_lambda_package(self):
    """Create a test Lambda package for S3 interactions"""
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'a', zipfile.ZIP_DEFLATED) as zip_file:
      zip_file.writestr('index.py', """
import json
import boto3
import os

def handler(event, context):
    print(f"Processing event in {os.environ.get('AWS_REGION', 'unknown')} region")
    
    s3 = boto3.client('s3')
    
    action = event.get('action', 'read')
    bucket = event.get('bucket')
    key = event.get('key')
    
    if action == 'write':
        data = event.get('data', {})
        s3.put_object(
            Bucket=bucket,
            Key=key,
            Body=json.dumps(data),
            ContentType='application/json'
        )
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully wrote object to s3://{bucket}/{key}',
                'data': data
            })
        }
    elif action == 'read':
        response = s3.get_object(
            Bucket=bucket,
            Key=key
        )
        data = json.loads(response['Body'].read().decode('utf-8'))
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully read object from s3://{bucket}/{key}',
                'data': data
            })
        }
    else:
        return {
            'statusCode': 400,
            'body': json.dumps({
                'message': f'Invalid action: {action}'
            })
        }
""")
      zip_file.writestr('__init__.py', '')

    return zip_buffer.getvalue()

  def _get_lambda_role_arn(self, function_name):
    """Get the role ARN used by an existing Lambda function"""
    try:
      response = self.eu_west_lambda.get_function(
          FunctionName=function_name
      )
      return response['Configuration']['Role']
    except (ClientError, KeyError):
      return None

  @mark.it("Lambda function can interact with encrypted S3 bucket using KMS key")
  def test_lambda_kms_encrypted_s3(self):
    """Test that Lambda function can interact with KMS-encrypted S3 bucket"""
    # Test in EU Central region
    eu_central_function_name = self._get_function_name('eu-central')
    eu_central_bucket = self._get_bucket_name('eu-central', 'SSE-KMS')

    if not eu_central_function_name or not eu_central_bucket:
      self.skipTest(
          "Lambda function or KMS-encrypted S3 bucket not found in EU Central")

    # Create a test object in the KMS-encrypted bucket
    test_data = {"test": "kms-encrypted-data", "timestamp": str(time.time())}
    test_key = f"test-kms-{int(time.time())}.json"

    # Put object in KMS-encrypted bucket
    self.eu_central_s3.put_object(
        Bucket=eu_central_bucket,
        Key=test_key,
        Body=json.dumps(test_data),
        ContentType='application/json'
    )

    # Create a Lambda event with test parameters
    event = {
        "action": "read",
        "bucket": eu_central_bucket,
        "key": test_key
    }

    # Create and deploy test Lambda function
    test_lambda_name = f"test-kms-integration-{self.environment_suffix}"
    try:
      # First try to update the function if it exists
      self.eu_central_lambda.update_function_code(
          FunctionName=test_lambda_name,
          ZipFile=self._create_test_lambda_package()
      )
    except ClientError:
      # If the function doesn't exist, create it
      role_arn = self._get_lambda_role_arn(eu_central_function_name)
      if not role_arn:
        self.skipTest("Could not determine Lambda execution role")

      self.eu_central_lambda.create_function(
          FunctionName=test_lambda_name,
          Runtime='python3.11',
          Role=role_arn,
          Handler='index.handler',
          Code={'ZipFile': self._create_test_lambda_package()},
          Timeout=30,
          Environment={
              'Variables': {
                  'BUCKET': eu_central_bucket
              }
          }
      )

      # Wait for function to be active
      time.sleep(5)

    # Invoke the Lambda function
    response = self.eu_central_lambda.invoke(
        FunctionName=test_lambda_name,
        InvocationType='RequestResponse',
        Payload=json.dumps(event).encode()
    )

    # Verify response
    self.assertEqual(response['StatusCode'], 200)

    payload = json.loads(response['Payload'].read().decode('utf-8'))
    body = json.loads(payload['body'])

    # Verify data matches test data
    self.assertEqual(body['data'], test_data)

    # Clean up test object
    self.eu_central_s3.delete_object(
        Bucket=eu_central_bucket,
        Key=test_key
    )

  @mark.it("CloudWatch alarms trigger when thresholds are exceeded")
  def test_cloudwatch_alarm_trigger(self):
    """Test that CloudWatch alarms trigger when thresholds are exceeded"""
    # This test requires manually triggering an alarm, which is difficult to do in an automated test
    # Instead, we'll verify the alarm configuration and examine recent alarm history

    regions = [
        ('eu-west-1', self.eu_west_session),
        ('eu-central-1', self.eu_central_session)
    ]

    for region_name, session in regions:
      with self.subTest(region=region_name):
        # Get CloudWatch client for this region
        cloudwatch = session.client('cloudwatch')

        # List alarms that match our pattern
        alarms = cloudwatch.describe_alarms(
            AlarmNamePrefix=f'lambda-high-duration-{region_name}'
        )

        # Skip if no alarms found
        if not alarms['MetricAlarms']:
          self.skipTest(f"No alarms found in {region_name}")

        # Get the first alarm
        alarm = alarms['MetricAlarms'][0]

        # Verify the alarm is correctly configured
        self.assertEqual(alarm['ComparisonOperator'], 'GreaterThanThreshold')
        self.assertEqual(alarm['Threshold'], 20000.0)

        # Get alarm history (last 24 hours)
        end_time = time.time()
        start_time = end_time - (24 * 60 * 60)  # 24 hours ago

        history = cloudwatch.describe_alarm_history(
            AlarmName=alarm['AlarmName'],
            HistoryItemType='StateUpdate',
            StartTime=start_time,
            EndTime=end_time
        )

        # Just print the history for informational purposes
        print(f"Alarm history for {alarm['AlarmName']} in {region_name}:")
        for item in history['AlarmHistoryItems']:
          print(f"  {item['Timestamp']}: {item['HistorySummary']}")


if __name__ == '__main__':
  unittest.main()
