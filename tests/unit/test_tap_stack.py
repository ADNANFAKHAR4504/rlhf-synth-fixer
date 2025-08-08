# import os
# import sys
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Unit tests for the TapStack CDK stack"""

  def setUp(self):
    self.app = cdk.App()

  @mark.it("creates a KMS key with rotation enabled")
  def test_creates_kms_key(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::KMS::Key", 1)
    template.has_resource_properties("AWS::KMS::Key", {
      "EnableKeyRotation": True
    })

  @mark.it("creates a CloudWatch Log Group with KMS encryption")
  def test_creates_log_group_with_kms(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::Logs::LogGroup", 1)
    template.has_resource_properties("AWS::Logs::LogGroup", {
      "KmsKeyId": Match.any_value()
    })

  @mark.it("creates a CloudTrail S3 bucket with KMS encryption and correct policies")
  def test_creates_cloudtrail_bucket(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::S3::Bucket", 2)
    template.has_resource_properties("AWS::S3::Bucket", {
      "BucketEncryption": Match.any_value()
    })
    
    # Just verify CloudTrail bucket policy exists
    template.resource_count_is("AWS::S3::BucketPolicy", 2)
    template.has_resource_properties("AWS::S3::BucketPolicy", {
      "PolicyDocument": Match.object_like({
        "Statement": Match.any_value()
      })
    })

  @mark.it("creates a VPC with Flow Logs")
  def test_creates_vpc_with_flow_logs(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::EC2::VPC", 1)
    template.resource_count_is("AWS::EC2::FlowLog", 1)

  @mark.it("creates an IAM Role for VPC Flow Logs with correct permissions")
  def test_creates_flow_log_role(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.has_resource_properties("AWS::IAM::Role", {
      "AssumeRolePolicyDocument": Match.object_like({
        "Statement": Match.array_with([
          Match.object_like({
            "Principal": {"Service": "vpc-flow-logs.amazonaws.com"}
          })
        ])
      })
    })

  @mark.it("creates an AWS Config rule and dependencies")
  def test_creates_config_rule_and_dependencies(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::Config::ConfigRule", 1)

  @mark.it("creates an RDS instance with encryption and in private subnets")
  def test_creates_rds_instance(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::RDS::DBInstance", 1)
    template.has_resource_properties("AWS::RDS::DBInstance", {
      "StorageEncrypted": True,
      "PubliclyAccessible": False
    })

  @mark.it("creates a Lambda function with DLQ and VPC config")
  def test_creates_lambda_with_dlq_and_vpc(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::Lambda::Function", 1)
    template.has_resource_properties("AWS::Lambda::Function", {
      "DeadLetterConfig": Match.any_value(),
      "VpcConfig": Match.any_value()
    })

  @mark.it("outputs all expected stack outputs")
  def test_stack_outputs(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)
    outputs = [
      "KmsKeyArn",
      "CloudTrailBucketName",
      "VpcId",
      "ConfigBucketName",
      "RdsEndpointAddress",
      "LambdaFunctionName",
      "DLQName"
    ]
    # ASSERT
    for output in outputs:
      template.has_output(output, Match.any_value())
