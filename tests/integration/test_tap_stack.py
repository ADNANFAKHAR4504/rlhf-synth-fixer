import unittest
import os
import time
import boto3
from pulumi import automation as auto
from botocore.exceptions import ClientError, NoCredentialsError


class TestTapStackLiveIntegration(unittest.TestCase):

  @classmethod
  def setUpClass(cls):
    cls.stack_name = "dev"
    cls.project_name = "tap-infra"
    cls.aws_region = "us-east-1"
    cls.backend_url = os.getenv("PULUMI_BACKEND_URL", "s3://iac-rlhf-pulumi-states")
    cls.pulumi_program_path = os.getcwd()

    cls.s3_client = boto3.client("s3", region_name=cls.aws_region)
    cls.iam_client = boto3.client("iam", region_name=cls.aws_region)
    cls.logs_client = boto3.client("logs", region_name=cls.aws_region)

    try:
      cls.stack = auto.create_or_select_stack(
        stack_name=cls.stack_name,
        project_name=cls.project_name,
        program=lambda: None,
        opts=auto.LocalWorkspaceOptions(
            work_dir=cls.pulumi_program_path,
            env_vars={
            "AWS_REGION": cls.aws_region,
            "PULUMI_BACKEND_URL": cls.backend_url,
            }
        )
      )

      cls.stack.refresh(on_output=print)
      cls.outputs = cls.stack.outputs()
    except NoCredentialsError as e:
      raise RuntimeError("AWS credentials not found. Make sure they're configured.") from e
    except ClientError as e:
      raise RuntimeError(f"Failed to initialize Pulumi stack: {e}") from e

  def retry_api_call(self, func, *args, max_attempts=5, delay=3, **kwargs):
    """Utility to retry API calls to avoid transient failures."""
    for attempt in range(max_attempts):
      try:
        return func(*args, **kwargs)
      except ClientError:
        if attempt == max_attempts - 1:
          raise
        time.sleep(delay)
    # This line is unreachable but added to satisfy linters
    raise RuntimeError("Exceeded max retry attempts without success.")



  def test_stack_outputs_exist(self):
    required_outputs = ["artifacts_bucket_name", "service_role_arn"]
    missing = [key for key in required_outputs if key not in self.outputs]
    self.assertFalse(missing, f"Missing expected Pulumi outputs: {missing}")

  def test_artifacts_bucket_exists(self):
    bucket_name = self.outputs["artifacts_bucket_name"].value
    try:
      response = self.retry_api_call(self.s3_client.head_bucket, Bucket=bucket_name)
      self.assertEqual(response["ResponseMetadata"]["HTTPStatusCode"], 200)
    except ClientError as e:
      self.fail(f"S3 bucket '{bucket_name}' does not exist or is not accessible: {e}")

  def test_service_role_exists(self):
    role_arn = self.outputs["service_role_arn"].value
    role_name = role_arn.split("/")[-1]
    try:
      response = self.retry_api_call(self.iam_client.get_role, RoleName=role_name)
      self.assertEqual(response["Role"]["Arn"], role_arn)
    except ClientError as e:
      self.fail(f"IAM Role '{role_name}' does not exist or is not accessible: {e}")

  def test_log_group_exists_if_monitoring_enabled(self):
    if "log_group_name" in self.outputs:
      log_group_name = self.outputs["log_group_name"].value
      try:
        response = self.retry_api_call(
          self.logs_client.describe_log_groups, logGroupNamePrefix=log_group_name
        )
        groups = response.get("logGroups", [])
        found = any(g["logGroupName"] == log_group_name for g in groups)
        self.assertTrue(found, f"Log group '{log_group_name}' not found.")
      except ClientError as e:
        self.fail(f"Log group '{log_group_name}' does not exist or is not accessible: {e}")
    else:
      self.skipTest("Monitoring disabled; skipping log group check.")

  def test_stack_is_up_to_date(self):
    try:
      preview_result = self.stack.preview()
      changes = preview_result.change_summary
      self.assertTrue(
        changes.create == 0 and changes.update == 0 and changes.delete == 0,
        f"Stack has pending changes: {changes}",
      )
    except ClientError as e:
      self.fail(f"Failed to preview stack changes: {e}")

  @classmethod
  def tearDownClass(cls):
    pass


if __name__ == "__main__":
  unittest.main()
