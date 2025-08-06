from lib.tap_stack import TapStackArgs, TapStack
import pulumi
import pulumi.runtime
import os
import sys
import unittest
from unittest.mock import Mock, MagicMock
import types

# === Set Pulumi test mode environment variable ===
os.environ["PULUMI_TEST_MODE"] = "true"

# === Register Pulumi mocks ===


class MyMocks(pulumi.runtime.Mocks):
  def new_resource(self, type_, name, inputs, provider, id_):
    # Return id and outputs for created resources
    outputs = inputs.copy()

    # Set default IDs for known resource types
    if type_ == "aws:ec2/vpc:Vpc":
      outputs["id"] = "vpc-123"
    elif type_ == "aws:ec2/subnet:Subnet":
      outputs["id"] = "subnet-123"
    elif type_ == "aws:ec2/securityGroup:SecurityGroup":
      outputs["id"] = "sg-123"
    elif type_ == "aws:rds/instance:Instance":
      outputs["id"] = "db-123"
      outputs["endpoint"] = "db-endpoint"
    elif type_ == "aws:iam/role:Role":
      outputs["arn"] = "arn:aws:iam::123:role/test"
    elif type_ == "aws:apigateway/restApi:RestApi":
      outputs["id"] = "api-123"

    return [f"{name}-id", outputs]

  def call(self, token, args, provider):
    # Handle specific function calls
    if token == "aws:index/getAvailabilityZones:getAvailabilityZones":
      return {"names": ["us-east-1a", "us-east-1b"]}
    if token == "aws:index/getRegion:getRegion":
      return {"name": "us-east-1"}
    return {}


pulumi.runtime.set_mocks(MyMocks())

# === Test class ===


class TestTapStackComponents(unittest.TestCase):
  def setUp(self):
    self.test_args = TapStackArgs(
        environment_suffix="test",
        tags={"Environment": "test", "Project": "tap-stack"}
    )

  def test_tap_stack_initialization(self):
    stack = TapStack(
        name="tap-test",
        args=self.test_args,
        opts=pulumi.ResourceOptions(),
    )

    # Verify components exist
    self.assertTrue(hasattr(stack, "iam_component"))
    self.assertTrue(hasattr(stack, "compute_component"))
    self.assertTrue(hasattr(stack, "database_component"))
    self.assertTrue(hasattr(stack, "serverless_component"))

    # Verify basic attributes
    self.assertEqual(stack.iam_component.lambda_role.arn,
                     "arn:aws:iam::123:role/test")
    self.assertEqual(stack.compute_component.vpc.id, "vpc-123")
    self.assertEqual(stack.database_component.rds_instance.endpoint,
                     "db-endpoint")
    self.assertEqual(stack.serverless_component.api.id, "api-123")


if __name__ == "__main__":
  unittest.main(verbosity=2, buffer=True)
