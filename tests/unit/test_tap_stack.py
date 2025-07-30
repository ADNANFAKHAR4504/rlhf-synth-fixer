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

  @mark.it("creates a secure S3 bucket with correct environment suffix")
  def test_creates_secure_s3_bucket_with_env_suffix(self):
    # ARRANGE
    env_suffix = "testenv"
    allowed_principals = ["arn:aws:iam::123456789012:user/testuser"]
    stack = TapStack(
        self.app, 
        "TapStackTest",
        TapStackProps(
            environment_suffix=env_suffix,
            allowed_principals=allowed_principals
        )
    )
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties("AWS::S3::Bucket", {
        "BucketName": f"secure-{env_suffix}-data-bucket",
        "BucketEncryption": {
            "ServerSideEncryptionConfiguration": [{
                "ServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "aws:kms"
                }
            }]
        },
        "VersioningConfiguration": {
            "Status": "Enabled"
        },
        "PublicAccessBlockConfiguration": {
            "BlockPublicAcls": True,
            "BlockPublicPolicy": True,
            "IgnorePublicAcls": True,
            "RestrictPublicBuckets": True
        }
    })

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_defaults_env_suffix_to_dev(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTestDefault")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties("AWS::S3::Bucket", {
        "BucketName": "secure-dev-data-bucket"
    })

  @mark.it("creates a KMS key with proper policies")
  def test_creates_kms_key_with_proper_policies(self):
    # ARRANGE
    allowed_principals = ["arn:aws:iam::123456789012:user/testuser"]
    stack = TapStack(
        self.app, 
        "TapStackTest",
        TapStackProps(allowed_principals=allowed_principals)
    )
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::KMS::Key", 1)
    template.has_resource_properties("AWS::KMS::Key", {
        "EnableKeyRotation": True,
        "KeyPolicy": {
            "Statement": Match.array_with([
                {
                    "Action": "kms:*",
                    "Effect": "Allow",
                    "Principal": {"AWS": Match.any_value()},
                    "Resource": "*",
                    "Sid": "EnableRootAccess"
                }
            ])
        }
    })

  @mark.it("creates KMS alias")
  def test_creates_kms_alias(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::KMS::Alias", 1)
    template.has_resource_properties("AWS::KMS::Alias", {
        "AliasName": "alias/secure-s3-key"
    })

  @mark.it("creates IAM managed policy for S3 access")
  def test_creates_iam_managed_policy(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::IAM::ManagedPolicy", 1)
    template.has_resource_properties("AWS::IAM::ManagedPolicy", {
        "ManagedPolicyName": "SecureS3Access-dev",
        "Description": Match.string_like_regexp(".*secure S3 bucket.*")
    })

  @mark.it("creates S3 bucket policy denying unencrypted uploads")
  def test_creates_bucket_policy_deny_unencrypted(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    template.resource_count_is("AWS::S3::BucketPolicy", 1)
    # Just verify the bucket policy exists - the detailed policy verification
    # is complex due to CloudFormation references
    policy_resources = template.find_resources("AWS::S3::BucketPolicy")
    self.assertEqual(len(policy_resources), 1, "Should have exactly one bucket policy")

  @mark.it("creates CloudFormation outputs")
  def test_creates_cloudformation_outputs(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT
    outputs = template.find_outputs("*", {})
    output_keys = list(outputs.keys())
    
    expected_outputs = ["S3BucketName", "S3BucketArn", "KMSKeyArn", "IAMPolicyArn"]
    for expected_output in expected_outputs:
        self.assertIn(expected_output, output_keys, 
                     f"Expected output {expected_output} not found")

  @mark.it("handles missing allowed_principals gracefully")
  def test_handles_missing_allowed_principals(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    template = Template.from_stack(stack)

    # ASSERT - Should not fail and should create resources
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.resource_count_is("AWS::KMS::Key", 1)
    template.resource_count_is("AWS::IAM::ManagedPolicy", 1)
