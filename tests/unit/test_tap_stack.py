import unittest
from aws_cdk import App
from aws_cdk.assertions import Template, Match
from lib.tap_stack import TapStack, TapStackProps


class TestTapStack(unittest.TestCase):
    def setUp(self):
        self.app = App()
        self.env_suffix = "test"
        props = TapStackProps(environment_suffix=self.env_suffix)
        self.stack = TapStack(self.app, "TapStackTest", props=props)

        # Extract nested stacks
        self.vpc_stack = self.stack.vpc_stack
        self.iam_stack = self.stack.iam_stack

    def test_vpc_is_created_with_public_and_private_subnets(self):
        vpc_template = Template.from_stack(self.vpc_stack)

        # Assert VPC exists
        vpc_template.resource_count_is("AWS::EC2::VPC", 1)

        # Assert 2 public and 2 private subnets (total 4)
        vpc_template.resource_count_is("AWS::EC2::Subnet", 4)

    def test_iam_role_is_created_with_ec2_read_only_policy(self):
        iam_template = Template.from_stack(self.iam_stack)

        # Assert one IAM role is created
        iam_template.resource_count_is("AWS::IAM::Role", 1)

        # Check AssumeRole policy
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
                # Check inline policies
                "Policies": Match.array_with([
                    Match.object_like({
                        "PolicyDocument": Match.object_like({
                            "Statement": Match.array_with([
                                Match.object_like({
                                    "Action": Match.array_with([
                                        "ec2:DescribeInstances",
                                        "ec2:DescribeTags"
                                    ]),
                                    "Effect": "Allow",
                                    "Resource": "*"
                                })
                            ])
                        }),
                        "PolicyName": Match.any_value()  # Accepts any generated name
                    })
                ])
            }
        )

    # def test_environment_suffix_affects_role_name(self):
    #     iam_template = Template.from_stack(self.iam_stack)

    #     iam_template.has_resource_properties(
    #         "AWS::IAM::Role",
    #         {
    #             "RoleName": Match.string_like_regexp(f".*{self.env_suffix}.*")
    #         }
    #     )


if __name__ == "__main__":
    unittest.main()
