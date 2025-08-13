"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""
import os
import unittest

import boto3
from pulumi import automation
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStack(unittest.TestCase):

  @classmethod
  def setUpClass(cls):
    """Deploy the Pulumi stack before running tests."""

    os.environ["PULUMI_CONFIG_PASSPHRASE"] = ""

    cls.stack_name = "TapStackTest"
    cls.project_name = "TapStack"

    def pulumi_program():
      environment_suffix = 'test'
      TapStack(
        name="pulumi-infra",
        args=TapStackArgs(environment_suffix=environment_suffix)
      )

    stack = automation.create_or_select_stack(
      stack_name=cls.stack_name,
      project_name=cls.project_name,
      program=pulumi_program,
      opts=automation.LocalWorkspaceOptions(secrets_provider="plaintext")
    )

    print("Deploying Pulumi stack...")
    stack.up()

    cls.outputs = stack.outputs()
    print(f"Outputs: {cls.outputs}")

    # Parse required outputs
    cls.bucket_name = cls.outputs["s3_bucket_name"].value
    cls.region = cls.outputs["region"].value
    cls.dynamodb_table_name = cls.outputs["dynamodb_table_name"].value
    cls.iam_role_name = cls.outputs["iam_role_name"].value

  def test_s3_bucket_exists(self):
    s3 = boto3.client("s3", region_name=self.region)
    resp = s3.head_bucket(Bucket=self.bucket_name)
    assert resp["ResponseMetadata"]["HTTPStatusCode"] == 200

  def test_dynamodb_table_exists(self):
    dynamodb = boto3.client("dynamodb", region_name=self.region)
    resp = dynamodb.describe_table(TableName=self.dynamodb_table_name)
    assert resp["Table"]["TableStatus"] in ["ACTIVE", "UPDATING"]

  def test_iam_role_exists(self):
    iam = boto3.client("iam")
    resp = iam.get_role(RoleName=self.iam_role_name)
    assert "Role" in resp
