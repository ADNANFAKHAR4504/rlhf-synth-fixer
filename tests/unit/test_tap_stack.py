import unittest
from pytest import mark, skip
from aws_cdk.assertions import Match, Template
from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):

  def setUp(self):
    from aws_cdk import App
    self.app = App()

  @mark.it("creates an S3 bucket with env suffix")
  def test_creates_s3_bucket_with_env_suffix(self):
    stack = TapStack(
      self.app,
      "TapStackWithSuffix",
      TapStackProps(environment_suffix="testenv")
    )
    template = Template.from_stack(stack)
    template.has_resource_properties(
      "AWS::S3::Bucket",
      Match.object_like({
        "BucketName": Match.string_like_regexp("tap-secure-data-testenv")
      })
    )

  @mark.it("defaults env suffix to 'dev'")
  def test_defaults_env_suffix_to_dev(self):
    stack = TapStack(self.app, "TapStackDefault", TapStackProps())
    template = Template.from_stack(stack)
    template.has_resource_properties(
      "AWS::S3::Bucket",
      Match.object_like({
        "BucketName": Match.string_like_regexp("tap-secure-data-dev")
      })
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
        "Properties": Match.object_like({
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
      })
    )

  @mark.it("creates an IAM role for EC2 with least privilege policy")
  def test_iam_role_with_ec2_assume_and_policy(self):
    stack = TapStack(
      self.app,
      "TapStackIAM",
      TapStackProps(environment_suffix="leastpriv")
    )
    template = Template.from_stack(stack)

    template.has_resource(
      "AWS::IAM::Role",
      Match.object_like({
        "Properties": Match.object_like({
          "AssumeRolePolicyDocument": Match.object_like({
            "Statement": Match.array_with([
              Match.object_like({
                "Effect": "Allow",
                "Principal": {"Service": "ec2.amazonaws.com"},
                "Action": "sts:AssumeRole"
              })
            ])
          }),
          "Policies": Match.array_with([
            Match.object_like({
              "PolicyName": Match.string_like_regexp("CustomEC2ReadOnlyPolicy"),
              "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                  Match.object_like({
                    "Effect": "Allow",
                    "Action": Match.array_with([
                      "ec2:DescribeInstances",
                      "ec2:DescribeTags"
                    ]),
                    "Resource": ["*"]
                  })
                ])
              })
            })
          ])
        })
      })
    )

  @mark.it("ensures the S3 bucket is KMS encrypted")
  def test_s3_bucket_is_kms_encrypted(self):
    stack = TapStack(
      self.app,
      "TapStackEncrypted",
      TapStackProps(environment_suffix="encrypted")
    )
    template = Template.from_stack(stack)
    template.has_resource_properties(
      "AWS::S3::Bucket",
      Match.object_like({
        "BucketEncryption": Match.object_like({
          "ServerSideEncryptionConfiguration": Match.array_with([
            Match.object_like({
              "ServerSideEncryptionByDefault": Match.object_like({
                "SSEAlgorithm": "aws:kms"
              })
            })
          ])
        })
      })
    )
