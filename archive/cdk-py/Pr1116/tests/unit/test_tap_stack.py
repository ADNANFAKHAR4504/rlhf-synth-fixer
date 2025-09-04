# import os
# import sys
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Unit tests for TapStack CDK stack"""

  def setUp(self):
    self.app = cdk.App()

  @mark.it("creates three S3 buckets with correct encryption and settings")
  def test_creates_s3_buckets(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackS3Test",
                     TapStackProps(environment_suffix="unittest"))
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::S3::Bucket", 3)
    template.has_resource_properties("AWS::S3::Bucket", {
      "BucketEncryption": {
        "ServerSideEncryptionConfiguration": [
          {
            "ServerSideEncryptionByDefault": {
              "SSEAlgorithm": "aws:kms"
            }
          }
        ]
      },
      "PublicAccessBlockConfiguration": {
        "BlockPublicAcls": True,
        "BlockPublicPolicy": True,
        "IgnorePublicAcls": True,
        "RestrictPublicBuckets": True
      }
    })

  @mark.it("creates KMS keys for S3 and RDS")
  def test_creates_kms_keys(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackKmsTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::KMS::Key", 2)

  @mark.it("creates VPC with three subnet types")
  def test_creates_vpc_and_subnets(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackVpcTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::EC2::VPC", 1)
    template.resource_count_is("AWS::EC2::Subnet", 6)  # 3 subnet types x 2 AZs

  @mark.it("creates RDS MySQL instance with correct settings")
  def test_creates_rds_instance(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackRdsTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::RDS::DBInstance", 1)
    template.has_resource_properties("AWS::RDS::DBInstance", {
      "Engine": "mysql",
      "StorageEncrypted": True,
      "BackupRetentionPeriod": 7,
      "DeletionProtection": False
    })

  @mark.it("outputs key resource identifiers")
  def test_outputs(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackOutputsTest")
    template = Template.from_stack(stack)

    # ASSERT
    outputs = template.to_json().get("Outputs", {})
    self.assertIn("VpcId", outputs)
    self.assertIn("WebAssetsBucketName", outputs)
    self.assertIn("UserUploadsBucketName", outputs)
    self.assertIn("AppDataBucketName", outputs)
