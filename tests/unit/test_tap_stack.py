import unittest

from pytest import mark
import aws_cdk as cdk
from aws_cdk.assertions import Template

from lib.tap_stack import TapStack


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  def setUp(self):
    self.app = cdk.App()

  @mark.it("creates resources with environment suffix and exports outputs")
  def test_resources_created_with_env_suffix(self):
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
    template = Template.from_stack(stack)

    # Assert resource counts
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

    # Validate expected output exports
    outputs = template.to_json().get("Outputs", {})
    expected_exports = [
      f"LogBucketName-{env_suffix}",
      f"ALBDNS-{env_suffix}",
      f"ASGName-{env_suffix}",
      f"VPCId-{env_suffix}",
      f"SecurityGroupId-{env_suffix}",
      f"EC2RoleName-{env_suffix}",
    ]

    for export_name in expected_exports:
      matching_outputs = [
        out for out in outputs.values()
        if out.get("Export", {}).get("Name") == export_name
      ]
      self.assertTrue(
        matching_outputs,
        f"Expected export '{export_name}' not found"
      )

  @mark.it("defaults environment suffix to 'dev' and exports outputs")
  def test_default_environment_suffix(self):
    stack = TapStack(self.app, "TapStackDefault")
    template = Template.from_stack(stack)

    outputs = template.to_json().get("Outputs", {})
    expected_exports = [
      "LogBucketName-dev",
      "ALBDNS-dev",
      "ASGName-dev",
      "VPCId-dev",
      "SecurityGroupId-dev",
      "EC2RoleName-dev",
    ]

    for export_name in expected_exports:
      matching_outputs = [
        out for out in outputs.values()
        if out.get("Export", {}).get("Name") == export_name
      ]
      self.assertTrue(
        matching_outputs,
        f"Expected export '{export_name}' not found"
      )


if __name__ == "__main__":
  unittest.main()
