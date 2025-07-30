import pytest
from aws_cdk import App
from aws_cdk.assertions import Template

from lib.tap_stack import TapStack, TapStackProps

@pytest.fixture
def templates():
  app = App(context={"environmentSuffix": "dev"})
  props = TapStackProps(
    environment_suffix="dev",
    principal_arns=["arn:aws:iam::123456789012:user/TestUser"]
  )
  stack = TapStack(app, "TapStackdev", props=props)
  return {
    "tap": Template.from_stack(stack),
    "nested": Template.from_stack(stack.node.find_child("SecureS3Stack-dev"))
  }

def test_bucket_config(templates):
  tmpl = templates["nested"]
  tmpl.has_resource_properties("AWS::S3::Bucket", {
    "BucketName": "secure-dev-data-bucket-1",
    "VersioningConfiguration": {"Status": "Enabled"},
    "BucketEncryption": {
      "ServerSideEncryptionConfiguration": [{
        "ServerSideEncryptionByDefault": {
          "SSEAlgorithm": "aws:kms"
        }
      }]
    }
  })

def test_kms_key_properties(templates):
  tmpl = templates["nested"]
  tmpl.has_resource_properties("AWS::KMS::Key", {
    "EnableKeyRotation": True
  })

def test_bucket_policy_deny_unencrypted_uploads(templates):
  tmpl = templates["nested"]
  tmpl.resource_count_is("AWS::S3::BucketPolicy", 1)

def test_outputs_exist(templates):
  tmpl = templates["nested"]
  for output_key in ["BucketName", "BucketArn", "KmsKeyArn"]:
    tmpl.has_output(output_key, {})

def test_stack_tagging(templates):
  tmpl = templates["tap"]
  tmpl.has_resource("AWS::CloudFormation::Stack", {})
