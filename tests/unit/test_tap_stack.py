# pylint: disable=C0111,C0103,C0303,W0511,R0903,R0913,R0914,R0915
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


ACCOUNT = "111111111111"
REGION = "us-east-1"


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  def setUp(self):
    self.app = cdk.App()
    self.env = cdk.Environment(account=ACCOUNT, region=REGION)

  @mark.it("does not create resources directly; only composes nested stacks")
  def test_tapstack_is_just_orchestration(self):
    # ARRANGE
    stack = TapStack(
      self.app,
      "TapStackOrchestratorOnly",
      props=TapStackProps(environment_suffix="dev"),
      env=self.env,
    )
    template = Template.from_stack(stack)

    # ASSERT: parent template should not directly create S3/Lambda/DynamoDB
    template.resource_count_is("AWS::S3::Bucket", 0)
    template.resource_count_is("AWS::Lambda::Function", 0)
    template.resource_count_is("AWS::DynamoDB::Table", 0)

    # But it should include at least one Nested Stack
    template.resource_count_is("AWS::CloudFormation::Stack", 1)

  @mark.it("creates an S3 bucket in the nested stack with the correct env suffix")
  def test_nested_creates_s3_bucket_with_env_suffix(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(
      self.app,
      "TapStackWithNested",
      props=TapStackProps(environment_suffix=env_suffix),
      env=self.env,
    )
    # The TapStack exposes the nested stack as `s3_processor`
    nested_template = Template.from_stack(stack.s3_processor)

    # EXPECTED bucket name:
    # serverless-processor-<env>-<account>-<region>
    expected_bucket_name = (
      f"serverless-processor-{env_suffix}-{ACCOUNT}-{REGION}"
    )

    # ASSERT
    nested_template.resource_count_is("AWS::S3::Bucket", 1)
    nested_template.has_resource_properties(
      "AWS::S3::Bucket",
      {
        "BucketName": expected_bucket_name,
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": True,
          "BlockPublicPolicy": True,
          "IgnorePublicAcls": True,
          "RestrictPublicBuckets": True,
        },
      },
    )

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_defaults_env_suffix_to_dev(self):
    # ARRANGE
    stack = TapStack(
      self.app,
      "TapStackDefaultEnv",
      env=self.env,
    )
    nested_template = Template.from_stack(stack.s3_processor)

    expected_bucket_name = f"serverless-processor-dev-{ACCOUNT}-{REGION}"

    # ASSERT
    nested_template.resource_count_is("AWS::S3::Bucket", 1)
    nested_template.has_resource_properties(
      "AWS::S3::Bucket",
      {"BucketName": expected_bucket_name},
    )

