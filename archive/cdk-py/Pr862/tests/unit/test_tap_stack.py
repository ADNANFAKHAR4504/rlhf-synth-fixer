# import os
# import sys
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up a fresh CDK app for each test"""
    self.app = cdk.App()

  @mark.it("creates three S3 buckets with KMS encryption and block public access")
  def test_creates_s3_buckets(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::S3::Bucket", 3)
    resources = template.find_resources("AWS::S3::Bucket")
    for logical_id, resource in resources.items():
      props = resource["Properties"]
      self.assertIn("BucketEncryption", props)
      self.assertIn("PublicAccessBlockConfiguration", props)
      pab = props["PublicAccessBlockConfiguration"]
      self.assertTrue(pab["BlockPublicAcls"])
      self.assertTrue(pab["BlockPublicPolicy"])
      self.assertTrue(pab["IgnorePublicAcls"])
      self.assertTrue(pab["RestrictPublicBuckets"])

  @mark.it("creates a KMS key with rotation enabled")
  def test_creates_kms_key(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTestKMS")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::KMS::Key", 1)
    template.has_resource_properties("AWS::KMS::Key", {
      "EnableKeyRotation": True
    })

  @mark.it("creates a VPC with 2 public and 2 private subnets")
  def test_creates_vpc_and_subnets(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTestVPC")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::EC2::VPC", 1)
    template.resource_count_is("AWS::EC2::Subnet", 4)

  @mark.it("creates security groups with restricted rules")
  def test_creates_security_groups(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTestSG")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::EC2::SecurityGroup", 2)
    # Check that at least one SG has no unrestricted ingress
    resources = template.find_resources("AWS::EC2::SecurityGroup")
    for sg in resources.values():
      ingress = sg["Properties"].get("SecurityGroupIngress", [])
      for rule in ingress:
        self.assertNotEqual(rule.get("CidrIp"), "0.0.0.0/0")

  @mark.it("creates an RDS instance with encryption and not publicly accessible")
  def test_creates_rds_instance(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTestRDS")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::RDS::DBInstance", 1)
    template.has_resource_properties("AWS::RDS::DBInstance", {
      "StorageEncrypted": True,
      "PubliclyAccessible": False
    })

  @mark.it("creates a CloudTrail with CloudWatch Logs integration")
  def test_creates_cloudtrail(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTestTrail")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::CloudTrail::Trail", 1)
    template.has_resource_properties("AWS::CloudTrail::Trail", {
      "IsMultiRegionTrail": True,
      "EnableLogFileValidation": True
    })
    # Check CloudWatch Logs group exists
    template.resource_count_is("AWS::Logs::LogGroup", 1)

  @mark.it("outputs VPC, KMS, RDS endpoint, and S3 bucket names")
  def test_outputs(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTestOutputs")
    template = Template.from_stack(stack)

    # ASSERT
    outputs = template.to_json().get("Outputs", {})
    self.assertIn("VPCId", outputs)
    self.assertIn("KMSKeyId", outputs)
    self.assertIn("DatabaseEndpoint", outputs)
    self.assertIn("S3BucketNames", outputs)
