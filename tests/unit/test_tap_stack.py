import unittest
import time
import uuid
import boto3
from botocore.exceptions import ClientError, NoCredentialsError


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
