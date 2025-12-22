import os
import unittest
from unittest.mock import patch

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps

@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Unit tests for TapStack CDK stack"""

    def setUp(self):
        self.app = cdk.App()
        self.is_localstack = os.environ.get("AWS_ENDPOINT_URL") is not None

    @mark.it("creates a VPC with three subnet types")
    def test_creates_vpc_and_subnets(self):
        stack = TapStack(self.app, "TapStackVpcTest")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.resource_count_is("AWS::EC2::Subnet", 6)  # 3 subnet types x 2 AZs

    @mark.it("creates security groups for web and db")
    def test_creates_security_groups(self):
        stack = TapStack(self.app, "TapStackSGTest")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::EC2::SecurityGroup", 2)

    @mark.it("creates RDS MySQL instance with correct settings")
    @patch.dict(os.environ, {"AWS_ENDPOINT_URL": ""}, clear=False)
    def test_creates_rds_instance(self):
        # Temporarily clear LocalStack env to test non-LocalStack path
        if "AWS_ENDPOINT_URL" in os.environ and os.environ["AWS_ENDPOINT_URL"]:
            del os.environ["AWS_ENDPOINT_URL"]
        stack = TapStack(self.app, "TapStackRdsTest")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::RDS::DBInstance", 1)
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "mysql",
            "StorageEncrypted": True,
            "BackupRetentionPeriod": 1,
            "DeletionProtection": False
        })

    @mark.it("creates S3 buckets for backup and logs")
    def test_creates_s3_buckets(self):
        stack = TapStack(self.app, "TapStackS3Test")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::S3::Bucket", 2)

    @mark.it("creates Application Load Balancer and Target Group")
    def test_creates_alb_and_target_group(self):
        stack = TapStack(self.app, "TapStackAlbTest")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)
        template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 1)

    @mark.it("creates KMS keys for S3 and RDS")
    @patch.dict(os.environ, {"AWS_ENDPOINT_URL": ""}, clear=False)
    def test_creates_kms_keys(self):
        # Temporarily clear LocalStack env to test non-LocalStack path
        if "AWS_ENDPOINT_URL" in os.environ and os.environ["AWS_ENDPOINT_URL"]:
            del os.environ["AWS_ENDPOINT_URL"]
        stack = TapStack(self.app, "TapStackKmsTest")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::KMS::Key", 2)

    @mark.it("creates CloudWatch dashboard and SNS topic")
    def test_creates_dashboard_and_sns(self):
        stack = TapStack(self.app, "TapStackMonitoringTest")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)
        template.resource_count_is("AWS::SNS::Topic", 1)

    @mark.it("outputs key resource identifiers")
    @patch.dict(os.environ, {"AWS_ENDPOINT_URL": ""}, clear=False)
    def test_outputs(self):
        # Temporarily clear LocalStack env to test non-LocalStack path
        if "AWS_ENDPOINT_URL" in os.environ and os.environ["AWS_ENDPOINT_URL"]:
            del os.environ["AWS_ENDPOINT_URL"]
        stack = TapStack(self.app, "TapStackOutputsTest")
        template = Template.from_stack(stack)
        outputs = template.to_json().get("Outputs", {})
        self.assertIn("VpcId", outputs)
        self.assertIn("DatabaseEndpoint", outputs)
        self.assertIn("AlbDnsName", outputs)
        self.assertIn("BackupBucketName", outputs)
        self.assertIn("LogsBucketName", outputs)
        self.assertIn("S3KmsKeyId", outputs)
        self.assertIn("RdsKmsKeyId", outputs)

    @mark.it("skips RDS resources when running on LocalStack")
    @patch.dict(os.environ, {"AWS_ENDPOINT_URL": "http://localhost:4566"})
    def test_localstack_skips_rds(self):
        stack = TapStack(self.app, "TapStackLocalStackTest")
        template = Template.from_stack(stack)
        template.resource_count_is("AWS::RDS::DBInstance", 0)
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 0)
        template.resource_count_is("AWS::KMS::Key", 1)  # Only S3 KMS key

    @mark.it("does not output RDS resources when on LocalStack")
    @patch.dict(os.environ, {"AWS_ENDPOINT_URL": "http://localhost:4566"})
    def test_localstack_outputs_no_rds(self):
        stack = TapStack(self.app, "TapStackLocalStackOutputsTest")
        template = Template.from_stack(stack)
        outputs = template.to_json().get("Outputs", {})
        self.assertIn("VpcId", outputs)
        self.assertNotIn("DatabaseEndpoint", outputs)
        self.assertNotIn("RdsKmsKeyId", outputs)
        self.assertIn("AlbDnsName", outputs)
        self.assertIn("S3KmsKeyId", outputs)
