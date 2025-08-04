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
    raise AssertionError("Nested TapStackProps not found in TapStack")

  @mark.it("creates all resources with expected suffix and validates IAM/SG/output exports")
  def test_resources_and_security_with_suffix(self):
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
    nested_stack = self.get_nested_stack(stack)
    template = Template.from_stack(nested_stack)

    template.resource_count_is("AWS::S3::Bucket", 1)
    template.resource_count_is("AWS::IAM::Role", 1)
    template.resource_count_is("AWS::EC2::SecurityGroup", 1)
    template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
    template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)

    template.has_resource_properties("AWS::IAM::Role", {
      "AssumeRolePolicyDocument": {
        "Statement": [{
          "Effect": "Allow",
          "Action": "sts:AssumeRole",
          "Principal": {
            "Service": "ec2.amazonaws.com"
          }
        }]
      },
      "Description": "IAM role for EC2 instances with access to app logs bucket"
    })

    template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
      "IpProtocol": "tcp",
      "FromPort": 80,
      "ToPort": 80,
      "CidrIp": "0.0.0.0/0",
      "Description": "Allow HTTP access from anywhere"
    })

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
      found = any(
        out.get("Export", {}).get("Name") == export_name
        for out in outputs.values()
      )
      self.assertTrue(found, f"Missing export: {export_name}")

  @mark.it("creates default 'dev' environment resources and exports")
  def test_default_suffix_resources_and_outputs(self):
    stack = TapStack(self.app, "TapStackDefault")
    nested_stack = self.get_nested_stack(stack)
    template = Template.from_stack(nested_stack)

    template.resource_count_is("AWS::IAM::Role", 1)
    template.resource_count_is("AWS::EC2::SecurityGroup", 1)

    template.has_resource_properties("AWS::IAM::Role", {
      "AssumeRolePolicyDocument": {
        "Statement": [{
          "Principal": {
            "Service": "ec2.amazonaws.com"
          }
        }]
      }
    })

    template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
      "IpProtocol": "tcp",
      "FromPort": 80,
      "ToPort": 80
    })

    outputs = template.to_json().get("Outputs", {})
    expected_exports = [
      "LogBucketName-dev",
      "ALBDNS-dev",
      "ASGName-dev",
      "VPCId-dev",
      "SecurityGroupId-dev",
      "EC2RoleName-dev"
    ]

    for export_name in expected_exports:
      found = any(
        out.get("Export", {}).get("Name") == export_name
        for out in outputs.values()
      )
      self.assertTrue(found, f"Missing export: {export_name}")


if __name__ == "__main__":
  unittest.main()
