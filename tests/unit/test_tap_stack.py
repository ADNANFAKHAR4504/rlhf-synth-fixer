import unittest
from aws_cdk import App
from aws_cdk.assertions import Template, Match
from lib.tap_stack import TapStack, TapStackProps


class TestTapStack(unittest.TestCase):
  def setUp(self):
    self.app = App()
    self.env_suffix = "test"
    props = TapStackProps(environment_suffix=self.env_suffix)
    self.stack = TapStack(self.app, "TapStackTest", props=props)

    self.vpc_stack = self.stack.vpc_stack
    self.iam_stack = self.stack.iam_stack
    self.bucket = self.stack.secure_bucket.bucket
    self.kms_key = self.stack.secure_bucket.kms_key

  def test_vpc_has_public_and_private_subnets(self):
    template = Template.from_stack(self.vpc_stack)

    template.resource_count_is("AWS::EC2::VPC", 1)
    template.resource_count_is("AWS::EC2::Subnet", 4)

    template.has_resource_properties(
      "AWS::EC2::Subnet",
      {
        "MapPublicIpOnLaunch": Match.any_value()
      }
    )

  def test_iam_role_with_custom_policy_and_trust(self):
    template = Template.from_stack(self.iam_stack)

    template.resource_count_is("AWS::IAM::Role", 1)

    template.has_resource_properties(
      "AWS::IAM::Role",
      {
        "AssumeRolePolicyDocument": Match.object_like({
          "Statement": Match.array_with([
            Match.object_like({
              "Effect": "Allow",
              "Principal": {
                "Service": "ec2.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            })
          ])
        }),
        "Policies": Match.array_with([
          Match.object_like({
            "PolicyDocument": Match.object_like({
              "Statement": Match.array_with([
                Match.object_like({
                  "Action": Match.array_with([
                    "ec2:DescribeInstances",
                    "ec2:DescribeTags"
                  ]),
                  "Effect": "Allow",
                  "Resource": "*"
                })
              ])
            })
          })
        ])
      }
    )

  def test_secure_s3_bucket_properties(self):
    template = Template.from_stack(self.stack)

    template.resource_count_is("AWS::S3::Bucket", 1)

    template.has_resource_properties(
      "AWS::S3::Bucket",
      {
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": Match.array_with([
            Match.object_like({
              "ServerSideEncryptionByDefault": Match.object_like({
                "SSEAlgorithm": "aws:kms"
              })
            })
          ])
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        }
      }
    )

  def test_bucket_policy_denies_insecure_transport(self):
    template = Template.from_stack(self.stack)

    template.has_resource_properties(
      "AWS::S3::BucketPolicy",
      {
        "PolicyDocument": Match.object_like({
          "Statement": Match.array_with([
            Match.object_like({
              "Effect": "Deny",
              "Condition": {
                "Bool": {
                  "aws:SecureTransport": "false"
                }
              },
              "Principal": {
                "AWS": "*"
              },
              "Action": "s3:*"
            })
          ])
        })
      }
    )


if __name__ == "__main__":
  unittest.main()
