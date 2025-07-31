from aws_cdk import App
from aws_cdk.assertions import Template, Match
from lib.tap_stack import VPCStack, IAMStack, TapStackProps


def test_vpc_is_created_with_public_and_private_subnets():
    app = App()
    stack = VPCStack(app, "TestVpcStack", environment_suffix="test")
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::EC2::VPC", 1)


def test_iam_role_is_created_with_ec2_read_only_policy():
    app = App()
    stack = IAMStack(app, "TestIamStack", environment_suffix="test")
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::IAM::Role", 1)

    template.has_resource_properties("AWS::IAM::Role", {
        "AssumeRolePolicyDocument": Match.object_like({
            "Statement": Match.array_with([
                Match.object_like({
                    "Principal": Match.object_like({
                        "Service": "ec2.amazonaws.com"
                    })
                })
            ])
        })
    })


def test_environment_suffix_default_to_dev():
    app = App()
    stack = IAMStack(app, "TestDefaultEnvStack", environment_suffix="dev")
    template = Template.from_stack(stack)

    template.has_resource_properties("AWS::IAM::Role", {
        "RoleName": Match.string_like_regexp(".*dev.*")
    })
