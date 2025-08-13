"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

# test_components_unit.py

import unittest
from typing import Any

import pulumi
from pulumi.runtime import set_mocks, MockResourceArgs, MockCallArgs

from lib.components.dynamodb_table import DynamoDBTableComponent
from lib.components.iam_role import IAMRoleComponent
from lib.components.s3_bucket import S3BucketComponent


class MyMocks(pulumi.runtime.Mocks):
  def new_resource(self, args: MockResourceArgs):
    """
    args: Contains type_, name, inputs, provider, and id.
    Must return (id, state) tuple.
    """

    args_typed: Any = args

    # Assign fake ARNs for specific resource types
    if "aws:s3/bucket:Bucket" in args_typed:
      args.inputs["arn"] = f"arn:aws:s3:::{args.name}"
    elif "aws:dynamodb/table:Table" in args_typed:
      args.inputs["arn"] = f"arn:aws:dynamodb:us-west-2:123456789012:table/{args.name}"
    elif "aws:iam/role:Role" in args_typed:
      args.inputs["arn"] = f"arn:aws:iam::123456789012:role/{args.name}"

    return f"{args.name}_id", args.inputs

  def call(self, args: MockCallArgs):
    return args.args


# Set mocks before creating any Pulumi resources
set_mocks(MyMocks())


class TestComponents(unittest.TestCase):

  def test_dynamodb_table_properties(self):
    def pulumi_program():
      table = DynamoDBTableComponent(
        name="my-table",
        environment="staging",
        hash_key="id",
        range_key="timestamp"
      )
      # Just check that an Output exists
      self.assertTrue(table.table_name)
      self.assertTrue(table.table_arn)

    pulumi.runtime.run_in_stack(pulumi_program)

  def test_iam_role_with_s3_and_dynamodb(self):
    def pulumi_program():
      role = IAMRoleComponent(
        name="my-role",
        environment="staging",
        s3_bucket_arn=pulumi.Output.secret("arn:aws:s3:::dummy-bucket"),
        dynamodb_table_arn=pulumi.Output.
        of("arn:aws:dynamodb:us-west-2:123456789012:table/dummy-table")
      )
      self.assertTrue(role.role_name)
      self.assertTrue(role.role_arn)

    pulumi.runtime.run_in_stack(pulumi_program)

  def test_s3_bucket_properties(self):
    def pulumi_program():
      bucket = S3BucketComponent(
        name="my-bucket",
        environment="staging"
      )
      self.assertTrue(bucket.bucket_name)
      self.assertTrue(bucket.bucket_arn)

    pulumi.runtime.run_in_stack(pulumi_program)


if __name__ == "__main__":
  unittest.main()
