# pylint: disable=no-member,missing-function-docstring

import os
import unittest
import base64
import boto3
from pulumi import automation as auto
from lib import tap_stack


class TestTapStackLiveIntegration(unittest.TestCase):
  """Integration tests against live deployed Pulumi stack."""

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

    try:
      cls.stack = auto.select_stack(
        stack_name=cls.stack_name,
        project_name=cls.project_name,
        program=pulumi_program
      )
    except auto.StackNotFoundError:
      cls.stack = auto.create_stack(
        stack_name=cls.stack_name,
        project_name=cls.project_name,
        program=pulumi_program
      )
      cls.stack.set_config("aws:region", auto.ConfigValue(value=cls.region))
      cls.stack.set_config("TapStack:db_password",
                           auto.ConfigValue(value="dummy-password", secret=True))

    cls.stack.workspace.env_vars["AWS_REGION"] = cls.region
    cls.stack.workspace.env_vars["PULUMI_BACKEND_URL"] = cls.s3_backend

    cls.stack.refresh(on_output=print)
    cls.stack.up(on_output=print)

    outputs = cls.stack.outputs()
    cls.outputs = outputs
    cls.vpc_id = outputs.get("vpc_id", auto.Output.from_input(None)).value
    cls.sg_id = outputs.get("security_group_id", auto.Output.from_input(None)).value
    cls.user_arn = outputs.get("iam_user_arn", auto.Output.from_input(None)).value
    cls.access_key_id = outputs.get("access_key_id", auto.Output.from_input(None)).value
    cls.kms_key_id = outputs.get("kms_key_id", auto.Output.from_input(None)).value
    cls.kms_alias = outputs.get("kms_alias", auto.Output.from_input("")).value
    cls.encrypted_blob = outputs.get("encrypted_db_password_blob", auto.Output.from_input("")).value

    cls.ec2 = boto3.client("ec2", region_name=cls.region)
    cls.iam = boto3.client("iam", region_name=cls.region)
    cls.kms = boto3.client("kms", region_name=cls.region)

  def test_vpc_exists(self):
    if not self.vpc_id:
      self.skipTest("vpc_id not found in stack outputs")
    vpcs = self.ec2.describe_vpcs(VpcIds=[self.vpc_id])["Vpcs"]
    self.assertEqual(vpcs[0]["State"], "available")

  def test_security_group_exists(self):
    if not self.sg_id:
      self.skipTest("security_group_id not found in stack outputs")
    groups = self.ec2.describe_security_groups(GroupIds=[self.sg_id])["SecurityGroups"]
    self.assertEqual(len(groups), 1)

  def test_iam_user_exists(self):
    if not self.user_arn:
      self.skipTest("iam_user_arn not found in stack outputs")
    username = self.user_arn.split("/")[-1]
    response = self.iam.get_user(UserName=username)
    self.assertEqual(response["User"]["Arn"], self.user_arn)

  def test_access_key_exists(self):
    if not self.user_arn or not self.access_key_id:
      self.skipTest("Missing IAM user or access key in outputs")
    username = self.user_arn.split("/")[-1]
    keys = self.iam.list_access_keys(UserName=username)["AccessKeyMetadata"]
    key_ids = [k["AccessKeyId"] for k in keys]
    self.assertIn(self.access_key_id, key_ids)

  def test_kms_key_is_enabled(self):
    if not self.kms_key_id:
      self.skipTest("kms_key_id not found in stack outputs")
    key = self.kms.describe_key(KeyId=self.kms_key_id)["KeyMetadata"]
    self.assertTrue(key["Enabled"])
    self.assertIn("secure-web-key", self.kms_alias)

  def test_encrypted_blob_is_non_empty(self):
    if not self.encrypted_blob:
      self.skipTest("encrypted_db_password_blob not found in stack outputs")
    self.assertIsInstance(self.encrypted_blob, str)
    self.assertGreater(len(self.encrypted_blob), 10)
    try:
      base64.b64decode(self.encrypted_blob)
    except Exception as e:
      self.fail(f"Encrypted blob is not valid base64: {str(e)}")


if __name__ == "__main__":
  unittest.main()
