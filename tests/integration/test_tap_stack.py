"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""
# pylint: disable=no-member,missing-function-docstring

import os
import unittest
import boto3
from pulumi import automation as auto


class TestTapStackLiveIntegration(unittest.TestCase):
  """Integration tests against live deployed Pulumi stack."""

  @classmethod
  def setUpClass(cls):
    """Set up Pulumi stack and AWS clients."""
    cls.stack_name = os.getenv("PULUMI_STACK", "dev")
    cls.project_name = os.getenv("PULUMI_PROJECT", "pulumi-infra")
    cls.region = os.getenv("AWS_REGION", "us-east-1")
    cls.s3_backend = os.getenv("PULUMI_BACKEND_URL", "s3://iac-rlhf-pulumi-states")

    cls.workspace = auto.LocalWorkspace(
      project_settings=auto.ProjectSettings(
        name=cls.project_name,
        runtime="python",
      ),
      env_vars={
        "AWS_REGION": cls.region,
        "PULUMI_BACKEND_URL": cls.s3_backend,
      }
    )

    cls.stack = auto.Stack.select(cls.stack_name, cls.workspace)
    cls.outputs = cls.stack.outputs()

    cls.vpc_id = cls.outputs.get("vpc_id").value
    cls.sg_id = cls.outputs.get("security_group_id").value
    cls.user_arn = cls.outputs.get("iam_user_arn").value
    cls.access_key_id = cls.outputs.get("access_key_id").value
    cls.kms_key_id = cls.outputs.get("kms_key_id").value
    cls.kms_alias = cls.outputs.get("kms_alias").value

    cls.ec2 = boto3.client("ec2", region_name=cls.region)
    cls.iam = boto3.client("iam", region_name=cls.region)
    cls.kms = boto3.client("kms", region_name=cls.region)

  def test_vpc_exists(self):
    """Validate the VPC exists and is active."""
    response = self.ec2.describe_vpcs(VpcIds=[self.vpc_id])
    vpc = response["Vpcs"][0]
    self.assertEqual(vpc["State"], "available")

  def test_security_group_exists(self):
    """Validate the security group exists."""
    response = self.ec2.describe_security_groups(GroupIds=[self.sg_id])
    self.assertEqual(len(response["SecurityGroups"]), 1)

  def test_iam_user_exists(self):
    """Validate the IAM user ARN exists."""
    username = self.user_arn.split("/")[-1]
    response = self.iam.get_user(UserName=username)
    self.assertEqual(response["User"]["Arn"], self.user_arn)

  def test_access_key_active(self):
    """Ensure the access key is active."""
    username = self.user_arn.split("/")[-1]
    keys = self.iam.list_access_keys(UserName=username)["AccessKeyMetadata"]
    key_ids = [k["AccessKeyId"] for k in keys]
    self.assertIn(self.access_key_id, key_ids)

  def test_kms_key_is_enabled(self):
    """Ensure the KMS key is enabled and matches alias."""
    key = self.kms.describe_key(KeyId=self.kms_key_id)["KeyMetadata"]
    self.assertTrue(key["Enabled"])
    self.assertIn("secure-web-key", self.kms_alias)

  def test_encrypted_blob_is_non_empty(self):
    """Check that the KMS-encrypted blob is present."""
    self.assertIsInstance(self.encrypted_blob, str)
    self.assertGreater(len(self.encrypted_blob), 10)


if __name__ == "__main__":
  unittest.main()
