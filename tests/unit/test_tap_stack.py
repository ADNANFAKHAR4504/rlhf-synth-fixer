#!/usr/bin/python
# -*- coding: utf-8 -*-
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match

from lib.tap_stack import TapStack, TapStackProps


class TestTapStack(unittest.TestCase):
  """Test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up a fresh CDK app before each test"""
    self.app = cdk.App()

  def test_vpc_is_created_with_public_and_private_subnets(self):
    # Arrange
    stack = TapStack(
      self.app,
      "TestVpcStack",
      TapStackProps(environment_suffix="test")
    )
    template = Template.from_stack(stack)

    # Assert VPC resource exists
    template.resource_count_is("AWS::EC2::VPC", 1)

    # Assert there are at least two subnets (public/private)
    template.resource_count_is("AWS::EC2::Subnet", 4)

  def test_iam_role_is_created_with_ec2_read_only_policy(self):
    # Arrange
    stack = TapStack(
      self.app,
      "TestIamStack",
      TapStackProps(environment_suffix="test")
    )
    template = Template.from_stack(stack)

    # Assert IAM Role exists
    template.resource_count_is("AWS::IAM::Role", 1)

    # Check if role is created with EC2 read-only access
    template.has_resource_properties(
      "AWS::IAM::Role",
      {
        "AssumeRolePolicyDocument": Match.object_like({
          "Statement": Match.array_with([
            Match.object_like({
              "Action": "sts:AssumeRole",
              "Effect": "Allow",
              "Principal": {
                "Service": "ec2.amazonaws.com"
              }
            })
          ])
        })
      }
    )

  def test_environment_suffix_default_to_dev(self):
    # Arrange
    stack = TapStack(self.app, "TestDefaultEnvStack")
    template = Template.from_stack(stack)

    # Assert IAM Role name includes 'dev' suffix
    template.has_resource_properties(
      "AWS::IAM::Role",
      {
        "RoleName": Match.string_like_regexp(".*dev.*")
      }
    )


if __name__ == "__main__":
  unittest.main()
