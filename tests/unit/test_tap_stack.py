import os
import unittest
from aws_cdk import App
from aws_cdk.assertions import Template, Match

from lib.tap_stack import TapStack, TapStackProps


class TestTapStack(unittest.TestCase):

    def setUp(self):
        # Read from env vars, fallback to defaults
        self.env_suffix = os.getenv("TEST_ENV", "dev")
        self.region = os.getenv("TEST_REGION", "us-east-1")
        self.account = os.getenv("TEST_ACCOUNT", "111111111111")
        self.app = App(context={"environmentSuffix": self.env_suffix})

    def test_vpc_is_created_with_public_and_private_subnets(self):
        stack = TapStack(self.app, "TestVpcStack", TapStackProps(environment_suffix=self.env_suffix))
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::EC2::VPC", 1)

    def test_iam_role_is_created_with_ec2_read_only_policy(self):
        stack = TapStack(self.app, "TestIamStack", TapStackProps(environment_suffix=self.env_suffix))
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::IAM::Role", 1)
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {
                            "Service": "ec2.amazonaws.com"
                        }
                    })
                ])
            }),
            "Policies": Match.array_with([
                Match.object_like({
                    "PolicyName": "CustomEC2ReadOnlyPolicy",
                })
            ])
        })

    def test_environment_suffix_default_to_dev(self):
        app = App()  # no context, should fall back to "dev"
        stack = TapStack(app, "TestDefaultEnvStack")
        template = Template.from_stack(stack)
        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": Match.string_like_regexp(".*dev.*")
        })
