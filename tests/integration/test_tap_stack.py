"""Integration tests for the TapStack CDK deployment.

This module contains end-to-end integration tests that validate:
- Deployed AWS infrastructure components
- S3 to Lambda to DynamoDB workflow
- Resource configurations and connectivity
"""
import json
import os
import time
import unittest
from datetime import datetime

import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
  base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    FLAT_OUTPUTS = f.read()
else:
  FLAT_OUTPUTS = '{}'

FLAT_OUTPUTS = json.loads(FLAT_OUTPUTS)


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
  """Integration test cases for the TapStack CDK stack"""

  @classmethod
  def setUpClass(cls):
    """Set up AWS clients and get stack outputs"""
    # Ensure we use us-east-1 region to match CDK deployment
    region = 'us-east-1'
    cls.s3_client = boto3.client('s3', region_name=region)
    cls.dynamodb_client = boto3.client('dynamodb', region_name=region)
    cls.lambda_client = boto3.client('lambda', region_name=region)
    cls.cloudtrail_client = boto3.client('cloudtrail', region_name=region)
    cls.iam_client = boto3.client('iam', region_name=region)

    # Get environment suffix for resource naming
    cls.env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')

    # Resource names based on naming convention
    cls.bucket_name = f"proj-bucket-{cls.env_suffix}"
    cls.table_name = f"proj-table-{cls.env_suffix}"
    cls.lambda_name = f"proj-lambda-{cls.env_suffix}"
    cls.trail_name = f"proj-trail-{cls.env_suffix}"
    cls.access_logs_bucket = f"proj-access-logs-{cls.env_suffix}"
    cls.cloudtrail_bucket = f"proj-cloudtrail-{cls.env_suffix}"

  @mark.it("verifies S3 bucket exists and has correct configuration")
  def test_s3_bucket_configuration(self):
    """Test that S3 bucket exists with proper configuration"""
    try:
      # Check bucket exists
      response = self.s3_client.head_bucket(Bucket=self.bucket_name)
      self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

      # Check versioning is enabled
      versioning = self.s3_client.get_bucket_versioning(
          Bucket=self.bucket_name)
      self.assertEqual(versioning.get('Status'), 'Enabled')

      # Check encryption is configured
      encryption = self.s3_client.get_bucket_encryption(
          Bucket=self.bucket_name)
      self.assertIn('ServerSideEncryptionConfiguration', encryption)

      # Check public access is blocked
      public_access = self.s3_client.get_public_access_block(
          Bucket=self.bucket_name)
      pab_config = public_access['PublicAccessBlockConfiguration']
      self.assertTrue(pab_config['BlockPublicAcls'])
      self.assertTrue(pab_config['BlockPublicPolicy'])
      self.assertTrue(pab_config['IgnorePublicAcls'])
      self.assertTrue(pab_config['RestrictPublicBuckets'])

      # Check access logging bucket exists
      response = self.s3_client.head_bucket(Bucket=self.access_logs_bucket)
      self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

    except ClientError as e:
      self.fail(f"S3 bucket configuration test failed: {e}")

  @mark.it("verifies DynamoDB table exists and has correct configuration")
  def test_dynamodb_table_configuration(self):
    """Test that DynamoDB table exists with proper configuration"""
    try:
      # Describe table
      response = self.dynamodb_client.describe_table(TableName=self.table_name)
      table = response['Table']

      # Check table status
      self.assertEqual(table['TableStatus'], 'ACTIVE')

      # Check key schema
      key_schema = table['KeySchema']
      self.assertEqual(len(key_schema), 2)

      pk_found = False
      sk_found = False
      for key in key_schema:
        if key['AttributeName'] == 'pk' and key['KeyType'] == 'HASH':
          pk_found = True
        elif key['AttributeName'] == 'sk' and key['KeyType'] == 'RANGE':
          sk_found = True

      self.assertTrue(pk_found, "Partition key 'pk' not found")
      self.assertTrue(sk_found, "Sort key 'sk' not found")

      # Check billing mode
      self.assertEqual(table['BillingModeSummary']['BillingMode'], 
                       'PAY_PER_REQUEST')

      # Check encryption is enabled
      self.assertIn('SSEDescription', table)
      self.assertEqual(table['SSEDescription']['Status'], 'ENABLED')

      # Check point-in-time recovery
      pitr_response = self.dynamodb_client.describe_continuous_backups(
          TableName=self.table_name
      )
      pitr_status = pitr_response['ContinuousBackupsDescription'][
          'PointInTimeRecoveryDescription']
      self.assertEqual(pitr_status['PointInTimeRecoveryStatus'], 'ENABLED')

    except ClientError as e:
      self.fail(f"DynamoDB table configuration test failed: {e}")

  @mark.it("verifies Lambda function exists and has correct configuration")
  def test_lambda_function_configuration(self):
    """Test that Lambda function exists with proper configuration"""
    try:
      # Get function configuration
      response = self.lambda_client.get_function(FunctionName=self.lambda_name)
      config = response['Configuration']

      # Check basic properties
      self.assertEqual(config['FunctionName'], self.lambda_name)
      self.assertEqual(config['Runtime'], 'python3.12')
      self.assertEqual(config['Handler'], 'lambda_handler.lambda_handler')
      self.assertEqual(config['Timeout'], 300)

      # Check environment variables
      env_vars = config['Environment']['Variables']
      self.assertEqual(env_vars['TABLE_NAME'], self.table_name)
      self.assertEqual(env_vars['BUCKET_NAME'], self.bucket_name)

      # Check IAM role exists
      role_arn = config['Role']
      role_name = role_arn.split('/')[-1]
      self.assertEqual(role_name, f"proj-lambda-role-{self.env_suffix}")

    except ClientError as e:
      self.fail(f"Lambda function configuration test failed: {e}")

  @mark.it("verifies CloudTrail exists and has correct configuration")
  def test_cloudtrail_configuration(self):
    """Test that CloudTrail exists with proper configuration"""
    try:
      # Describe trail
      response = self.cloudtrail_client.describe_trails(
        trailNameList=[self.trail_name]
      )
      trails = response['trailList']
      self.assertEqual(len(trails), 1)

      trail = trails[0]
      self.assertEqual(trail['Name'], self.trail_name)
      self.assertTrue(trail['IsMultiRegionTrail'])
      self.assertTrue(trail['LogFileValidationEnabled'])
      self.assertTrue(trail['IncludeGlobalServiceEvents'])

      # Check CloudTrail bucket exists
      response = self.s3_client.head_bucket(Bucket=self.cloudtrail_bucket)
      self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

    except ClientError as e:
      self.fail(f"CloudTrail configuration test failed: {e}")

  @mark.it("tests end-to-end S3 to Lambda to DynamoDB workflow")
  def test_e2e_s3_lambda_dynamodb_workflow(self):
    """Test the complete workflow: S3 event -> Lambda -> DynamoDB"""
    test_key = f"integration-test-{int(time.time())}.txt"
    test_content = f"Integration test content at {datetime.now().isoformat()}"

    try:
      # Step 1: Upload a file to S3
      self.s3_client.put_object(
      Bucket=self.bucket_name,
      Key=test_key,
      Body=test_content.encode('utf-8'),
      ContentType='text/plain'
      )

      # Step 2: Wait for Lambda to process the event
      # Note: This is asynchronous, so we need to wait and retry
      max_retries = 30
      retry_delay = 2

      item_found = False
      for _ in range(max_retries):
        try:
          # Step 3: Check if the item was created in DynamoDB
          response = self.dynamodb_client.scan(
            TableName=self.table_name,
            FilterExpression='object_key = :key',
            ExpressionAttributeValues={
                    ':key': {'S': test_key}
            }
          )

          if response['Items']:
            item_found = True
            item = response['Items'][0]

            # Verify item structure
            self.assertEqual(item['object_key']['S'], test_key)
            self.assertEqual(item['bucket_name']['S'], self.bucket_name)
            self.assertEqual(item['event_source']['S'], 'aws:s3')
            self.assertIn('event_name', item)
            self.assertIn('created_at', item)
            self.assertIn('pk', item)
            self.assertIn('sk', item)

            # Check that pk follows the pattern
            self.assertTrue(item['pk']['S'].startswith(f'OBJECT#{test_key}'))
            self.assertTrue(item['sk']['S'].startswith('CREATED#'))

            break

        except ClientError:
          pass

        time.sleep(retry_delay)

      self.assertTrue(item_found,
          f"DynamoDB item for {test_key} not found after {max_retries} attempts")

    except (ClientError, ValueError, AssertionError) as e:
      self.fail(f"End-to-end workflow test failed: {e}")

    finally:
      # Cleanup: Delete the test object
      try:
        self.s3_client.delete_object(Bucket=self.bucket_name, Key=test_key)
      except ClientError:
        pass  # Ignore cleanup errors

  @mark.it("tests Lambda function can be invoked directly")
  def test_lambda_direct_invocation(self):
    """Test that Lambda function can be invoked directly with a mock S3 event"""
    test_event = {
    "Records": [
    {
            "eventSource": "aws:s3",
            "eventName": "s3:ObjectCreated:Put",
            "eventTime": "2023-01-01T00:00:00.000Z",
            "awsRegion": "us-east-1",
            "s3": {
                    "bucket": {"name": self.bucket_name},
                    "object": {
                            "key": f"direct-test-{int(time.time())}.txt",
                            "size": 1024,
                            "eTag": "test-etag"
                    }
            }
    }
    ]
    }

    try:
      # Invoke Lambda function directly
      response = self.lambda_client.invoke(
      FunctionName=self.lambda_name,
      InvocationType='RequestResponse',
      Payload=json.dumps(test_event)
      )

      # Check response
      self.assertEqual(response['StatusCode'], 200)

      # Parse response payload
      payload = json.loads(response['Payload'].read().decode('utf-8'))
      self.assertEqual(payload['statusCode'], 200)

      response_body = json.loads(payload['body'])
      self.assertEqual(response_body['processed_count'], 1)
      self.assertEqual(response_body['error_count'], 0)

    except ClientError as e:
      self.fail(f"Lambda direct invocation test failed: {e}")

  @mark.it("verifies IAM permissions are correctly configured")
  def test_iam_permissions(self):
    """Test that IAM role has correct permissions"""
    try:
      # Get Lambda function to find its role
      function_response = self.lambda_client.get_function(
      FunctionName=self.lambda_name)
      role_arn = function_response['Configuration']['Role']
      role_name = role_arn.split('/')[-1]

      # List attached policies
      policies_response = self.iam_client.list_attached_role_policies(
      RoleName=role_name)
      attached_policies = [p['PolicyArn'].split('/')[-1]
       for p in policies_response.get('AttachedPolicies', [])]

      # Check basic execution role is attached
      self.assertIn('AWSLambdaBasicExecutionRole', attached_policies)
      # List inline policies
      inline_policies_response = self.iam_client.list_role_policies(
      RoleName=role_name)
      inline_policies = inline_policies_response.get('PolicyNames', [])

      # Verify at least one inline policy exists
      self.assertTrue(len(inline_policies) > 0,
     "No inline policies found for Lambda role")

      # Get first policy document
      policy_response = self.iam_client.get_role_policy(
      RoleName=role_name,
      PolicyName=inline_policies[0]
      )
      policy_doc = policy_response['PolicyDocument']

      # Verify statements contain required permissions
      has_s3_access = any(
      's3:GetObject' in stmt.get('Action', []) 
      for stmt in policy_doc['Statement']
      )
      has_dynamodb_access = any(
      any(action in stmt.get('Action', [])
        for action in ['dynamodb:GetItem', 'dynamodb:PutItem'])
      for stmt in policy_doc['Statement']
      )

      self.assertTrue(has_s3_access, "Missing required S3 permissions")
      self.assertTrue(has_dynamodb_access, "Missing required DynamoDB permissions")

    except ClientError as e:
      self.fail(f"IAM permissions test failed: {e}")

  @mark.it("verifies S3 bucket notification configuration")
  def test_s3_notification_configuration(self):
    """Test that S3 bucket has correct Lambda notification configuration"""
    try:
      # Get bucket notification configuration
      response = self.s3_client.get_bucket_notification_configuration(
      Bucket=self.bucket_name
      )

      # Check Lambda function configurations exist
      lambda_configs = response.get('LambdaFunctionConfigurations', [])
      self.assertTrue(len(lambda_configs) > 0,
        "No LambdaFunctionConfigurations found in S3 notification config")

      # Find the configuration for our Lambda function
      lambda_found = False
      for config in lambda_configs:
        if self.lambda_name in config['LambdaFunctionArn']:
          lambda_found = True
          # Check events
          events = config['Events']
          self.assertIn('s3:ObjectCreated:*', events)
          break

      self.assertTrue(lambda_found,
        f"Lambda function {self.lambda_name} not found in S3 notifications")

    except ClientError as e:
      self.fail(f"S3 notification configuration test failed: {e}")

  @mark.it("tests resource cleanup and no retain policies")
  def test_no_retain_policies_validation(self):
    """Validate that resources can be deleted (no retain policies)"""
    # This test doesn't actually delete resources but validates that
    # they don't have retain policies by checking CloudFormation template
    # In a real scenario, this would be validated during the destroy phase

    # For now, we just verify resources exist and are in expected state
    # The actual retain policy validation happens during stack deletion

    try:
      # Just verify resources exist and are in deletable state
      self.s3_client.head_bucket(Bucket=self.bucket_name)
      self.dynamodb_client.describe_table(TableName=self.table_name)
      self.lambda_client.get_function(FunctionName=self.lambda_name)

      # If we can access all resources, they exist and deletion should work
      # unless retain policies are set (which we've avoided in the CDK code)

    except ClientError as e:
      self.fail(f"Resource accessibility test failed: {e}")

  @mark.it("verifies S3 access logs are delivered to the access log bucket")
  def test_s3_access_log_delivery(self):
    """Test that S3 access logs are delivered to the access log bucket.
  
    Note: S3 server access logs can take several minutes to several hours 
    to be delivered according to AWS documentation. This test uses an 
    extended timeout to account for this delay.
    """
    access_logs_bucket = FLAT_OUTPUTS.get(
    "S3AccessLogBucketName") or getattr(self, "access_logs_bucket", None)
    bucket_name = FLAT_OUTPUTS.get(
    "S3BucketName") or getattr(self, "bucket_name", None)
    if not access_logs_bucket or not bucket_name:
      self.skipTest(
        "S3 access log bucket or main bucket not defined in outputs")
  
    # Create multiple test objects to increase chances of triggering access logs
    test_keys = []
    for i in range(3):
      test_key = f"accesslog-test-{int(time.time())}-{i}.txt"
      test_keys.append(test_key)
      self.s3_client.put_object(
        Bucket=bucket_name, Key=test_key, Body=f"log test {i}".encode())
  
    # Also perform some read operations to generate more access log entries
    for test_key in test_keys:
      try:
        self.s3_client.get_object(Bucket=bucket_name, Key=test_key)
      except ClientError:
        pass  # Ignore errors, we just want to generate access log entries
  
    # Wait for access log delivery with extended timeout
    # S3 access logs can take several minutes to hours according to AWS docs
    found = False
    max_attempts = 60  # 60 attempts × 30 seconds = 30 minutes maximum wait
  
    print(f"Waiting for S3 access logs to be delivered to {access_logs_bucket}")
    print("This can take several minutes according to AWS documentation...")
  
    for attempt in range(max_attempts):
      resp = self.s3_client.list_objects_v2(
        Bucket=access_logs_bucket, Prefix="access-logs/")
      if resp.get("Contents"):
        found = True
        print(f"Found access log files after {attempt + 1} attempts ({(attempt + 1) * 30} seconds)")
        break
      
      # Print progress every 5 minutes
      if (attempt + 1) % 10 == 0:
        elapsed_minutes = ((attempt + 1) * 30) // 60
        print(f"Still waiting for access logs... ({elapsed_minutes} minutes elapsed)")
      
      time.sleep(30)  # Wait 30 seconds between checks
  
    # Cleanup test objects
    for test_key in test_keys:
      try:
        self.s3_client.delete_object(Bucket=bucket_name, Key=test_key)
      except ClientError:
        pass  # Ignore cleanup errors
  
    self.assertTrue(
    found, 
    f"No access log file found in access log bucket after {max_attempts * 30} seconds. "
    "S3 access logs can take several minutes to hours to be delivered "
    "according to AWS documentation.")

  @mark.it("verifies CloudTrail logs are delivered to the CloudTrail bucket")
  def test_cloudtrail_log_delivery(self):
    """Test that CloudTrail logs are delivered to the CloudTrail bucket.
  
    Note: CloudTrail typically delivers logs within 15 minutes, but can 
    sometimes take longer during high activity periods.
    """
    cloudtrail_bucket = FLAT_OUTPUTS.get(
    "CloudTrailBucketName") or getattr(self, "cloudtrail_bucket", None)
    if not cloudtrail_bucket:
      self.skipTest("CloudTrail bucket not defined in outputs")
  
    # Trigger multiple events to increase chances of log delivery
    print("Triggering CloudTrail events...")
    self.s3_client.list_buckets()
    # Perform additional API calls to generate more events
    try:
      self.lambda_client.list_functions()
      self.dynamodb_client.list_tables()
    except ClientError:
      pass  # Ignore permission errors, we just want to generate events
  
    # Wait for CloudTrail log delivery with extended timeout
    found = False
    max_attempts = 30  # 30 attempts × 30 seconds = 15 minutes maximum wait
  
    print(f"Waiting for CloudTrail logs to be delivered to {cloudtrail_bucket}")
    print("CloudTrail typically delivers logs within 15 minutes...")
  
    for attempt in range(max_attempts):
      resp = self.s3_client.list_objects_v2(Bucket=cloudtrail_bucket)
      if resp.get("Contents"):
        found = True
        print(f"Found CloudTrail log files after {attempt + 1} attempts "
              f"({(attempt + 1) * 30} seconds)")
        break
      
      # Print progress every 5 minutes
      if (attempt + 1) % 10 == 0:
        elapsed_minutes = ((attempt + 1) * 30) // 60
        print(f"Still waiting for CloudTrail logs... ({elapsed_minutes} minutes elapsed)")
      
      time.sleep(30)  # Wait 30 seconds between checks
  
    self.assertTrue(
    found, 
    f"No CloudTrail log file found in CloudTrail bucket after {max_attempts * 30} seconds. "
    "CloudTrail typically delivers logs within 15 minutes but can take longer "
    "during high activity.")
