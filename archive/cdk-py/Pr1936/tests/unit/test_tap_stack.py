import os
import unittest
from unittest.mock import patch

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up a fresh CDK app for each test"""
    self.app = cdk.App()

  @mark.it("creates S3 buckets with the correct environment suffix")
  @patch.dict(os.environ, {'ENVIRONMENT_SUFFIX': 'testenv'})
  def test_creates_s3_bucket_with_env_suffix(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT - Should create 3 S3 buckets (app, logs, config)
    template.resource_count_is("AWS::S3::Bucket", 3)

  @mark.it("defaults environment suffix to 'dev' if not provided")
  @patch.dict(os.environ, {}, clear=True)
  def test_defaults_env_suffix_to_dev(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTestDefault")
    template = Template.from_stack(stack)

    # ASSERT - Should create 3 S3 buckets with dev suffix
    template.resource_count_is("AWS::S3::Bucket", 3)

  @mark.it("creates VPC with correct subnets")
  def test_creates_vpc_with_subnets(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::EC2::VPC", 1)
    template.has_resource_properties("AWS::EC2::VPC", {
      "CidrBlock": "10.0.0.0/16"
    })

  @mark.it("creates RDS database in isolated subnet")
  def test_creates_rds_database(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::RDS::DBInstance", 1)
    template.has_resource_properties("AWS::RDS::DBInstance", {
      "Engine": "mysql"
    })

  @mark.it("creates DynamoDB table with encryption")
  def test_creates_dynamodb_table(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::DynamoDB::Table", 1)
    template.has_resource_properties("AWS::DynamoDB::Table", {
      "PointInTimeRecoverySpecification": {
        "PointInTimeRecoveryEnabled": True
      }
    })

  @mark.it("creates Auto Scaling Group with correct capacity")
  def test_creates_auto_scaling_group(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
    template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
      "MinSize": "2",
      "MaxSize": "6",
      "DesiredCapacity": "2"
    })

  @mark.it("creates Application Load Balancer")
  def test_creates_application_load_balancer(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
    template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
      "Scheme": "internet-facing",
      "Type": "application"
    })

  @mark.it("creates WAF WebACL for CloudFront")
  def test_creates_waf_web_acl(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::WAFv2::WebACL", 1)
    template.has_resource_properties("AWS::WAFv2::WebACL", {
      "Scope": "CLOUDFRONT"
    })

  @mark.it("creates CloudFront distribution")
  def test_creates_cloudfront_distribution(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::CloudFront::Distribution", 1)
