# pylint: disable=C0111,C0103,C0303,W0511,R0903,R0913,R0914,R0915

import unittest
from pytest import mark
import aws_cdk as cdk
from aws_cdk.assertions import Template
from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  def setUp(self):
    self.app = cdk.App()

  def get_nested_stack(self, stack: TapStack) -> TapStackProps:
    for child in stack.node.children:
      if isinstance(child, TapStackProps):
        return child
    raise AssertionError("Nested TapStackProps not found")

  @mark.it("creates required resources and exports outputs with correct IAM and SG settings")
  def test_resources_and_exports_with_iam_sg(self):
    suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest", environment_suffix=suffix)
    inner = self.get_nested_stack(stack)
    template = Template.from_stack(inner)

    template.resource_count_is("AWS::S3::Bucket", 1)
    template.resource_count_is("AWS::IAM::Role", 1)
    template.resource_count_is("AWS::EC2::VPC", 1)

    # Expecting 2 SGs (EC2 + ALB)
    template.resource_count_is("AWS::EC2::SecurityGroup", 2)

    outputs = template.to_json().get("Outputs", {})
    expected = [
      "LogBucketName" + suffix,
      "ALBDNS" + suffix,
      "ASGName" + suffix,
      "VPCId" + suffix,
      "SecurityGroupId" + suffix,
      "EC2RoleName" + suffix,
    ]
    for name in expected:
      value = outputs.get(name)
      self.assertIsNotNone(value, f"Missing output '{name}'")

  @mark.it("uses 'dev' as default suffix and includes IAM + SG validation")
  def test_default_env_suffix_with_iam_sg(self):
    stack = TapStack(self.app, "TapStackDefault")
    inner = self.get_nested_stack(stack)
    template = Template.from_stack(inner)

    outputs = template.to_json().get("Outputs", {})
    expected = [
      "LogBucketName" + "dev",
      "ALBDNS" + "dev",
      "ASGName" + "dev",
      "VPCId" + "dev",
      "SecurityGroupId" + "dev",
      "EC2RoleName" + "dev",
    ]
    for name in expected:
      value = outputs.get(name)
      self.assertIsNotNone(value, f"Missing output '{name}'")


if __name__ == "__main__":
  unittest.main()
