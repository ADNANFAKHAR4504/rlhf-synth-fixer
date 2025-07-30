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

  @mark.it("creates a secure S3 bucket with the correct name based on env_suffix")
  def test_secure_s3_bucket_created_with_env_suffix(self):
    env_suffix = "testenv"
    stack = TapStack(self.app, "TestStack", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    expected_bucket_name = f"secure-{env_suffix}-bucket-assets"

    template.has_resource_properties("AWS::S3::Bucket", {
      "BucketName": expected_bucket_name,
      "VersioningConfiguration": {"Status": "Enabled"},
      "BucketEncryption": {
        "ServerSideEncryptionConfiguration": [{
          "ServerSideEncryptionByDefault": {
            "SSEAlgorithm": "aws:kms"
          }
        }]
      },
      "PublicAccessBlockConfiguration": {
        "BlockPublicAcls": True,
        "IgnorePublicAcls": True,
        "BlockPublicPolicy": True,
        "RestrictPublicBuckets": True
      }
    })

  @mark.it("creates a KMS key with key rotation enabled")
  def test_kms_key_properties(self):
    stack = TapStack(self.app, "TestStack", TapStackProps(environment_suffix="qa"))
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::KMS::Key", 1)
    template.has_resource_properties("AWS::KMS::Key", {
      "EnableKeyRotation": True
    })

  @mark.it("adds deny policy for unencrypted uploads to S3 bucket")
  def test_deny_unencrypted_upload_policy(self):
    stack = TapStack(self.app, "TestStack", TapStackProps(environment_suffix="qa"))
    template = Template.from_stack(stack)

    template.has_resource("AWS::S3::BucketPolicy", {
      "PolicyDocument": {
        "Statement": [
          {
            "Sid": "DenyUnEncryptedObjectUploads",
            "Effect": "Deny",
            "Action": "s3:PutObject",
            "Principal": {"AWS": "*"},
            "Condition": {
              "StringNotEquals": {
                "s3:x-amz-server-side-encryption": "aws:kms"
              }
            }
          }
        ]
      }
    })

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_defaults_env_suffix_to_dev(self):
    stack = TapStack(self.app, "TestStack")
    template = Template.from_stack(stack)
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties("AWS::S3::Bucket", {
      "BucketName": "secure-dev-bucket-assets"
    })

  @mark.it("creates outputs for bucket name, bucket ARN, and KMS key ARN")
  def test_outputs_exist(self):
    env_suffix = "demo"
    stack = TapStack(self.app, "TestStack", TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    for output in ["BucketName", "BucketArn", "KmsKeyArn"]:
      template.has_output(output, {})
