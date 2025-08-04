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

    @mark.it("validates resources and exports for pr439 environment")
    def test_resources_and_outputs_for_pr439(self):
        env_suffix = "pr439"
        stack = TapStack(self.app, "TapStackpr439", environment_suffix=env_suffix)
        nested_stack = self.get_nested_stack(stack)
        template = Template.from_stack(nested_stack)

        # Resource counts
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.resource_count_is("AWS::IAM::Role", 1)
        template.resource_count_is("AWS::EC2::SecurityGroup", 2)
        template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)

        # IAM Role properties check
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

        # SG Ingress rule check
        template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTP access from anywhere"
        })

        # Output exports based on pr439 suffix
        outputs = template.to_json().get("Outputs", {})
        expected_exports = [
            "LogBucketNamepr439",
            "ALBDNSpr439",
            "ASGNamepr439",
            "VPCIdpr439",
            "SecurityGroupIdpr439",
            "EC2RoleNamepr439"
        ]
        for name in expected_exports:
            found = any(
                out.get("Export", {}).get("Name") == name
                for out in outputs.values()
            )
            self.assertTrue(found, f"Missing export: {name}")


if __name__ == "__main__":
    unittest.main()
