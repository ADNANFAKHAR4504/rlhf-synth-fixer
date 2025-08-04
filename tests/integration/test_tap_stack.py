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

  @mark.it("creates resources with environment suffix and validates IAM + SG")
  def test_resources_and_security_validations(self):
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
    nested_stack = self.get_nested_stack(stack)
    template = Template.from_stack(nested_stack)

    # Validate resource counts
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.resource_count_is("AWS::IAM::Role", 1)
    template.resource_count_is("AWS::EC2::SecurityGroup", 2)
    template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
    template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)

    # IAM Role validation
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

    # Security Group Ingress rule validation
    template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
      "IpProtocol": "tcp",
      "FromPort": 80,
      "ToPort": 80,
      "Description": "Allow HTTP access from internal CIDR block",
      "CidrIp": "10.0.0.0/16"
    })

    # Validate exported outputs
    outputs = template.to_json().get("Outputs", {})
    expected_exports = [
      f"LogBucketName-{env_suffix}",
      f"ALBDNS-{env_suffix}",
      f"ASGName-{env_suffix}",
    ]

    for export_name in expected_exports:
      matching_outputs = [
        out for out in outputs.values()
        if out.get("Export", {}).get("Name") == export_name
      ]
      self.assertTrue(matching_outputs, f"Expected export '{export_name}' not found")

  @mark.it("defaults environment suffix to 'dev' and validates IAM + SG")
  def test_default_env_suffix_exports_and_security(self):
    stack = TapStack(self.app, "TapStackDefault")
    nested_stack = self.get_nested_stack(stack)
    template = Template.from_stack(nested_stack)

    # IAM Role existence
    template.has_resource_properties("AWS::IAM::Role", {
      "AssumeRolePolicyDocument": {
        "Statement": [{
          "Principal": {"Service": "ec2.amazonaws.com"}
        }]
      }
    })

    # SG Ingress rule
    template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
      "FromPort": 80,
      "ToPort": 80,
      "IpProtocol": "tcp"
    })

    # Export outputs
    outputs = template.to_json().get("Outputs", {})
    expected_exports = [
      "LogBucketName-dev",
      "ALBDNS-dev",
      "ASGName-dev",
    ]

    for export_name in expected_exports:
      matching_outputs = [
        out for out in outputs.values()
        if out.get("Export", {}).get("Name") == export_name
      ]
      self.assertTrue(matching_outputs, f"Expected export '{export_name}' not found")


if __name__ == "__main__":
  unittest.main()
