# pylint: disable=no-member,missing-function-docstring

import os
import unittest
import boto3
import base64
from pulumi import automation as auto
from pulumi.automation import LocalWorkspace, Stack




class TestTapStackDeployedResources(unittest.TestCase):
  """Test AWS resources after Pulumi stack is deployed."""

  from pulumi.automation import LocalWorkspace, Stack

  @classmethod
  def setUpClass(cls):
    cls.stack_name = os.getenv("PULUMI_STACK", "dev")
    cls.project_name = os.getenv("PULUMI_PROJECT", "pulumi-infra")
    cls.region = os.getenv("AWS_REGION", "us-east-1")

    os.environ["AWS_REGION"] = cls.region

    # Create workspace from existing Pulumi.yaml
    ws = LocalWorkspace(work_dir=os.getcwd())

    # Select the stack from that workspace
    cls.stack = Stack.select(stack_name=cls.stack_name, workspace=ws)

    outputs = cls.stack.outputs()
    cls.vpc_id = outputs.get("vpc_id", {}).get("value")
    cls.sg_id = outputs.get("security_group_id", {}).get("value")
    cls.user_arn = outputs.get("iam_user_arn", {}).get("value")
    cls.access_key_id = outputs.get("access_key_id", {}).get("value")
    cls.kms_key_id = outputs.get("kms_key_id", {}).get("value")
    cls.kms_alias = outputs.get("kms_alias", {}).get("value")
    cls.encrypted_blob = outputs.get("encrypted_db_password_blob", {}).get("value")

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

  def test_encrypted_blob_is_base64(self):
    if not self.encrypted_blob:
      self.skipTest("encrypted_db_password_blob not found in stack outputs")
    self.assertGreater(len(self.encrypted_blob), 10)
    try:
      base64.b64decode(self.encrypted_blob)
    except Exception as e:
      self.fail(f"Invalid base64 in encrypted blob: {e}")


if __name__ == "__main__":
  unittest.main()
