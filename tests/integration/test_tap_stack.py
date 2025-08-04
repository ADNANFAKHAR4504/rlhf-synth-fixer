# pylint: disable=C0111,C0103,C0303,W0511,R0903,R0913,R0914,R0915

import unittest
from pytest import mark
import aws_cdk as cdk
from aws_cdk.assertions import Template
from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack Integration Tests")
class TestTapStack(unittest.TestCase):

  def setUp(self):
    self.app = cdk.App()

  def get_nested_stack(self, stack: TapStack) -> TapStackProps:
    for child in stack.node.children:
      if isinstance(child, TapStackProps):
        return child
    self.fail("Nested TapStackProps not found in TapStack")

  @mark.it("validates resources and exports for pr439 environment")
  def test_resources_and_outputs_for_pr439(self):
    env_suffix = "pr439"
    stack = TapStack(self.app, f"TapStack{env_suffix}", environment_suffix=env_suffix)
    nested_stack = self.get_nested_stack(stack)
    template = Template.from_stack(nested_stack)

    failures = []

    # Resource count checks
    expected_counts = {
      "AWS::S3::Bucket": 1,
      "AWS::IAM::Role": 1,
      "AWS::EC2::SecurityGroup": 2,
      "AWS::EC2::SecurityGroupIngress": 1,
      "AWS::AutoScaling::AutoScalingGroup": 1,
      "AWS::ElasticLoadBalancingV2::LoadBalancer": 1,
    }

    for resource_type, count in expected_counts.items():
      try:
        template.resource_count_is(resource_type, count)
      except AssertionError as e:
        failures.append(f"{resource_type} count mismatch: {e}")

    # IAM Role properties
    try:
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
        "Description": "IAM role for EC2 instances with access to log bucket"
      })
    except AssertionError as e:
      failures.append(f"IAM Role properties mismatch: {e}")

    # Ingress from ALB to EC2 (source is ALB SG, not CIDR)
    try:
      template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
        "IpProtocol": "tcp",
        "FromPort": 80,
        "ToPort": 80,
        "Description": "Load balancer to target"
      })
    except AssertionError as e:
      failures.append(f"SecurityGroupIngress rule mismatch: {e}")

    # Output exports
    try:
      outputs = template.to_json().get("Outputs", {})
      expected_exports = [
        f"LogBucketName-{env_suffix}",
        f"EC2RoleName-{env_suffix}",
        f"ASGName-{env_suffix}",
        f"ALBDNS-{env_suffix}",
        f"VPCId-{env_suffix}",
        f"SecurityGroupId-{env_suffix}",
      ]
      for expected_output in expected_exports:
        found = any(
          key.startswith(expected_output) or
          val.get("Export", {}).get("Name") == expected_output
          for key, val in outputs.items()
        )
        if not found:
          failures.append(f"Missing output export: {expected_output}")
    except Exception as e:
      failures.append(f"Output export check failed: {e}")

    if failures:
      self.fail("\n".join(failures))


if __name__ == "__main__":
  unittest.main()
