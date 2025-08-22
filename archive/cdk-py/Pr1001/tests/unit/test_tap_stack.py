# import os
# import sys
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up a fresh CDK app for each test"""
    self.app = cdk.App()

  @mark.it("creates KMS keys for S3, CloudTrail, and Lambda")
  def test_creates_kms_keys(self):
    stack = TapStack(self.app, "TapStackKMS")
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::KMS::Key", 3)

  @mark.it("creates IAM roles for EC2, Lambda, CloudTrail, and Backup")
  def test_creates_iam_roles(self):
    stack = TapStack(self.app, "TapStackIAM")
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::IAM::Role", 6)  # EC2, Lambda, CloudTrail, Backup, FlowLogs

  @mark.it("creates a VPC with public and private subnets")
  def test_creates_vpc_and_subnets(self):
    stack = TapStack(self.app, "TapStackVPC")
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::EC2::VPC", 1)
    template.resource_count_is("AWS::EC2::Subnet", 4)

  @mark.it("creates S3 buckets for app, cloudtrail, and access logs")
  def test_creates_s3_buckets(self):
    stack = TapStack(self.app, "TapStackS3")
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::S3::Bucket", 3)

  @mark.it("creates a CloudTrail trail")
  def test_creates_cloudtrail_trail(self):
    stack = TapStack(self.app, "TapStackCloudTrail")
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::CloudTrail::Trail", 1)

  @mark.it("creates a WAF Web ACL")
  def test_creates_waf_web_acl(self):
    stack = TapStack(self.app, "TapStackWAF")
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::WAFv2::WebACL", 1)

  @mark.it("creates a Lambda function in VPC")
  def test_creates_lambda_function(self):
    stack = TapStack(self.app, "TapStackLambda")
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::Lambda::Function", 2)

  @mark.it("creates a Backup Vault and Plan")
  def test_creates_backup_vault_and_plan(self):
    stack = TapStack(self.app, "TapStackBackup")
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::Backup::BackupVault", 1)
    template.resource_count_is("AWS::Backup::BackupPlan", 1)

  @mark.it("outputs key resource identifiers")
  def test_outputs(self):
    stack = TapStack(self.app, "TapStackOutputs")
    template = Template.from_stack(stack)
    outputs = template.to_json().get("Outputs", {})
    self.assertIn("VpcId", outputs)
    self.assertIn("AppBucketName", outputs)
    self.assertIn("CloudTrailArn", outputs)
    self.assertIn("WebAclArn", outputs)
    self.assertIn("BackupVaultName", outputs)
    self.assertIn("Ec2InstanceType", outputs)
    self.assertIn("LambdaFunctionName", outputs)
    self.assertIn("S3BucketEncryptionKeyId", outputs)
    self.assertIn("CloudTrailKmsKeyId", outputs)
    self.assertIn("LambdaKmsKeyId", outputs)
