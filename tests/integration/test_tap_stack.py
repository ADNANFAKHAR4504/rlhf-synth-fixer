import pytest
from aws_cdk import App
from aws_cdk.assertions import Template

from lib.tap_stack import TapStack, TapStackProps


@pytest.fixture
def get_template():
  app = App(context={"environmentSuffix": "dev"})
  props = TapStackProps(
    environment_suffix="dev",
    principal_arns=["arn:aws:iam::123456789012:user/TestUser"]
  )
  stack = TapStack(app, "TapStackdev", props=props)
  return Template.from_stack(stack)


def test_bucket_config(get_template):
  tmpl = get_template
  tmpl.has_resource_properties("AWS::S3::Bucket", {
    "BucketName": "secure-dev-data-bucket-1",
    "VersioningConfiguration": {"Status": "Enabled"},
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


def test_kms_key_properties(get_template):
  tmpl = get_template
  tmpl.has_resource_properties("AWS::KMS::Key", {
    "EnableKeyRotation": True
  })


def test_bucket_policy_deny_unencrypted_uploads(get_template):
  tmpl = get_template
  tmpl.has_resource("AWS::S3::BucketPolicy", {
    "PolicyDocument": {
      "Statement": [
        {
          "Sid": "DenyUnEncryptedObjectUploads",
          "Effect": "Deny",
          "Action": "s3:PutObject",
          "Principal": {"AWS": "*"},
          "Resource": {
            "Fn::Join": [
              "",
              [
                {"Fn::GetAtt": ["SecureDataBucket", "Arn"]},
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


def test_outputs_exist(get_template):
  tmpl = get_template
  for output_key in ["BucketName", "BucketArn", "KmsKeyArn"]:
    tmpl.has_output(output_key)


def test_stack_tagging(get_template):
  tmpl = get_template
  tmpl.has_resource("AWS::CloudFormation::Stack", {
    "Tags": [
      {"Key": "Environment", "Value": "dev"},
      {"Key": "Project", "Value": "SecureStorage"}
    ]
  })
