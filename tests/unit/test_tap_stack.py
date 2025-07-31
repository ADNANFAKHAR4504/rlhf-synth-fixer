# import os
# import sys
import unittest

import aws_cdk as cdk
# import pytest
# from aws_cdk.assertions import Match, Template
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up a fresh CDK app for each test"""
    self.app = cdk.App()

  @mark.it("creates an S3 bucket with the correct environment suffix")
  def test_creates_s3_bucket_with_env_suffix(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties("AWS::S3::Bucket", {
        "BucketName": f"tap-bucket-{env_suffix}"
    })

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_defaults_env_suffix_to_dev(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTestDefault")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties("AWS::S3::Bucket", {
        "BucketName": "tap-bucket-dev"
    })

  def test_vpc_created_with_correct_cidr(self):
    stack = TapStack(self.app, "TapStackVpc")
    template = Template.from_stack(stack)
    template.has_resource_properties("AWS::EC2::VPC", {
      "CidrBlock": "10.0.0.0/16"
    })

  def test_iam_instance_profile_created(self):
    stack = TapStack(self.app, "TapStackIAM")
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::IAM::InstanceProfile", 1)

  def test_ec2_instance_type(self):
    stack = TapStack(self.app, "TapStackEC2")
    template = Template.from_stack(stack)
    template.has_resource_properties("AWS::EC2::Instance", {
      "InstanceType": "t3.micro"
    })

  def test_rds_instance_created(self):
    stack = TapStack(self.app, "TapStackRDS")
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::RDS::DBInstance", 1)
    template.has_resource_properties("AWS::RDS::DBInstance", {
      "Engine": "postgres"
    })

  def test_alb_listener_created(self):
    stack = TapStack(self.app, "TapStackALB")
    template = Template.from_stack(stack)
    template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
      "Port": 80
    })

  def test_outputs_are_defined(self):
    stack = TapStack(self.app, "TapStackOutputs")
    template = Template.from_stack(stack)
    for output_name in [
      "VPCId", "EC2InstanceId", "ElasticIP",
      "ALBDNSName", "RDSEndpoint", "S3BucketName", "KMSKeyId"
    ]:
      template.has_output(output_name)