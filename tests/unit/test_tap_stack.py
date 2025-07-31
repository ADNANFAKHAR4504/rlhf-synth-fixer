import pytest
from aws_cdk import App
from aws_cdk.assertions import Template, Match
from lib.tap_stack import TapStack, TapStackProps


@pytest.fixture
def template():
  app = App(context={"environmentSuffix": "pr334"})
  stack = TapStack(app, "TapStackpr334", props=TapStackProps(environment_suffix="pr334"))
  return Template.from_stack(stack)


def test_vpc_output(template):
  template.has_output(
    "VpcIdOutput-pr334",
    {
      "Export": {"Name": "VpcId-pr334"},
      "Value": {"Ref": Match.string_like_regexp("TapVpc-pr334.*")}
    }
  )


def test_iam_role_output(template):
  template.has_output(
    "RoleArnOutput-pr334",
    {
      "Export": {"Name": "RoleArn-pr334"},
      "Value": {
        "Fn::GetAtt": [Match.string_like_regexp("TapRole-pr334.*"), "Arn"]
      }
    }
  )

  template.has_output(
    "IamRoleNameOutput",
    {
      "Export": {"Name": "TapStackIamRoleName"},
      "Value": Match.string_like_regexp("TapRole-pr334.*")
    }
  )


def test_s3_bucket_properties(template):
  template.resource_count_is("AWS::S3::Bucket", 1)
  template.resource_count_is("AWS::KMS::Key", 1)

  template.has_resource_properties(
    "AWS::S3::Bucket",
    {
      "BucketEncryption": {
        "ServerSideEncryptionConfiguration": Match.array_with([
          {
            "ServerSideEncryptionByDefault": {
              "SSEAlgorithm": "aws:kms",
              "KMSMasterKeyID": Match.any_value()
            }
          }
        ])
      },
      "VersioningConfiguration": {
        "Status": "Enabled"
      }
    }
  )

  template.has_output(
    "SecureBucketNameOutput",
    {
      "Export": {"Name": "TapStackSecureBucketName"},
      "Value": "tap-secure-data-pr334"
    }
  )


def test_s3_bucket_deny_insecure_transport(template):
  template.has_resource_properties(
    "AWS::S3::BucketPolicy",
    {
      "PolicyDocument": {
        "Statement": Match.array_with([
          Match.object_like({
            "Effect": "Deny",
            "Condition": {
              "Bool": {
                "aws:SecureTransport": "false"
              }
            }
          })
        ])
      }
    }
  )
