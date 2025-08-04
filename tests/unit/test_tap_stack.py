# pylint: disable=C0111,C0103,C0303,W0511,R0903,R0913,R0914,R0915

import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template
from lib.tap_stack import TapStack, TapStackProps  # Ensure this matches your structure


class TestTapStack(unittest.TestCase):
  def setUp(self):
    self.app = cdk.App()

  def get_nested_stack(self, stack: TapStack) -> TapStackProps:
    # CDK appends 'Props' to the nested stack name in this case
    for child in stack.node.children:
      if isinstance(child, TapStackProps):
        return child
    raise AssertionError("Nested TapStackProps not found in TapStack")

  def test_resources_created_with_env_suffix(self):
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
    nested_stack = self.get_nested_stack(stack)
    template = Template.from_stack(nested_stack)

    template.resource_count_is("AWS::S3::Bucket", 1)
    template.resource_count_is("AWS::IAM::Role", 1)
    template.has_resource_properties("AWS::IAM::Role", {
      "AssumeRolePolicyDocument": {
        "Statement": [{
          "Action": "sts:AssumeRole",
          "Effect": "Allow",
          "Principal": {"Service": "ec2.amazonaws.com"}
        }]
      }
    })

    template.resource_count_is("AWS::EC2::VPC", 1)
    template.resource_count_is("AWS::EC2::SecurityGroup", 1)
    template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
      "IpProtocol": "tcp",
      "FromPort": 80,
      "ToPort": 80,
    })

    template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
    template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)

  def test_default_environment_suffix(self):
    stack = TapStack(self.app, "TapStackDefault")
    nested_stack = self.get_nested_stack(stack)
    template = Template.from_stack(nested_stack)

    outputs = template.to_json().get("Outputs", {})
    expected_suffix = "dev"
    found = any(expected_suffix in out.get("Export", {}).get("Name", "") for out in outputs.values())
    self.assertTrue(found, f"Expected at least one output to contain '{expected_suffix}'")


if __name__ == "__main__":
  unittest.main()
