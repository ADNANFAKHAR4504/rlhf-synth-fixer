import json
import os
import unittest
from pytest import mark

import aws_cdk as cdk
from aws_cdk.assertions import Template

from lib.tap_stack import TapStack, TapStackProps  # adjust import path if needed


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  def setUp(self):
    self.app = cdk.App()

  @mark.it("creates resources with environment suffix and exports outputs")
  def test_resources_and_exports(self):
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::S3::Bucket", 1)
    template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
    template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)

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

  @mark.it("defaults environment suffix to 'dev' and exports outputs")
  def test_default_env_suffix_exports(self):
    stack = TapStack(self.app, "TapStackDefault")
    template = Template.from_stack(stack)

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
