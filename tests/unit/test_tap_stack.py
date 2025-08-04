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

  def get_nested(self, stack: TapStack) -> TapStackProps:
    for child in stack.node.children:
      if isinstance(child, TapStackProps):
        return child
    raise AssertionError("Nested TapStackProps not found")

  @mark.it("creates resources with environment suffix and exports outputs")
  def test_resources_and_exports(self):
    suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest", environment_suffix=suffix)
    inner = self.get_nested(stack)
    template = Template.from_stack(inner)

    # Assert correct resources present in nested stack
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.resource_count_is("AWS::IAM::Role", 1)
    template.resource_count_is("AWS::EC2::VPC", 1)
    template.resource_count_is("AWS::EC2::SecurityGroup", 2)
    template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
    template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)

    # IAM role assume policy check
    template.has_resource_properties("AWS::IAM::Role", {
      "AssumeRolePolicyDocument": {
        "Statement": [{
          "Action": "sts:AssumeRole",
          "Effect": "Allow",
          "Principal": {"Service": "ec2.amazonaws.com"}
        }]
      }
    })

    outputs = template.to_json().get("Outputs", {})
    expected = [
      f"LogBucketName-{suffix}",
      f"ALBDNS-{suffix}",
      f"ASGName-{suffix}",
      f"VPCId-{suffix}",
      f"SecurityGroupId-{suffix}",
      f"EC2RoleName-{suffix}",
    ]
    for name in expected:
      data = [o for o in outputs.values() if o.get("Export", {}).get("Name") == name]
      self.assertTrue(data, f"Missing export '{name}'")

  @mark.it("defaults environment suffix to 'dev' and exports outputs")
  def test_default_env_suffix(self):
    stack = TapStack(self.app, "TapStackDefault")
    inner = self.get_nested(stack)
    template = Template.from_stack(inner)

    outputs = template.to_json().get("Outputs", {})
    expected = [
      "LogBucketName-dev",
      "ALBDNS-dev",
      "ASGName-dev",
      "VPCId-dev",
      "SecurityGroupId-dev",
      "EC2RoleName-dev",
    ]
    for name in expected:
      data = [o for o in outputs.values() if o.get("Export", {}).get("Name") == name]
      self.assertTrue(data, f"Missing export '{name}'")


if __name__ == "__main__":
  unittest.main()
