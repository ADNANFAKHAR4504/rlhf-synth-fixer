import aws_cdk as cdk
from aws_cdk.assertions import Template

from lib.tap_stack import TapStack


def get_template():
  app = cdk.App()
  stack = TapStack(app, "TestTapStack")
  return Template.from_stack(stack)


def test_vpc_created():
  template = get_template()
  template.resource_count_is("AWS::EC2::VPC", 1)
  template.has_resource_properties("AWS::EC2::VPC", {})


def test_iam_role_for_ec2():
  template = get_template()
  template.resource_count_is("AWS::IAM::Role", 2)
  template.has_resource_properties(
    "AWS::IAM::Role",
    {
      "AssumeRolePolicyDocument": {
        "Statement": [
          {
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {"Service": "ec2.amazonaws.com"},
          }
        ]
      }
    },
  )


def test_security_groups():
  template = get_template()
  template.resource_count_is("AWS::EC2::SecurityGroup", 2)


def test_ec2_instance():
  template = get_template()
  template.resource_count_is("AWS::EC2::Instance", 1)
  template.has_resource_properties(
    "AWS::EC2::Instance",
    {
      "InstanceType": "t3.micro",
    },
  )


def test_cloudtrail_and_log_groups():
  template = get_template()
  template.resource_count_is("AWS::CloudTrail::Trail", 1)
  template.resource_count_is("AWS::Logs::LogGroup", 2)  # CloudTrail + EC2 log groups
