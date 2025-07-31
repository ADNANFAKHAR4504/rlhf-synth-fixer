import unittest
from aws_cdk import App
from aws_cdk.assertions import Template, Match
from lib.tap_stack import TapStack, TapStackProps


class TestTapStack(unittest.TestCase):
    def setUp(self):
        self.app = App()
        self.env_suffix = "test"
        self.stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=self.env_suffix))

        # Extract nested stacks
        self.vpc_stack = self.stack.vpc_stack
        self.iam_stack = self.stack.iam_stack

    def test_vpc_is_created_with_public_and_private_subnets(self):
        vpc_template = Template.from_stack(self.vpc_stack)

        # Validate one VPC
        vpc_template.resource_count_is("AWS::EC2::VPC", 1)

        # Validate two public and two private subnets (adjust if your config differs)
        vpc_template.resource_count_is("AWS::EC2::Subnet", 4)

    def test_iam_role_is_created_with_ec2_read_only_policy(self):
        iam_template = Template.from_stack(self.iam_stack)

        iam_template.resource_count_is("AWS::IAM::Role", 1)

        iam_template.has_resource_properties(
            "AWS::IAM::Role",
            {
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
                        "PolicyName": Match.string_like_regexp(".*ReadOnly.*")
                    })
                ])
            }
        )

    def test_environment_suffix_affects_role_name(self):
        iam_template = Template.from_stack(self.iam_stack)

        iam_template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "RoleName": Match.string_like_regexp(f".*{self.env_suffix}.*")
            }
        )


if __name__ == "__main__":
    unittest.main()
