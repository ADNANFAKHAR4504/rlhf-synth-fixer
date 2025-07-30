import pytest
from aws_cdk import App
from aws_cdk.assertions import Template

from lib.tap_stack import TapStack, TapStackProps


@pytest.fixture(scope="module")
def synthesized_template():
  app = App()
  stack = TapStack(
    app,
    "IntegrationTestTapStack",
    props=TapStackProps(
      environment_suffix="int",
      principal_arns=["arn:aws:iam::123456789012:user/test-user"]
    )
  )
  return Template.from_stack(stack)


def test_kms_key_created(synthesized_template):
  template = synthesized_template
  template.resource_count_is("AWS::KMS::Key", 1)


def test_s3_bucket_created(synthesized_template):
  template = synthesized_template
  template.resource_count_is("AWS::S3::Bucket", 1)


def test_bucket_encryption_is_kms(synthesized_template):
  template = synthesized_template
  template.has_resource_properties("AWS::S3::Bucket", {
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


def test_bucket_policy_exists(synthesized_template):
  template = synthesized_template
  template.resource_count_is("AWS::S3::BucketPolicy", 1)


def test_bucket_policy_denies_http_access(synthesized_template):
  template = synthesized_template
  template.has_resource_properties("AWS::S3::BucketPolicy", {
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


def test_stack_outputs_exist(synthesized_template):
  template = synthesized_template
  output_keys = template.to_json().get("Outputs", {}).keys()
  expected = {"BucketName", "BucketArn", "KmsKeyArn"}
  assert expected.issubset(output_keys)

