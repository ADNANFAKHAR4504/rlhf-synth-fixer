import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):

  def setUp(self):
    self.app = cdk.App()

  @mark.it("creates an S3 bucket with the correct environment suffix")
  def test_creates_s3_bucket_with_env_suffix(self):
    env_suffix = "testenv"
    stack = TapStack(
      self.app,
      "TapStackTest",
      TapStackProps(environment_suffix=env_suffix)
    )
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties(
      "AWS::S3::Bucket",
      {
        "BucketName": f"tap-secure-data-{env_suffix}",
        "VersioningConfiguration": {"Status": "Enabled"}
      }
    )

  @mark.it("enables KMS encryption at rest for the S3 bucket")
  def test_s3_bucket_is_kms_encrypted(self):
    stack = TapStack(
      self.app,
      "TapStackEncrypted",
      TapStackProps(environment_suffix="secure")
    )
    template = Template.from_stack(stack)

    template.has_resource_properties(
      "AWS::S3::Bucket",
      {
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": Match.array_with([
            Match.object_like({
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms"
              }
            })
          ])
        }
      }
    )

  @mark.it("enforces SSL-only access on the S3 bucket")
  def test_s3_ssl_only_policy(self):
    stack = TapStack(
      self.app,
      "TapStackSSLPolicy",
      TapStackProps(environment_suffix="ssltest")
    )
    template = Template.from_stack(stack)

    template.has_resource(
      "AWS::S3::BucketPolicy",
      Match.object_like({
        "PolicyDocument": Match.object_like({
          "Statement": Match.array_with([
            Match.object_like({
              "Effect": "Deny",
              "Principal": {"AWS": "*"},
              "Action": "s3:*",
              "Condition": {
                "Bool": {"aws:SecureTransport": "false"}
              }
            })
          ])
        })
      })
    )

  @mark.it("creates an IAM role with least privilege EC2 read-only policy")
  def test_iam_role_with_least_privilege(self):
    stack = TapStack(
      self.app,
      "TapStackIAM",
      TapStackProps(environment_suffix="leastpriv")
    )
    template = Template.from_stack(stack)

    template.has_resource_properties(
      "AWS::IAM::Role",
      {
        "AssumeRolePolicyDocument": {
          "Statement": Match.array_with([
            Match.object_like({
              "Effect": "Allow",
              "Principal": {"Service": "ec2.amazonaws.com"},
              "Action": "sts:AssumeRole"
            })
          ])
        },
        "Policies": Match.array_with([
          Match.object_like({
            "PolicyDocument": {
              "Statement": Match.array_with([
                Match.object_like({
                  "Action": ["ec2:DescribeInstances", "ec2:DescribeTags"],
                  "Effect": "Allow",
                  "Resource": "*"
                })
              ])
            }
          })
        ])
      }
    )

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_defaults_env_suffix_to_dev(self):
    stack = TapStack(self.app, "TapStackTestDefault")
    template = Template.from_stack(stack)

    template.has_resource_properties(
      "AWS::S3::Bucket",
      {
        "BucketName": "tap-secure-data-dev"
      }
    )
