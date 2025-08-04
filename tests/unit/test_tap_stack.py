# pylint: disable=C0111,C0103,C0303,W0511,R0903,R0913,R0914,R0915

import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template
from lib.tap_stack import TapStack  # Adjust path as necessary


class TestTapStack(unittest.TestCase):
  def setUp(self):
    self.app = cdk.App()

  def test_resources_created_with_env_suffix(self):
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
    template = Template.from_stack(stack)

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
    template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
      "MinSize": "1",
      "MaxSize": "3",
      "InstanceType": "t3.micro"
    })

    template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)

  def test_default_environment_suffix(self):
    stack = TapStack(self.app, "TapStackDefault")
    template = Template.from_stack(stack)

    logical_ids = template.to_json()["Resources"].keys()
    matched = any("dev" in logical_id.lower() for logical_id in logical_ids)
    self.assertTrue(matched, "Resources should contain 'dev' suffix by default")


if __name__ == "__main__":
  unittest.main()
