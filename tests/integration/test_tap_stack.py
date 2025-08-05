# pylint: disable=no-member,missing-function-docstring

import os
import unittest
import boto3
from pulumi import automation as auto
from lib import tap_stack


class TestTapStackLiveIntegration(unittest.TestCase):
  """Basic integration tests for 6 core secure infrastructure components."""

  @classmethod
  def setUpClass(cls):
    cls.stack_name = os.getenv("PULUMI_STACK", "dev")
    cls.project_name = os.getenv("PULUMI_PROJECT", "pulumi-infra")
    cls.region = os.getenv("AWS_REGION", "us-east-1")
    cls.s3_backend = os.getenv("PULUMI_BACKEND_URL", "s3://iac-rlhf-pulumi-states")

    os.environ["AWS_REGION"] = cls.region
    os.environ["PULUMI_BACKEND_URL"] = cls.s3_backend

    def pulumi_program():
      return tap_stack.TapStack(
        "TapStack",
        tap_stack.TapStackArgs(environment_suffix=cls.stack_name)
      )

    cls.stack = auto.select_stack(
      stack_name=cls.stack_name,
      project_name=cls.project_name,
      program=pulumi_program
    )

    cls.stack.refresh(on_output=print)

    outputs = cls.stack.outputs()
    cls.vpc_id = outputs["vpc_id"].value
    cls.sg_id = outputs["security_group_id"].value
    cls.user_arn = outputs["iam_user_arn"].value
    cls.access_key_id = outputs["access_key_id"].value
    cls.kms_key_id = outputs["kms_key_id"].value
    cls.encrypted_blob = outputs["encrypted_db_password_blob"].value

    cls.ec2 = boto3.client("ec2", region_name=cls.region)
    cls.iam = boto3.client("iam", region_name=cls.region)
    cls.kms = boto3.client("kms", region_name=cls.region)

  def test_vpc_exists(self):
    vpcs = self.ec2.describe_vpcs(VpcIds=[self.vpc_id])["Vpcs"]
    self.assertEqual(vpcs[0]["State"], "available")

  def test_security_group_exists(self):
    sgs = self.ec2.describe_security_groups(GroupIds=[self.sg_id])["SecurityGroups"]
    self.assertEqual(len(sgs), 1)

  def test_iam_user_exists(self):
    username = self.user_arn.split("/")[-1]
    user = self.iam.get_user(UserName=username)["User"]
    self.assertEqual(user["Arn"], self.user_arn)

  def test_access_key_exists(self):
    username = self.user_arn.split("/")[-1]
    keys = self.iam.list_access_keys(UserName=username)["AccessKeyMetadata"]
    key_ids = [k["AccessKeyId"] for k in keys]
    self.assertIn(self.access_key_id, key_ids)

  def test_kms_key_is_enabled(self):
    key = self.kms.describe_key(KeyId=self.kms_key_id)["KeyMetadata"]
    self.assertTrue(key["Enabled"])

  def test_encrypted_blob_is_non_empty(self):
    self.assertIsInstance(self.encrypted_blob, str)
    self.assertGreater(len(self.encrypted_blob), 10)


if __name__ == "__main__":
  unittest.main()
