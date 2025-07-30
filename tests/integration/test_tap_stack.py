"""Integration tests for nested SecureS3Stack in TapStack."""

import pytest
from aws_cdk import App
from aws_cdk.assertions import Template

try:
  from tests.tap.tap_stack import TapStack
  from tests.tap.constructs.secure_s3_stack import SecureS3Stack
except ImportError:
  from tap.tap_stack import TapStack
  from tap.constructs.secure_s3_stack import SecureS3Stack


@pytest.fixture(scope="module")
def template_fixture():
  """Fixture to synthesize the nested SecureS3Stack."""
  app = App()
  tap_stack = TapStack(app, "TapStackTest", environment="dev")
  nested_stack = next(
    child for child in tap_stack.node.children if isinstance(child, SecureS3Stack)
  )
  return Template.from_stack(nested_stack)


def test_kms_key_created(template_fixture):
  template_fixture.resource_count_is("AWS::KMS::Key", 1)


def test_s3_bucket_created(template_fixture):
  template_fixture.resource_count_is("AWS::S3::Bucket", 1)


def test_bucket_encryption_is_kms(template_fixture):
  template_fixture.has_resource_properties("AWS::S3::Bucket", {
    "BucketEncryption": {
      "ServerSideEncryptionConfiguration": [
        {
          "ServerSideEncryptionByDefault": {
            "SSEAlgorithm": "aws:kms"
          }
        }
      ]
    }
  })


def test_bucket_policy_exists(template_fixture):
  template_fixture.resource_count_is("AWS::S3::BucketPolicy", 1)


def test_bucket_policy_denies_http_access(template_fixture):
  template_fixture.has_resource_properties("AWS::S3::BucketPolicy", {
    "PolicyDocument": {
      "Statement": [
        {
          "Action": "*",
          "Effect": "Deny",
          "Principal": "*",
          "Resource": "*",
          "Condition": {
            "Bool": {
              "aws:SecureTransport": "false"
            }
          }
        }
      ]
    }
  })


def test_stack_outputs_exist(template_fixture):
  output_keys = template_fixture.to_json().get("Outputs", {}).keys()
  expected = {"BucketName", "BucketArn", "KmsKeyArn"}
  assert expected.issubset(output_keys)


def test_bucket_policy_restricts_unencrypted_uploads(template_fixture):
  template_fixture.has_resource_properties("AWS::S3::BucketPolicy", {
    "PolicyDocument": {
      "Statement": [
        {
          "Effect": "Deny",
          "Principal": "*",
          "Action": "s3:PutObject",
          "Resource": {
            "Fn::Join": [
              "",
              [
                "arn:aws:s3:::",
                {"Ref": "SecureBucket"},
                "/*"
              ]
            ]
          },
          "Condition": {
            "StringNotEquals": {
              "s3:x-amz-server-side-encryption": "aws:kms"
            }
          }
        }
      ]
    }
  })


def test_bucket_policy_has_principal_control(template_fixture):
  template_fixture.has_resource_properties("AWS::S3::BucketPolicy", {
    "PolicyDocument": {
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "AWS": {
              "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
            }
          },
          "Action": "s3:*",
          "Resource": {
            "Fn::Join": [
              "",
              [
                "arn:aws:s3:::",
                {"Ref": "SecureBucket"},
                "/*"
              ]
            ]
          }
        }
      ]
    }
  })
