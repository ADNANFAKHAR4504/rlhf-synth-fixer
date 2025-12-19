import os
import unittest
from unittest import mock

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps

@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Unit tests for TapStack CDK stack"""

    def setUp(self):
        self.app = cdk.App()

    @mark.it("creates VPC with three subnet types")
    def test_creates_vpc_and_subnets(self):
        stack = TapStack(self.app, "TapStackVpcTest")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.resource_count_is("AWS::EC2::Subnet", 6)  # 3 subnet types x 2 AZs

    @mark.it("creates security groups for bastion, ALB, app server, and RDS")
    def test_creates_security_groups(self):
        stack = TapStack(self.app, "TapStackSGTest")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::EC2::SecurityGroup", 4)

    @mark.it("creates KMS keys for S3, RDS, and CloudTrail")
    def test_creates_kms_keys(self):
        stack = TapStack(self.app, "TapStackKmsTest")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::KMS::Key", 3)

    @mark.it("creates S3 buckets for app data and CloudTrail logs")
    def test_creates_s3_buckets(self):
        stack = TapStack(self.app, "TapStackS3Test")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::S3::Bucket", 2)
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

    @mark.it("creates RDS MySQL instance with correct settings (non-LocalStack)")
    def test_creates_rds_instance(self):
        with mock.patch('lib.tap_stack.IS_LOCALSTACK', False):
            stack = TapStack(self.app, "TapStackRdsTest")
            template = Template.from_stack(stack)
            template.resource_count_is("AWS::RDS::DBInstance", 1)
            template.has_resource_properties("AWS::RDS::DBInstance", {
                "Engine": "mysql",
                "StorageEncrypted": True,
                "BackupRetentionPeriod": 7,
                "DeletionProtection": False
            })

    @mark.it("creates CloudTrail resource (non-LocalStack)")
    def test_creates_cloudtrail(self):
        with mock.patch('lib.tap_stack.IS_LOCALSTACK', False):
            stack = TapStack(self.app, "TapStackCloudTrailTest")
            template = Template.from_stack(stack)
            template.resource_count_is("AWS::CloudTrail::Trail", 1)

    @mark.it("creates EC2 bastion host and app servers")
    def test_creates_ec2_instances(self):
        stack = TapStack(self.app, "TapStackEC2Test")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::EC2::Instance", 3)  # 1 Bastion + 2 AppServers

    @mark.it("outputs key resource identifiers (non-LocalStack)")
    def test_outputs(self):
        with mock.patch('lib.tap_stack.IS_LOCALSTACK', False):
            stack = TapStack(self.app, "TapStackOutputsTest")
            template = Template.from_stack(stack)
            outputs = template.to_json().get("Outputs", {})
            self.assertIn("VpcId", outputs)
            self.assertIn("BastionHostId", outputs)
            self.assertIn("DatabaseEndpoint", outputs)
            self.assertIn("AppDataBucketName", outputs)

    @mark.it("skips RDS creation in LocalStack mode")
    def test_localstack_skips_rds(self):
        with mock.patch('lib.tap_stack.IS_LOCALSTACK', True):
            stack = TapStack(self.app, "TapStackLocalStackRdsTest")
            template = Template.from_stack(stack)
            template.resource_count_is("AWS::RDS::DBInstance", 0)

    @mark.it("skips CloudTrail creation in LocalStack mode")
    def test_localstack_skips_cloudtrail(self):
        with mock.patch('lib.tap_stack.IS_LOCALSTACK', True):
            stack = TapStack(self.app, "TapStackLocalStackCloudTrailTest")
            template = Template.from_stack(stack)
            template.resource_count_is("AWS::CloudTrail::Trail", 0)

    @mark.it("does not output DatabaseEndpoint in LocalStack mode")
    def test_localstack_no_database_output(self):
        with mock.patch('lib.tap_stack.IS_LOCALSTACK', True):
            stack = TapStack(self.app, "TapStackLocalStackOutputsTest")
            template = Template.from_stack(stack)
            outputs = template.to_json().get("Outputs", {})
            self.assertIn("VpcId", outputs)
            self.assertIn("BastionHostId", outputs)
            self.assertNotIn("DatabaseEndpoint", outputs)  # Should not exist in LocalStack
            self.assertIn("AppDataBucketName", outputs)
