import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates an S3 bucket with correct properties")
    def test_creates_s3_bucket_with_properties(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        # Check for bucket properties without relying on exact BucketName string
        # BucketName synthesizes to Fn::Join with account/region tokens
        template.has_resource_properties("AWS::S3::Bucket", {
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": Match.any_value()
                },
                "VersioningConfiguration": {
                    "Status": "Enabled"
                },
                "PublicAccessBlockConfiguration": Match.object_like({
                    "BlockPublicAcls": True,
                    "BlockPublicPolicy": True,
                    "IgnorePublicAcls": True,
                    "RestrictPublicBuckets": True
                })
        })

    @mark.it("creates VPC with correct configuration")
    def test_creates_vpc(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestVpc")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)

    @mark.it("creates RDS instance with correct properties")
    def test_creates_rds_instance(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestRds")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBInstance", 1)
        template.has_resource_properties("AWS::RDS::DBInstance", {
                "Engine": "postgres",
                "StorageEncrypted": True
        })

    @mark.it("creates CloudFront distribution")
    def test_creates_cloudfront_distribution(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestCloudfront")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudFront::Distribution", 1)
        template.has_resource_properties("AWS::CloudFront::Distribution", {
                "DistributionConfig": Match.object_like({
                    "Enabled": True,
                    "DefaultRootObject": "index.html"
                })
        })

    @mark.it("creates IAM roles for resource access")
    def test_creates_iam_roles(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestIam")
        template = Template.from_stack(stack)

        # ASSERT - Check for IAM roles (S3 access and RDS access)
        # Get all IAM roles from template
        iam_roles = template.find_resources("AWS::IAM::Role")
        # Verify at least 2 roles exist
        assert len(iam_roles) >= 2, f"Expected at least 2 IAM roles, found {len(iam_roles)}"
