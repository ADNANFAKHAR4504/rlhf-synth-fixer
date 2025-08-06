from lib.tap_stack import TapStackArgs, TapStack
import pulumi
import pulumi.runtime
import os
import unittest

# Set Pulumi test mode environment variable
os.environ["PULUMI_TEST_MODE"] = "true"

# Simplified Mocks implementation


class MyMocks(pulumi.runtime.Mocks):
  def new_resource(self, type_, name, inputs, provider, id_):
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

  def call(self, token, *args, **kwargs):
    # Handle specific function calls
    if token == "aws:index/getAvailabilityZones:getAvailabilityZones":
      return {"names": ["us-east-1a", "us-east-1b"]}
    if token == "aws:index/getRegion:getRegion":
      return {"name": "us-east-1"}
    return {}


pulumi.runtime.set_mocks(MyMocks())

# Test class


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

    self.assertTrue(hasattr(stack, "iam_component"))
    self.assertTrue(hasattr(stack, "compute_component"))
    self.assertTrue(hasattr(stack, "database_component"))
    self.assertTrue(hasattr(stack, "serverless_component"))


if __name__ == "__main__":
  unittest.main(verbosity=2, buffer=True)
