import unittest
import time
import uuid
import boto3
import json
import sys
import os
from botocore.exceptions import ClientError, NoCredentialsError

# Add the lib directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib'))

# Import the actual modules for coverage
try:
  import tap_stack
  from tap_stack import TapStack, TapStackArgs
  TAP_STACK_AVAILABLE = True
except ImportError:
  TAP_STACK_AVAILABLE = False

try:
  import lambda_code.main
  LAMBDA_MAIN_AVAILABLE = True
except ImportError:
  LAMBDA_MAIN_AVAILABLE = False


class TestTapStackLiveIntegration(unittest.TestCase):
  """Integration tests against live deployed Pulumi stack."""

  @classmethod
  def setUpClass(cls):
    cls.stack_name_prefix = "serverless-s3-lambda"
    cls.region = "us-east-1"
    cls.test_file_content = f"Test file created at {time.time()}"
    cls.test_file_key = f"test-integration-{uuid.uuid4().hex}.txt"

    try:
      cls.s3_client = boto3.client("s3", region_name=cls.region)
      cls.lambda_client = boto3.client("lambda", region_name=cls.region)
      cls.iam_client = boto3.client("iam", region_name=cls.region)
      cls.logs_client = boto3.client("logs", region_name=cls.region)
    except NoCredentialsError:
      cls.skipTest(cls, "AWS credentials not available - skipping integration tests")
    except (ClientError) as e:
      cls.skipTest(cls, f"Failed to initialize AWS clients: {str(e)}")

    cls._discover_deployed_resources()

  @classmethod
  def _discover_deployed_resources(cls):
    cls.bucket_name = None
    cls.lambda_function_name = None
    cls.lambda_role_name = None

    try:
      response = cls.s3_client.list_buckets()
      for bucket in response["Buckets"]:
        if cls.stack_name_prefix in bucket["Name"]:
          cls.bucket_name = bucket["Name"]
          break

      response = cls.lambda_client.list_functions()
      for function in response["Functions"]:
        if "s3-processor" in function["FunctionName"] or cls.stack_name_prefix in function["FunctionName"]:
          cls.lambda_function_name = function["FunctionName"]
          cls.lambda_function_arn = function["FunctionArn"]
          cls.lambda_role_arn = function["Role"]
          cls.lambda_role_name = cls.lambda_role_arn.split("/")[-1]
          break
    except ClientError as e:
      cls.skipTest(cls, f"Failed to discover deployed resources: {str(e)}")

  def test_aws_credentials_available(self):
    try:
      sts_client = boto3.client("sts", region_name=self.region)
      response = sts_client.get_caller_identity()
      self.assertIn("Account", response)
      self.assertIn("UserId", response)
    except NoCredentialsError:
      self.fail("AWS credentials not configured")
    except ClientError as e:
      self.fail(f"Failed to verify AWS credentials: {str(e)}")

  def test_s3_bucket_exists(self):
    self.assertIsNotNone(self.bucket_name, "S3 bucket not found")
    try:
      response = self.s3_client.head_bucket(Bucket=self.bucket_name)
      status_code = response["ResponseMetadata"]["HTTPStatusCode"]
      self.assertEqual(status_code, 200)
    except ClientError as e:
      error_msg = f"S3 bucket validation failed: {str(e)}"
      self.fail(error_msg)

  @classmethod
  def tearDownClass(cls):
    if hasattr(cls, "s3_client") and cls.bucket_name:
      try:
        cls.s3_client.delete_object(Bucket=cls.bucket_name, Key=cls.test_file_key)
      except ClientError:
        pass


class TestTapStackIntegrationComprehensive(unittest.TestCase):
  """Comprehensive integration tests for TapStack and Lambda function."""

  @classmethod
  def setUpClass(cls):
    """Set up integration test environment."""
    cls.stack_name_prefix = "serverless-s3-lambda"
    cls.region = "us-east-1"
    cls.test_file_content = f"Test file created at {time.time()}"
    cls.test_file_key = f"test-integration-{uuid.uuid4().hex}.txt"

    try:
      cls.s3_client = boto3.client("s3", region_name=cls.region)
      cls.lambda_client = boto3.client("lambda", region_name=cls.region)
      cls.iam_client = boto3.client("iam", region_name=cls.region)
      cls.logs_client = boto3.client("logs", region_name=cls.region)
    except NoCredentialsError:
      cls.skipTest(cls, "AWS credentials not available - skipping integration tests")
    except ClientError as e:
      cls.skipTest(cls, f"Failed to initialize AWS clients: {str(e)}")

    cls._discover_deployed_resources()

  @classmethod
  def _discover_deployed_resources(cls):
    """Discover deployed AWS resources for testing."""
    cls.bucket_name = None
    cls.lambda_function_name = None
    cls.lambda_role_name = None

    try:
      response = cls.s3_client.list_buckets()
      for bucket in response["Buckets"]:
        if cls.stack_name_prefix in bucket["Name"]:
          cls.bucket_name = bucket["Name"]
          break

      response = cls.lambda_client.list_functions()
      for function in response["Functions"]:
        if ("s3-processor" in function["FunctionName"] or
            cls.stack_name_prefix in function["FunctionName"]):
          cls.lambda_function_name = function["FunctionName"]
          cls.lambda_function_arn = function["FunctionArn"]
          cls.lambda_role_arn = function["Role"]
          cls.lambda_role_name = cls.lambda_role_arn.split("/")[-1]
          break
    except ClientError as e:
      cls.skipTest(cls, f"Failed to discover deployed resources: {str(e)}")

  def test_lambda_function_configuration(self):
    """Test Lambda function configuration and properties."""
    if not self.lambda_function_name:
      self.skipTest("Lambda function not found")

    try:
      response = self.lambda_client.get_function(FunctionName=self.lambda_function_name)
      function_config = response["Configuration"]
      
      # Test runtime
      self.assertEqual(function_config["Runtime"], "python3.11")
      
      # Test handler
      self.assertEqual(function_config["Handler"], "main.lambda_handler")
      
      # Test timeout
      self.assertEqual(function_config["Timeout"], 300)
      
      # Test memory size
      self.assertEqual(function_config["MemorySize"], 256)
      
      # Test environment variables
      if "Environment" in function_config:
        env_vars = function_config["Environment"]["Variables"]
        self.assertEqual(env_vars["LOG_LEVEL"], "INFO")
        self.assertEqual(env_vars["ENVIRONMENT"], "production")
      
    except ClientError as e:
      self.fail(f"Failed to get Lambda function configuration: {str(e)}")

  def test_lambda_function_tags(self):
    """Test Lambda function tags."""
    if not self.lambda_function_name:
      self.skipTest("Lambda function not found")

    try:
      response = self.lambda_client.list_tags(Resource=self.lambda_function_arn)
      tags = response["Tags"]
      
      # Test required tags
      self.assertIn("Environment", tags)
      self.assertIn("Project", tags)
      self.assertIn("ManagedBy", tags)
      
      # Test tag values
      self.assertEqual(tags["Environment"], "production")
      self.assertEqual(tags["Project"], "serverless-s3-lambda")
      self.assertEqual(tags["ManagedBy"], "Pulumi")
      
    except ClientError as e:
      self.fail(f"Failed to get Lambda function tags: {str(e)}")

  def test_s3_bucket_configuration(self):
    """Test S3 bucket configuration and properties."""
    if not self.bucket_name:
      self.skipTest("S3 bucket not found")

    try:
      # Test bucket versioning
      versioning_response = self.s3_client.get_bucket_versioning(Bucket=self.bucket_name)
      self.assertEqual(versioning_response["Status"], "Enabled")
      
      # Test bucket encryption
      encryption_response = self.s3_client.get_bucket_encryption(Bucket=self.bucket_name)
      rules = encryption_response["ServerSideEncryptionConfiguration"]["Rules"]
      self.assertGreater(len(rules), 0)
      
      # Test bucket public access block
      public_access_response = self.s3_client.get_public_access_block(Bucket=self.bucket_name)
      config = public_access_response["PublicAccessBlockConfiguration"]
      self.assertTrue(config["BlockPublicAcls"])
      self.assertTrue(config["BlockPublicPolicy"])
      self.assertTrue(config["IgnorePublicAcls"])
      self.assertTrue(config["RestrictPublicBuckets"])
      
    except ClientError as e:
      self.fail(f"Failed to get S3 bucket configuration: {str(e)}")

  def test_s3_bucket_tags(self):
    """Test S3 bucket tags."""
    if not self.bucket_name:
      self.skipTest("S3 bucket not found")

    try:
      response = self.s3_client.get_bucket_tagging(Bucket=self.bucket_name)
      tags = response["TagSet"]
      
      # Convert tags list to dict for easier testing
      tags_dict = {tag["Key"]: tag["Value"] for tag in tags}
      
      # Test required tags
      self.assertIn("Environment", tags_dict)
      self.assertIn("Project", tags_dict)
      self.assertIn("Purpose", tags_dict)
      self.assertIn("ManagedBy", tags_dict)
      
      # Test tag values
      self.assertEqual(tags_dict["Environment"], "production")
      self.assertEqual(tags_dict["Project"], "serverless-s3-lambda")
      self.assertEqual(tags_dict["Purpose"], "Lambda trigger source")
      self.assertEqual(tags_dict["ManagedBy"], "Pulumi")
      
    except ClientError as e:
      self.fail(f"Failed to get S3 bucket tags: {str(e)}")

  def test_iam_role_configuration(self):
    """Test IAM role configuration and policies."""
    if not self.lambda_role_name:
      self.skipTest("IAM role not found")

    try:
      # Test role details
      response = self.iam_client.get_role(RoleName=self.lambda_role_name)
      role = response["Role"]
      
      # Test role description
      self.assertIn("S3-triggered Lambda function", role["Description"])
      
      # Test assume role policy
      assume_role_policy = json.loads(role["AssumeRolePolicyDocument"])
      self.assertEqual(assume_role_policy["Version"], "2012-10-17")
      self.assertEqual(len(assume_role_policy["Statement"]), 1)
      
      statement = assume_role_policy["Statement"][0]
      self.assertEqual(statement["Effect"], "Allow")
      self.assertEqual(statement["Action"], "sts:AssumeRole")
      self.assertEqual(statement["Principal"]["Service"], "lambda.amazonaws.com")
      
      # Test role tags
      response = self.iam_client.list_role_tags(RoleName=self.lambda_role_name)
      tags = response["Tags"]
      
      # Convert tags list to dict for easier testing
      tags_dict = {tag["Key"]: tag["Value"] for tag in tags}
      
      # Test required tags
      self.assertIn("Environment", tags_dict)
      self.assertIn("Project", tags_dict)
      self.assertIn("ManagedBy", tags_dict)
      
      # Test tag values
      self.assertEqual(tags_dict["Environment"], "production")
      self.assertEqual(tags_dict["Project"], "serverless-s3-lambda")
      self.assertEqual(tags_dict["ManagedBy"], "Pulumi")
      
    except ClientError as e:
      self.fail(f"Failed to get IAM role configuration: {str(e)}")

  def test_iam_policy_configuration(self):
    """Test IAM policy configuration."""
    if not self.lambda_role_name:
      self.skipTest("IAM role not found")

    try:
      # Get attached policies
      response = self.iam_client.list_attached_role_policies(RoleName=self.lambda_role_name)
      policies = response["AttachedPolicies"]
      
      # Find the Lambda S3 policy
      lambda_policy = None
      for policy in policies:
        if "lambda-s3-policy" in policy["PolicyName"]:
          lambda_policy = policy
          break
      
      self.assertIsNotNone(lambda_policy, "Lambda S3 policy not found")
      
      # Test policy details
      policy_response = self.iam_client.get_policy(PolicyArn=lambda_policy["PolicyArn"])
      policy = policy_response["Policy"]
      
      # Test policy description
      self.assertIn("Policy for Lambda function to access S3 and CloudWatch Logs", policy["Description"])
      
      # Test policy tags
      response = self.iam_client.list_policy_tags(PolicyArn=lambda_policy["PolicyArn"])
      tags = response["Tags"]
      
      # Convert tags list to dict for easier testing
      tags_dict = {tag["Key"]: tag["Value"] for tag in tags}
      
      # Test required tags
      self.assertIn("Environment", tags_dict)
      self.assertIn("Project", tags_dict)
      self.assertIn("ManagedBy", tags_dict)
      
      # Test tag values
      self.assertEqual(tags_dict["Environment"], "production")
      self.assertEqual(tags_dict["Project"], "serverless-s3-lambda")
      self.assertEqual(tags_dict["ManagedBy"], "Pulumi")
      
    except ClientError as e:
      self.fail(f"Failed to get IAM policy configuration: {str(e)}")

  def test_s3_lambda_integration(self):
    """Test S3 to Lambda integration functionality."""
    if not self.bucket_name or not self.lambda_function_name:
      self.skipTest("S3 bucket or Lambda function not found")

    try:
      # Upload a test file to trigger the Lambda function
      self.s3_client.put_object(
        Bucket=self.bucket_name,
        Key=self.test_file_key,
        Body=self.test_file_content
      )
      
      # Wait a moment for the Lambda function to process
      time.sleep(5)
      
      # Check CloudWatch logs for Lambda execution
      log_group_name = f"/aws/lambda/{self.lambda_function_name}"
      
      # Get the most recent log stream
      response = self.logs_client.describe_log_streams(
        logGroupName=log_group_name,
        orderBy='LastEventTime',
        descending=True,
        maxItems=1
      )
      
      if response["logStreams"]:
        log_stream_name = response["logStreams"][0]["logStreamName"]
        
        # Get log events
        log_response = self.logs_client.get_log_events(
          logGroupName=log_group_name,
          logStreamName=log_stream_name,
          startFromHead=False,
          limit=10
        )
        
        # Check if there are recent log events
        self.assertGreater(len(log_response["events"]), 0, "No log events found")
        
        # Check for successful processing message
        log_messages = [event["message"] for event in log_response["events"]]
        success_found = any("Successfully processed" in msg for msg in log_messages)
        self.assertTrue(success_found, "No successful processing message found in logs")
      
    except ClientError as e:
      self.fail(f"Failed to test S3-Lambda integration: {str(e)}")

  def test_lambda_function_invoke(self):
    """Test direct Lambda function invocation."""
    if not self.lambda_function_name:
      self.skipTest("Lambda function not found")

    try:
      # Create a test S3 event
      test_event = {
        "Records": [
          {
            "eventName": "ObjectCreated:Put",
            "s3": {
              "bucket": {
                "name": self.bucket_name or "test-bucket"
              },
              "object": {
                "key": "test-file.txt",
                "size": 1024
              }
            }
          }
        ]
      }
      
      # Invoke the Lambda function
      response = self.lambda_client.invoke(
        FunctionName=self.lambda_function_name,
        InvocationType='RequestResponse',
        Payload=json.dumps(test_event)
      )
      
      # Check response status
      self.assertEqual(response["StatusCode"], 200)
      
      # Parse response payload
      payload = json.loads(response["Payload"].read())
      self.assertEqual(payload["statusCode"], 200)
      
      # Parse response body
      body = json.loads(payload["body"])
      self.assertIn("message", body)
      self.assertIn("processedRecords", body)
      self.assertEqual(body["processedRecords"], 1)
      
    except ClientError as e:
      self.fail(f"Failed to invoke Lambda function: {str(e)}")

  def test_error_handling_scenarios(self):
    """Test error handling scenarios."""
    if not self.lambda_function_name:
      self.skipTest("Lambda function not found")

    try:
      # Test with invalid event (None)
      response = self.lambda_client.invoke(
        FunctionName=self.lambda_function_name,
        InvocationType='RequestResponse',
        Payload=json.dumps(None)
      )
      
      # Check response status
      self.assertEqual(response["StatusCode"], 200)
      
      # Parse response payload
      payload = json.loads(response["Payload"].read())
      self.assertEqual(payload["statusCode"], 500)
      
      # Parse response body
      body = json.loads(payload["body"])
      self.assertIn("error", body)
      self.assertEqual(body["error"], "Failed to process S3 event")
      
    except ClientError as e:
      self.fail(f"Failed to test error handling: {str(e)}")

  def test_empty_event_handling(self):
    """Test handling of empty events."""
    if not self.lambda_function_name:
      self.skipTest("Lambda function not found")

    try:
      # Test with empty event
      empty_event = {"Records": []}
      
      response = self.lambda_client.invoke(
        FunctionName=self.lambda_function_name,
        InvocationType='RequestResponse',
        Payload=json.dumps(empty_event)
      )
      
      # Check response status
      self.assertEqual(response["StatusCode"], 200)
      
      # Parse response payload
      payload = json.loads(response["Payload"].read())
      self.assertEqual(payload["statusCode"], 200)
      
      # Parse response body
      body = json.loads(payload["body"])
      self.assertEqual(body["processedRecords"], 0)
      self.assertEqual(body["message"], "Successfully processed 0 S3 records")
      
    except ClientError as e:
      self.fail(f"Failed to test empty event handling: {str(e)}")

  @classmethod
  def tearDownClass(cls):
    """Clean up test resources."""
    if hasattr(cls, "s3_client") and cls.bucket_name:
      try:
        cls.s3_client.delete_object(Bucket=cls.bucket_name, Key=cls.test_file_key)
      except ClientError:
        pass


if __name__ == "__main__":
  unittest.main(verbosity=2)
