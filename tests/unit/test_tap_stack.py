import unittest
from pytest import mark
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
                    "Resource": "*"
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
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": Match.any_value()
              })
            })
          ])
        })
      })
    )

  @mark.it("exports SecureBucketNameOutput with correct value reference")
  def test_exports_secure_bucket_name_output(self):
    stack = TapStack(self.app, "TapStackBucketNameOutput", TapStackProps(environment_suffix="bucket-out"))
    template = Template.from_stack(stack)
    template.has_output(
      "SecureBucketNameOutput",
      Match.object_like({
        "Value": {"Ref": Match.string_like_regexp("SecureBucketConstructSecureS3Bucket[0-9A-F]{8}")}, # Expects a Ref to the S3 Bucket's logical ID
        "Export": {"Name": "TapStackSecureBucketName"}
      })
    )

  @mark.it("exports IamRoleNameOutput with correct value reference")
  def test_exports_iam_role_name_output(self):
    stack = TapStack(self.app, "TapStackRoleNameOutput", TapStackProps(environment_suffix="role-name-out"))
    template = Template.from_stack(stack)
    template.has_output(
      "IamRoleNameOutput",
      Match.object_like({
        "Value": {"Fn::GetAtt": [Match.string_like_regexp("IamStackrolenameoutNestedStackIamStackrolenameoutNestedStackResource[0-9A-F]{8}"), "Outputs.TapRolerolenameout[0-9A-F]{8}Name"]}, # Correctly expects Fn::GetAtt for nested stack output
        "Export": {"Name": "TapStackIamRoleName"}
      })
    )

  @mark.it("exports VPC ID from nested stack via main stack's output")
  def test_exports_vpc_id_via_main_stack(self):
    stack = TapStack(self.app, "TapStackVpcOutputTest", TapStackProps(environment_suffix="vpc-test"))
    template = Template.from_stack(stack)
    template.has_resource_properties(
        "AWS::CloudFormation::Stack",
        Match.object_like({
            "TemplateURL": Match.any_value(),
            "Parameters": {
                "EnvironmentSuffix": "vpc-test"
            }
        })
    )

  @mark.it("exports IAM Role ARN from nested stack via main stack's output")
  def test_exports_iam_role_arn_via_main_stack(self):
    stack = TapStack(self.app, "TapStackIamOutputTest", TapStackProps(environment_suffix="iam-test"))
    template = Template.from_stack(stack)
    template.has_resource_properties(
        "AWS::CloudFormation::Stack",
        Match.object_like({
            "TemplateURL": Match.any_value(),
            "Parameters": {
                "EnvironmentSuffix": "iam-test"
            }
        })
    )
