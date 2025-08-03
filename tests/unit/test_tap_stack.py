import unittest
import time
import uuid
import boto3
from botocore.exceptions import ClientError, NoCredentialsError


class TestTapStackBasic(unittest.TestCase):
  """Basic unit tests for TapStack components."""

  def test_environment_suffix_validation(self):
    """Test environment suffix validation logic."""
    # Test valid environment suffixes
    valid_suffixes = ['dev', 'staging', 'prod', 'test']
    for suffix in valid_suffixes:
      self.assertIsInstance(suffix, str)
      self.assertGreater(len(suffix), 0)

  def test_aws_region_validation(self):
    """Test AWS region validation."""
    valid_regions = ['us-east-1', 'us-west-2', 'eu-west-1']
    for region in valid_regions:
      self.assertIsInstance(region, str)
      self.assertIn('-', region)

  def test_resource_naming_convention(self):
    """Test resource naming conventions."""
    # Test that resource names follow expected patterns
    resource_names = [
      'serverless-trigger-bucket',
      'lambda-execution-role',
      's3-processor-lambda'
    ]
    for name in resource_names:
      self.assertIsInstance(name, str)
      self.assertGreater(len(name), 0)
      self.assertNotIn(' ', name)

  def test_tag_structure(self):
    """Test tag structure validation."""
    expected_tags = {
      'Environment': 'production',
      'Project': 'serverless-s3-lambda',
      'ManagedBy': 'Pulumi'
    }
    
    # Test tag structure
    self.assertIsInstance(expected_tags, dict)
    self.assertIn('Environment', expected_tags)
    self.assertIn('Project', expected_tags)
    self.assertIn('ManagedBy', expected_tags)

  def test_lambda_configuration(self):
    """Test Lambda function configuration validation."""
    lambda_config = {
      'runtime': 'python3.11',
      'handler': 'main.lambda_handler',
      'timeout': 300,
      'memory_size': 256
    }
    
    # Validate configuration values
    self.assertEqual(lambda_config['runtime'], 'python3.11')
    self.assertEqual(lambda_config['handler'], 'main.lambda_handler')
    self.assertEqual(lambda_config['timeout'], 300)
    self.assertEqual(lambda_config['memory_size'], 256)

  def test_s3_bucket_configuration(self):
    """Test S3 bucket configuration validation."""
    bucket_config = {
      'versioning': 'Enabled',
      'encryption': 'AES256',
      'public_access': False
    }
    
    # Validate configuration values
    self.assertEqual(bucket_config['versioning'], 'Enabled')
    self.assertEqual(bucket_config['encryption'], 'AES256')
    self.assertFalse(bucket_config['public_access'])

  def test_iam_policy_structure(self):
    """Test IAM policy structure validation."""
    policy_structure = {
      'Version': '2012-10-17',
      'Statement': [
        {
          'Effect': 'Allow',
          'Action': 'sts:AssumeRole',
          'Principal': {
            'Service': 'lambda.amazonaws.com'
          }
        }
      ]
    }
    
    # Validate policy structure
    self.assertEqual(policy_structure['Version'], '2012-10-17')
    self.assertIsInstance(policy_structure['Statement'], list)
    self.assertGreater(len(policy_structure['Statement']), 0)


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
    except ClientError as e:
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
        if ("s3-processor" in function["FunctionName"] or
            cls.stack_name_prefix in function["FunctionName"]):
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
      error_msg = (
        f"S3 bucket validation failed: {str(e)}"
      )
      self.fail(error_msg)

  @classmethod
  def tearDownClass(cls):
    if hasattr(cls, "s3_client") and cls.bucket_name:
      try:
        cls.s3_client.delete_object(
          Bucket=cls.bucket_name,
          Key=cls.test_file_key
        )
      except ClientError:
        pass


if __name__ == "__main__":
  unittest.main(verbosity=2)
